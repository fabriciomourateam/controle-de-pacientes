import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = 'https://qhzifnyjyxdushxorzrk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoemlmbnlqeXhkdXNoeG9yenJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM0ODQzMywiZXhwIjoyMDcyOTI0NDMzfQ.LpQxBVftxEC4h-pIa_V4SQ0YmXEGaO4AUo2YUVI3nek';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQL() {
  try {
    console.log('🔄 Executando script SQL para sistema de feedback de check-in...');
    
    // Ler o arquivo SQL simplificado
    const sqlPath = path.join(__dirname, 'sql', 'checkin-feedback-system-simple.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar o SQL principal
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
    
    if (error) {
      console.error('❌ Erro ao executar SQL principal:', error);
      return;
    }
    
    console.log('✅ Tabelas criadas com sucesso!');
    
    // Tentar inserir template padrão
    try {
      const templateSqlPath = path.join(__dirname, 'sql', 'insert-default-template.sql');
      const templateSqlContent = fs.readFileSync(templateSqlPath, 'utf8');
      
      const { data: templateData, error: templateError } = await supabase.rpc('exec_sql', { sql_query: templateSqlContent });
      
      if (templateError) {
        console.warn('⚠️ Aviso ao inserir template padrão:', templateError);
        console.log('📝 Você pode inserir o template manualmente depois');
      } else {
        console.log('📝 Template padrão inserido com sucesso!');
      }
    } catch (templateErr) {
      console.warn('⚠️ Não foi possível inserir template padrão:', templateErr.message);
    }
    
    console.log('📋 Tabelas criadas:');
    console.log('  - feedback_prompt_templates');
    console.log('  - checkin_feedback_analysis');
    console.log('🔐 Políticas RLS configuradas');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

runSQL();