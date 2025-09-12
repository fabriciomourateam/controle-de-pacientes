import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    // Log dos dados recebidos
    console.log('=== DADOS RECEBIDOS DO N8N ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(data, null, 2));
    console.log('================================');
    
    return res.status(200).json({
      success: true,
      message: 'Dados recebidos com sucesso',
      receivedData: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao processar dados:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: String(error)
    });
  }
}
