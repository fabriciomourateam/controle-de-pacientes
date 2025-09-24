// API Route para sincronização de métricas do dashboard na Vercel
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { apiKey, databaseId } = req.body;

    if (!apiKey || !databaseId) {
      return res.status(400).json({
        success: false,
        error: 'API Key e Database ID são obrigatórios'
      });
    }

    console.log('🔄 Iniciando sincronização de métricas...');
    console.log('📊 Database ID:', databaseId);
    console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');

    // Aqui você pode implementar a lógica de sincronização
    // Por enquanto, vamos retornar sucesso
    res.json({
      success: true,
      message: 'Sincronização de métricas iniciada',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na sincronização de métricas:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}