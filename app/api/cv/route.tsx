import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// @react-pdf/renderer will be imported dynamically

export const runtime = 'nodejs'; // Ensure runs on standard Node.js runtime environment


export async function GET(request: NextRequest) {
  let profile = { name: 'Hamid U V', role: 'Web & Software Developer', bio: '' };
  let works: any[] = [];
  let projects: any[] = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Query details in parallel
    const [profileRes, worksRes, projectsRes] = await Promise.allSettled([
      supabase.from('profiles').select('*').eq('email', 'hamid@haaamid.art').maybeSingle(),
      supabase.from('works').select('*').limit(3),
      supabase.from('posts').select('*').limit(3)
    ]);

    if (profileRes.status === 'fulfilled' && profileRes.value.data) {
      profile = profileRes.value.data as any;
    }
    if (worksRes.status === 'fulfilled' && worksRes.value.data) {
      works = worksRes.value.data;
    }
    if (projectsRes.status === 'fulfilled' && projectsRes.value.data) {
      projects = projectsRes.value.data;
    }
  } catch (err) {
    console.warn('DB queries for CV failed, using default mock templates:', err);
  }

  try {
    // PDF generation disabled for Cloudflare Workers due to bundle size limits
    // Cloudflare Workers have a 3MB total size limit, but @react-pdf/renderer requires a 5MB+ Yoga WASM engine.
    // const { Page, Text, View, Document, StyleSheet, pdf } = await import('@react-pdf/renderer');
    // ... rendering logic skipped ...
    // const blobStream = await pdf(<CVDocument />).toBuffer();
    
    return NextResponse.json({ error: 'CV Generation is disabled on Cloudflare edge due to WASM size limits.' }, { status: 501 });

    // return new NextResponse(blobStream, {
    //   headers: {
    //     'Content-Type': 'application/pdf',
    //     'Content-Disposition': 'attachment; filename="CV_Hamid.pdf"'
    //   }
    // });

  } catch (err: any) {
    console.error('PDF rendering failed:', err);
    return NextResponse.json({ error: 'Failed to compile PDF' }, { status: 500 });
  }
}
