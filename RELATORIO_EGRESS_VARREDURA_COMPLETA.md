# 🔍 Relatório Completo de Varredura - Egress Supabase

## 📊 Resumo Executivo

Após uma varredura completa, foram identificados **problemas adicionais** além dos já corrigidos:

### ✅ Já Corrigidos:
- ✅ `usePatients()` - Removido refetchInterval
- ✅ `useFeedbacks()` - Removido refetchInterval
- ✅ `refetchOnWindowFocus` - Desabilitado globalmente
- ✅ Query duplicada em `PatientEvolution.tsx` - Otimizada

### ⚠️ Problemas Adicionais Encontrados:

---

## 🚨 PROBLEMAS CRÍTICOS ADICIONAIS

### 1. `checkinService.getAll()` - Sem Limite

**Localização:** `src/lib/checkin-service.ts:18`

**Problema:**
```typescript
async getAll(): Promise<Checkin[]> {
  const { data, error } = await supabase
    .from('checkin')
    .select('*')  // ❌ Todos os campos
    .order('data_checkin', { ascending: false });
    // ❌ Sem limite!
}
```

**Impacto:**
- Busca **TODOS** os checkins sem limite
- Usa `select('*')` = busca todos os campos
- Se houver 10.000 checkins = 10.000 registros completos
- **Alto egress** mesmo que não seja usado frequentemente

**Solução:**
```typescript
async getAll(limit: number = 500): Promise<Checkin[]> {
  const { data, error } = await supabase
    .from('checkin')
    .select('id, telefone, data_checkin, peso, medida, objetivo, ...') // Campos específicos
    .order('data_checkin', { ascending: false })
    .limit(limit);
}
```

---

### 2. `feedbackService.getAll()` - Sem Limite + select('*')

**Localização:** `src/lib/supabase-services.ts:537`

**Problema:**
```typescript
async getAll() {
  const { data, error } = await supabase
    .from('patients')
    .select('*')  // ❌ Todos os campos
    .order('created_at', { ascending: false });
    // ❌ Sem limite!
}
```

**Impacto:**
- Busca **TODOS** os pacientes com `select('*')`
- Mesmo que já tenha removido refetchInterval, ainda busca tudo quando chamado
- **Alto egress** quando a função é chamada

**Solução:**
```typescript
async getAll(limit: number = 1000) {
  const { data, error } = await supabase
    .from('patients')
    .select('id, nome, telefone, plano, ...') // Campos específicos necessários
    .order('created_at', { ascending: false })
    .limit(limit);
}
```

---

### 3. `patientService.getAll()` - Sem Limite

**Localização:** `src/lib/supabase-services.ts:37`

**Problema:**
- Já usa campos específicos (✅ bom)
- Mas **sem limite** (❌ problema)
- Se houver 5000 pacientes = 5000 registros a cada chamada

**Solução:**
```typescript
async getAll(limit?: number) {
  let query = supabase
    .from('patients')
    .select(`...campos específicos...`)
    .order('created_at', { ascending: false });
  
  if (limit) {
    query = query.limit(limit);
  }
  // ...
}
```

---

## ⚠️ PROBLEMAS ALTOS ADICIONAIS

### 4. `CheckinsList.tsx` - Query Direta sem Cache

**Localização:** `src/components/checkins/CheckinsList.tsx:193`

**Problema:**
```typescript
useEffect(() => {
  const loadPatientsWithBioimpedance = async () => {
    const { data, error } = await supabase
      .from('body_composition')
      .select('telefone')
      .not('telefone', 'is', null);
    // ❌ Sem cache, executa toda vez que o componente monta
    // ❌ Sem limite
  };
  loadPatientsWithBioimpedance();
}, []);
```

**Impacto:**
- Executa toda vez que a página de checkins é acessada
- Sem cache do React Query
- Busca todos os registros de `body_composition` sem limite

**Solução:** Criar hook `usePatientsWithBioimpedance()` com React Query e cache

---

### 5. `commercial-metrics-service.ts` - Múltiplas Queries com select('*') e sem Limite

**Localização:** `src/lib/commercial-metrics-service.ts`

