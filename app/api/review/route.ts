import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, reviewer_name, reviewer_role, reviewer_company, rating, content } = body;

    if (!id || !reviewer_name || !content) {
      return NextResponse.json({ error: 'Missing required review fields' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update review record: lock inputs, transition status to pending moderation, reset token
    const { error } = await supabase
      .from('reviews')
      .update({
        reviewer_name,
        reviewer_role: reviewer_role || null,
        reviewer_company: reviewer_company || null,
        rating: Number(rating) || 5,
        content,
        status: 'pending',
        token: null, // Clear token so link cannot be reused
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('DB review update failed:', error);
      return NextResponse.json({ error: 'Failed to update review record' }, { status: 500 });
    }

    // Award XP to the owner visitor profile logs (handled client-side by TrackerProvider)
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Review submission failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
