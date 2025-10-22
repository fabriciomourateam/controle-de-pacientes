// Script para debugar dados de vendas no Supabase
// Execute este script no console do navegador na página de métricas comerciais

console.log('🔍 Iniciando debug dos dados de vendas...');

// Função para analisar dados de vendas
async function debugSalesData() {
    try {
        // Acessar o cliente Supabase da aplicação
        const { supabase } = await import('/src/integrations/supabase/client.js');
        
        console.log('📊 Buscando dados da tabela "Total de Vendas"...');
        
        // Buscar todos os dados de vendas
        const { data: vendas, error } = await supabase
            .from('Total de Vendas')
            .select('*')
            .order('DATA', { ascending: false });
            
        if (error) {
            console.error('❌ Erro ao buscar dados:', error);
            return;
        }
        
        console.log('✅ Dados carregados:', vendas.length, 'registros');
        
        // Análise 1: Verificar estrutura dos dados
        console.log('\n📋 Estrutura dos dados:');
        if (vendas.length > 0) {
            console.log('Primeiro registro:', vendas[0]);
            console.log('Campos disponíveis:', Object.keys(vendas[0]));
        }
        
        // Análise 2: Agrupar por mês
        const vendasPorMes = {};
        vendas.forEach(venda => {
            const mes = venda.MÊS || 'Sem mês';
            if (!vendasPorMes[mes]) {
                vendasPorMes[mes] = [];
            }
            vendasPorMes[mes].push(venda);
        });
        
        console.log('\n📅 Vendas por mês:');
        Object.keys(vendasPorMes).forEach(mes => {
            console.log(`${mes}: ${vendasPorMes[mes].length} registros`);
        });
        
        // Análise 3: Verificar valores dos campos de status
        console.log('\n🔍 Análise dos campos de status:');
        const statusAnalysis = {
            comprou: new Set(),
            naoComprou: new Set(),
            noShow: new Set()
        };
        
        vendas.forEach(venda => {
            if (venda.COMPROU) statusAnalysis.comprou.add(venda.COMPROU);
            if (venda['NÃO COMPROU']) statusAnalysis.naoComprou.add(venda['NÃO COMPROU']);
            if (venda['NO SHOW']) statusAnalysis.noShow.add(venda['NO SHOW']);
        });
        
        console.log('Valores únicos em COMPROU:', Array.from(statusAnalysis.comprou));
        console.log('Valores únicos em NÃO COMPROU:', Array.from(statusAnalysis.naoComprou));
        console.log('Valores únicos em NO SHOW:', Array.from(statusAnalysis.noShow));
        
        // Análise 4: Contar vendas por status (lógica atual do sistema)
        console.log('\n🧮 Contagem por status (lógica atual):');
        let totalCalls = 0;
        let comprou = 0;
        let naoComprou = 0;
        let noShow = 0;
        
        vendas.forEach(venda => {
            totalCalls++;
            
            const comprouValue = venda.COMPROU;
            const naoComprouValue = venda['NÃO COMPROU'];
            const noShowValue = venda['NO SHOW'];
            
            // Lógica atual: prioridade Comprou > No Show > Não Comprou
            if (isYes(comprouValue)) {
                comprou++;
            } else if (isYes(noShowValue)) {
                noShow++;
            } else {
                naoComprou++;
            }
        });
        
        console.log(`Total Calls: ${totalCalls}`);
        console.log(`Comprou: ${comprou}`);
        console.log(`Não Comprou: ${naoComprou}`);
        console.log(`No Show: ${noShow}`);
        console.log(`Soma: ${comprou + naoComprou + noShow}`);
        console.log(`Diferença: ${totalCalls - (comprou + naoComprou + noShow)}`);
        
        // Análise 5: Verificar registros problemáticos
        console.log('\n⚠️ Registros com múltiplos status:');
        vendas.forEach((venda, index) => {
            const comprouValue = venda.COMPROU;
            const naoComprouValue = venda['NÃO COMPROU'];
            const noShowValue = venda['NO SHOW'];
            
            const comprouYes = isYes(comprouValue);
            const naoComprouYes = isYes(naoComprouValue);
            const noShowYes = isYes(noShowValue);
            
            const statusCount = [comprouYes, naoComprouYes, noShowYes].filter(Boolean).length;
            
            if (statusCount > 1) {
                console.log(`Registro ${index + 1}:`, {
                    MÊS: venda.MÊS,
                    FUNIL: venda.FUNIL,
                    COMPROU: comprouValue,
                    'NÃO COMPROU': naoComprouValue,
                    'NO SHOW': noShowValue,
                    'Status Count': statusCount
                });
            }
        });
        
        // Análise 6: Comparar com dados do Excel
        console.log('\n📊 Comparação com dados do Excel:');
        console.log('Excel Total Geral:');
        console.log('- COMPROU: 202');
        console.log('- NÃO COMPROU NO SHOW: 109');
        console.log('- CALLS: 78');
        console.log('- Total (coluna direita): 406');
        
        console.log('\nSistema atual:');
        console.log(`- COMPROU: ${comprou}`);
        console.log(`- NÃO COMPROU: ${naoComprou}`);
        console.log(`- NO SHOW: ${noShow}`);
        console.log(`- Total Calls: ${totalCalls}`);
        
        // Análise 7: Verificar se há dados filtrados
        console.log('\n🔍 Verificando filtros aplicados:');
        const vendasFiltradas = vendas.filter(venda => {
            const funil = normalizeString(venda.FUNIL);
            const closer = normalizeString(venda['QUEM FEZ A CALL']);
            
            // Verificar se seria filtrado pela lógica atual
            const seriaFiltrado = funil.includes('reuniao') || funil.includes('reunião') || funil.includes('equipe') ||
                                closer.includes('nao especificado') || closer.includes('não especificado');
            
            return seriaFiltrado;
        });
        
        console.log(`Registros que seriam filtrados: ${vendasFiltradas.length}`);
        if (vendasFiltradas.length > 0) {
            console.log('Primeiros registros filtrados:', vendasFiltradas.slice(0, 3));
        }
        
        return {
            totalCalls,
            comprou,
            naoComprou,
            noShow,
            vendasPorMes,
            vendasFiltradas
        };
        
    } catch (error) {
        console.error('❌ Erro no debug:', error);
    }
}

// Função auxiliar para normalizar strings
function normalizeString(str) {
    if (!str) return '';
    return str.toString().toLowerCase().trim();
}

// Função auxiliar para verificar se é "Sim"
function isYes(value) {
    if (!value) return false;
    const normalized = normalizeString(value);
    return normalized === 'sim' || 
           normalized === 's' || 
           normalized === 'yes' || 
           normalized === 'y' || 
           normalized === 'x' || 
           normalized === '1' || 
           normalized === 'true';
}

// Executar debug
debugSalesData().then(result => {
    console.log('\n✅ Debug concluído!');
    console.log('Resultado final:', result);
});








