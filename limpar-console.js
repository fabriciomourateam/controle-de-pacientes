// Script para limpar dados das métricas comerciais via console do navegador
// Cole este código no console do navegador (F12 -> Console)

console.log('🧹 Iniciando limpeza completa dos dados das métricas comerciais...');

// Lista de chaves para limpar
const chavesParaLimpar = [
    'n8n_metrics_data',
    'commercial_metrics_data', 
    'metrics_data',
    'n8n_data',
    'webhook_data'
];

// Verificar dados existentes
console.log('🔍 Verificando dados existentes...');
const chavesExistentes = [];
chavesParaLimpar.forEach(chave => {
    if (localStorage.getItem(chave)) {
        chavesExistentes.push(chave);
        console.log(`📊 Dados encontrados em: ${chave}`);
    }
});

// Verificar outras chaves relacionadas
const todasChaves = Object.keys(localStorage);
const chavesRelacionadas = todasChaves.filter(chave => 
    chave.includes('n8n') || 
    chave.includes('metric') || 
    chave.includes('commercial')
);

console.log(`📋 Total de chaves relacionadas encontradas: ${chavesRelacionadas.length}`);
chavesRelacionadas.forEach(chave => {
    console.log(`  - ${chave}`);
});

// Limpar dados
console.log('🗑️ Limpando dados...');
let removidas = 0;

// Limpar chaves específicas
chavesParaLimpar.forEach(chave => {
    if (localStorage.getItem(chave)) {
        localStorage.removeItem(chave);
        removidas++;
        console.log(`✅ Removido: ${chave}`);
    }
});

// Limpar chaves relacionadas
chavesRelacionadas.forEach(chave => {
    if (!chavesParaLimpar.includes(chave)) {
        localStorage.removeItem(chave);
        removidas++;
        console.log(`✅ Removido: ${chave}`);
    }
});

console.log(`🎉 Limpeza concluída! ${removidas} chaves removidas.`);

// Verificar se ainda há dados
const chavesRestantes = Object.keys(localStorage).filter(chave => 
    chave.includes('n8n') || 
    chave.includes('metric') || 
    chave.includes('commercial')
);

if (chavesRestantes.length === 0) {
    console.log('✅ Todos os dados das métricas foram removidos com sucesso!');
    console.log('🎯 Agora você pode testar com dados reais do N8N');
} else {
    console.log('⚠️ Ainda há dados restantes:');
    chavesRestantes.forEach(chave => {
        console.log(`  - ${chave}`);
    });
}

console.log('📋 Próximos passos:');
console.log('1. Configure o N8N para enviar dados para: https://painel-fmteam.vercel.app/api/public-webhook');
console.log('2. Acesse a página de Métricas Comerciais');
console.log('3. Execute o workflow do N8N');
console.log('4. Verifique se os dados aparecem na página');
