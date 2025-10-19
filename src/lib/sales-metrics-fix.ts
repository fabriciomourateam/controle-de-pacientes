// Função corrigida para processar dados de vendas
// Esta função resolve as discrepâncias entre Excel e Sistema

export interface VendaData {
  MÊS?: string | null;
  FUNIL?: string | null;
  COMPROU?: string | null;
  'NÃO COMPROU'?: string | null;
  'NO SHOW'?: string | null;
  'QUEM FEZ A CALL'?: string | null;
}

export interface ProcessedSalesData {
  totalCalls: number;
  comprou: number;
  naoComprou: number;
  noShow: number;
  porMes: { [key: string]: any };
  registrosProblematicos: any[];
}

// Função para normalizar strings
export function normalizeString(str: string | null | undefined): string {
  if (!str) return '';
  return str.toString().toLowerCase().trim();
}

// Função para verificar se é "Sim" - VERSÃO FINAL
export function isYes(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = normalizeString(value);
  
  // Log apenas para os primeiros 10 registros para não sobrecarregar
  if (Math.random() < 0.1) { // 10% dos registros
    console.log('🔍 Verificando valor:', value, '-> normalizado:', normalized);
  }
  
  // Aceitar apenas valores que claramente indicam "Sim"
  const result = ['sim', 's', 'yes', 'y', 'x', '1', 'true'].includes(normalized);
  
  if (result && Math.random() < 0.1) {
    console.log('✅ Reconhecido como SIM:', value);
  } else if (!result && Math.random() < 0.1) {
    console.log('❌ NÃO reconhecido como SIM:', value);
  }
  
  return result;
}

