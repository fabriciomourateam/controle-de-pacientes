const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://zxqnrhqjujqngljvzjto.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4cW5yaHFqdWpxbmdsanZ6anRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMzI0NDcsImV4cCI6MjA2MDYwODQ0N30.BNLQ7sL_cEH3vz0dkv66VbkK6lx_Jg2PqVxMOLBYKBU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch }
});

async function diagnosticarOutubro() {
  console.log('🔍 Iniciando diagnóstico de Outubro...\n');

  try {
    // Buscar todas as vendas
    const { data: vendas, error } = await supabase
      .from('Total de Vendas')
      .select('*')
      .order('DATA', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar dados:', error);
      return;
    }

    console.log(`✅ Total de vendas no banco: ${vendas.length}\n`);

    // Filtrar Outubro
    const outubro = vendas.filter(v => 
      v.MÊS && v.MÊS.toLowerCase().includes('outubro')
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DIAGNÓSTICO - OUTUBRO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Total de vendas em Outubro: ${outubro.length}\n`);

    // Contar status
    const comprou = outubro.filter(v => v.COMPROU === '1').length;
    const naoComprou = outubro.filter(v => v['NÃO COMPROU'] === '1').length;
    const noShow = outubro.filter(v => v['NO SHOW'] === '1').length;
    const semStatus = outubro.filter(v => 
      v.COMPROU !== '1' && v['NÃO COMPROU'] !== '1' && v['NO SHOW'] !== '1'
    ).length;

    console.log('📈 CONTAGEM POR STATUS:');
    console.log(`  ✅ Comprou:     ${comprou}`);
    console.log(`  ❌ Não Comprou: ${naoComprou}`);
    console.log(`  ⚠️  No Show:     ${noShow}`);
    console.log(`  ⭕ Sem Status:  ${semStatus}\n`);

    // Valores únicos
    const valoresUnicos = {
      comprou: [...new Set(outubro.map(v => v.COMPROU))].filter(v => v !== null && v !== undefined),
      naoComprou: [...new Set(outubro.map(v => v['NÃO COMPROU']))].filter(v => v !== null && v !== undefined),
      noShow: [...new Set(outubro.map(v => v['NO SHOW']))].filter(v => v !== null && v !== undefined)
    };

    console.log('🔍 VALORES ÚNICOS ENCONTRADOS:');
    console.log(`  COMPROU:      [${valoresUnicos.comprou.join(', ')}]`);
    console.log(`  NÃO COMPROU:  [${valoresUnicos.naoComprou.join(', ')}]`);
    console.log(`  NO SHOW:      [${valoresUnicos.noShow.join(', ')}]\n`);

    // Exemplos
    console.log('📋 EXEMPLOS DE REGISTROS:\n');
    
    if (comprou > 0) {
      console.log('✅ Exemplo de "Comprou":');
      const exemploComprou = outubro.find(v => v.COMPROU === '1');
      console.log(`  Data: ${exemploComprou.DATA}`);
      console.log(`  COMPROU: "${exemploComprou.COMPROU}"`);
      console.log(`  NÃO COMPROU: "${exemploComprou['NÃO COMPROU']}"`);
      console.log(`  NO SHOW: "${exemploComprou['NO SHOW']}"`);
      console.log(`  Funil: ${exemploComprou.FUNIL}\n`);
    }

    if (naoComprou > 0) {
      console.log('❌ Exemplo de "Não Comprou":');
      const exemploNao = outubro.find(v => v['NÃO COMPROU'] === '1');
      console.log(`  Data: ${exemploNao.DATA}`);
      console.log(`  COMPROU: "${exemploNao.COMPROU}"`);
      console.log(`  NÃO COMPROU: "${exemploNao['NÃO COMPROU']}"`);
      console.log(`  NO SHOW: "${exemploNao['NO SHOW']}"`);
      console.log(`  Funil: ${exemploNao.FUNIL}\n`);
    } else {
      console.log('❌ Não Comprou: ⚠️ NENHUM REGISTRO ENCONTRADO!\n');
    }

    if (noShow > 0) {
      console.log('⚠️ Exemplo de "No Show":');
      const exemploNoShow = outubro.find(v => v['NO SHOW'] === '1');
      console.log(`  Data: ${exemploNoShow.DATA}`);
      console.log(`  COMPROU: "${exemploNoShow.COMPROU}"`);
      console.log(`  NÃO COMPROU: "${exemploNoShow['NÃO COMPROU']}"`);
      console.log(`  NO SHOW: "${exemploNoShow['NO SHOW']}"`);
      console.log(`  Funil: ${exemploNoShow.FUNIL}\n`);
    } else {
      console.log('⚠️ No Show: ⚠️ NENHUM REGISTRO ENCONTRADO!\n');
    }

    // Comparar com outros meses
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 COMPARAÇÃO COM OUTROS MESES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const meses = {};
    vendas.forEach(v => {
      const mes = v.MÊS || 'Sem mês';
      if (!meses[mes]) {
        meses[mes] = { total: 0, comprou: 0, naoComprou: 0, noShow: 0 };
      }
      meses[mes].total++;
      if (v.COMPROU === '1') meses[mes].comprou++;
      if (v['NÃO COMPROU'] === '1') meses[mes].naoComprou++;
      if (v['NO SHOW'] === '1') meses[mes].noShow++;
    });

    Object.entries(meses).forEach(([mes, dados]) => {
      const conversao = dados.comprou + dados.naoComprou > 0
        ? ((dados.comprou / (dados.comprou + dados.naoComprou)) * 100).toFixed(1)
        : 0;
      
      const problema = dados.naoComprou === 0 && dados.noShow === 0 && dados.total > 0;
      const emoji = problema ? '🚨' : '✅';
      
      console.log(`${emoji} ${mes}:`);
      console.log(`   Total: ${dados.total} | Comprou: ${dados.comprou} | Não Comprou: ${dados.naoComprou} | No Show: ${dados.noShow} | Conv: ${conversao}%`);
      if (problema) {
        console.log('   ⚠️ PROBLEMA: Nenhum registro de "Não Comprou" ou "No Show"!');
      }
      console.log('');
    });

    // Diagnóstico final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔬 DIAGNÓSTICO FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (naoComprou === 0 && noShow === 0 && outubro.length > 0) {
      console.log('🚨 PROBLEMA CRÍTICO IDENTIFICADO!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(`Todos os ${outubro.length} registros de Outubro estão marcados apenas como "COMPROU = 1".`);
      console.log('Isso indica um dos seguintes problemas:\n');
      console.log('1. ❌ Os dados foram importados INCORRETAMENTE');
      console.log('   → As colunas "NÃO COMPROU" e "NO SHOW" não foram preenchidas\n');
      console.log('2. ❌ O N8N está enviando dados INCOMPLETOS');
      console.log('   → Verificar o workflow do N8N para outubro\n');
      console.log('3. ❌ A fonte de dados (planilha) está COM ERRO');
      console.log('   → Verificar se as colunas existem na planilha original\n');
      console.log('SOLUÇÃO RECOMENDADA:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('1. Verificar a planilha de vendas de Outubro');
      console.log('2. Confirmar que as colunas "NÃO COMPROU" e "NO SHOW" têm dados');
      console.log('3. Reprocessar os dados de Outubro através do N8N');
      console.log('4. Ou importar manualmente usando o SQL correto\n');
    } else {
      console.log('✅ Os dados parecem estar corretos!');
    }

  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  }
}

diagnosticarOutubro();

