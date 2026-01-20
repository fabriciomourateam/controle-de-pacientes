/**
 * Utilitários para extrair e processar medidas corporais de texto
 */

export interface MeasurementData {
  cintura: number | null;
  quadril: number | null;
}

/**
 * Extrai medidas de cintura e quadril de um texto de forma inteligente
 * Analisa o contexto e valores típicos para identificar qual número corresponde a cada medida
 * 
 * @param text - Texto contendo as medidas (ex: "64cm 97cm", "97 64", "cintura 63 quadril 97")
 * @returns Objeto com cintura e quadril extraídos
 */
export function extractMeasurements(text: string | null | undefined): MeasurementData {
  if (!text) return { cintura: null, quadril: null };
  
  const textStr = text.toString();
  
  let cintura: number | null = null;
  let quadril: number | null = null;
  
  // Função auxiliar para converter vírgula em ponto e fazer parse
  const parseNumber = (str: string): number => {
    return parseFloat(str.replace(',', '.'));
  };
  
  // Padrão especial: "Cintura X e Quadril Y" ou "Cintura X, Quadril Y" - captura ambos de uma vez
  const combinedPattern = /cintura\s+(\d+(?:[.,]\d+)?)\s*(?:e|,)?\s*quadril\s+(\d+(?:[.,]\d+)?)/i;
  const combinedMatch = textStr.match(combinedPattern);
  if (combinedMatch) {
    const cinturaValue = parseNumber(combinedMatch[1]);
    const quadrilValue = parseNumber(combinedMatch[2]);
    if (isValidMeasurement(cinturaValue, 'cintura') && isValidMeasurement(quadrilValue, 'quadril')) {
      return { cintura: cinturaValue, quadril: quadrilValue };
    }
  }
  
  // Padrão especial: "cintura 89Quadril 89" (sem espaço entre número e Quadril)
  const noSpacePattern = /cintura\s+(\d+(?:[.,]\d+)?)(?:cm)?\s*quadril\s+(\d+(?:[.,]\d+)?)/i;
  const noSpaceMatch = textStr.match(noSpacePattern);
  if (noSpaceMatch) {
    const cinturaValue = parseNumber(noSpaceMatch[1]);
    const quadrilValue = parseNumber(noSpaceMatch[2]);
    if (isValidMeasurement(cinturaValue, 'cintura') && isValidMeasurement(quadrilValue, 'quadril')) {
      return { cintura: cinturaValue, quadril: quadrilValue };
    }
  }
  
  // Padrão especial: "Cintura - X" e "Quadril - Y" (com hífen/traço)
  // Captura ambos quando aparecem em linhas separadas ou na mesma linha
  const hyphenCombinedPattern = /cintura\s*[-–—]\s*(\d+(?:[.,]\d+)?).*?quadril\s*[-–—]\s*(\d+(?:[.,]\d+)?)/is;
  const hyphenCombinedMatch = textStr.match(hyphenCombinedPattern);
  if (hyphenCombinedMatch) {
    const cinturaValue = parseNumber(hyphenCombinedMatch[1]);
    const quadrilValue = parseNumber(hyphenCombinedMatch[2]);
    if (isValidMeasurement(cinturaValue, 'cintura') && isValidMeasurement(quadrilValue, 'quadril')) {
      return { cintura: cinturaValue, quadril: quadrilValue };
    }
  }
  
  // Padrão especial: "Quadril - Y" e "Cintura - X" (ordem invertida)
  const hyphenCombinedPatternReverse = /quadril\s*[-–—]\s*(\d+(?:[.,]\d+)?).*?cintura\s*[-–—]\s*(\d+(?:[.,]\d+)?)/is;
  const hyphenCombinedMatchReverse = textStr.match(hyphenCombinedPatternReverse);
  if (hyphenCombinedMatchReverse) {
    const quadrilValue = parseNumber(hyphenCombinedMatchReverse[1]);
    const cinturaValue = parseNumber(hyphenCombinedMatchReverse[2]);
    if (isValidMeasurement(cinturaValue, 'cintura') && isValidMeasurement(quadrilValue, 'quadril')) {
      return { cintura: cinturaValue, quadril: quadrilValue };
    }
  }
  
  // Padrão 0: Formato numerado "1- 76 cintura, 2- 93 quadril" ou "1- 76 cintura 2- 93 quadril"
  // Captura padrões como: "1- 76 cintura, 2- 93 quadril", "1 - 76 cintura 2 - 93 quadril", etc.
  // Usar matchAll para encontrar todos os padrões numerados no texto
  // Aceita vírgula ou ponto como separador decimal
  const numberedPattern = /(\d+)\s*-\s*(\d+(?:[.,]\d+)?)\s+(cintura|quadril)/gi;
  const numberedMatches = Array.from(textStr.matchAll(numberedPattern));
  
  if (numberedMatches.length > 0) {
    for (const match of numberedMatches) {
      const num = parseNumber(match[2]);
      const label = match[3].toLowerCase();
      
      if (label === 'cintura' && isValidMeasurement(num, 'cintura') && cintura === null) {
        cintura = num;
      } else if (label === 'quadril' && isValidMeasurement(num, 'quadril') && quadril === null) {
        quadril = num;
      }
    }
    
    // Se encontrou pelo menos uma medida no formato numerado, retornar
    if (cintura !== null || quadril !== null) {
      return { cintura, quadril };
    }
  }
  
  // Padrão 1: Procurar por palavras-chave específicas com mais precisão
  // Buscar por "Cintura" seguido de dois pontos e número (incluindo texto complexo)
  // Padrões mais específicos primeiro (com palavras-chave explícitas)
  // Suporte para vírgula e ponto como separador decimal (77,5 ou 77.5)
  const cinturaPatterns = [
    // Padrão especial: "Cintura X e Quadril Y" ou "Cintura X, Quadril Y"
    // Este padrão captura apenas a cintura quando há ambos os valores
    /cintura\s+(\d+(?:[.,]\d+)?)\s*(?:e|,)\s*quadril/i,
    // Padrões com hífen/traço: "Cintura - X", "Cintura -X", "Cintura-X"
    /cintura\s*[-–—]\s*(\d+(?:[.,]\d+)?)(?:\s|$|cm|quadril|\n|e|,)/i, // "Cintura - 81" ou "Cintura -81"
    /cintura\s*[-–—]\s*(\d+(?:[.,]\d+)?)/i, // Fallback para hífen
    // Padrões com número ANTES da palavra-chave (ex: "96cm cintura", "96 cintura", "96 cm cintura")
    /(\d+(?:[.,]\d+)?)\s*cm\s*cintura/i, // "96cm cintura" ou "96 cm cintura" (com ou sem espaço entre cm e cintura)
    /(\d+(?:[.,]\d+)?)\s+cintura/i, // "96 cintura"
    // Padrões com palavra-chave ANTES do número (ex: "cintura 96", "cintura: 96", "cintura 77,5")
    /cintura\s+(\d+(?:[.,]\d+)?)(?:\s|$|cm|quadril|\n|e|,)/i, // Padrão mais específico primeiro: "Cintura 87" seguido de espaço, fim, quebra de linha, "e", "," ou "Quadril"
    /cintura[^:]*:\*?\s*(\d+(?:[.,]\d+)?)/i,
    /cintura[^:]*\s+(\d+(?:[.,]\d+)?)/i,
    /waist[^:]*:\*?\s*(\d+(?:[.,]\d+)?)/i,
    /abaixo.*costela[^:]*:\*?\s*(\d+(?:[.,]\d+)?)/i
  ];
  
  const quadrilPatterns = [
    // Padrão especial: "Quadril Y" após "Cintura X e" ou "Cintura X,"
    /(?:cintura\s+\d+(?:[.,]\d+)?\s*(?:e|,)\s*)?quadril\s+(\d+(?:[.,]\d+)?)(?:\s|$|cm|\n)/i,
    // Padrões com hífen/traço: "Quadril - Y", "Quadril -Y", "Quadril-Y"
    /quadril\s*[-–—]\s*(\d+(?:[.,]\d+)?)(?:\s|$|cm|\n|e|,)/i, // "Quadril - 93" ou "Quadril -93"
    /quadril\s*[-–—]\s*(\d+(?:[.,]\d+)?)/i, // Fallback para hífen
    // Padrões com número ANTES da palavra-chave (ex: "104cm quadril", "104 quadril", "104 cm quadril")
    /(\d+(?:[.,]\d+)?)\s*cm\s*quadril/i, // "104cm quadril" ou "104 cm quadril" (com ou sem espaço entre cm e quadril)
    /(\d+(?:[.,]\d+)?)\s+quadril/i, // "104 quadril"
    // Padrões com palavra-chave ANTES do número (ex: "quadril 104", "quadril: 104", "quadril 98")
    /quadril\s+(\d+(?:[.,]\d+)?)(?:\s|$|cm|\n|e|,)/i, // Padrão mais específico primeiro: "Quadril 115" seguido de espaço, fim, quebra de linha, "e", "," ou "cm"
    /quadril[^:]*:\*?\s*(\d+(?:[.,]\d+)?)/i,
    /quadril[^:]*\s+(\d+(?:[.,]\d+)?)/i,
    /glúteo[^:]*:\*?\s*(\d+(?:[.,]\d+)?)/i,
    /hip[^:]*:\*?\s*(\d+(?:[.,]\d+)?)/i,
    /glúteo\s+maior[^:]*:\*?\s*(\d+(?:[.,]\d+)?)/i
  ];
  
  // Tentar encontrar cintura - buscar primeiro para evitar conflitos
  for (const pattern of cinturaPatterns) {
    const match = textStr.match(pattern);
    if (match) {
      const value = parseNumber(match[1]);
      if (isValidMeasurement(value, 'cintura')) {
        cintura = value;
        break;
      }
    }
  }
  
  // Tentar encontrar quadril - buscar após cintura para evitar capturar o mesmo número
  for (const pattern of quadrilPatterns) {
    const match = textStr.match(pattern);
    if (match) {
      const value = parseNumber(match[1]);
      // Verificar se não é o mesmo valor da cintura (para evitar duplicação)
      if (isValidMeasurement(value, 'quadril') && (cintura === null || value !== cintura)) {
        quadril = value;
        break;
      }
    }
  }
  
  // Validação cruzada: Se encontrou ambos, verificar se fazem sentido
  // Geralmente cintura < quadril (exceto casos muito específicos)
  if (cintura !== null && quadril !== null) {
    // Se cintura > quadril, pode estar invertido - verificar se ambos são válidos
    if (cintura > quadril) {
      // Verificar se a inversão faz sentido (ambos dentro dos ranges)
      const tempCintura = cintura;
      const tempQuadril = quadril;
      
      // Se o valor maior está no range de quadril e o menor no range de cintura
      if (isValidMeasurement(tempCintura, 'quadril') && isValidMeasurement(tempQuadril, 'cintura')) {
        // Provavelmente está invertido - trocar
        cintura = tempQuadril;
        quadril = tempCintura;
      }
      // Caso contrário, manter como está (pode ser um caso especial)
    }
    
    return { cintura, quadril };
  }
  
  // Se encontrou apenas um com palavra-chave, retornar
  if (cintura !== null || quadril !== null) {
    return { cintura, quadril };
  }
  
  // Padrão 2: Fallback para textos simples (dois números consecutivos)
  const textLower = textStr.toLowerCase();
  // Aceitar vírgula ou ponto como separador decimal
  const numbers = textLower.match(/\d+(?:[.,]\d+)?/g);
  
  if (!numbers || numbers.length < 2) {
    // Se só tem um número, tentar identificar pelo contexto
    if (numbers && numbers.length === 1) {
      const num = parseNumber(numbers[0]);
      if (textLower.includes('quadril') || textLower.includes('hip') || textLower.includes('glúteo')) {
        return { cintura: null, quadril: isValidMeasurement(num, 'quadril') ? num : null };
      } else if (textLower.includes('cintura') || textLower.includes('waist')) {
        return { cintura: isValidMeasurement(num, 'cintura') ? num : null, quadril: null };
      }
    }
    return { cintura: null, quadril: null };
  }
  
  const nums = numbers.map(n => parseNumber(n));
  const validNums = nums.filter(n => n >= 40 && n <= 200);
  
  if (validNums.length >= 2) {
    // Para textos simples como "63 97" ou "97 63" ou "77,5 98"
    const consecutivePattern = textLower.match(/(\d+(?:[.,]\d+)?)\s*(?:cm|e|,)?\s*(\d+(?:[.,]\d+)?)/);
    
    if (consecutivePattern) {
      const num1 = parseNumber(consecutivePattern[1]);
      const num2 = parseNumber(consecutivePattern[2]);
      
      if (num1 >= 40 && num1 <= 200 && num2 >= 40 && num2 <= 200) {
        // Lógica para identificar qual é cintura e qual é quadril
        if (num1 >= 50 && num1 <= 100 && num2 >= 80 && num2 <= 150 && num2 > num1) {
          // num1 parece cintura, num2 parece quadril
          cintura = num1;
          quadril = num2;
        } else if (num2 >= 50 && num2 <= 100 && num1 >= 80 && num1 <= 150 && num1 > num2) {
          // num2 parece cintura, num1 parece quadril
          cintura = num2;
          quadril = num1;
        } else {
          // Usar o menor como cintura (regra geral)
          if (num1 < num2) {
            cintura = isValidMeasurement(num1, 'cintura') ? num1 : null;
            quadril = isValidMeasurement(num2, 'quadril') ? num2 : null;
          } else {
            cintura = isValidMeasurement(num2, 'cintura') ? num2 : null;
            quadril = isValidMeasurement(num1, 'quadril') ? num1 : null;
          }
        }
        
        return { cintura, quadril };
      }
    }
    
    // Fallback final - usar os dois primeiros números válidos
    const [num1, num2] = validNums;
    
    if (num1 < num2) {
      cintura = isValidMeasurement(num1, 'cintura') ? num1 : null;
      quadril = isValidMeasurement(num2, 'quadril') ? num2 : null;
    } else {
      cintura = isValidMeasurement(num2, 'cintura') ? num2 : null;
      quadril = isValidMeasurement(num1, 'quadril') ? num1 : null;
    }
  }
  
  return { cintura, quadril };
}

/**
 * Valida se uma medida está dentro de um range razoável
 */
export function isValidMeasurement(value: number, type: 'cintura' | 'quadril'): boolean {
  if (type === 'cintura') {
    return value >= 50 && value <= 120;
  } else {
    return value >= 70 && value <= 150;
  }
}

/**
 * Formata uma medida para exibição
 */
export function formatMeasurement(value: number | null): string {
  if (!value) return 'N/A';
  return `${value}cm`;
}