// Função principal para processar dados de vendas
export function processSalesData(vendas: VendaData[]): ProcessedSalesData {
  console.log('📊 Processando dados de vendas com lógica corrigida...');
  console.log('📊 TOTAL DE REGISTROS NO SUPABASE:', vendas.length);
  
  // Mostrar TODOS os dados brutos do Supabase
  console.log('📊 DADOS BRUTOS DO SUPABASE:');
  vendas.forEach((venda, index) => {
    if (index < 50) { // Mostrar os primeiros 50 para ver mais dados
      console.log(`Registro ${index + 1}:`, {
        comprou: venda.COMPROU,
        naoComprou: venda['NÃO COMPROU'],
        noShow: venda['NO SHOW'],
        mes: venda.MÊS,
        funil: venda.FUNIL
      });
    }
  });
  
  // Mostrar TODOS os valores únicos encontrados
  const todosValores = {
    comprou: [...new Set(vendas.map(v => v.COMPROU).filter(v => v))],
    naoComprou: [...new Set(vendas.map(v => v['NÃO COMPROU']).filter(v => v))],
    noShow: [...new Set(vendas.map(v => v['NO SHOW']).filter(v => v))]
  };
  
  console.log('📊 TODOS OS VALORES ÚNICOS NO SUPABASE:');
  console.log('COMPROU:', todosValores.comprou);
  console.log('NÃO COMPROU:', todosValores.naoComprou);
  console.log('NO SHOW:', todosValores.noShow);
  
  // Contar quantos registros têm cada valor
  const contadores = {
    comprou: {},
    naoComprou: {},
    noShow: {}
  };
  
  vendas.forEach(venda => {
    // Contar COMPROU
    const comprouVal = venda.COMPROU;
    if (comprouVal) {
      contadores.comprou[comprouVal] = (contadores.comprou[comprouVal] || 0) + 1;
    }
    
    // Contar NÃO COMPROU
    const naoComprouVal = venda['NÃO COMPROU'];
    if (naoComprouVal) {
      contadores.naoComprou[naoComprouVal] = (contadores.naoComprou[naoComprouVal] || 0) + 1;
    }
    
    // Contar NO SHOW
    const noShowVal = venda['NO SHOW'];
    if (noShowVal) {
      contadores.noShow[noShowVal] = (contadores.noShow[noShowVal] || 0) + 1;
    }
  });
  
  console.log('📊 CONTADORES DE CADA VALOR:');
  console.log('COMPROU:', contadores.comprou);
  console.log('NÃO COMPROU:', contadores.naoComprou);
  console.log('NO SHOW:', contadores.noShow);
  
  let totalCalls = 0;
  let comprou = 0;
  let naoComprou = 0;
  let noShow = 0;
  
  const porMes: { [key: string]: any } = {};
  const registrosProblematicos: any[] = [];
  
  vendas.forEach((venda, index) => {
    totalCalls++;
    
    const mes = venda.MÊS || 'Sem mês';
    if (!porMes[mes]) {
      porMes[mes] = { total: 0, comprou: 0, naoComprou: 0, noShow: 0 };
    }
    porMes[mes].total++;
    
    const comprouValue = venda.COMPROU;
    const naoComprouValue = venda['NÃO COMPROU'];
    const noShowValue = venda['NO SHOW'];
    
    const comprouSim = comprouValue && comprouValue !== '0';
    const naoComprouSim = naoComprouValue && naoComprouValue !== '0';
    const noShowSim = noShowValue && noShowValue !== '0';
    
    // Log detalhado para os primeiros 20 registros
    if (index < 20) {
      console.log(`Registro ${index + 1}:`, {
        comprou: comprouValue,
        naoComprou: naoComprouValue,
        noShow: noShowValue,
        comprouSim,
        naoComprouSim,
        noShowSim,
        mes: venda.MÊS,
        funil: venda.FUNIL
      });
    }
    
    // Log para registros que estão sendo classificados como NO SHOW
    if (noShowSim && index < 50) {
      console.log(`🔍 NO SHOW - Registro ${index + 1}:`, {
        comprou: comprouValue,
        naoComprou: naoComprouValue,
        noShow: noShowValue,
        mes: venda.MÊS,
        funil: venda.FUNIL
      });
    }
    
    // Verificar múltiplos status marcados
    const statusCount = [comprouSim, naoComprouSim, noShowSim].filter(Boolean).length;
    
    if (statusCount > 1) {
      registrosProblematicos.push({
        index: index + 1,
        mes: mes,
        funil: venda.FUNIL,
        comprou: comprouValue,
        naoComprou: naoComprouValue,
        noShow: noShowValue,
        statusCount
      });
    }
    
    // CONTAGEM CORRIGIDA: Contar apenas registros com "1" em cada coluna
    // No Supabase, TODOS os registros têm valores em todas as colunas
    // Apenas os com "1" devem ser contados
    
    // Contar COMPROU - apenas se for "1"
    if (comprouValue === '1') {
      comprou++;
      porMes[mes].comprou++;
      if (index < 10) {
        console.log(`✅ COMPROU - Registro ${index + 1}:`, comprouValue);
      }
    }
    
    // Contar NÃO COMPROU - apenas se for "1"
    if (naoComprouValue === '1') {
      naoComprou++;
      porMes[mes].naoComprou++;
      if (index < 10) {
        console.log(`✅ NÃO COMPROU - Registro ${index + 1}:`, naoComprouValue);
      }
    }
    
    // Contar NO SHOW - apenas se for "1"
    if (noShowValue === '1') {
      noShow++;
      porMes[mes].noShow++;
      if (index < 10) {
        console.log(`✅ NO SHOW - Registro ${index + 1}:`, noShowValue);
      }
    }
    
    // Log para debug - mostrar como cada registro está sendo classificado
    if (index < 10) {
      console.log(`Registro ${index + 1} - Classificação DIRETA:`, {
        comprou: comprouValue ? 'TEM VALOR' : 'VAZIO',
        naoComprou: naoComprouValue ? 'TEM VALOR' : 'VAZIO', 
        noShow: noShowValue ? 'TEM VALOR' : 'VAZIO',
        valores: {
          comprou: comprouValue,
          naoComprou: naoComprouValue,
          noShow: noShowValue
        }
      });
    }
  });
  
  // Log dos registros problemáticos
  if (registrosProblematicos.length > 0) {
    console.log('⚠️ Registros com múltiplos status:', registrosProblematicos);
  }
  
  // Identificar registros que podem estar causando as diferenças
  // Registros suspeitos são aqueles que NÃO têm "1" em nenhuma coluna
  // (mas têm outros valores que não são "0" ou "1")
  const registrosSuspeitos = vendas.filter((venda, index) => {
    const comprouValue = venda.COMPROU;
    const naoComprouValue = venda['NÃO COMPROU'];
    const noShowValue = venda['NO SHOW'];
    
    const temComprou = comprouValue === '1';
    const temNaoComprou = naoComprouValue === '1';
    const temNoShow = noShowValue === '1';
    
    // Verificar se tem valores estranhos (não "0" e não "1")
    const valorEstranho = (comprouValue && comprouValue !== '0' && comprouValue !== '1') ||
                          (naoComprouValue && naoComprouValue !== '0' && naoComprouValue !== '1') ||
                          (noShowValue && noShowValue !== '0' && noShowValue !== '1');
    
    if (valorEstranho) {
      console.log(`🔍 Registro suspeito ${index + 1}:`, {
        comprou: comprouValue,
        naoComprou: naoComprouValue,
        noShow: noShowValue,
        mes: venda.MÊS,
        funil: venda.FUNIL
      });
    }
    
    return valorEstranho;
  });
  
  console.log(`🔍 Encontrados ${registrosSuspeitos.length} registros sem status marcado`);
  
  // Analisar valores únicos no Supabase
  const valoresUnicos = {
    comprou: [...new Set(vendas.map(v => v.COMPROU).filter(v => v))],
    naoComprou: [...new Set(vendas.map(v => v['NÃO COMPROU']).filter(v => v))],
    noShow: [...new Set(vendas.map(v => v['NO SHOW']).filter(v => v))]
  };
  
  console.log('📊 VALORES ÚNICOS NO SUPABASE:');
  console.log('COMPROU:', valoresUnicos.comprou);
  console.log('NÃO COMPROU:', valoresUnicos.naoComprou);
  console.log('NO SHOW:', valoresUnicos.noShow);
  
  // Verificar se a soma bate
  const somaClassificados = comprou + naoComprou + noShow;
  const diferencaSoma = totalCalls - somaClassificados;
  
  console.log(`📊 ANÁLISE DE SOMA:`);
  console.log(`Total de calls: ${totalCalls}`);
  console.log(`Comprou: ${comprou}`);
  console.log(`Não Comprou: ${naoComprou}`);
  console.log(`No Show: ${noShow}`);
  console.log(`Soma classificados: ${somaClassificados}`);
  console.log(`Diferença: ${diferencaSoma} (registros não classificados)`);
  
  const resultados = {
    totalCalls,
    comprou,
    naoComprou,
    noShow,
    porMes,
    registrosProblematicos,
    registrosSuspeitos: registrosSuspeitos.length,
    somaClassificados,
    diferencaSoma,
    valoresUnicos
  };
  
  console.log('📊 Resultados processados:', resultados);
  return resultados;
}

