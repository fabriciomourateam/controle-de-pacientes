const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = "https://qhzifnyjyxdushxorzrk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoemlmbnlqeXhkdXNoeG9yenJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDg0MzMsImV4cCI6MjA3MjkyNDQzM30.3K7qDeqle5OYC0wsuaB1S8NDkk8XfI8BN_VX7s4zLKA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  let log = 'Buscando TODOS os pacientes...\n';
  const { data: pts } = await supabase.from('patients').select('id, nome, telefone');
  
  if (pts && pts.length > 0) {
    // Filtrar pacientes com "9859" e "4007" no telefone
    const matches = pts.filter(p => p.telefone && p.telefone.includes('9859') && p.telefone.includes('4007'));
    
    if (matches.length > 0) {
      for (const pt of matches) {
        log += `\n\nPaciente encontrado: ${pt.nome} (Telefone: ${pt.telefone}, ID: ${pt.id})\n`;
        
        // Buscar planos
        const { data: plans } = await supabase.from('diet_plans').select('*').eq('patient_id', pt.id).order('created_at', { ascending: false });
        
        if (plans && plans.length > 0) {
          for (const p of plans) {
            log += `=== Plano: ${p.name} (Ativo: ${p.active}) | ID: ${p.id} ===\n`;
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
          log += 'Nenhum plano encontrado para este paciente.\n';
        }
      }
    } else {
      log += 'Paciente não encontrado após filtrar em javascript.\n';
      // list some
      log += 'Amostra de telefones:\n';
      pts.slice(0, 10).forEach(p => log += `- ${p.nome}: ${p.telefone}\n`);
    }
  } else {
    log += 'Tabela patients vazia ou inacessível.\n';
  }
  
  fs.writeFileSync('scripts/meals_user_output.txt', log, 'utf8');
}

check().catch(console.error);
