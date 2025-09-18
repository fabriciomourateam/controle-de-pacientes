// Teste simples para verificar conexão com Supabase
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (substitua pelos seus valores)
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('🧪 Testando conexão com Supabase...');
  
  try {
    // Testar se a tabela dashboard_dados existe
    console.log('📊 Verificando tabela dashboard_dados...');
    const { data, error } = await supabase
      .from('dashboard_dados')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro ao acessar dashboard_dados:', error.message);
      
      if (error.message.includes('relation "dashboard_dados" does not exist')) {
        console.log('💡 Solução: Execute primeiro o script sql/create-dashboard-tables-flexible.sql');
      }
    } else {
      console.log('✅ Tabela dashboard_dados existe e está acessível');
      console.log('📋 Registros encontrados:', data.length);
    }
    
    // Testar se a view dashboard_metricas existe
    console.log('📈 Verificando view dashboard_metricas...');
    const { data: metricasData, error: metricasError } = await supabase
      .from('dashboard_metricas')
      .select('*')
      .limit(1);
    
    if (metricasError) {
      console.log('❌ Erro ao acessar dashboard_metricas:', metricasError.message);
    } else {
      console.log('✅ View dashboard_metricas existe e está acessível');
      console.log('📋 Registros encontrados:', metricasData.length);
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

testSupabaseConnection();




