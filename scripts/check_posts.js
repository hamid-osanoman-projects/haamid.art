import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDB() {
  const { data, error } = await supabase.from('posts').select('*');
  console.log('Posts in DB:', data?.map(d => ({ id: d.id, title: d.title, slug: d.slug })));
}

checkDB();
