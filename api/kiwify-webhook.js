// Endpoint para receber webhooks da Kiwify
// Configurado para funcionar com Vercel

export default async function handler(req, res) {
  // Configurar CORS
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
      message: 'Webhook Kiwify funcionando',
      timestamp: new Date().toISOString(),
      instructions: 'Use POST para receber eventos da Kiwify',
      endpoint: '/api/kiwify-webhook'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const event = req.body;

    console.log('=== WEBHOOK KIWIFY RECEBIDO ===');
    console.log('Event:', event.event || 'unknown');
    console.log('Data:', JSON.stringify(event.data, null, 2));
    console.log('Timestamp:', new Date().toISOString());
    console.log('================================');

    // Por enquanto, apenas retornar sucesso
    // A lógica completa será adicionada após confirmar que o endpoint funciona
    return res.status(200).json({
      success: true,
      message: 'Webhook recebido com sucesso',
      event: event.event || 'unknown',
      timestamp: new Date().toISOString(),
      note: 'Endpoint funcionando - lógica completa será adicionada em seguida'
    });

  } catch (error) {
    console.error('Erro geral no webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
