import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract dynamic query parameters
    const title = searchParams.get('title') || 'haaamid.art';
    const category = searchParams.get('category') || 'Software Engineering';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#070708',
            backgroundImage: 'radial-gradient(circle at 10% 10%, rgba(127, 119, 221, 0.1) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(62, 207, 142, 0.08) 0%, transparent 40%)',
            padding: '80px',
            fontFamily: 'sans-serif',
            color: '#f4f4f5',
          }}
        >
          {/* Top Logo & Category Pill */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  height: '40px',
                  width: '40px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#a855f7',
                }}
              >
                H
              </div>
              <span style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '2px', color: '#ffffff' }}>
                HAAAMID<span style={{ color: '#a855f7' }}>.ART</span>
              </span>
            </div>

            {category && (
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: '#a855f7',
                  backgroundColor: 'rgba(168, 85, 247, 0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  padding: '6px 16px',
                  borderRadius: '20px',
                }}
              >
                {category.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Post Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1000px', marginTop: '40px', marginBottom: '40px' }}>
            <h1
              style={{
                fontSize: '56px',
                fontWeight: '900',
                lineHeight: 1.2,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-1.5px',
              }}
            >
              {title}
            </h1>
            <p style={{ fontSize: '20px', color: '#a1a1aa', margin: 0, fontWeight: '500' }}>
              Thoughts, build logs, and software engineering insights by Hamid U V
            </p>
          </div>

          {/* Footer Profile Details */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderTop: '1px solid #1f1f23',
              paddingTop: '32px',
            }}
          >
            <span style={{ fontSize: '15px', color: '#71717a', fontWeight: '600' }}>
              Based in Muscat, Oman · Available for Remote Freelance
            </span>
            <div style={{ display: 'flex', gap: '20px', color: '#a855f7', fontSize: '15px', fontWeight: 'bold' }}>
              <span>Next.js</span>
              <span>·</span>
              <span>Supabase</span>
              <span>·</span>
              <span>Tailwind v4</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error('Failed to generate OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
