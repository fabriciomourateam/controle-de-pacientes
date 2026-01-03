# 🔍 Relatório de Análise de Egress - Supabase

## 📊 Resumo Executivo

Foram identificados **5 categorias principais** de problemas que estão sobrecarregando o egress do Supabase:

1. **Queries sem limite em tabelas grandes** (CRÍTICO)
2. **Uso excessivo de `select('*')`** (ALTO)
3. **Chamadas diretas ao Supabase sem React Query** (ALTO)
4. **Queries duplicadas** (MÉDIO)
5. **RefetchInterval muito frequente** (MÉDIO)

---

## 🚨 PROBLEMAS CRÍTICOS

### 1. `patientService.getAll()` - Sem Limite + Refetch Frequente

**Localização:** `src/lib/supabase-services.ts:37` e `src/hooks/use-supabase-data.ts:35`

**Problema:**
- Busca **TODOS** os pacientes sem limite
- Refetch a cada **5 minutos**
- Usa campos específicos (bom), mas ainda busca todos os registros

**Impacto:** 
- Se houver 1000 pacientes = 1000 registros a cada 5 minutos
- **~288 chamadas/dia** buscando todos os pacientes
- **Alto egress** mesmo com campos específicos

**Solução:**
```typescript
// Adicionar limite padrão e paginação
async getAll(limit?: number) {
  const query = supabase
    .from('patients')
    .select('...campos...')
    .order('created_at', { ascending: false });
  
  if (limit) query = query.limit(limit);
  // ...
}
```

---

### 2. `feedbackService.getAll()` - Sem Limite + Refetch Muito Frequente

**Localização:** `src/lib/supabase-services.ts:537` e `src/hooks/use-supabase-data.ts:122`

**Problema:**
- Busca **TODOS** os pacientes usando `select('*')`
- Refetch a cada **2 minutos** (muito frequente!)
- Dados de feedback mudam pouco durante o dia

**Impacto:**
- Se houver 1000 pacientes = 1000 registros completos a cada 2 minutos
- **~720 chamadas/dia** buscando todos os pacientes
- **Muito alto egress** (select('*') + sem limite)

**Solução:**
```typescript
// 1. Adicionar limite
async getAll(limit: number = 100) {
  const { data, error } = await supabase
    .from('patients')
    .select('id, nome, telefone, ...') // Campos específicos
    .order('created_at', { ascending: false })
    .limit(limit);
}

// 2. Aumentar refetchInterval para 10 minutos
refetchInterval: getRefetchInterval(10 * 60 * 1000), // 10 minutos
```

---

## ⚠️ PROBLEMAS ALTOS

### 3. Chamadas Diretas ao Supabase em `useEffect` (Sem Cache)

**Localização:** `src/components/checkins/CheckinsList.tsx:193`

**Problema:**
```typescript
useEffect(() => {
  const loadPatientsWithBioimpedance = async () => {
    const { data, error } = await supabase
      .from('body_composition')
      .select('telefone')
      .not('telefone', 'is', null);
    // Sem cache, executa toda vez que o componente monta
  };
  loadPatientsWithBioimpedance();
}, []);
```

**Impacto:**
- Executa toda vez que a página de checkins é acessada
- Sem cache do React Query
- Busca todos os registros de `body_composition`

**Solução:** Criar hook `usePatientsWithBioimpedance()` com React Query

---

### 4. `PatientEvolution.tsx` - Múltiplas Queries com `select('*')`

**Localização:** `src/pages/PatientEvolution.tsx:315-372`

**Problemas:**
1. **Query duplicada:** Busca checkins 2x (linhas 330 e 338)
2. **select('*') em patients:** Linha 349
3. **select('*') em body_composition:** Linha 370
4. **Sem React Query:** Todas as queries são diretas, sem cache

**Impacto:**
- Cada acesso à página de evolução = 3 queries grandes
- Sem cache = refetch a cada acesso
- Busca dados completos quando poderia buscar campos específicos

**Solução:**
```typescript
// Usar hooks do React Query
const { data: checkins } = useCheckinsByPhone(telefone);
const { data: patient } = usePatient(telefone);
const { data: bioData } = useBodyComposition(telefone);

// E remover a query duplicada
```

---

### 5. `PatientPortal.tsx` - Queries Diretas sem Cache

**Localização:** `src/pages/PatientPortal.tsx:243-255`

**Problema:**
```typescript
const [checkinsData, patientResult, bioResult] = await Promise.all([
  checkinService.getByPhone(telefone),
  supabase.from('patients').select('*').eq('telefone', telefone).single(),
  supabase.from('body_composition').select('*').eq('telefone', telefone)
]);
```

