# Correção: Exibição do Penúltimo Check-in

## Problema Identificado

Na página de check-ins, no feedback card, a **Coluna 2** (que deveria mostrar o penúltimo check-in) estava exibindo um check-in mais antigo incorreto.

## Causa Raiz

O array `previousCheckins` retornado pelo hook `use-all-checkins` está ordenado do **mais antigo para o mais recente** (ascending: true):

```typescript
// Ordenação no banco
.order('data_checkin', { ascending: true })
```

Isso significa:
- `previousCheckins[0]` = check-in mais antigo
- `previousCheckins[1]` = segundo check-in mais antigo
- `previousCheckins[previousCheckins.length - 1]` = **penúltimo check-in** (o mais recente antes do atual)

O código estava usando `previousCheckins[1]` quando deveria usar `previousCheckins[previousCheckins.length - 1]`.

## Solução Implementada

### 1. Cabeçalho da Tabela
**Antes:**
```tsx
{/* Coluna do antepenúltimo check-in */}
{!showAllCheckinsColumns && previousCheckins.length >= 2 && (
  <th>{new Date(previousCheckins[1].data_checkin).toLocaleDateString()}</th>
)}
```

**Depois:**
```tsx
{/* Coluna do penúltimo check-in (sempre visível se houver) */}
{!showAllCheckinsColumns && previousCheckins.length > 0 && (
  <th>{new Date(previousCheckins[previousCheckins.length - 1].data_checkin).toLocaleDateString()}</th>
)}
```

### 2. Colunas Históricas
**Antes:**
```tsx
{showAllCheckinsColumns && previousCheckins.slice(2).map((checkin) => (
  // Renderizar check-ins a partir do 3º mais antigo
))}
```

**Depois:**
```tsx
{showAllCheckinsColumns && previousCheckins.slice(0, -1).map((checkin) => (
  // Renderizar todos os check-ins exceto o penúltimo (que já tem coluna própria)
))}
```

### 3. Valores das Métricas
**Antes:**
```tsx
{getCheckinMetricValue(previousCheckins[1], 'peso')}
```

**Depois:**
```tsx
{getCheckinMetricValue(previousCheckins[previousCheckins.length - 1], 'peso')}
```

## Estrutura Final das Colunas

Agora a tabela exibe corretamente:

| Coluna | Descrição | Dados Exibidos |
|--------|-----------|----------------|
| **Coluna 1** | Métrica | Nome da métrica (Peso, Cintura, etc.) |
| **Coluna 2** | Penúltimo Check-in | `previousCheckins[previousCheckins.length - 1]` |
| **Coluna 3** | Último Check-in | Check-in atual (`checkin`) |
| **Coluna 4** | Evolução | Diferença entre último e penúltimo |

Quando o botão "Ver X Check-ins" é clicado, todas as colunas históricas são exibidas (exceto o penúltimo que já tem coluna própria).

## Alterações Realizadas

✅ Substituído `previousCheckins[1]` por `previousCheckins[previousCheckins.length - 1]` em todas as ocorrências
✅ Substituído `previousCheckins.slice(2)` por `previousCheckins.slice(0, -1)` 
✅ Removida coluna "antepenúltimo" que não era necessária
✅ Ajustada condição de `previousCheckins.length >= 2` para `previousCheckins.length > 0`

## Teste

Para testar a correção:
1. Acesse a página de check-ins
2. Expanda um feedback card de um paciente com múltiplos check-ins
3. Verifique se a **Coluna 2** mostra o penúltimo check-in (data mais recente antes do atual)
4. Clique em "Ver X Check-ins" para ver o histórico completo
5. Confirme que todos os check-ins históricos aparecem corretamente ordenados

## Arquivos Modificados

- `src/components/checkins/CheckinFeedbackCard.tsx` - Componente principal corrigido
- `fix-penultimo-checkin.ps1` - Script PowerShell usado para fazer as substituições
