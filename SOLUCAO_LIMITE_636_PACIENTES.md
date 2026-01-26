# SOLUÇÃO IMPLEMENTADA: Limite de 636 Pacientes no Dashboard

## Problema Identificado

O dashboard estava mostrando apenas 636 pacientes ativos, mas o usuário tinha 1024 pacientes cadastrados (659 ativos + 365 inativos).

### Causa Raiz

O PostgREST/Supabase tem um **limite padrão de 1000 registros** por query. Quando não especificamos um limite explícito, ele retorna apenas os primeiros 1000 registros.

Na função `dashboardService.getMetrics()` em `src/lib/supabase-services.ts`, a query estava assim:

```typescript
const { data: allPatients } = await supabase
  .from('patients')
  .select('vencimento, created_at, telefone, plano');
```

Como o sistema tinha 1024 pacientes, o Supabase retornava apenas os primeiros 1000. Dentro desses 1000, apenas 636 eram ativos, resultando na discrepância.

## Solução Implementada

Adicionado limite explícito de **5000 pacientes** na query:

```typescript
const { data: allPatients } = await supabase
  .from('patients')
  .select('vencimento, created_at, telefone, plano')
  .limit(5000); // ✅ Limite explícito adicionado
```

Também adicionado limite de **10000 checkins** para garantir que todos sejam carregados:

```typescript
const { data: checkins } = await supabase
  .from('checkin')
  .select('telefone, data_checkin, total_pontuacao')
  .limit(10000); // ✅ Limite explícito adicionado
```

## Resultado Esperado

Agora o dashboard deve mostrar:
- **Total de pacientes**: 1024 (todos os registros)
- **Pacientes ativos**: 659 (todos os ativos)
- **Pacientes inativos**: 365 (todos os inativos)

## Arquivos Modificados

- `controle-de-pacientes/src/lib/supabase-services.ts` (linhas ~701 e ~726)

## Notas Técnicas

- O limite de 5000 é suficiente para a maioria dos casos de uso
- Se o sistema crescer além de 5000 pacientes, será necessário implementar paginação ou carregamento em lotes
- A função `patientService.getAll()` já tinha suporte para limite configurável, mas `dashboardService.getMetrics()` não tinha

## Teste

Para verificar se a solução funcionou:

1. Acesse o dashboard
2. Verifique se o card "Pacientes Ativos" mostra 659
3. Verifique se o total de pacientes está correto
4. Execute a query SQL de diagnóstico para confirmar os números:

```sql
-- Verificar total de pacientes
SELECT COUNT(*) as total FROM patients;

-- Verificar pacientes ativos vs inativos
SELECT 
  CASE 
    WHEN plano IN ('INATIVO', '⛔ Negativado', 'RESCISÃO', 'Pendência Financeira', 'CONGELADO') 
    THEN 'Inativos' 
    ELSE 'Ativos' 
  END as status,
  COUNT(*) as total
FROM patients
GROUP BY status;
```

## Impacto no Egress

- Aumentar o limite de 1000 para 5000 aumenta o egress potencial em ~5x
- Para 1024 pacientes, o impacto real é mínimo (apenas 2.4% acima do limite padrão)
- A query usa apenas 4 campos específicos (vencimento, created_at, telefone, plano) em vez de `*`, minimizando o tamanho dos dados

## Alternativa Futura

Se o sistema crescer além de 5000 pacientes, considere implementar carregamento em lotes:

```typescript
async function getAllInBatches() {
  const batchSize = 1000;
  let allData = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('patients')
      .select('vencimento, created_at, telefone, plano')
      .range(from, from + batchSize - 1);

    if (error) throw error;
    
    if (data && data.length > 0) {
      allData = [...allData, ...data];
      from += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }

  return allData;
}
```
