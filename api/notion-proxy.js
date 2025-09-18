// Vercel Serverless Function para proxy do Notion
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder OPTIONS para CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { apiKey, databaseId, action, requestBody = {} } = req.body;

    if (!apiKey || !databaseId) {
      return res.status(400).json({
        success: false,
        error: 'API Key e Database ID são obrigatórios'
      });
    }

    if (action === 'query') {
      const defaultBody = {
        page_size: 100,
        ...requestBody
      };

      console.log('🔍 Fazendo requisição para Notion API...');
      console.log('📊 Database ID:', databaseId);
      console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');

      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultBody)
      });

      console.log('📡 Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro da API do Notion:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Dados recebidos:', data.results?.length || 0, 'registros');
      
      return res.status(200).json(data);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Ação não suportada'
      });
    }

  } catch (error) {
    console.error('Erro no proxy:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro no servidor proxy',
      details: String(error)
    });
  }
}
