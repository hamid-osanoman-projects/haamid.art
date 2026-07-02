import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';

const anthropicKey = process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Attempt to scrape the text from the URL to give the AI some context
    let scrapedText = '';
    try {
      const response = await fetch(url, { 
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HaaamidArt/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Remove scripts, styles, etc.
      $('script, style, noscript, iframe, img, svg').remove();
      scrapedText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000); // Take first 5k chars
    } catch (err) {
      console.warn('Failed to scrape URL:', err);
      scrapedText = "Could not fetch content. Just roast the idea of the URL itself: " + url;
    }

    if (!anthropicKey) {
      return NextResponse.json({ 
        roast: "Wow, your website is so bad my creator didn't even bother putting his API key in to roast it properly. It's giving 'I deployed an unstyled index.html on Netlify in 2014 and called it a day.'",
        tips: [
          "Actually add some CSS next time.",
          "Maybe buy a real domain?",
          "Try using Next.js instead of whatever this is."
        ]
      });
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const systemPrompt = `You are a brutal, hilarious, and savage Senior Software Engineer acting as an AI judge. A developer has submitted their website URL to be "roasted".
    
You must output a JSON response with two fields:
1. "roast": A funny, brutal, savage paragraph roasting their website based on the content scraped from it. Do not hold back, be highly opinionated about design and tech stacks.
2. "tips": An array of exactly 3 strings. These should be genuine, constructive, but slightly snarky actionable tips to actually improve the site.

Here is the scraped content of the website (first 5000 chars):
${scrapedText}

Respond ONLY in valid JSON format like:
{
  "roast": "...",
  "tips": ["...", "...", "..."]
}`;

    const msg = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Roast this URL: ${url}` }]
    });

    const firstBlock = msg.content[0];
    let replyObj;
    
    if (firstBlock && firstBlock.type === 'text') {
      try {
        const text = firstBlock.text.trim();
        // Extract JSON if it wrapped in markdown
        const match = text.match(/\{[\s\S]*\}/);
        replyObj = JSON.parse(match ? match[0] : text);
      } catch (parseError) {
        console.error('Failed to parse AI JSON:', parseError);
        replyObj = {
          roast: "Your site broke my parser. It's that bad. " + firstBlock.text.substring(0, 200),
          tips: ["Fix your layout", "Write better copy", "Consider a career change"]
        };
      }
    }

    return NextResponse.json(replyObj);

  } catch (error: any) {
    console.error('Roast API failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
