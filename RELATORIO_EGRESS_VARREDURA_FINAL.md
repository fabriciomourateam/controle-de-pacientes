# 🔍 Relatório Final de Varredura - Egress Supabase

## 📊 Resumo Executivo

Após uma varredura completa do projeto, foram identificados **problemas adicionais** que ainda podem estar sobrecarregando o egress:

### ✅ Já Otimizados:
- ✅ `usePatients()` - Limite + atualização agendada
- ✅ `useFeedbacks()` - Limite + atualização agendada
- ✅ `useCheckins()` - Limite + atualização agendada
- ✅ `refetchOnWindowFocus` - Desabilitado globalmente
- ✅ `refetchInterval` - Removido da maioria das queries
- ✅ `commercial-metrics-service` - Limites adicionados
- ✅ `dashboard-metrics-service` - Campos específicos + limites

### ⚠️ Problemas Adicionais Encontrados:

---

## 🚨 PROBLEMAS CRÍTICOS

### 1. `PatientEvolution.tsx` - Múltiplas Queries Diretas com `select('*')`

**Localização:** `src/pages/PatientEvolution.tsx`

**Problemas:**
1. **Linha 352-356:** Query direta para `patients` com `select('*')`
2. **Linha 373-377:** Query direta para `body_composition` com `select('*')` (sem limite)
3. **Linha 469-473:** Query duplicada para `body_composition` com `select('*')`
4. **Linha 484-488:** Query duplicada para `patients` com `select('*')`
5. **Sem React Query:** Todas as queries são diretas, sem cache

**Impacto:**
- Cada acesso à página = 3-4 queries grandes
- Sem cache = refetch a cada acesso
- `select('*')` = busca todos os campos desnecessariamente
- **Alto egress** mesmo com poucos acessos

**Solução:**
```typescript
// Usar hooks do React Query
const { data: patient } = usePatient(telefone);
const { data: bioData } = useBodyComposition(telefone);
const { data: checkins } = usePatientCheckins(telefone);
```

**Economia estimada:** ~80% menos egress nesta página

---

### 2. `PatientPortal.tsx` - Queries Diretas sem Cache

**Localização:** `src/pages/PatientPortal.tsx:249-255`

**Problema:**
```typescript
const [checkinsData, patientResult, bioResult] = await Promise.all([
  checkinService.getByPhone(telefone),
  supabase.from('patients').select('*').eq('telefone', telefone).single(),
  supabase.from('body_composition').select('*').eq('telefone', telefone)
    .order('data_avaliacao', { ascending: false })
]);
```

**Impacto:**
- Sem cache do React Query
- `select('*')` em todas as queries
- Executa toda vez que a página é acessada
- Busca todos os registros de `body_composition` sem limite

**Solução:** Usar hooks do React Query com cache

**Economia estimada:** ~75% menos egress nesta página

---

### 3. `BioimpedanciaList.tsx` - Query Direta sem Cache

**Localização:** `src/components/evolution/BioimpedanciaList.tsx:69-73`

**Problema:**
```typescript
const { data, error } = await supabase
  .from('body_composition')
  .select('*')  // ❌ Todos os campos
  .eq('telefone', telefone)
  .order('data_avaliacao', { ascending: false });
  // ❌ Sem limite!
```

**Impacto:**
- Executa toda vez que o componente é montado
- Sem cache do React Query
- `select('*')` = busca todos os campos
- Sem limite = busca todos os registros do paciente

**Solução:** Criar hook `useBodyComposition(telefone)` com React Query

**Economia estimada:** ~70% menos egress neste componente

---

## ⚠️ PROBLEMAS ALTOS

### 4. `CurrentDataInput.tsx` - Query Direta sem Cache

**Localização:** `src/components/evolution/CurrentDataInput.tsx:84-88`

**Problema:**
```typescript
const { data: patientData, error } = await supabase
  .from('patients')
  .select('*')  // ❌ Todos os campos
  .eq('telefone', telefone)
  .single();
```

**Impacto:**
- Executa toda vez que o componente é montado
- Sem cache
- `select('*')` = busca todos os campos

**Solução:** Usar hook `usePatient(telefone)` do React Query

---

### 5. `InitialDataInput.tsx` - Query Direta sem Cache

**Localização:** `src/components/evolution/InitialDataInput.tsx:78-82`

**Problema:** Similar ao anterior

**Solução:** Usar hook `usePatient(telefone)` do React Query

---

### 6. `CheckinFeedbackCard.tsx` - Queries Diretas

**Localização:** `src/components/checkins/CheckinFeedbackCard.tsx`

**Problemas:**
1. **Linha 91-95:** Query para `checkin_feedback_analysis` com `select('*')`
2. **Linha 383-387:** Query para `checkin` com `select('*')`
3. **Linha 146-151:** Query para `body_composition` (otimizada, mas ainda direta)

**Impacto:**
- Múltiplas queries diretas sem cache
- `select('*')` em algumas queries
- Executa toda vez que o componente é renderizado

