// Endpoint público para receber dados do N8N
// Sem proteção de deploy

export default async function handler(req, res) {
  // Configurar CORS para permitir acesso de qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Endpoint de teste (GET)
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'Webhook público N8N funcionando',
      timestamp: new Date().toISOString(),
      instructions: 'Use POST para enviar dados do N8N',
      endpoint: '/api/public-webhook'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { table, data, timestamp } = req.body;

    console.log(`📊 Dados recebidos do N8N - Tabela: ${table}`);
    console.log(`📅 Timestamp: ${timestamp}`);
    console.log(`📋 Dados:`, JSON.stringify(data, null, 2));

    // Processar e salvar os dados
    const webhookData = {
      table,
      data,
      timestamp: timestamp || new Date().toISOString()
    };

    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 100));

    // Retornar os dados para o frontend processar
    res.status(200).json({
      success: true,
      message: `Dados da tabela ${table} recebidos com sucesso`,
      timestamp: new Date().toISOString(),
      webhookData: webhookData,
      receivedData: {
        table,
        recordCount: Array.isArray(data) ? data.length : 1,
        timestamp: webhookData.timestamp
      },
      instructions: 'Os dados foram enviados para o frontend processar'
    });

  } catch (error) {
    console.error('❌ Erro ao processar dados do N8N:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
}
