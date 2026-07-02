const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data, error } = await supabase.from('vibe_rooms').insert({
    owner_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    room_name: 'test-p2p',
    display_name: 'Test',
    type: 'p2p_call',
    status: 'active',
    watch_url: '',
    invited_contact_ids: []
  });
  console.log('Error:', JSON.stringify(error, null, 2));
}

testInsert();
