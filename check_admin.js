const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUserRole() {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, name, role')
    .eq('email', 'victoriamaybradley@gmail.com');
  
  if (error) {
    return;
  }
  
}

checkUserRole();
