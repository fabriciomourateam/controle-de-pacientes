// Script de teste para o webhook de checkin
// Execute com: node test-webhook-checkin.js

// Diferentes formatos de telefone para testar
const testCases = [
  {
    name: "Telefone com +55",
    data: {
      telefone: "+553497226444",
      mes_ano: "2024-01",
      peso: "70.5",
      pontos_treinos: "8",
      treino: "Fiz 3 treinos esta semana",
      nome: "João Silva"
    }
  },
  {
    name: "Telefone com 9 extra",
    data: {
      telefone: "5534997226444",
      mes_ano: "2024-01",
      peso: "65.2",
      pontos_treinos: "7",
      treino: "2 treinos esta semana",
      nome: "Maria Santos"
    }
  },
  {
    name: "Telefone normal",
    data: {
      telefone: "3497226444",
      mes_ano: "2024-01",
      peso: "72.1",
      pontos_treinos: "9",
      treino: "4 treinos esta semana",
      nome: "Pedro Costa"
    }
  },
  {
    name: "Telefone com formatação",
    data: {
      telefone: "(34) 97226-4444",
      mes_ano: "2024-01",
      peso: "68.3",
      pontos_treinos: "6",
      treino: "3 treinos esta semana",
      nome: "Ana Lima"
    }
  }
];

async function testWebhook(testCase) {
  try {
    console.log(`\n🧪 Testando: ${testCase.name}`);
    console.log(`📞 Telefone: ${testCase.data.telefone}`);
    
    const response = await fetch('http://localhost:3000/api/n8n-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.data)
    });

    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    
    if (result.success) {
      console.log('✅ Teste passou! Checkin criado com sucesso.');
      if (result.checkin_id) {
        console.log(`📝 ID do checkin: ${result.checkin_id}`);
      }
    } else {
      console.log('❌ Teste falhou:', result.error);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Iniciando testes de normalização de telefone...\n');
  
  for (const testCase of testCases) {
    await testWebhook(testCase);
    // Aguardar 1 segundo entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✨ Todos os testes concluídos!');
}

// Executar testes
runAllTests();
