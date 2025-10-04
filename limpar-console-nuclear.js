// SCRIPT NUCLEAR PARA LIMPAR TUDO
// Cole este código no console do navegador (F12 -> Console)

console.log('💥 INICIANDO LIMPEZA NUCLEAR...');

// 1. Verificar tudo que existe
console.log('🔍 Verificando localStorage...');
const todasChaves = Object.keys(localStorage);
console.log(`📊 Total de chaves: ${todasChaves.length}`);

const chavesRelacionadas = todasChaves.filter(chave => 
    chave.toLowerCase().includes('n8n') || 
    chave.toLowerCase().includes('metric') || 
    chave.toLowerCase().includes('commercial') ||
    chave.toLowerCase().includes('webhook') ||
    chave.toLowerCase().includes('data')
);

console.log(`🎯 Chaves relacionadas: ${chavesRelacionadas.length}`);
chavesRelacionadas.forEach(chave => {
    console.log(`  - ${chave}`);
});

// 2. Limpar tudo relacionado
console.log('🗑️ Limpando dados relacionados...');
let removidas = 0;

chavesRelacionadas.forEach(chave => {
    localStorage.removeItem(chave);
    removidas++;
    console.log(`✅ Removido: ${chave}`);
});

// 3. Limpar chaves específicas conhecidas
const chavesEspecificas = [
    'n8n_metrics_data',
    'commercial_metrics_data',
    'metrics_data',
    'n8n_data',
    'webhook_data',
    'cached_data',
    'app_data',
    'vite_react_shadcn_ts',
    'commercial-metrics'
];

chavesEspecificas.forEach(chave => {
    if (localStorage.getItem(chave)) {
        localStorage.removeItem(chave);
        removidas++;
        console.log(`✅ Removido específico: ${chave}`);
    }
});

// 4. Limpar sessionStorage também
console.log('🗑️ Limpando sessionStorage...');
const sessionChaves = Object.keys(sessionStorage);
sessionChaves.forEach(chave => {
    sessionStorage.removeItem(chave);
    removidas++;
    console.log(`✅ Removido session: ${chave}`);
});

// 5. Verificar se ainda há algo
console.log('🔍 Verificação final...');
const chavesRestantes = Object.keys(localStorage).filter(chave => 
    chave.toLowerCase().includes('n8n') || 
    chave.toLowerCase().includes('metric') || 
    chave.toLowerCase().includes('commercial') ||
    chave.toLowerCase().includes('webhook') ||
    chave.toLowerCase().includes('data')
);

console.log(`📊 Total removido: ${removidas}`);
console.log(`📊 Chaves restantes: ${chavesRestantes.length}`);

if (chavesRestantes.length === 0) {
    console.log('✅ LIMPEZA NUCLEAR CONCLUÍDA!');
    console.log('🔄 Recarregando página...');
    setTimeout(() => {
        location.reload();
    }, 2000);
} else {
    console.log('⚠️ Ainda há dados restantes:');
    chavesRestantes.forEach(chave => {
        console.log(`  - ${chave}`);
    });
    console.log('💥 Executando limpeza total...');
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ LIMPEZA TOTAL EXECUTADA!');
    setTimeout(() => {
        location.reload();
    }, 2000);
}
