// Script atualizado com dados corretos do Excel - Cole no console da página de métricas comerciais
console.log('🔍 Debug de vendas com dados atualizados iniciado...');

// Método mais direto: tentar acessar o hook de métricas comerciais
function debugVendas() {
    console.log('📊 Tentando acessar dados de vendas...');
    
    // Tentar interceptar requisições de rede
    console.log('🌐 Configurando interceptador de rede...');
    
    const fetchOriginal = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        
        if (typeof url === 'string' && (url.includes('supabase') || url.includes('vendas'))) {
            console.log('📊 Interceptando requisição:', url);
            
            return fetchOriginal.apply(this, args).then(response => {
                if (response.ok) {
                    response.clone().json().then(data => {
                        console.log('📊 Dados interceptados:', data);
                        
                        // Se são dados de vendas, analisar
                        if (Array.isArray(data) && data.length > 0 && data[0].MÊS) {
                            console.log('✅ Dados de vendas encontrados!');
                            analisarVendas(data);
                        }
                    }).catch(e => {
                        // Não é JSON, continuar
                    });
                }
                return response;
            });
        }
        
        return fetchOriginal.apply(this, args);
    };
    
    console.log('✅ Interceptador configurado. Recarregue a página para capturar dados.');
}

// Função para analisar dados de vendas
function analisarVendas(vendas) {
    console.log(`📊 Analisando ${vendas.length} registros de vendas...`);
    
    // Mostrar primeiro registro para entender a estrutura
    if (vendas.length > 0) {
        console.log('📋 Estrutura do primeiro registro:', vendas[0]);
        console.log('📋 Campos disponíveis:', Object.keys(vendas[0]));
    }
    
    // Contar por status
    let totalCalls = 0;
    let comprou = 0;
    let naoComprou = 0;
    let noShow = 0;
    
    // Agrupar por mês
    const porMes = {};
    
    vendas.forEach(venda => {
        totalCalls++;
        
        const mes = venda.MÊS || 'Sem mês';
        if (!porMes[mes]) {
            porMes[mes] = { total: 0, comprou: 0, naoComprou: 0, noShow: 0 };
        }
        porMes[mes].total++;
        
        // Função para verificar se é "Sim"
        const ehSim = (valor) => {
            if (!valor) return false;
            const normalizado = valor.toString().toLowerCase().trim();
            return ['sim', 's', 'yes', 'y', 'x', '1', 'true'].includes(normalizado);
        };
        
        // Lógica de prioridade: Comprou > No Show > Não Comprou
        if (ehSim(venda.COMPROU)) {
            comprou++;
            porMes[mes].comprou++;
        } else if (ehSim(venda['NO SHOW'])) {
            noShow++;
            porMes[mes].noShow++;
        } else {
            naoComprou++;
            porMes[mes].naoComprou++;
        }
    });
    
    // Mostrar resultados
    console.log('\n📊 RESULTADOS DO SISTEMA:');
    console.log(`Total de Calls: ${totalCalls}`);
    console.log(`Comprou: ${comprou}`);
    console.log(`Não Comprou: ${naoComprou}`);
    console.log(`No Show: ${noShow}`);
    console.log(`Soma: ${comprou + naoComprou + noShow}`);
    console.log(`Diferença: ${totalCalls - (comprou + naoComprou + noShow)}`);
    
    // Mostrar por mês
    console.log('\n📅 POR MÊS:');
    Object.keys(porMes).forEach(mes => {
        const dados = porMes[mes];
        const conversao = dados.comprou + dados.naoComprou > 0 
            ? (dados.comprou / (dados.comprou + dados.naoComprou) * 100).toFixed(1)
            : '0.0';
        console.log(`${mes}: ${dados.total} calls, ${dados.comprou} comprou, ${dados.naoComprou} não comprou, ${dados.noShow} no show (${conversao}% conversão)`);
    });
    
    // Comparar com Excel (dados atualizados)
    console.log('\n📊 COMPARAÇÃO COM EXCEL (DADOS ATUALIZADOS):');
    console.log('Excel:');
    console.log('  COMPROU: 206');
    console.log('  NÃO COMPROU: 110');
    console.log('  NO SHOW: 77');
    console.log('  CALLS: 410');
    console.log('');
    console.log('Sistema:');
    console.log(`  COMPROU: ${comprou}`);
    console.log(`  NÃO COMPROU: ${naoComprou}`);
    console.log(`  NO SHOW: ${noShow}`);
    console.log(`  Total Calls: ${totalCalls}`);
    
    // Calcular diferenças
    console.log('\n🔍 DIFERENÇAS:');
    console.log(`COMPROU: ${206 - comprou} (Excel - Sistema)`);
    console.log(`NÃO COMPROU: ${110 - naoComprou} (Excel - Sistema)`);
    console.log(`NO SHOW: ${77 - noShow} (Excel - Sistema)`);
    console.log(`Total Calls: ${410 - totalCalls} (Excel - Sistema)`);
    
    // Verificar se as diferenças são significativas
    const diferencaComprou = Math.abs(206 - comprou);
    const diferencaTotal = Math.abs(410 - totalCalls);
    
    if (diferencaComprou === 0 && diferencaTotal === 0) {
        console.log('\n✅ PERFEITO! Os dados estão 100% alinhados com o Excel!');
    } else if (diferencaComprou <= 5 && diferencaTotal <= 10) {
        console.log('\n⚠️ Pequenas diferenças encontradas. Pode ser normal devido a filtros ou processamento.');
    } else {
        console.log('\n❌ Diferenças significativas encontradas. Investigar possíveis causas:');
        console.log('1. Filtros aplicados no sistema');
        console.log('2. Dados duplicados ou faltando');
        console.log('3. Lógica de processamento diferente');
        console.log('4. Período de dados diferente');
    }
    
    // Análise de possíveis causas
    console.log('\n💡 POSSÍVEIS CAUSAS DAS DIFERENÇAS:');
    console.log('1. Sistema pode estar filtrando registros (ex: "reunião de equipe", "não especificado")');
    console.log('2. Lógica de prioridade pode estar diferente');
    console.log('3. Período de dados pode ser diferente');
    console.log('4. Formato dos dados pode estar diferente');
    console.log('5. Dados podem estar sendo processados de forma diferente');
    
    return { totalCalls, comprou, naoComprou, noShow, porMes };
}

// Função para debug manual (caso o automático não funcione)
window.debugVendasManual = function(dados) {
    console.log('📊 Debug manual iniciado...');
    analisarVendas(dados);
};

// Executar debug
debugVendas();

console.log('✅ Script executado!');
console.log('📝 Se não apareceram dados automaticamente:');
console.log('1. Recarregue a página');
console.log('2. Ou use: debugVendasManual([seus_dados_aqui])');
console.log('3. Ou vá na aba Network (F12) e procure por requisições Supabase');







