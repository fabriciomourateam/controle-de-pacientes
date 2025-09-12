// Proxy para chamadas da API do Notion (contorna CORS)
export async function fetchNotionData(apiKey: string, databaseId: string, requestBody: any = {}) {
  try {
    // Chamar diretamente o servidor proxy na porta 3001
    const response = await fetch('http://localhost:3001/api/notion-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        databaseId,
        action: 'query',
        requestBody
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API do Notion:', { status: response.status, error: errorText });
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro no proxy do Notion:', error);
    throw error;
  }
}
