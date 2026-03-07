import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

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

// Proxy para Anthropic (Bioimpedância)
app.post('/api/analyze-bioimpedancia', async (req, res) => {
  try {
    const apiKey = process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('❌ Chave ANTHROPIC_API_KEY não encontrada no .env');
      return res.status(500).json({ error: 'Chave da API Anthropic não configurada localmente.' });
    }

    const { model, messages, max_tokens } = req.body;

    const bodySize = JSON.stringify(req.body).length;
    console.log(`🤖 Fazendo requisição para Anthropic API (via Proxy Local)... Payload: ${(bodySize / 1024 / 1024).toFixed(2)}MB`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-5-20250929',
        messages,
        max_tokens: max_tokens || 4000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da API da Anthropic:', data);
      return res.status(response.status).json(data);
    }

    console.log('✅ Resposta da IA recebida com sucesso!');
    res.json(data);
  } catch (error) {
    console.error('❌ Erro no proxy Anthropic:', error);
    res.status(500).json({ error: 'Erro no servidor proxy', details: String(error) });
  }
});

// Middleware de erro global para evitar crash do processo
app.use((err, req, res, next) => {
  console.error('🔥 Erro Global no Proxy:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erro interno no servidor proxy',
    type: err.type
  });
});

app.listen(port, () => {
  console.log(`Servidor proxy rodando em http://localhost:${port}`);
  console.log(`🔧 Auto-sync endpoint: http://localhost:${port}/api/configure-auto-sync`);
});