// Função para comparar com dados do Excel
export function compareWithExcel(resultados: ProcessedSalesData) {
  const excelData = {
    comprou: 204,
    naoComprou: 110,
    noShow: 87,
    totalCalls: 402
  };
  
  const diferencas = {
    comprou: excelData.comprou - resultados.comprou,
    naoComprou: excelData.naoComprou - resultados.naoComprou,
    noShow: excelData.noShow - resultados.noShow,
    totalCalls: excelData.totalCalls - resultados.totalCalls
  };
  
  console.log('📊 COMPARAÇÃO COM EXCEL:');
  console.log('Excel - COMPROU:', excelData.comprou);
  console.log('Excel - NÃO COMPROU:', excelData.naoComprou);
  console.log('Excel - NO SHOW:', excelData.noShow);
  console.log('Excel - TOTAL CALLS:', excelData.totalCalls);
  console.log('');
  console.log('Sistema - COMPROU:', resultados.comprou);
  console.log('Sistema - NÃO COMPROU:', resultados.naoComprou);
  console.log('Sistema - NO SHOW:', resultados.noShow);
  console.log('Sistema - TOTAL CALLS:', resultados.totalCalls);
  console.log('');
  console.log('DIFERENÇAS:');
  console.log('COMPROU:', diferencas.comprou);
  console.log('NÃO COMPROU:', diferencas.naoComprou);
  console.log('NO SHOW:', diferencas.noShow);
  console.log('TOTAL CALLS:', diferencas.totalCalls);
  
  return diferencas;
}
