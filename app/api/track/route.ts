import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup admin client to bypass row level security for logs tracking
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const XP_ACTIONS: Record<string, number> = {
  visit: 5,
  page_view: 2,
  read_blog: 10,
  contact: 25,
  newsletter: 15,
  share_post: 20
};

// Return level name based on accumulated XP score
function getXpLevel(xp: number): string {
  if (xp >= 1000) return 'Superfan ⭐';
  if (xp >= 600) return 'Collaborator 🤝';
  if (xp >= 300) return 'Enthusiast 🔥';
  if (xp >= 100) return 'Reader 📖';
  return 'Explorer 🗺️';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fingerprint, page, referrer, utm_source, action, details } = body;

    if (!fingerprint) {
      return NextResponse.json({ error: 'Fingerprint token is required' }, { status: 400 });
    }

    const xpReward = XP_ACTIONS[action] || 2;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve visitor location parameters from IP
    let country = 'Oman';
    let city = 'Muscat';

    try {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '';
      if (ip && !ip.startsWith('127.') && !ip.startsWith('192.')) {
        const ipRes = await fetch(`https://ipapi.co/${ip}/json/`);
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.country_name) {
            country = ipData.country_name;
            city = ipData.city || 'Muscat';
          }
        }
      }
    } catch (err) {
      console.warn('IP geolocation lookup skipped or rate-limited:', err);
    }

    // 1. Fetch current visitor status
    let { data: visitor } = await supabase
      .from('visitors')
      .select('*')
      .eq('fingerprint', fingerprint)
      .maybeSingle();

    let newAchievements: string[] = [];

    if (!visitor) {
      // 2. New Visitor Setup
      const initialPages = [page].filter(Boolean);
      const unlocked: string[] = ['first_look'];
      
      const newVisitor = {
        fingerprint,
        country,
        city,
        referrer: referrer || 'Direct',
        utm_source: utm_source || null,
        visit_count: 1,
        pages_viewed: initialPages,
        unlocked_achievements: unlocked,
        xp: xpReward,
        segment: action === 'contact' ? 'lead' : 'lurker',
        is_subscriber: action === 'newsletter',
        commands_typed: action === 'command' && details?.cmd ? [details.cmd] : [],
        easter_eggs_found: (action !== 'visit' && action !== 'page_view' && action !== 'contact' && action !== 'newsletter' && action !== 'read_blog' && action !== 'command') ? [action] : [],
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      };

      await supabase.from('visitors').insert(newVisitor);
      visitor = newVisitor;
      newAchievements = unlocked;

    } else {
      // 3. Returning Visitor calculations
      let currentXp = (visitor.xp || 0) + xpReward;
      let visitCount = visitor.visit_count || 1;
      if (action === 'visit') {
        visitCount += 1;
      }

      // Add page to unique array
      let pages = [...(visitor.pages_viewed || [])];
      if (page && !pages.includes(page)) {
        pages.push(page);
      }

      let segment = visitor.segment || 'lurker';
      if (action === 'contact') segment = 'lead';

      let isSubscriber = visitor.is_subscriber || false;
      if (action === 'newsletter') isSubscriber = true;

      // Extract unlocked achievements
      let unlocked = [...(visitor.unlocked_achievements || [])];

      // Achievements Evaluation
      const evaluateUnlock = (key: string, condition: boolean) => {
        if (condition && !unlocked.includes(key)) {
          unlocked.push(key);
          newAchievements.push(key);
        }
      };

      evaluateUnlock('first_look', visitCount >= 1);
      
      // Deep Diver: unique blog pages read >= 3
      const uniqueBlogsCount = pages.filter(p => p.startsWith('/blog/')).length;
      evaluateUnlock('deep_diver', uniqueBlogsCount >= 3);
      
      // Scholar: unique blog pages read >= 10
      evaluateUnlock('scholar', uniqueBlogsCount >= 10);
      
      evaluateUnlock('collaborator', segment === 'lead');
      evaluateUnlock('superfan', visitCount >= 5);
      evaluateUnlock('subscriber', isSubscriber);

      // Early Adopter: visited within 30 days of launch (e.g. launch date June 1, 2026)
      const firstSeen = new Date(visitor.first_seen_at || Date.now());
      const launchDate = new Date('2026-06-01');
      const diffDays = (firstSeen.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24);
      evaluateUnlock('early_adopter', diffDays < 30);

      // Track granular details for gamification
      let commandsTyped = [...(visitor.commands_typed || [])];
      let easterEggsFound = [...(visitor.easter_eggs_found || [])];

      if (action === 'command' && details?.cmd) {
        commandsTyped.push(details.cmd);
      } else if (action !== 'visit' && action !== 'page_view' && action !== 'contact' && action !== 'newsletter' && action !== 'read_blog' && action !== 'command') {
        if (!easterEggsFound.includes(action)) {
          easterEggsFound.push(action);
        }
      }

      // Perform update mutations
      await supabase
        .from('visitors')
        .update({
          visit_count: visitCount,
          pages_viewed: pages,
          unlocked_achievements: unlocked,
          xp: currentXp,
          segment,
          is_subscriber: isSubscriber,
          commands_typed: commandsTyped,
          easter_eggs_found: easterEggsFound,
          last_seen_at: new Date().toISOString(),
          country: country || visitor.country,
          city: city || visitor.city
        })
        .eq('fingerprint', fingerprint);

      visitor.xp = currentXp;
      visitor.unlocked_achievements = unlocked;
    }

    const currentLevel = getXpLevel(visitor.xp);

    return NextResponse.json({
      xp: visitor.xp,
      level: currentLevel,
      unlockedAchievements: visitor.unlocked_achievements,
      newAchievements
    });

  } catch (error: any) {
    console.error('Visitor tracking service failed:', error);
    return NextResponse.json({ error: 'Internal tracking error failed' }, { status: 500 });
  }
}
