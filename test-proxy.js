const express = require('express');
const cors = require('cors');

const app = express();
const port = 3002;

// Configurar CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Endpoint de teste
app.get('/health', (req, res) => {
  console.log('✅ Health check recebido');
  res.json({ 
    status: 'ok', 
    message: 'Proxy N8N funcionando',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para testar conexão com N8N
app.get('/test-n8n', (req, res) => {
  console.log('✅ Test N8N recebido');
  res.json({ 
    success: true, 
    message: 'Conexão com N8N OK (simulado)',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🚀 Proxy N8N rodando na porta ${port}`);
  console.log(`📡 Teste: http://localhost:${port}/health`);
  console.log(`📡 Teste N8N: http://localhost:${port}/test-n8n`);
});
