// Proxy para Chamadas da API Anthropic
// Resolve erro de CORS ao fazer a requisição do lado do servidor

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            error: 'Chave da API Anthropic não configurada no ambiente Vercel.'
        });
    }

    try {
        const { model, messages, max_tokens } = req.body;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model || 'claude-sonnet-4-5-20250929',
                messages,
                max_tokens: max_tokens || 4000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Anthropic API error:', data);
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Error in analyze-bioimpedancia proxy:', error);
        return res.status(500).json({
            error: 'Erro interno ao processar a análise corporal',
            message: error.message
        });
    }
}
