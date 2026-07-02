const { createClient } = require('@supabase/supabase-js');
const { Anthropic } = require('@anthropic-ai/sdk');

// Config parameters from Actions env context
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const resendKey = process.env.RESEND_API_KEY;

const KEYWORDS = ['next.js', 'react', 'supabase', 'typescript', 'tailwind', 'vercel', 'ai', 'web dev', 'javascript', 'node'];

async function run() {
  console.log('Initiating news digest job...');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credential keys.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  let stories = [];

  // 1. Fetch Hacker News top stories
  try {
    console.log('Fetching top stories from Hacker News...');
    const topIdsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (topIdsRes.ok) {
      const topIds = await topIdsRes.json();
      const firstTen = topIds.slice(0, 10);
      
      for (const id of firstTen) {
        const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (itemRes.ok) {
          const item = await itemRes.json();
          if (item && item.title) {
            stories.push({
              title: item.title,
              url: item.url || `https://news.ycombinator.com/item?id=${id}`,
              description: '',
              source: 'Hacker News',
              engagement: item.score || 1
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch from Hacker News:', err);
  }

  // 2. Fetch RSS / Atom feeds
  const rssFeeds = [
    { name: 'Next.js Blog', url: 'https://nextjs.org/feed.xml' },
    { name: 'Supabase Blog', url: 'https://supabase.com/rss.xml' },
    { name: 'Vercel Blog', url: 'https://vercel.com/atom' },
    { name: 'Dev.to Webdev', url: 'https://dev.to/feed/tag/webdev' },
    { name: 'Dev.to Next.js', url: 'https://dev.to/feed/tag/nextjs' }
  ];

  for (const feed of rssFeeds) {
    try {
      console.log(`Fetching feed: ${feed.name}...`);
      const response = await fetch(feed.url);
      if (response.ok) {
        const xml = await response.text();
        const parsed = parseFeedXML(xml, feed.name);
        stories = [...stories, ...parsed];
      }
    } catch (err) {
      console.error(`Failed to fetch feed ${feed.name}:`, err);
    }
  }

  // 3. Keyword scoring filter
  console.log('Scoring articles by relevance...');
  const scoredStories = stories.map(story => {
    let score = 0;
    const titleText = story.title.toLowerCase();
    const descText = story.description.toLowerCase();
    
    KEYWORDS.forEach(kw => {
      if (titleText.includes(kw)) score += 2;
      if (descText.includes(kw)) score += 1;
    });

    return { ...story, score };
  });

  // Pick top 5 stories
  const topFive = scoredStories
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  console.log(`Selected top ${topFive.length} articles.`);

  // 4. Summarize each story using Claude
  const digestItems = [];
  for (const story of topFive) {
    console.log(`Summarising story: ${story.title}...`);
    const ai_summary = await getSummary(story.title, story.description, anthropicKey);
    
    digestItems.push({
      title: story.title,
      url: story.url,
      ai_summary,
      source: story.source,
      engagement: story.engagement,
      tags: KEYWORDS.filter(kw => story.title.toLowerCase().includes(kw) || story.description.toLowerCase().includes(kw)),
      digest_date: new Date().toISOString().split('T')[0]
    });
  }

  // 5. Upsert to Supabase
  if (digestItems.length > 0) {
    try {
      console.log('Saving digest to Supabase database...');
      const { error } = await supabase
        .from('news_items')
        .upsert(digestItems, { onConflict: 'url' });
      
      if (error) console.error('DB save error:', error);
      else console.log('Digest saved successfully.');
    } catch (err) {
      console.error('Database query failed:', err);
    }
  }

  // 6. Send weekly newsletter if it is Monday
  if (new Date().getDay() === 1) {
    console.log('Monday detected. Scheduling newsletters send out...');
    try {
      // Get active subscribers
      const { data: subscribers } = await supabase
        .from('subscribers')
        .select('email')
        .eq('status', 'active');

      if (subscribers && subscribers.length > 0 && digestItems.length > 0) {
        await sendNewsletter(subscribers, digestItems, resendKey);
        console.log(`Newsletters sent to ${subscribers.length} subscribers.`);
      }
    } catch (err) {
      console.error('Failed to send weekly newsletter digest:', err);
    }
  }

  console.log('News digest job completed.');
}

// Custom RSS & Atom parsing helper using regex patterns
function parseFeedXML(xmlText, sourceName) {
  const items = [];
  const itemRegex = /<(item|entry)>([\s\S]*?)<\/\1>/g;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const content = match[2];
    const titleMatch = content.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const linkMatch = content.match(/<link[^>]*href=["']([^"']+)["']|<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/);
    const descMatch = content.match(/<(description|summary)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/\1>/);

    const title = titleMatch ? titleMatch[1].trim() : '';
    let link = '';
    if (linkMatch) {
      link = linkMatch[1] || linkMatch[2] || '';
    }
    const description = descMatch ? descMatch[2].trim().replace(/<[^>]*>/g, '') : '';

    if (title && (link || description)) {
      items.push({
        title,
        url: link.trim(),
        description: description.slice(0, 300),
        source: sourceName,
        engagement: 1
      });
    }
  }
  return items;
}

// Get AI Summaries from Claude API
async function getSummary(title, description, apiKey) {
  if (!apiKey) {
    return 'Summary fallback: Curated developers updates compiling framework and library improvements.';
  }
  
  const anthropic = new Anthropic({ apiKey });
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 120,
      messages: [{
        role: 'user',
        content: `Summarise this tech article in exactly 2 sentences for a developer audience. Be specific, avoid hype. Article: ${title} ${description}`
      }]
    });
    return response.content[0].text.trim();
  } catch (err) {
    console.error('Claude API summary call failed:', err);
    return 'Detailed developers summary compiling core concepts.';
  }
}

// Resend HTTP Email Dispatcher
async function sendNewsletter(subscribers, stories, key) {
  if (!key) return;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #fafafa; padding: 40px; border-radius: 16px; border: 1px solid #e5e5e5; color: #0a0a0a;">
      <h2 style="color: #7F77DD; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Today in Dev — Weekly Digest</h2>
      <p style="color: #666; font-size: 13px; line-height: 1.5; margin-bottom: 30px;">Here are the top tech stories curated for you this week by Hamid U V.</p>
      
      <div style="space-y: 20px;">
        ${stories.map(s => `
          <div style="background-color: white; border: 1px solid #e5e5e5; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
            <span style="font-size: 9px; font-weight: 900; color: #7F77DD; text-transform: uppercase; tracking-wider: 1px;">${s.source}</span>
            <h3 style="font-size: 15px; font-weight: bold; margin: 8px 0;"><a href="${s.url}" style="color: #0a0a0a; text-decoration: none; hover:underline;">${s.title}</a></h3>
            <p style="font-size: 12px; color: #444; line-height: 1.6; margin: 0;">${s.ai_summary}</p>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 40px; border-top: 1px solid #e5e5e5; padding-top: 20px; text-align: center;">
        <p style="font-size: 10px; color: #999; margin: 0;">
          You subscribed to tech updates on haaamid.art. <a href="https://haaamid.art/unsubscribe" style="color: #7F77DD; text-decoration: none;">Unsubscribe</a>.
        </p>
      </div>
    </div>
  `;

  for (const sub of subscribers) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          from: 'Hamid <hamid@haaamid.art>',
          to: sub.email,
          subject: 'Today in Dev — Your Weekly Tech Digest',
          html: htmlContent
        })
      });
    } catch (err) {
      console.error(`Resend newsletter dispatch failed to ${sub.email}:`, err);
    }
  }
}

// Run script
run().catch(console.error);
