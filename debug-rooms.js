const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRooms() {
  const { data, error } = await supabase.from('vibe_rooms').select('*').eq('status', 'active');
  console.log('Active Rooms:', JSON.stringify(data, null, 2));
}

checkRooms();
