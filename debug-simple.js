// Script simples para debug - Cole no console da página de métricas comerciais
// Este script tenta acessar os dados de várias formas

console.log('🔍 Iniciando debug simples...');

// Método 1: Tentar acessar via React DevTools
function tryReactDevTools() {
    console.log('📊 Tentando via React DevTools...');
    
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        console.log('✅ React DevTools encontrado');
        
        // Tentar encontrar componentes que usam Supabase
        const renderers = hook.renderers;
        for (let id in renderers) {
            const renderer = renderers[id];
            console.log(`Renderer ${id}:`, renderer);
        }
    } else {
        console.log('❌ React DevTools não encontrado');
    }
}

// Método 2: Tentar acessar via window global
function tryGlobalAccess() {
    console.log('📊 Tentando acessar variáveis globais...');
    
    // Listar todas as propriedades do window que podem conter supabase
    const possibleKeys = Object.keys(window).filter(key => 
        key.toLowerCase().includes('supabase') || 
        key.toLowerCase().includes('client') ||
        key.toLowerCase().includes('db')
    );
    
    console.log('Possíveis chaves relacionadas:', possibleKeys);
    
    possibleKeys.forEach(key => {
        try {
            console.log(`${key}:`, window[key]);
        } catch (e) {
            console.log(`${key}: [erro ao acessar]`);
        }
    });
}

// Método 3: Tentar interceptar requisições
function tryInterceptRequests() {
    console.log('📊 Configurando interceptador de requisições...');
    
    // Interceptar fetch
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        console.log('🌐 Requisição interceptada:', args[0]);
        return originalFetch.apply(this, args)
            .then(response => {
                if (args[0].includes('supabase') || args[0].includes('vendas')) {
                    console.log('📊 Resposta de vendas:', response);
                    response.clone().json().then(data => {
                        console.log('📊 Dados de vendas:', data);
                        if (Array.isArray(data)) {
                            analyzeSalesData(data);
                        }
                    }).catch(e => console.log('Erro ao parsear JSON:', e));
                }
                return response;
            });
    };
    
    console.log('✅ Interceptador configurado. Recarregue a página para capturar requisições.');
}

// Método 4: Tentar acessar via elementos da página
function tryPageElements() {
    console.log('📊 Tentando acessar elementos da página...');
    
    // Procurar por elementos que podem conter dados
    const elements = document.querySelectorAll('[data-testid*="metric"], [class*="metric"], [id*="metric"]');
    console.log('Elementos de métricas encontrados:', elements.length);
    
    elements.forEach((el, index) => {
        console.log(`Elemento ${index}:`, el.textContent?.substring(0, 100));
    });
}

// Função para analisar dados (se conseguirmos acessá-los)
function analyzeSalesData(vendas) {
    if (!vendas || !Array.isArray(vendas)) {
        console.error('❌ Dados inválidos para análise');
        return;
    }
    
    console.log(`📊 Analisando ${vendas.length} registros...`);
    
    let totalCalls = 0;
    let comprou = 0;
    let naoComprou = 0;
    let noShow = 0;
    
    const isYes = (value) => {
        if (!value) return false;
        const normalized = value.toString().toLowerCase().trim();
        return ['sim', 's', 'yes', 'y', 'x', '1', 'true'].includes(normalized);
    };
    
    vendas.forEach(venda => {
        totalCalls++;
        
        if (isYes(venda.COMPROU)) {
            comprou++;
        } else if (isYes(venda['NO SHOW'])) {
            noShow++;
        } else {
            naoComprou++;
        }
    });
    
    console.log('📊 RESULTADOS:');
    console.log(`Total: ${totalCalls}`);
    console.log(`Comprou: ${comprou}`);
    console.log(`Não Comprou: ${naoComprou}`);
    console.log(`No Show: ${noShow}`);
    
    console.log('📊 COMPARAÇÃO COM EXCEL:');
    console.log('Excel - COMPROU: 202');
    console.log('Excel - NÃO COMPROU NO SHOW: 109');
    console.log('Excel - CALLS: 78');
    console.log(`Diferença COMPROU: ${202 - comprou}`);
    console.log(`Diferença Total: ${406 - totalCalls}`);
}

// Método 5: Tentar acessar via localStorage/sessionStorage
function tryStorage() {
    console.log('📊 Verificando storage...');
    
    const localStorageKeys = Object.keys(localStorage);
    const sessionStorageKeys = Object.keys(sessionStorage);
    
    console.log('localStorage keys:', localStorageKeys);
    console.log('sessionStorage keys:', sessionStorageKeys);
    
    // Procurar por dados relacionados a vendas
    [...localStorageKeys, ...sessionStorageKeys].forEach(key => {
        if (key.toLowerCase().includes('venda') || key.toLowerCase().includes('metric')) {
            try {
                const data = JSON.parse(localStorage.getItem(key) || sessionStorage.getItem(key));
                console.log(`Dados em ${key}:`, data);
            } catch (e) {
                console.log(`${key}: [não é JSON]`);
            }
        }
    });
}

// Executar todos os métodos
console.log('🚀 Executando todos os métodos de debug...');

tryReactDevTools();
tryGlobalAccess();
tryPageElements();
tryStorage();
tryInterceptRequests();

console.log('✅ Debug concluído! Verifique os logs acima.');
console.log('📝 Se nenhum dado foi encontrado, tente:');
console.log('1. Recarregar a página após executar este script');
console.log('2. Ir para a aba Network (F12) e procurar por requisições Supabase');
console.log('3. Usar o método manual abaixo:');

// Método manual - para usar se os automáticos não funcionarem
window.debugManual = function(dadosVendas) {
    console.log('📊 Analisando dados manuais...');
    analyzeSalesData(dadosVendas);
};

console.log('💡 Para usar o método manual: debugManual([seus_dados_aqui])');






