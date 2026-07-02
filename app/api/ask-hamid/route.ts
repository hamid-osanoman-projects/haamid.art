import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Anthropic } from '@anthropic-ai/sdk';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fingerprint, message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch visitor data to check rate limits (max 10 queries per day)
    let visitorFingerprint = fingerprint || 'fp_anonymous';
    let { data: visitor } = await supabase
      .from('visitors')
      .select('*')
      .eq('fingerprint', visitorFingerprint)
      .maybeSingle();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch existing log history
    let questionsLog = [];
    if (visitor && visitor.ask_hamid_questions) {
      questionsLog = Array.isArray(visitor.ask_hamid_questions) 
        ? visitor.ask_hamid_questions 
        : [];
    }

    // Filter questions asked in the last 24 hours
    const recentQueries = questionsLog.filter((q: any) => {
      const qTime = new Date(q.timestamp);
      return qTime > oneDayAgo;
    });

    if (recentQueries.length >= 10) {
      return NextResponse.json({
        reply: 'Daily query limit reached (10 questions max per 24 hours). Reach out to Hamid directly at hamid@haaamid.art!'
      }, { status: 429 });
    }

    // 2. Fetch live developer profile & availability
    let isAvailable = true;
    let companyWork = 'building performant software systems';
    let contactEmail = 'hamid@haaamid.art';

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'hamid@haaamid.art')
        .maybeSingle();

      if (profile) {
        isAvailable = profile.available ?? true;
        contactEmail = profile.email || contactEmail;
        if (profile.bio) companyWork = profile.bio;
      }
    } catch (err) {
      console.warn('DB profile fetch failed inside chatbot, using mocks:', err);
    }

    // 3. Compile prompt constraints
    const systemPrompt = `You are a helpful AI assistant representing Hamid U V, a web and software developer based in Muscat, Oman. You answer questions about Hamid's work, skills, availability, and projects. Be friendly, concise, and professional.

About Hamid:
- Full-stack developer specialising in Next.js, React, TypeScript, Supabase, Tailwind CSS
- Based in Muscat, Oman. Available for remote freelance work globally.
- Company Work Focus: ${companyWork}
- Portfolio link: haaamid.art
- Contact email: ${contactEmail}
- Currently available for freelance work: ${isAvailable ? 'YES, available' : 'NO, currently booked'}

Skills: Next.js, React, TypeScript, Supabase, Tailwind, Node.js, PostgreSQL, Figma, REST APIs, Git.

If asked about pricing: say Hamid will provide a custom quote based on project scope.
If asked if Hamid is available: reply based on current status (${isAvailable ? 'Available for work' : 'Booked'}).
If you don't know something: say "I'm not sure — reach out to Hamid directly at ${contactEmail}"
Never make up projects or experience Hamid doesn't have.`;

    let reply = '';

    // 4. Query Claude API or fallback
    if (anthropicKey) {
      try {
        const anthropic = new Anthropic({ apiKey: anthropicKey });
        const response = await anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 200,
          system: systemPrompt,
          messages: [{ role: 'user', content: message }]
        });
        const firstBlock = response.content[0];
        if (firstBlock && firstBlock.type === 'text') {
          reply = firstBlock.text.trim();
        }
      } catch (err) {
        console.error('Claude API chatbot request crashed:', err);
        reply = `Hamid's agent here: Connection error with my LLM endpoint. Hamid is a Next.js / Supabase developer based in Muscat, Oman, and is currently ${isAvailable ? 'available' : 'booked'} for freelance work. Contact him at ${contactEmail}!`;
      }
    } else {
      // Offline fallback responder logic
      console.log('No ANTHROPIC_API_KEY set, responding with local offline heuristic...');
      const cleanMessage = message.toLowerCase();
      if (cleanMessage.includes('price') || cleanMessage.includes('cost') || cleanMessage.includes('charge')) {
        reply = `Hamid's pricing is structured on a per-project basis depending on work scope. Send details to ${contactEmail} for a custom quotation!`;
      } else if (cleanMessage.includes('availab') || cleanMessage.includes('busy') || cleanMessage.includes('free')) {
        reply = `Hamid is currently ${isAvailable ? 'available' : 'fully booked'} for new freelance opportunities. Reach out at ${contactEmail} to reserve a slot!`;
      } else if (cleanMessage.includes('skill') || cleanMessage.includes('language') || cleanMessage.includes('tech')) {
        reply = `Hamid specializes in full-stack web products using Next.js, React, TypeScript, Tailwind CSS, Node.js, and Supabase / PostgreSQL databases.`;
      } else {
        reply = `I am running in offline mode. Hamid is a web & software developer based in Muscat, Oman, specializing in Next.js, React, TypeScript, and Supabase. Contact him directly at ${contactEmail}!`;
      }
    }

    // 5. Log question to Supabase & Award +5 XP for engaging
    try {
      questionsLog.push({
        question: message.slice(0, 500),
        answer: reply.slice(0, 500),
        timestamp: new Date().toISOString()
      });

      if (visitor) {
        const nextXp = (visitor.xp || 0) + 5;
        await supabase
          .from('visitors')
          .update({
            ask_hamid_questions: questionsLog,
            xp: nextXp
          })
          .eq('fingerprint', visitorFingerprint);
      }
    } catch (err) {
      console.warn('Logging question and XP failed:', err);
    }

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('Ask Hamid API failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
