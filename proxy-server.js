import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Proxy para API do Notion
app.post('/api/notion-proxy', async (req, res) => {
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

      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } else {
      res.status(400).json({
        success: false,
        error: 'Ação não suportada'
      });
    }

  } catch (error) {
    console.error('Erro no proxy:', error);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor proxy',
      details: String(error)
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor proxy rodando em http://localhost:${port}`);
});
