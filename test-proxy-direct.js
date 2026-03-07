import fetch from 'node-fetch';

async function testProxyDirect() {
    console.log('🧪 Testando proxy diretamente...');
    
    try {
        const response = await fetch('http://localhost:3001/api/analyze-bioimpedancia', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5-20250929',
                messages: [
                    {
                        role: 'user',
                        content: 'Teste simples. Responda apenas: OK'
                    }
                ],
                max_tokens: 10
            })
        });

        console.log('📊 Status:', response.status);
        console.log('📊 Status Text:', response.statusText);

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Proxy funcionando!');
            console.log('📋 Resposta:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ Erro no proxy:');
            console.log('📋 Detalhes:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.log('❌ Erro na conexão:', error.message);
    }
}

testProxyDirect();