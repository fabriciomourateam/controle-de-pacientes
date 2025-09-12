import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== TESTE WEBHOOK ===');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    console.log('Body type:', typeof req.body);
    console.log('Body:', req.body);
    console.log('====================');

    return res.status(200).json({
      success: true,
      message: 'Dados recebidos com sucesso',
      receivedData: req.body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no teste:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: String(error)
    });
  }
}
