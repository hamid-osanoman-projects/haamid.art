import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup admin client to bypass row level security for drops
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch the drop record
    const { data: dropRecord, error: fetchError } = await supabase
      .from('file_drops')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !dropRecord) {
      return NextResponse.json({ error: 'Link invalid, expired, or already destroyed' }, { status: 404 });
    }

    // 2. Generate a signed URL valid for 60 seconds (with download forced header)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('client_drops')
      .createSignedUrl(dropRecord.file_path, 60, { download: dropRecord.file_name });

    if (signedError || !signedData) {
      return NextResponse.json({ error: 'Failed to generate secure download link' }, { status: 500 });
    }

    // 3. BURN THE RECORD (Self-Destruct mechanism)
    // We delete the record from Postgres. 
    // We also could delete from Storage immediately, but the user is actively downloading it!
    // So we will just delete the DB record. Without the DB record, the public drop/[id] page 
    // will show as destroyed. The signed URL expires in 60s anyway.
    
    await supabase
      .from('file_drops')
      .delete()
      .eq('id', id);

    // Optional: We can leave the storage file cleanup for a cron job, or we can wait 60s and delete it.
    // For now, deleting the DB record makes the link perfectly "Burn After Reading" from a UI perspective.

    return NextResponse.json({ signedUrl: signedData.signedUrl });

  } catch (error: any) {
    console.error('Drop download API failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
