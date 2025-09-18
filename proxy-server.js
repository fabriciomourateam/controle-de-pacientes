import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Proxy para API do Notion
app.post('/api/notion-proxy', async (req, res) => {
  try {
    const { apiKey, databaseId, action, requestBody = {} } = req.body;

    if (!apiKey || !databaseId) {
      return res.status(400).json({
        success: false,
        error: 'API Key e Database ID são obrigatórios'
      });
    }

    if (action === 'query') {
      const defaultBody = {
        page_size: 100,
        ...requestBody
      };

      console.log('🔍 Fazendo requisição para Notion API...');
      console.log('📊 Database ID:', databaseId);
      console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
      console.log('📋 Request Body:', JSON.stringify(defaultBody, null, 2));

      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultBody)
      });

      console.log('📡 Status da resposta:', response.status);
      console.log('📡 Status Text:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro da API do Notion:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Dados recebidos:', data.results?.length || 0, 'registros');
      res.json(data);
    } else {
      res.status(400).json({
        success: false,
        error: 'Ação não suportada'
      });
    }

  } catch (error) {
    console.error('Erro no proxy:', error);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor proxy',
      details: String(error)
    });
  }
});

// Rota para sincronização de métricas
app.post('/api/sync-dashboard-metrics', async (req, res) => {
  try {
    const { apiKey, databaseId } = req.body;

    if (!apiKey || !databaseId) {
      return res.status(400).json({
        success: false,
        error: 'API Key e Database ID são obrigatórios'
      });
    }

    console.log('🔄 Iniciando sincronização de métricas...');
    
    // Importar o serviço dinamicamente
    const { DashboardNotionService } = await import('./src/lib/dashboard-notion-service.js');
    const dashboardNotionService = new DashboardNotionService(apiKey);
    const result = await dashboardNotionService.syncToSupabase(databaseId);

    if (result.success) {
      console.log('✅ Métricas sincronizadas com sucesso!');
      return res.status(200).json({
        success: true,
        message: result.message || `Métricas sincronizadas com sucesso! ${result.imported || 0} inseridas, ${result.updated || 0} atualizadas.`,
        imported: result.imported || 0,
        total: result.imported + result.updated,
        inserted: result.imported || 0,
        updated: result.updated || 0
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.message || 'Erro na sincronização'
      });
    }
  } catch (error) {
    console.error('Erro na sincronização de métricas:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro desconhecido'
    });
  }
});

// Auto-sync em background (para produção)
let autoSyncInterval = null;

// Endpoint para configurar auto-sync
app.post('/api/configure-auto-sync', (req, res) => {
  const { apiKey, databaseId, intervalMinutes, enabled } = req.body;
  
  if (!enabled) {
    if (autoSyncInterval) {
      clearInterval(autoSyncInterval);
      autoSyncInterval = null;
      console.log('🛑 Auto-sync desabilitado');
    }
    return res.json({ success: true, message: 'Auto-sync desabilitado' });
  }

  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
  }

  console.log(`🔄 Configurando auto-sync: ${intervalMinutes} minutos`);
  
  autoSyncInterval = setInterval(async () => {
    try {
      console.log('🔄 Executando sincronização automática...');
      // Chamar endpoint de sincronização
      const response = await fetch('http://localhost:3001/api/sync-dashboard-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, databaseId })
      });
      
      const result = await response.json();
      console.log('✅ Auto-sync concluído:', result);
    } catch (error) {
      console.error('❌ Erro no auto-sync:', error);
    }
  }, intervalMinutes * 60 * 1000);

  res.json({ 
    success: true, 
    message: `Auto-sync configurado para ${intervalMinutes} minutos` 
  });
});

app.listen(port, () => {
  console.log(`Servidor proxy rodando em http://localhost:${port}`);
  console.log(`🔧 Auto-sync endpoint: http://localhost:${port}/api/configure-auto-sync`);
});
