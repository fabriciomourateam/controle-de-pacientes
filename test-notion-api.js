// Teste simples para verificar API do Notion
const https = require('https');

// Substitua pelos seus dados reais
const API_KEY = 'YOUR_NOTION_API_KEY_HERE';
const DATABASE_ID = 'YOUR_DATABASE_ID_HERE';

function testNotionAPI() {
  const postData = JSON.stringify({
    page_size: 1
  });

  const options = {
    hostname: 'api.notion.com',
    port: 443,
    path: `/v1/databases/${DATABASE_ID}/query`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ API Key e Database ID estão funcionando!');
        console.log('Resposta:', data);
      } else {
        console.log('❌ Erro na API do Notion:');
        console.log('Status:', res.statusCode);
        console.log('Resposta:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error);
  });

  req.write(postData);
  req.end();
}

console.log('🧪 Testando API do Notion...');
console.log('API Key:', API_KEY.substring(0, 10) + '...');
console.log('Database ID:', DATABASE_ID);
console.log('');

testNotionAPI();















