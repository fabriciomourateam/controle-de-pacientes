# Visão Compacta para "Leads que vão para Call"

## Implementação Completa

Adicionada opção de visualização compacta no card "Leads que vão para Call" (componente `ChannelComparisonWithFilter`) que mostra os dados por mês.

## Funcionalidades

### 1. Duas Visualizações
- **Visão Expandida (Cards)**: Layout em grid com cards detalhados (padrão anterior)
- **Visão Compacta (Tabela)**: Todas informações em linhas, uma abaixo da outra

### 2. Botão de Alternância
- Localizado no header do card, ao lado do filtro de mês
- Texto: "Visão Compacta" / "Visão Expandida"
- Ícones: ChevronUp / ChevronDown

### 3. Ordenação Interativa (NOVO!)
- **Colunas clicáveis** no header da tabela
- **4 opções de ordenação**:
  - Taxa de Conversão (padrão, decrescente)
  - Leads (decrescente)
  - Calls (decrescente)
  - Nome do Canal (crescente)
- **Indicador visual**: Ícone de seta mostra coluna ativa e direção
- **Alternância**: Clicar na mesma coluna inverte a ordem
- **Persistência**: Preferência salva no localStorage

### 4. Preferência Salva
- Salva automaticamente no localStorage
- Chaves:
  - `channelComparisonViewExpanded`: Tipo de visualização
  - `channelComparisonSortBy`: Coluna de ordenação
  - `channelComparisonSortAscending`: Direção da ordenação
- Padrão: Visão compacta, ordenada por taxa de conversão (decrescente)
- Toast de confirmação ao alternar visualização

### 5. Dados Mantidos
- ✅ Emojis dos canais (🔍 📝 📸 👥 💼 👋 📊)
- ✅ Nome do canal
- ✅ Quantidade de Leads
- ✅ Quantidade de Calls
- ✅ Taxa de conversão
- ✅ Barra de progresso visual
- ✅ Cores por performance (verde/amarelo/laranja/vermelho)
- ✅ Filtro de mês mantido
- ✅ Legenda de cores

### 6. Visão Compacta (Tabela)
Colunas (todas clicáveis para ordenar):
1. **Canal** (4 cols): Emoji + Nome
2. **Leads** (2 cols): Valor em azul
3. **Calls** (2 cols): Valor em verde
4. **Taxa** (2 cols): Percentual colorido
5. **Barra** (2 cols): Barra de progresso

### 7. Cores por Performance
- Verde (≥21%): Excelente
- Amarelo (15-20%): Bom
- Laranja (10-14%): Regular
- Vermelho (<10%): Baixo

## Arquivos Modificados

### `src/components/commercial-metrics/ChannelComparisonWithFilter.tsx`
- Adicionado estado `isExpanded` com localStorage
- Adicionado estados `sortBy` e `sortAscending` com localStorage
- Adicionado função `toggleView()`
- Adicionado função `handleSortChange()`
- Implementada lógica de ordenação dinâmica
- Adicionado header clicável na tabela
- Implementada visão compacta (tabela)
- Mantida visão expandida (cards)
- Importado `Button`, `ChevronDown`, `ChevronUp`, `ArrowUpDown`, `useToast`

## Como Usar

### Alternar Visualização
1. Acesse a página de Métricas Comerciais
2. Localize o card "Leads que vão para Call"
3. Clique no botão "Visão Compacta" ou "Visão Expandida"
4. A preferência é salva automaticamente

### Ordenar Dados (Visão Compacta)
1. Clique no header da coluna desejada (Canal, Leads, Calls ou Taxa)
2. Clique novamente na mesma coluna para inverter a ordem
3. O ícone de seta indica a coluna ativa e direção
4. A preferência é salva automaticamente

## Benefícios

- **Visão compacta**: Mais dados visíveis de uma vez, ideal para análise rápida
- **Visão expandida**: Mais detalhes visuais, ideal para apresentações
- **Ordenação flexível**: Analise por diferentes critérios
- **Flexibilidade**: Usuário escolhe o formato e ordenação que prefere
- **Persistência**: Todas preferências mantidas entre sessões
- **UX intuitiva**: Headers clicáveis com feedback visual


