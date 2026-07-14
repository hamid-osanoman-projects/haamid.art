import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure the client actually belongs to this user
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 });
    }

    // Generate a secure UUID token
    const token = crypto.randomUUID();
    
    // Set expiry to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update the client record
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        magic_link_token: token,
        magic_link_expires_at: expiresAt.toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to generate magic link token:', updateError);
      return NextResponse.json({ error: 'Failed to save token' }, { status: 500 });
    }

    return NextResponse.json({ token, expires_at: expiresAt });

  } catch (err: any) {
    console.error('Magic link API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
