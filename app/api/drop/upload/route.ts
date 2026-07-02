import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup admin client to bypass row level security for creating drops
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileSizeBytes, filePath, mimeType } = await request.json();

    if (!fileName || !filePath) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Set expiry 7 days from now (though it self-destructs on download anyway)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const newDrop = {
      file_name: fileName,
      file_size_bytes: fileSizeBytes,
      file_path: filePath,
      mime_type: mimeType,
      expires_at: expiresAt.toISOString(),
    };

    const { data, error } = await supabase
      .from('file_drops')
      .insert(newDrop)
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting file drop:', error);
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (error: any) {
    console.error('Drop upload API failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
