// Script para debug de vendas - Execute na página de métricas comerciais
// Cole este código no console do navegador (F12)

console.log('🔍 Iniciando debug dos dados de vendas...');

// Função para encontrar o cliente Supabase na aplicação React
function findSupabaseClient() {
    // Tentar diferentes formas de acessar o Supabase
    const possiblePaths = [
        'window.__REACT_DEVTOOLS_GLOBAL_HOOK__',
        'window.React',
        'document.querySelector("[data-reactroot]")',
        'window.supabase'
    ];
    
    // Procurar por instâncias do Supabase no React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const reactRoots = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers;
        for (let id in reactRoots) {
            const renderer = reactRoots[id];
            if (renderer && renderer.findFiberByHostInstance) {
                try {
                    const root = renderer.getCurrentFiber();
                    if (root) {
                        // Procurar por props que contenham supabase
                        const findSupabase = (fiber) => {
                            if (fiber && fiber.memoizedProps) {
                                for (let key in fiber.memoizedProps) {
                                    if (key.toLowerCase().includes('supabase') || 
                                        (typeof fiber.memoizedProps[key] === 'object' && 
                                         fiber.memoizedProps[key] && 
                                         fiber.memoizedProps[key].from)) {
                                        return fiber.memoizedProps[key];
                                    }
                                }
                            }
                            if (fiber && fiber.child) {
                                return findSupabase(fiber.child);
                            }
                            if (fiber && fiber.sibling) {
                                return findSupabase(fiber.sibling);
                            }
                            return null;
                        };
                        
                        const supabase = findSupabase(root);
                        if (supabase) {
                            console.log('✅ Supabase encontrado via React DevTools');
                            return supabase;
                        }
                    }
                } catch (e) {
                    // Continuar tentando outras formas
                }
            }
        }
    }
    
    return null;
}

