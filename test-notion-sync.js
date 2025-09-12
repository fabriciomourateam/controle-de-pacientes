// Script para testar sincronização com Notion
import { NotionService } from './src/lib/notion-service.js';

async function testNotionSync() {
  try {
    console.log('🧪 Testando sincronização com Notion...');
    
    // Substitua pelas suas credenciais reais
    const apiKey = 'YOUR_NOTION_API_KEY';
    const databaseId = 'YOUR_DATABASE_ID';
    
    if (apiKey === 'YOUR_NOTION_API_KEY' || databaseId === 'YOUR_DATABASE_ID') {
      console.log('❌ Configure suas credenciais do Notion no script');
      return;
    }
    
    const notionService = new NotionService(apiKey);
    
    console.log('📡 Testando proxy...');
    const data = await notionService.fetchAllDataProxy(databaseId);
    console.log(`✅ Proxy funcionando! Encontrados ${data.length} registros`);
    
    console.log('🔄 Testando mapeamento...');
    const mapped = data.slice(0, 3).map(page => notionService.mapNotionToSupabase(page));
    console.log('✅ Mapeamento funcionando!', mapped);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testNotionSync();