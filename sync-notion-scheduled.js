// Script para sincronização agendada do Notion
import { createClient } from '@supabase/supabase-js';

// Configurações
const SUPABASE_URL = 'https://qhzifnyjyxdushxorzrk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoemlmbnlqeXhkdXNoeG9yenJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDg0MzMsImV4cCI6MjA3MjkyNDQzM30.3K7qDeqle5OYC0wsuaB1S8NDkk8XfI8BN_VX7s4zLKA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncNotionData() {
  const timestamp = new Date().toISOString();
  console.log(`🔄 [${timestamp}] Iniciando sincronização agendada do Notion...`);
  
  try {
    // Fazer requisição para o proxy local
    const response = await fetch('http://localhost:3001/api/notion-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'query',
        apiKey: process.env.NOTION_API_KEY || 'ntn_E50356...', // Use sua API key real
        databaseId: process.env.NOTION_DATABASE_ID || '631cf85b608d4c1693b772bfe0822f64', // Use seu database ID real
        requestBody: {
          page_size: 100
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ [${timestamp}] Sincronização concluída com sucesso!`);
    console.log(`📊 Dados processados:`, result);
    
    // Salvar log da sincronização
    await supabase
      .from('sync_logs')
      .insert({
        timestamp: timestamp,
        status: 'success',
        details: JSON.stringify(result),
        sync_type: 'scheduled'
      });

  } catch (error) {
    console.error(`❌ [${timestamp}] Erro na sincronização:`, error.message);
    
    // Salvar log de erro
    await supabase
      .from('sync_logs')
      .insert({
        timestamp: timestamp,
        status: 'error',
        details: error.message,
        sync_type: 'scheduled'
      });
  }
}

// Executar sincronização
syncNotionData()
  .then(() => {
    console.log('🎯 Sincronização agendada finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal na sincronização:', error);
    process.exit(1);
  });
