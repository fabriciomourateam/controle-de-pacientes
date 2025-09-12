import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, databaseId, action, requestBody } = await request.json();

    console.log('Proxy Notion - Dados recebidos:', { 
      hasApiKey: !!apiKey, 
      hasDatabaseId: !!databaseId, 
      action,
      requestBodyKeys: Object.keys(requestBody || {})
    });

    if (!apiKey || !databaseId) {
      console.error('Proxy Notion - Parâmetros obrigatórios ausentes:', { apiKey: !!apiKey, databaseId: !!databaseId });
      return NextResponse.json(
        { error: 'API Key e Database ID são obrigatórios' },
        { status: 400 }
      );
    }

    // Fazer a chamada para a API do Notion
    console.log('Proxy Notion - Fazendo chamada para API do Notion...');
    const notionResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Proxy Notion - Resposta da API:', { 
      status: notionResponse.status, 
      ok: notionResponse.ok,
      statusText: notionResponse.statusText
    });

    if (!notionResponse.ok) {
      const errorData = await notionResponse.text();
      console.error('Erro da API do Notion:', { status: notionResponse.status, error: errorData });
      return NextResponse.json(
        { error: `Erro da API do Notion: ${notionResponse.status} - ${errorData}` },
        { status: notionResponse.status }
      );
    }

    const data = await notionResponse.json();
    console.log('Proxy Notion - Dados retornados:', { 
      hasResults: !!data.results, 
      resultsLength: data.results?.length,
      hasMore: data.has_more
    });
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erro no proxy do Notion:', error);
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 }
    );
  }
}

