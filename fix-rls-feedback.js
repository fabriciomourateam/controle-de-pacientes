const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qhzifnyjyxdushxorzrk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile() {
  try {
    console.log('🔄 Executando correções RLS para sistema de feedback...');
    
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('./sql/fix-feedback-system-rls.sql', 'utf8');
    
    // Dividir em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql_query: command });
          
          if (error) {
            console.error(`❌ Erro no comando ${i + 1}:`, error);
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          }
        } catch (err) {
          console.error(`❌ Erro ao executar comando ${i + 1}:`, err);
        }
      }
    }
    
    console.log('✅ Correções RLS aplicadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar correções:', error);
  }
}

executeSQLFile();