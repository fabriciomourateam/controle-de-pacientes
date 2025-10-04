// Endpoint para o frontend buscar dados do N8N
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Simular dados do N8N (em produção, isso viria de um banco de dados)
    const mockData = {
      leads_que_entraram: [
        {
          data: {
            DATA: new Date().toISOString().split('T')[0],
            GOOGLE: 15,
            'GOOGLE-FORMS': '8',
            INSTAGRAM: 12,
            FACEBOOK: 6,
            SELLER: '4',
            'INDICAÇÃO': '3',
            OUTROS: 2,
            TOTAL: 50
          },
          timestamp: new Date().toISOString(),
          receivedAt: new Date().toISOString()
        }
      ],
      calls_agendadas: [
        {
          data: {
            AGENDADAS: new Date().toISOString().split('T')[0],
            'AGEND GOOGLE': 8,
            'AGEND GOOGLE-FORMS': 4,
            'AGEND INSTAGRAM': 6,
            'AGEND FACEBOOK': 3,
            'AGEND SELLER': 2,
            'AGEND INDICAÇÃO': 1,
            'AGEND OUTROS': 1,
            'TOTAL DE CALLS AGENDADAS': 25,
            '% QUE VAI PRA CALL': '50%'
          },
          timestamp: new Date().toISOString(),
          receivedAt: new Date().toISOString()
        }
      ],
      total_leads_mes: [
        {
          data: {
            LEADS: 'Janeiro 2024',
            LEAD_GOOGLE: 450,
            LEAD_GOOGLE_FORMS: 200,
            LEAD_INSTAGRAM: 300,
            LEAD_FACEBOOK: 150,
            LEAD_SELLER: 100,
            LEAD_INDICACAO: 80,
            LEAD_OUTROS: 50,
            TOTAL_DE_LEADS: 1330
          },
          timestamp: new Date().toISOString(),
          receivedAt: new Date().toISOString()
        }
      ]
    };

    res.status(200).json({
      success: true,
      message: 'Dados do N8N recuperados com sucesso',
      timestamp: new Date().toISOString(),
      data: mockData,
      instructions: 'Estes são dados de exemplo. Em produção, viriam do N8N real.'
    });

  } catch (error) {
    console.error('❌ Erro ao buscar dados do N8N:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
}