**Impacto:**
- Sem cache do React Query
- `select('*')` em todas as queries
- Executa toda vez que a página é acessada

**Solução:** Usar hooks do React Query

---

## 📋 PROBLEMAS MÉDIOS

### 6. Queries de Checkin sem Limite Adequado

**Localização:** `src/lib/checkin-service.ts`

**Problemas:**
- `getAll()` - Sem limite (linha 18)
- `getByPhone()` - Sem limite (linha 51)
- `getByPeriod()` - Sem limite (linha 143)
- `getPatientEvolution()` - Limite por meses, mas pode ser alto (linha 218)

**Solução:** Adicionar limites padrão em todas as queries

---

### 7. `refetchOnWindowFocus: true` Global

**Localização:** `src/App.tsx:65`

**Problema:**
- Todas as queries refazem fetch ao focar na janela
- Se o usuário alternar entre abas frequentemente, gera muitas chamadas

**Solução:** Manter `refetchOnWindowFocus: false` para queries pesadas

---

## 📊 Estatísticas de Impacto Estimado

### Antes das Otimizações (Estimativa):
- **Feedbacks:** 720 chamadas/dia × 1000 registros × ~2KB = **~1.4 GB/dia**
- **Pacientes:** 288 chamadas/dia × 1000 registros × ~1KB = **~288 MB/dia**
- **Checkins:** Já otimizado ✅
- **Outras queries:** ~500 MB/dia
- **Total estimado:** **~2.2 GB/dia** = **~66 GB/mês** ❌

### Após Otimizações (Estimativa):
- **Feedbacks:** 144 chamadas/dia × 100 registros × ~1KB = **~14 MB/dia**
- **Pacientes:** 144 chamadas/dia × 100 registros × ~0.5KB = **~7 MB/dia**
- **Checkins:** Já otimizado ✅
- **Outras queries:** ~100 MB/dia
- **Total estimado:** **~121 MB/dia** = **~3.6 GB/mês** ✅

**Redução estimada: ~95%** 🎯

---

## ✅ Recomendações Prioritárias

### Prioridade 1 (CRÍTICO - Fazer Agora):
1. ✅ Adicionar limite em `feedbackService.getAll()`
2. ✅ Aumentar `refetchInterval` de feedbacks para 10 minutos
3. ✅ Adicionar limite em `patientService.getAll()`
4. ✅ Converter `select('*')` para campos específicos em `feedbackService.getAll()`

### Prioridade 2 (ALTO - Fazer em Seguida):
5. ✅ Criar hook `usePatientsWithBioimpedance()` com React Query
6. ✅ Otimizar `PatientEvolution.tsx` para usar React Query
7. ✅ Remover query duplicada em `PatientEvolution.tsx`
8. ✅ Otimizar `PatientPortal.tsx` para usar React Query

### Prioridade 3 (MÉDIO - Fazer quando possível):
9. ✅ Adicionar limites em queries de checkin
10. ✅ Revisar `refetchOnWindowFocus` para queries pesadas

---

## 🔧 Padrões de Otimização Recomendados

### 1. Sempre usar React Query para queries frequentes
```typescript
// ❌ Ruim
useEffect(() => {
  supabase.from('table').select('*').then(...);
}, []);

// ✅ Bom
const { data } = useQuery({
  queryKey: ['table'],
  queryFn: () => tableService.getAll(),
  staleTime: 5 * 60 * 1000,
});
```

### 2. Sempre adicionar limite em queries de listagem
```typescript
// ❌ Ruim
.select('*').order('created_at', { ascending: false })

// ✅ Bom
.select('id, nome, telefone')
.order('created_at', { ascending: false })
.limit(100)
```

### 3. Sempre usar campos específicos em vez de `select('*')`
```typescript
// ❌ Ruim
.select('*')

// ✅ Bom
.select('id, nome, telefone, created_at')
```

### 4. Ajustar `refetchInterval` baseado na frequência de mudança dos dados
```typescript
// Dados que mudam pouco: 10-15 minutos
// Dados que mudam moderadamente: 5 minutos
// Dados que mudam frequentemente: 2-3 minutos
```

---

## 📝 Notas Finais

- As otimizações de checkins já implementadas estão funcionando bem ✅
- O principal problema agora são as queries de **pacientes** e **feedbacks**
- Implementar as otimizações de Prioridade 1 deve reduzir o egress em **~80-90%**
- Considerar upgrade do plano Supabase se o uso continuar alto após otimizações
