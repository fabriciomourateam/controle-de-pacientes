// Webhook simples para receber dados do N8N
// Este arquivo pode ser usado como referência para criar o webhook no N8N

const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Webhook para receber dados de leads
app.post('/webhook/leads-updated', (req, res) => {
  console.log('📊 Leads atualizados:', req.body);
  
  // Aqui você pode processar os dados recebidos
  const { table, data, timestamp } = req.body;
  
  // Salvar em cache ou banco de dados
  // Por exemplo, salvar em um arquivo JSON ou banco de dados
  
  res.json({ 
    success: true, 
    message: 'Leads atualizados com sucesso',
    timestamp: new Date().toISOString()
  });
});

// Webhook para receber dados de calls
app.post('/webhook/calls-updated', (req, res) => {
  console.log('📞 Calls atualizadas:', req.body);
  
  const { table, data, timestamp } = req.body;
  
  res.json({ 
    success: true, 
    message: 'Calls atualizadas com sucesso',
    timestamp: new Date().toISOString()
  });
});

// Webhook para receber dados mensais de leads
app.post('/webhook/leads-monthly-updated', (req, res) => {
  console.log('📈 Leads mensais atualizados:', req.body);
  
  const { table, data, timestamp } = req.body;
  
  res.json({ 
    success: true, 
    message: 'Leads mensais atualizados com sucesso',
    timestamp: new Date().toISOString()
  });
});

// Webhook para receber dados de leads por funil
app.post('/webhook/leads-funis-updated', (req, res) => {
  console.log('🎯 Leads por funil atualizados:', req.body);
  
  const { table, data, timestamp } = req.body;
  
  res.json({ 
    success: true, 
    message: 'Leads por funil atualizados com sucesso',
    timestamp: new Date().toISOString()
  });
});

// Webhook para receber dados de agendamentos por funil
app.post('/webhook/agend-funis-updated', (req, res) => {
  console.log('📅 Agendamentos por funil atualizados:', req.body);
  
  const { table, data, timestamp } = req.body;
  
  res.json({ 
    success: true, 
    message: 'Agendamentos por funil atualizados com sucesso',
    timestamp: new Date().toISOString()
  });
});

// Webhook único para todos os dados
app.post('/webhook/metrics-updated', (req, res) => {
  console.log('📊 Métricas atualizadas:', req.body);
  
  const { table, data, timestamp } = req.body;
  
  // Processar dados baseado na tabela
  switch (table) {
    case 'leads_que_entraram':
      console.log('Processando leads diários...');
      break;
    case 'total_leads_mes':
      console.log('Processando leads mensais...');
      break;
    case 'calls_agendadas':
      console.log('Processando calls...');
      break;
    case 'leads_funis':
      console.log('Processando leads por funil...');
      break;
    case 'agend_funis':
      console.log('Processando agendamentos por funil...');
      break;
    default:
      console.log('Tabela desconhecida:', table);
  }
  
  res.json({ 
    success: true, 
    message: 'Métricas atualizadas com sucesso',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para testar conexão
app.get('/webhook/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Webhook funcionando',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🚀 Webhook rodando na porta ${port}`);
  console.log(`📡 Endpoints disponíveis:`);
  console.log(`   POST /webhook/leads-updated`);
  console.log(`   POST /webhook/calls-updated`);
  console.log(`   POST /webhook/leads-monthly-updated`);
  console.log(`   POST /webhook/leads-funis-updated`);
  console.log(`   POST /webhook/agend-funis-updated`);
  console.log(`   POST /webhook/metrics-updated`);
  console.log(`   GET  /webhook/test`);
});
