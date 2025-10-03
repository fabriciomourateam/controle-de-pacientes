// Webhook público temporário para teste
// Execute este arquivo para criar um endpoint público

const express = require('express');
const cors = require('cors');

const app = express();
const port = 3003;

// Configurar CORS
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// Endpoint para receber dados do N8N
app.post('/api/n8n-webhook', (req, res) => {
  console.log('📊 Dados recebidos do N8N:');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('📋 Dados:', JSON.stringify(req.body, null, 2));
  
  const { table, data, timestamp } = req.body;
  
  // Simular processamento
  console.log(`✅ Processando tabela: ${table}`);
  console.log(`📊 Registros: ${Array.isArray(data) ? data.length : 1}`);
  
  res.json({
    success: true,
    message: `Dados da tabela ${table} recebidos com sucesso`,
    timestamp: new Date().toISOString(),
    receivedData: {
      table,
      recordCount: Array.isArray(data) ? data.length : 1,
      timestamp
    }
  });
});

// Endpoint de teste
app.get('/api/n8n-webhook', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook N8N funcionando',
    timestamp: new Date().toISOString(),
    instructions: 'Use POST para enviar dados do N8N'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Webhook público funcionando',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🚀 Webhook público rodando na porta ${port}`);
  console.log(`📡 URL para N8N: http://localhost:${port}/api/n8n-webhook`);
  console.log(`🔍 Teste: http://localhost:${port}/health`);
  console.log(`\n⚠️  IMPORTANTE: Use esta URL no N8N: http://localhost:${port}/api/n8n-webhook`);
});
