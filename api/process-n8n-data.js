// Endpoint para processar dados do N8N no frontend
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { table, data, timestamp } = req.body;

    console.log(`🔄 Processando dados do N8N - Tabela: ${table}`);
    console.log(`📅 Timestamp: ${timestamp}`);
    console.log(`📋 Dados:`, JSON.stringify(data, null, 2));

    // Retornar os dados para o frontend processar
    res.status(200).json({
      success: true,
      message: `Dados da tabela ${table} prontos para processamento`,
      timestamp: new Date().toISOString(),
      webhookData: {
        table,
        data,
        timestamp: timestamp || new Date().toISOString()
      }
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
