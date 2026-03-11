const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qhzifnyjyxdushxorzrk.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoemlmbnlqeXhkdXNoeG9yenJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDg0MzMsImV4cCI6MjA3MjkyNDQzM30.3K7qDeqle5OYC0wsuaB1S8NDkk8XfI8BN_VX7s4zLKA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPhone() {
  const { data: patients, error } = await supabase
    .from('patients')
    .select('id, nome, telefone')
    .ilike('telefone', '%605%99%');
    
  console.log("Matches:", JSON.stringify(patients, null, 2));
}

checkPhone().catch(console.error);