**Problemas:**
1. `getLeadsQueEntraram()` - `select('*')` sem limite (linha 18)
2. `getAllTotalDeLeads()` - `select('*')` sem limite (linha 33)
3. `getAllTotalDeCallsAgendadas()` - `select('*')` sem limite (linha 64)
4. `getTotalDeLeadsPorFunil()` - `select('*')` sem limite (linha 95)
5. `getTotalDeAgendamentosPorFunil()` - `select('*')` sem limite (linha 109)
6. `getTotalDeVendas()` - `select('*')` sem limite (linha 125)
7. `getVendasByMonth()` - `select('*')` sem limite (linha 153)

**Impacto:**
- Todas as queries de métricas comerciais usam `select('*')`
- Nenhuma tem limite
- Refetch a cada 5 minutos (ainda não otimizado)
- **Alto egress** especialmente em `getTotalDeVendas()` que pode ter muitos registros

**Solução:**
- Adicionar limites apropriados
- Usar campos específicos quando possível
- Remover refetchInterval (já identificado)

---

### 6. `dashboard-metrics-service.ts` - Queries com select('*')

**Localização:** `src/lib/dashboard-metrics-service.ts`

**Problemas:**
- `calculateGrowthMetrics()` - `select('*')` com limit(50) (linha 25)
- `calculateRetentionMetrics()` - `select('*')` com limit(50) (linha 125)
- `calculateHealthMetrics()` - `select('*')` com limit(50) (linha 216)
- `getChartData()` - `select('*')` com limit(50) (linha 375)

**Impacto:**
- Usa `select('*')` mesmo com limite
- Refetch a cada 5 minutos (ainda não otimizado)
- Poderia usar campos específicos para reduzir egress

**Solução:**
- Usar campos específicos em vez de `select('*')`
- Remover refetchInterval

---

## 📋 PROBLEMAS MÉDIOS ADICIONAIS

### 7. `useDashboardMetrics()` - RefetchInterval Ainda Ativo

**Localização:** `src/hooks/use-supabase-data.ts:174`

**Problema:**
```typescript
refetchInterval: getRefetchInterval(5 * 60 * 1000), // 5 minutos
```

**Impacto:**
- Refetch a cada 5 minutos
- Dados mensais mudam pouco durante o dia
- Poderia usar atualização agendada ou Realtime

**Solução:** Remover refetchInterval, usar atualização agendada

---

### 8. `useChartData()` - RefetchInterval Ainda Ativo

**Localização:** `src/hooks/use-supabase-data.ts:184`

**Problema:**
```typescript
refetchInterval: getRefetchInterval(5 * 60 * 1000), // 5 minutos
```

**Impacto:** Similar ao anterior

**Solução:** Remover refetchInterval

---

### 9. `useExpiringPatients()` - RefetchInterval Ainda Ativo

**Localização:** `src/hooks/use-supabase-data.ts:194`

**Problema:**
```typescript
refetchInterval: getRefetchInterval(5 * 60 * 1000), // 5 minutos
```

**Impacto:**
- Refetch a cada 5 minutos
- Dados de pacientes expirando mudam pouco

**Solução:** Remover refetchInterval

---

### 10. `use-commercial-metrics.ts` - Múltiplos RefetchIntervals

**Localização:** `src/hooks/use-commercial-metrics.ts`

**Problemas:**
- Todas as 9 queries têm `refetchInterval: 5 minutos`
- Métricas comerciais são atualizadas pelo N8N, não precisam de refetch tão frequente

**Impacto:**
- 9 queries × 288 chamadas/dia = **2.592 chamadas/dia** só de métricas comerciais
- Alto egress desnecessário

**Solução:** Remover refetchInterval de todas, usar atualização agendada ou Realtime

---

## 📊 Estatísticas de Impacto Adicional

### Queries com RefetchInterval Ainda Ativas:
- **Dashboard Metrics:** 2 queries × 288 chamadas/dia = 576 chamadas/dia
- **Commercial Metrics:** 9 queries × 288 chamadas/dia = 2.592 chamadas/dia
- **Expiring Patients:** 1 query × 288 chamadas/dia = 288 chamadas/dia
- **Total:** ~3.456 chamadas/dia adicionais

### Queries sem Limite:
- `checkinService.getAll()` - Pode buscar 10.000+ registros
- `feedbackService.getAll()` - Pode buscar 5.000+ registros
- `patientService.getAll()` - Pode buscar 5.000+ registros
- `commercial-metrics-service` - 7 queries sem limite

