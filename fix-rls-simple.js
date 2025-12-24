const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qhzifnyjyxdushxorzrk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLS() {
  try {
    console.log('🔄 Corrigindo RLS para sistema de feedback...');
    
    // 1. Habilitar RLS
    console.log('📝 Habilitando RLS...');
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE feedback_prompt_templates ENABLE ROW LEVEL SECURITY' 
    });
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE checkin_feedback_analysis ENABLE ROW LEVEL SECURITY' 
    });
    
    // 2. Remover políticas existentes
    console.log('🗑️ Removendo políticas antigas...');
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view own templates" ON feedback_prompt_templates',
      'DROP POLICY IF EXISTS "Users can create templates" ON feedback_prompt_templates',
      'DROP POLICY IF EXISTS "Users can update own templates" ON feedback_prompt_templates',
      'DROP POLICY IF EXISTS "Users can delete own templates" ON feedback_prompt_templates',
      'DROP POLICY IF EXISTS "Users can view templates" ON feedback_prompt_templates',
      'DROP POLICY IF EXISTS "Users can update templates" ON feedback_prompt_templates',
      'DROP POLICY IF EXISTS "Users can delete templates" ON feedback_prompt_templates'
    ];
    
    for (const policy of dropPolicies) {
      await supabase.rpc('exec_sql', { sql_query: policy });
    }
    
    // 3. Criar novas políticas para templates
    console.log('🔐 Criando políticas para templates...');
    
    // View templates
    await supabase.rpc('exec_sql', { 
      sql_query: `CREATE POLICY "Users can view templates" ON feedback_prompt_templates
        FOR SELECT USING (auth.uid() = user_id)`
    });
    
    // Create templates
    await supabase.rpc('exec_sql', { 
      sql_query: `CREATE POLICY "Users can create templates" ON feedback_prompt_templates
        FOR INSERT WITH CHECK (auth.uid() = user_id)`
    });
    
    // Update templates
    await supabase.rpc('exec_sql', { 
      sql_query: `CREATE POLICY "Users can update templates" ON feedback_prompt_templates
        FOR UPDATE USING (auth.uid() = user_id)`
    });
    
    // Delete templates
    await supabase.rpc('exec_sql', { 
      sql_query: `CREATE POLICY "Users can delete templates" ON feedback_prompt_templates
        FOR DELETE USING (auth.uid() = user_id)`
    });
    
    console.log('✅ Políticas RLS corrigidas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir RLS:', error);
  }
}

fixRLS();