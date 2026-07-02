import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearDB() {
  const { error } = await supabase.from('posts').delete().neq('id', '0');
  console.log('Cleared DB error?', error);
}

clearDB();