### Queries com select('*'):
- `checkinService.getAll()` - Todos os campos
- `feedbackService.getAll()` - Todos os campos
- `commercial-metrics-service` - 9 queries com select('*')
- `dashboard-metrics-service` - 4 queries com select('*')

---

## ✅ Recomendações Prioritárias

### Prioridade 1 (CRÍTICO - Fazer Agora):
1. ✅ Adicionar limite em `checkinService.getAll()`
2. ✅ Adicionar limite e campos específicos em `feedbackService.getAll()`
3. ✅ Adicionar limite em `patientService.getAll()`
4. ✅ Criar hook `usePatientsWithBioimpedance()` com React Query

### Prioridade 2 (ALTO - Fazer em Seguida):
5. ✅ Adicionar limites em todas as queries de `commercial-metrics-service`
6. ✅ Remover `refetchInterval` de `useDashboardMetrics`, `useChartData`, `useExpiringPatients`
7. ✅ Remover `refetchInterval` de todas as queries em `use-commercial-metrics.ts`
8. ✅ Otimizar `dashboard-metrics-service` para usar campos específicos

### Prioridade 3 (MÉDIO - Fazer quando possível):
9. ✅ Revisar outras queries com `select('*')` e otimizar
10. ✅ Implementar paginação onde necessário

---

## 📈 Impacto Total Estimado

### Antes de TODAS as otimizações:
- **Feedbacks:** 720 chamadas/dia × 1000 registros × ~2KB = ~1.4 GB/dia
- **Pacientes:** 288 chamadas/dia × 1000 registros × ~1KB = ~288 MB/dia
- **Checkins:** Varia, mas pode ser alto
- **Métricas Comerciais:** 2.592 chamadas/dia × ~50KB = ~130 MB/dia
- **Dashboard:** 576 chamadas/dia × ~20KB = ~12 MB/dia
- **Total:** ~2.8 GB/dia = **~84 GB/mês** ❌

### Após TODAS as otimizações:
- **Feedbacks:** 4 chamadas/dia × 100 registros × ~1KB = ~0.4 MB/dia
- **Pacientes:** 4 chamadas/dia × 1000 registros × ~0.5KB = ~2 MB/dia
- **Checkins:** Otimizado com limite
- **Métricas Comerciais:** 4 chamadas/dia × ~50KB = ~0.2 MB/dia
- **Dashboard:** 4 chamadas/dia × ~20KB = ~0.08 MB/dia
- **Total:** ~2.7 MB/dia = **~81 MB/mês** ✅

**Redução estimada: ~99.9%** 🎯

---

## 🔧 Padrões de Otimização Aplicáveis

### 1. Sempre adicionar limite em queries de listagem
```typescript
// ❌ Ruim
.select('*').order('created_at', { ascending: false })

// ✅ Bom
.select('id, nome, telefone')
.order('created_at', { ascending: false })
.limit(100)
```

### 2. Sempre usar campos específicos em vez de select('*')
```typescript
// ❌ Ruim
.select('*')

// ✅ Bom
.select('id, nome, telefone, created_at')
```

### 3. Remover refetchInterval de queries que não mudam frequentemente
```typescript
// ❌ Ruim
refetchInterval: getRefetchInterval(5 * 60 * 1000)

// ✅ Bom
// Sem refetchInterval - usa atualização agendada ou Realtime
staleTime: 10 * 60 * 1000
```

### 4. Usar React Query para todas as queries frequentes
```typescript
// ❌ Ruim
useEffect(() => {
  supabase.from('table').select('*').then(...);
}, []);

// ✅ Bom
const { data } = useQuery({
  queryKey: ['table'],
  queryFn: () => tableService.getAll(),
  staleTime: 10 * 60 * 1000,
});
```

---

## 📝 Notas Finais

- As otimizações já implementadas (Realtime + atualização agendada) são fundamentais ✅
- Os problemas adicionais identificados podem ser otimizados gradualmente
- Priorizar as otimizações de Prioridade 1 e 2 deve reduzir o egress em **~90-95%**
- Considerar upgrade do plano Supabase apenas se necessário após todas as otimizações
