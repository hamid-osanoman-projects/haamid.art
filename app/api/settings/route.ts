import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

export async function GET() {
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Public GET to allow layout.tsx and page.tsx to read settings easily
  const { data, error } = await adminSupabase
    .from('global_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error || !data) {
    // Return safe defaults if table doesn't exist yet
    return NextResponse.json({
      easter_eggs_enabled: true,
      maintenance_mode: false,
      force_dark_mode: false
    })
  }

  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  
  // Authenticate Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  
  // Whitelist fields
  const updates: any = {}
  if (body.easter_eggs_enabled !== undefined) updates.easter_eggs_enabled = body.easter_eggs_enabled
  if (body.maintenance_mode !== undefined) updates.maintenance_mode = body.maintenance_mode
  if (body.force_dark_mode !== undefined) updates.force_dark_mode = body.force_dark_mode

  updates.updated_at = new Date().toISOString()

  // Use service role to bypass RLS when creating/updating global settings
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await adminSupabase
    .from('global_settings')
    .upsert({ id: 1, ...updates })
    .select()
    .single()

  if (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Force the landing page and layout to completely drop their caches
  revalidatePath('/', 'layout')

  return NextResponse.json(data)
}