// Função alternativa - buscar via fetch direto para a API
async function debugSalesDataViaAPI() {
    try {
        console.log('📊 Tentando acessar dados via API...');
        
        // Tentar diferentes endpoints possíveis
        const endpoints = [
            '/api/sales-metrics',
            '/api/commercial-metrics',
            '/api/vendas',
            '/api/metrics'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Dados encontrados em ${endpoint}:`, data);
                    return data;
                }
            } catch (e) {
                // Continuar tentando outros endpoints
            }
        }
        
        console.log('❌ Nenhum endpoint de API encontrado');
        return null;
        
    } catch (error) {
        console.error('❌ Erro ao buscar via API:', error);
        return null;
    }
}

// Função para analisar dados se conseguirmos acessá-los
function analyzeSalesData(vendas) {
    if (!vendas || !Array.isArray(vendas)) {
        console.error('❌ Dados de vendas inválidos');
        return;
    }
    
    console.log(`📊 Analisando ${vendas.length} registros de vendas...`);
    
    // Mostrar estrutura dos dados
    if (vendas.length > 0) {
        console.log('📋 Primeiro registro:', vendas[0]);
        console.log('📋 Campos disponíveis:', Object.keys(vendas[0]));
    }
    
    // Função para verificar se é "Sim"
    const isYes = (value) => {
        if (!value) return false;
        const normalized = value.toString().toLowerCase().trim();
        return ['sim', 's', 'yes', 'y', 'x', '1', 'true'].includes(normalized);
    };
    
    // Contar por status
    let totalCalls = 0;
    let comprou = 0;
    let naoComprou = 0;
    let noShow = 0;
    let registrosComMultiplosStatus = 0;
    
    // Agrupar por mês
    const vendasPorMes = {};
    
    vendas.forEach((venda, index) => {
        totalCalls++;
        
        const mes = venda.MÊS || 'Sem mês';
        if (!vendasPorMes[mes]) {
            vendasPorMes[mes] = { total: 0, comprou: 0, naoComprou: 0, noShow: 0 };
        }
        vendasPorMes[mes].total++;
        
        const comprouValue = venda.COMPROU;
        const naoComprouValue = venda['NÃO COMPROU'];
        const noShowValue = venda['NO SHOW'];
        
        const comprouYes = isYes(comprouValue);
        const naoComprouYes = isYes(naoComprouValue);
        const noShowYes = isYes(noShowValue);
        
        // Verificar múltiplos status
        const statusCount = [comprouYes, naoComprouYes, noShowYes].filter(Boolean).length;
        if (statusCount > 1) {
            registrosComMultiplosStatus++;
            console.log(`⚠️ Registro ${index + 1} com múltiplos status:`, {
                MÊS: mes,
                FUNIL: venda.FUNIL,
                COMPROU: comprouValue,
                'NÃO COMPROU': naoComprouValue,
                'NO SHOW': noShowValue
            });
        }
        
        // Lógica de prioridade: Comprou > No Show > Não Comprou
        if (comprouYes) {
            comprou++;
            vendasPorMes[mes].comprou++;
        } else if (noShowYes) {
            noShow++;
            vendasPorMes[mes].noShow++;
        } else {
            naoComprou++;
            vendasPorMes[mes].naoComprou++;
        }
    });
    
    // Mostrar resultados
    console.log('\n📊 RESULTADOS DO SISTEMA:');
    console.log(`Total Calls: ${totalCalls}`);
    console.log(`Comprou: ${comprou}`);
    console.log(`Não Comprou: ${naoComprou}`);
    console.log(`No Show: ${noShow}`);
    console.log(`Soma: ${comprou + naoComprou + noShow}`);
    console.log(`Diferença: ${totalCalls - (comprou + naoComprou + noShow)}`);
    console.log(`Registros com múltiplos status: ${registrosComMultiplosStatus}`);
    
    // Mostrar por mês
    console.log('\n📅 VENDAS POR MÊS:');
    Object.keys(vendasPorMes).forEach(mes => {
        const data = vendasPorMes[mes];
        const conversion = data.comprou + data.naoComprou > 0 
            ? (data.comprou / (data.comprou + data.naoComprou) * 100).toFixed(1)
            : '0.0';
        console.log(`${mes}: ${data.total} calls, ${data.comprou} comprou, ${data.naoComprou} não comprou, ${data.noShow} no show (${conversion}% conversão)`);
    });
    
    // Comparar com Excel
    console.log('\n📊 COMPARAÇÃO COM EXCEL:');
    console.log('Excel - COMPROU: 202');
    console.log('Excel - NÃO COMPROU NO SHOW: 109');
    console.log('Excel - CALLS: 78');
    console.log('Excel - Total: 406');
    console.log('');
    console.log('Sistema - COMPROU:', comprou);
    console.log('Sistema - NÃO COMPROU:', naoComprou);
    console.log('Sistema - NO SHOW:', noShow);
    console.log('Sistema - Total Calls:', totalCalls);
    
    // Análise de discrepâncias
    console.log('\n🔍 ANÁLISE DE DISCREPÂNCIAS:');
    console.log(`Diferença COMPROU: ${202 - comprou} (Excel - Sistema)`);
    console.log(`Diferença Total: ${406 - totalCalls} (Excel - Sistema)`);
    
    return { totalCalls, comprou, naoComprou, noShow, vendasPorMes };
}

// Função principal
async function debugSalesData() {
    console.log('🔍 Tentando encontrar dados de vendas...');
    
    // Tentar encontrar Supabase via React DevTools
    const supabase = findSupabaseClient();
    
    if (supabase) {
        try {
            console.log('📊 Buscando dados via Supabase...');
            const { data: vendas, error } = await supabase
                .from('Total de Vendas')
                .select('*')
                .order('DATA', { ascending: false });
                
            if (error) {
                console.error('❌ Erro ao buscar dados:', error);
                return;
            }
            
            return analyzeSalesData(vendas);
            
        } catch (error) {
            console.error('❌ Erro ao acessar Supabase:', error);
        }
    }
    
    // Se não conseguiu via Supabase, tentar via API
    const apiData = await debugSalesDataViaAPI();
    if (apiData) {
        return analyzeSalesData(apiData);
    }
    
    // Se nada funcionou, mostrar instruções
    console.log('❌ Não foi possível acessar os dados automaticamente.');
    console.log('📝 INSTRUÇÕES ALTERNATIVAS:');
    console.log('1. Abra a aba Network no DevTools (F12)');
    console.log('2. Recarregue a página de métricas comerciais');
    console.log('3. Procure por requisições para Supabase ou API');
    console.log('4. Clique em uma requisição e veja a resposta JSON');
    console.log('5. Copie os dados e execute: analyzeSalesData(dadosCopiados)');
}

// Executar o debug
debugSalesData();








