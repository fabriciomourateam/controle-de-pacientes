const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = "https://qhzifnyjyxdushxorzrk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoemlmbnlqeXhkdXNoeG9yenJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDg0MzMsImV4cCI6MjA3MjkyNDQzM30.3K7qDeqle5OYC0wsuaB1S8NDkk8XfI8BN_VX7s4zLKA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  let log = 'Fetching 2 most recent diet plans...\n';
  const { data: plans } = await supabase.from('diet_plans').select('*').order('created_at', { ascending: false }).limit(2);
  
  if (plans && plans.length > 0) {
    for (const p of plans) {
      log += `\n\n=== Plano: ${p.name} (Ativo: ${p.active}) | Patient ID: ${p.patient_id} ===\n`;
      const { data: meals } = await supabase
        .from('diet_meals')
        .select('*')
        .eq('diet_plan_id', p.id)
        .order('meal_order');
      log += `Refeições cadastradas na DB: ${meals ? meals.length : 0}\n`;
      
      for (const m of (meals || [])) {
        const { data: foods } = await supabase
          .from('diet_foods')
          .select('*')
          .eq('meal_id', m.id);
        log += `  - [Meal Order: ${m.meal_order}] [ID: ${m.id}] ${m.meal_name}. Alimentos: ${foods ? foods.length : 0}\n`;
      }
    }
  } else {
    log += 'Nenhum plano encontrado.\n';
  }
  
  fs.writeFileSync('scripts/meals_output_utf8.txt', log, 'utf8');
}

check().catch(console.error);