**Solução:** Criar hooks do React Query para essas queries

---

### 7. `PatientEvolutionTab.tsx` - Query Direta

**Localização:** `src/components/diets/PatientEvolutionTab.tsx:101-105`

**Problema:**
```typescript
const { data: patientData, error: patientError } = await supabase
  .from('patients')
  .select('*')  // ❌ Todos os campos
  .eq('id', patientId)
  .single();
```

**Solução:** Usar hook `usePatient(patientId)` do React Query

---

## 📋 PROBLEMAS MÉDIOS

### 8. Queries de `body_composition` sem Limite

**Localizações:**
- `PatientEvolution.tsx:373-377` - Sem limite
- `PatientPortal.tsx:251-254` - Sem limite
- `BioimpedanciaList.tsx:69-73` - Sem limite

**Impacto:**
- Se um paciente tiver muitas avaliações de bioimpedância, busca todas
- Pode ser 10, 20, 50+ registros por paciente

**Solução:** Adicionar limite padrão (ex: 12 últimas avaliações)

---

### 9. `commercial-metrics-service.ts` - `select('*')` em Todas as Queries

**Localização:** `src/lib/commercial-metrics-service.ts`

**Problema:**
- Todas as 9 queries usam `select('*')`
- Já têm limites (✅ bom)
- Mas ainda buscam todos os campos

**Impacto:** Médio - já tem limites, mas poderia ser mais eficiente

**Solução:** Selecionar apenas campos necessários

**Economia estimada:** ~30-40% menos egress por query

---

## 📊 Estatísticas de Impacto Estimado

### Queries Diretas sem Cache (Crítico):
- **PatientEvolution.tsx:** ~3-4 queries por acesso
- **PatientPortal.tsx:** ~3 queries por acesso
- **BioimpedanciaList.tsx:** ~1 query por montagem
- **Outros componentes:** ~5-10 queries diretas

**Total estimado:** ~15-20 queries diretas sem cache no projeto

### Queries com `select('*')`:
- **PatientEvolution.tsx:** 4 queries
- **PatientPortal.tsx:** 2 queries
- **BioimpedanciaList.tsx:** 1 query
- **Outros componentes:** ~5 queries
- **commercial-metrics-service:** 9 queries (mas com limites)

**Total estimado:** ~20 queries com `select('*')`

---

## 🎯 Priorização de Correções

### **Prioridade CRÍTICA (Fazer Primeiro):**
1. ✅ `PatientEvolution.tsx` - Refatorar para usar React Query hooks
2. ✅ `PatientPortal.tsx` - Refatorar para usar React Query hooks
3. ✅ `BioimpedanciaList.tsx` - Criar hook `useBodyComposition()`

### **Prioridade ALTA:**
4. ✅ `CheckinFeedbackCard.tsx` - Criar hooks para queries
5. ✅ `CurrentDataInput.tsx` e `InitialDataInput.tsx` - Usar hooks existentes

### **Prioridade MÉDIA:**
6. ✅ Adicionar limites em queries de `body_composition`
7. ✅ Otimizar `commercial-metrics-service` para usar campos específicos

---

## 💡 Recomendações Gerais

### **1. Criar Hooks Faltantes:**
```typescript
// src/hooks/use-body-composition.ts
export function useBodyComposition(telefone: string, limit: number = 12) {
  return useQuery({
    queryKey: ['body-composition', telefone, limit],
    queryFn: () => bodyCompositionService.getByPhone(telefone, limit),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}
```

### **2. Refatorar Componentes:**
- Substituir todas as queries diretas por hooks do React Query
- Garantir que todos os hooks tenham `staleTime` adequado
- Adicionar limites em queries que buscam múltiplos registros

### **3. Otimizar Campos:**
- Substituir `select('*')` por campos específicos quando possível
- Especialmente em queries que são executadas frequentemente

---

## 📈 Economia Estimada Total

### **Antes das Correções:**
- Queries diretas: ~15-20 queries sem cache
- `select('*')`: ~20 queries buscando todos os campos
- Sem limites: ~5 queries buscando todos os registros
- **Egress estimado:** ~500 MB/dia adicional

### **Após as Correções:**
- Queries com cache: 100% das queries usando React Query
- Campos específicos: ~80% das queries otimizadas
- Limites adequados: 100% das queries com limites
- **Egress estimado:** ~100 MB/dia adicional

**Redução estimada:** ~80% menos egress adicional! 🎯

---

## ✅ Conclusão

Ainda há **~20 locais** que podem ser otimizados para reduzir egress:

1. **Queries diretas sem cache** (crítico) - ~15 locais
2. **Queries com `select('*')`** (alto) - ~20 locais
3. **Queries sem limite** (médio) - ~5 locais

**Prioridade:** Focar primeiro em `PatientEvolution.tsx` e `PatientPortal.tsx`, pois são páginas acessadas frequentemente.
