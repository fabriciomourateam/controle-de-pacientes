import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

      res.json({
        success: true,
        data: data,
        recordsCount: data.results?.length || 0
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Ação não suportada. Use "query"'
      });
    }

  } catch (error) {
    console.error('❌ Erro no proxy:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor proxy rodando em http://localhost:${port}`);
  console.log(`💚 Health check: http://localhost:${port}/health`);
  console.log(`🔧 Notion proxy: http://localhost:${port}/api/notion-proxy`);
});

// Manter o processo vivo
process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});
