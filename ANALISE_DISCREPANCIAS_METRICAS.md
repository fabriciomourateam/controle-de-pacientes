# 🔍 Análise das Discrepâncias entre Excel e Sistema

## 📊 Dados do Excel vs Sistema

### Totais do Excel (dados confirmados no Supabase):
- **COMPROU**: 206
- **NÃO COMPROU**: 110
- **NO SHOW**: 77
- **CALLS**: 410

### Totais do Sistema (a verificar):
- **COMPROU**: ? (executar script para verificar)
- **NÃO COMPROU**: ? (executar script para verificar)
- **NO SHOW**: ? (executar script para verificar)
- **Total Calls**: ? (executar script para verificar)

## 🔍 Principais Causas Identificadas

### 1. **Definições Diferentes de Status**
- **Excel**: Tem uma coluna "NÃO COMPROU NO SHOW" (parece combinar dois status)
- **Sistema**: Tem colunas separadas "NÃO COMPROU" e "NO SHOW"
- **Problema**: O Excel pode estar agrupando "Não Comprou" + "No Show" em uma única categoria

### 2. **Lógica de Prioridade no Sistema**
O sistema atual aplica uma lógica de prioridade:
```
1. Se COMPROU = "Sim" → conta como "Comprou"
2. Senão, se NO SHOW = "Sim" → conta como "No Show"  
3. Senão → conta como "Não Comprou"
```

**Problema**: Se uma venda tem múltiplos status marcados, só conta o primeiro.

### 3. **Filtros Aplicados no Sistema**
O sistema filtra automaticamente:
- Funis que contenham "reunião de equipe"
- Closers "não especificado"

**Problema**: Esses registros podem estar sendo contados no Excel mas não no sistema.

### 4. **Valores dos Campos**
O sistema aceita vários formatos para "Sim":
- "sim", "s", "yes", "y", "x", "1", "true"

**Problema**: O Excel pode estar usando formatos diferentes que não são reconhecidos.

### 5. **Cálculo da Taxa de Conversão**
- **Excel**: Pode estar calculando de forma diferente
- **Sistema**: `(Comprou / (Comprou + Não Comprou)) * 100` (exclui No Show)

### 6. **Período dos Dados**
- **Excel**: Dados de Junho a Outubro
- **Sistema**: Pode estar incluindo outros meses ou excluindo alguns

## 🛠️ Soluções Recomendadas

### 1. **Criar Script de Debug**
```javascript
// Execute no console da página de métricas
// Para analisar os dados reais do Supabase
```

### 2. **Verificar Dados Brutos**
- Acessar a tabela "Total de Vendas" no Supabase
- Verificar valores exatos dos campos COMPROU, NÃO COMPROU, NO SHOW
- Contar registros por mês

### 3. **Ajustar Lógica de Contagem**
Considerar mudanças na lógica:
- Permitir múltiplos status por venda
- Criar categorias intermediárias
- Ajustar filtros

### 4. **Padronizar Definições**
- Definir claramente o que é "COMPROU", "NÃO COMPROU", "NO SHOW"
- Documentar a lógica de prioridade
- Alinhar com o Excel

### 5. **Criar Relatório de Comparação**
- Gerar relatório mensal comparando Excel vs Sistema
- Identificar registros que causam discrepâncias
- Criar dashboard de reconciliação

## 🚨 Próximos Passos

1. **Execute o script de debug** (`debug-supabase-sales.js`) no console
2. **Verifique os dados reais** na tabela do Supabase
3. **Compare mês por mês** os totais
4. **Identifique registros problemáticos** (múltiplos status, valores estranhos)
5. **Ajuste a lógica** conforme necessário

## 📝 Arquivos Criados para Debug

1. `debug-metrics-comparison.html` - Interface para comparar dados
2. `debug-supabase-sales.js` - Script para analisar dados do Supabase
3. `ANALISE_DISCREPANCIAS_METRICAS.md` - Este documento de análise

## 🔧 Como Usar

1. Abra a página de métricas comerciais
2. Abra o console do navegador (F12)
3. Cole e execute o script `debug-supabase-sales.js`
4. Analise os resultados para identificar as discrepâncias
5. Use o arquivo HTML para uma comparação visual
