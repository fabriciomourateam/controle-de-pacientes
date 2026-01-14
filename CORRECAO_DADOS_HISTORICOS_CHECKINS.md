# Correção: Dados Históricos dos Check-ins - Mesma Fonte de Dados

## Problema Identificado

Os check-ins históricos estavam usando campos diferentes dos usados na coluna "Anterior" e nos dados atuais, causando inconsistência nos valores exibidos.

### Antes da Correção:

1. **Coluna "Anterior" e "Atual"** (via `use-checkin-feedback.ts`):
   - Usava campos: `treino`, `cardio`, `agua`, `sono`, `ref_livre`, `beliscos`
   - ✅ Mostrava as quantidades corretas

2. **Colunas Históricas** (via `getCheckinMetricValue`):
   - Usava campos: `pontos_treinos`, `pontos_cardios`, `pontos_agua`, `pontos_sono`, `pontos_refeicao_livre`, `pontos_beliscos`
   - ❌ Mostrava valores de pontuação ao invés das quantidades

3. **Hook `use-all-checkins`**:
   - Buscava campos com prefixo `pontos_*`
   - ❌ Não buscava os campos de quantidade

### Resultado:
- Água, sono, treinos, cardios mostravam valores diferentes entre "Anterior" e colunas históricas
- Inconsistência visual e confusão para o usuário

---

## Solução Implementada

### Arquivos Modificados:

1. **`src/hooks/use-all-checkins.ts`**
   - Alterado interface e query para buscar campos de quantidade: `treino`, `cardio`, `agua`, `sono`, `ref_livre`, `beliscos`
   - Removido campos com prefixo `pontos_*`

2. **`src/components/checkins/CheckinFeedbackCard.tsx`**
   - Função `getCheckinMetricValue` atualizada para usar os mesmos campos que `evolutionData`
   - Agora lê de: `treino`, `cardio`, `agua`, `sono`, `ref_livre`, `beliscos`

---

## Campos Utilizados (Consistentes em Todas as Colunas)

| Métrica | Campo no Banco | Tipo de Dado |
|---------|---------------|--------------|
| 🏃 Treinos | `treino` | Quantidade (número) |
| 🏃‍♂️ Cardio | `cardio` | Quantidade (número) |
| 💧 Água | `agua` | Quantidade em copos |
| 😴 Sono | `sono` | Quantidade em horas |
| 🍽️ Ref. Livre | `ref_livre` | Quantidade |
| 🍪 Beliscos | `beliscos` | Quantidade |
| ⏱️ Tempo Treino | `tempo` | Texto livre (duração) |
| 🏃 Tempo Cardio | `tempo_cardio` | Texto livre (duração) |
| ⏸️ Descanso | `descanso` | Texto livre (segundos) |

---

## Resultado Final

✅ **Todas as colunas agora usam a mesma fonte de dados:**
- Coluna "Anterior" → lê de campos `treino`, `cardio`, `agua`, `sono`, etc.
- Colunas Históricas → lê dos mesmos campos via `getCheckinMetricValue`
- Hook `use-all-checkins` → busca os mesmos campos do banco

✅ **Valores consistentes em toda a tabela:**
- 4 água = 4 copos (em todas as colunas)
- 7 sono = 7 horas (em todas as colunas)
- 5 treinos = 5 sessões (em todas as colunas)
- 3 cardios = 3 sessões (em todas as colunas)

✅ **Mesma lógica de processamento:**
- Todos usam a função `cleanNumber()` para converter valores
- Todos usam `extractMeasurements()` para medidas (cintura/quadril)
- Todos usam `extractTimeMinutes()` e `extractRestSeconds()` para tempos

---

## Observações Técnicas

### Diferença entre Campos de Quantidade e Pontos:

**Campos de Quantidade** (usados agora):
- `treino`, `cardio`, `agua`, `sono` = quantidades reais informadas pelo paciente
- Exemplo: `agua: "4"` = 4 copos de água

**Campos de Pontos** (NÃO usados):
- `pontos_treinos`, `pontos_cardios`, `pontos_agua`, `pontos_sono` = pontuação calculada para gamificação
- Exemplo: `pontos_agua: "4"` = 4 pontos no sistema de gamificação

### Por que a confusão?
Em muitos casos, a quantidade e os pontos são iguais (4 copos = 4 pontos), mas:
1. Semanticamente são diferentes (quantidade vs pontuação)
2. Podem ter regras de cálculo diferentes no futuro
3. Os campos de quantidade são os que o usuário preenche diretamente

---

## Data da Correção
14 de janeiro de 2026

## Status
✅ **IMPLEMENTADO E CORRIGIDO**
