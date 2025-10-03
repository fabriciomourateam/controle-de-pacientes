const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const port = 3002;

// Configurar CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Middleware para log das requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Proxy para N8N
app.use('/api', createProxyMiddleware({
  target: 'https://n8n.shapepro.shop',
  changeOrigin: true,
  secure: true,
  onProxyReq: (proxyReq, req, res) => {
    // Adicionar API Key do N8N
    proxyReq.setHeader('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMzg3MmUxMy00YWE1LTRlNDAtYjRhNi03NTQ2ZjQyZGQ5NTgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5NTE0NTg5fQ.aI088L82zfQYwuTCLrN4IiSuD4XuFC6hxmtWMpys0ko');
    proxyReq.setHeader('Content-Type', 'application/json');
  },
  onProxyRes: (proxyRes, req, res) => {
    // Adicionar headers CORS
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  },
  onError: (err, req, res) => {
    console.error('Erro no proxy:', err);
    res.status(500).json({ error: 'Erro no proxy para N8N' });
  }
}));

// Endpoint de teste
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Proxy N8N funcionando',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para testar conexão com N8N
app.get('/test-n8n', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://n8n.shapepro.shop/api/v1/datatables/07P5hv4Q2O4fRA7t/rows?limit=1', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMzg3MmUxMy00YWE1LTRlNDAtYjRhNi03NTQ2ZjQyZGQ5NTgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5NTE0NTg5fQ.aI088L82zfQYwuTCLrN4IiSuD4XuFC6hxmtWMpys0ko',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      res.json({ success: true, message: 'Conexão com N8N OK' });
    } else {
      res.json({ success: false, message: `Erro N8N: ${response.status}` });
    }
  } catch (error) {
    res.json({ success: false, message: `Erro: ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`🚀 Proxy N8N rodando na porta ${port}`);
  console.log(`📡 Endpoints disponíveis:`);
  console.log(`   GET  /health - Status do proxy`);
  console.log(`   GET  /test-n8n - Teste de conexão com N8N`);
  console.log(`   GET  /api/* - Proxy para N8N`);
  console.log(`\n🔗 URLs para usar no frontend:`);
  console.log(`   http://localhost:${port}/api/v1/datatables/{tableId}/rows`);
  console.log(`\n⚠️  NOTA: Porta 3001 já está sendo usada pelo proxy do Notion`);
  console.log(`   Este proxy N8N está rodando na porta ${port}`);
});
