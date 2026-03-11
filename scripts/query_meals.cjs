const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = "https://qhzifnyjyxdushxorzrk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoemlmbnlqeXhkdXNoeG9yenJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDg0MzMsImV4cCI6MjA3MjkyNDQzM30.3K7qDeqle5OYC0wsuaB1S8NDkk8XfI8BN_VX7s4zLKA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
  const { data: patients } = await supabase.from('patients').select('id, nome, telefone').order('created_at', { ascending: false });
  fs.writeFileSync('scripts/sql_output.txt', JSON.stringify(patients, null, 2), 'utf8');
}

runSQL().catch(console.error);