## Correções Aplicadas (19/01/2026)

### Problema 1: Erro 406 ao buscar "2025" e "2026"
**Causa**: Sistema tentava buscar valores "2025" e "2026" como meses no Supabase
**Solução**: 
- Alterado valores especiais para `TOTAL_2025` e `TOTAL_2026`
- Hook `useCommercialMetrics` agora filtra valores especiais antes de buscar
- Função `isSpecialValue()` identifica: 'TODOS', 'TOTAL_2025', 'TOTAL_2026'
- Quando valor especial é detectado, usa o mês mais recente para busca individual
- Cálculos de somatória feitos localmente, sem buscar do banco

### Problema 2: Duplicação de "/26" 
**Causa**: Lógica adicionava "/26" sem verificar se já existia
**Exemplo**: "Janeiro/26 /26"
**Solução**: 
- Verifica se já existe sufixo "/26" ou "/25" antes de adicionar
- Formato correto: "Janeiro/26" (apenas uma vez)

### Problema 3: Identificação incorreta de meses 2025 vs 2026
**Causa**: Usava nomes completos (JUNHO, JULHO) que não correspondiam aos dados reais
**Solução**: 
- Alterado para usar abreviações (JUN, JUL, AGO, SET, OUT, NOV, DEZ)
- Mais preciso para identificar meses de 2025
- Todos os outros meses = 2026

### Problema 4: Números exorbitantes nas somatórias
**Causa**: Aplicava `processValue()` duas vezes (na somatória e depois no display)
**Solução**: 
- Somatórias agora usam valores RAW (sem processValue)
- Adicionada flag `shouldProcessValues` que detecta se é somatória
- Para somatórias (TODOS, TOTAL_2025, TOTAL_2026): usa valores diretos
- Para meses individuais: aplica processValue normalmente
- Evita multiplicação por 100 duas vezes

### Arquivos Modificados

1. **`src/components/commercial-metrics/ChannelComparisonWithFilter.tsx`**
   - Valores especiais: `TOTAL_2025` e `TOTAL_2026`
   - Verificação de sufixo "/26" duplicado
   - Identificação de ano por abreviações
   - Flag `shouldProcessValues` para somatórias

2. **`src/hooks/use-commercial-metrics.ts`**
   - Função `isSpecialValue()` para filtrar valores especiais
   - Impede busca no Supabase para TODOS, TOTAL_2025, TOTAL_2026
   - Usa mês mais recente quando valor especial é detectado

### Filtro de Período - Comportamento Correto

**Opções Especiais** (não buscam do Supabase):
- "Todos os Meses" (value: `TODOS`): Soma TODOS os meses disponíveis
- "2025 (Total)" (value: `TOTAL_2025`): Soma apenas JUN, JUL, AGO, SET, OUT, NOV, DEZ
- "2026 (Total)" (value: `TOTAL_2026`): Soma apenas meses de 2026

**Meses Individuais**:
- Meses de 2025: JUN, JUL, AGO, SET, OUT, NOV, DEZ (sem sufixo)
- Meses de 2026: Janeiro/26, Fevereiro/26, Março/26, Abril/26, Maio/26

### Status: ✅ Todos os problemas corrigidos

## Correção Final: Reset de Mês (20/01/2026)

### Problema 5: Mês resetava após selecionar 2 vezes
**Causa**: 
- `availableMonths` mudava de referência, causando re-execução do `useEffect`
- `useMemo` usava `availableMonths.join(',')` que não era suficiente
- `useEffect` não tinha guard para evitar reset quando já havia mês selecionado

**Solução**: 
- ✅ `useMemo` agora usa `JSON.stringify(availableMonths)` para comparação por valor
- ✅ Adicionado guard no `useEffect`: só inicializa se `!selectedMonth`
- ✅ Removidos logs de debug
- ✅ Garantido que inicialização só acontece uma vez

**Resultado**: Seleção de mês agora é estável e não reseta mais!
