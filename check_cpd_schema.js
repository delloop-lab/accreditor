const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCpdSchema() {
  try {
    // Query to get table information
    const { data, error } = await supabase
      .rpc('get_table_info', { table_name: 'cpd' });
    
    if (error) {
      return;
    }
    
  } catch (error) {
  }
}

checkCpdSchema();
