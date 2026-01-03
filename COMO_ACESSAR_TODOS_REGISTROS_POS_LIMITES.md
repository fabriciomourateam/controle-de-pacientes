# 📋 Como Acessar Todos os Registros Após Implementação de Limites

## 🎯 Resumo

Após a implementação básica de limites para reduzir egress, alguns registros podem não aparecer por padrão. Este guia explica como acessar **TODOS** os registros quando necessário.

---

## 📊 O QUE FOI IMPLEMENTADO

### **Limites Padrão Adicionados:**

1. **Checkins:**
   - Padrão: 200 checkins (na lista principal)
   - Padrão: 500 checkins (em `getByPhone()`)
   - ✅ **Controle na interface:** Botão "Limite: X" na página de Checkins

2. **Pacientes:**
   - Padrão: 1000 pacientes
   - ✅ **Controle via código:** Pode passar `limit` como parâmetro

3. **Feedbacks:**
   - Padrão: 1000 registros
   - ✅ **Controle via código:** Pode passar `limit` como parâmetro

4. **Body Composition (Bioimpedância):**
   - Padrão: 50 avaliações (em PatientEvolution, PatientPortal, BioimpedanciaList)
   - ⚠️ **Sem controle na interface ainda** (apenas via código)

---

## 🔍 COMO ACESSAR TODOS OS REGISTROS

### **1. CHECKINS - Via Interface (Mais Fácil) ✅**

#### **Na Página de Checkins:**
1. Localize o botão **"Limite: 200"** (ou o limite atual)
2. Clique no botão para abrir o menu
3. Selecione **"Todos os checkins (sem limite)"**
4. Aguarde o carregamento

**Localização:** Topo da página, próximo aos filtros

```
┌─────────────────────────────────────┐
│ [Buscar...] [Filtros...] [Limite: 200 ▼] │
└─────────────────────────────────────┘
```

#### **Opções Disponíveis:**
- 200 checkins (padrão)
- 500 checkins
- 1.000 checkins
- 2.000 checkins
- **Todos os checkins (sem limite)** ← Use esta opção!

---

### **2. CHECKINS - Por Telefone (PatientEvolution)**

Quando você acessa a página de evolução de um paciente (`/checkins/evolution/:telefone`), os checkins são buscados com `checkinService.getByPhone(telefone)`, que tem limite padrão de 500.

**Para ver TODOS os checkins de um paciente específico:**

#### **Opção A: Modificar Temporariamente o Código**
```typescript
// src/lib/checkin-service.ts
async getByPhone(telefone: string, limit: number | null = null) {
  // Passe null para buscar todos
  let query = supabase
    .from('checkin')
    .select('*')
    .eq('telefone', telefone)
    .order('data_checkin', { ascending: false });
  
  if (limit !== null) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
```

#### **Opção B: Usar Hook com Limite Customizado**
```typescript
// Em algum componente
const { data: allCheckins } = usePatientCheckins(telefone, null); // null = sem limite
```

---

### **3. PACIENTES - Via Código**

#### **Usando Hook:**
```typescript
import { usePatients } from '@/hooks/use-supabase-data';

// Buscar todos os pacientes (sem limite)
const { data: allPatients } = usePatients(null); // null = sem limite

// Ou buscar com limite maior
const { data: manyPatients } = usePatients(5000); // 5000 pacientes
```

#### **Usando Service Diretamente:**
```typescript
import { patientService } from '@/lib/supabase-services';

// Buscar todos os pacientes
const allPatients = await patientService.getAll(null); // null = sem limite

// Ou buscar com limite maior
const manyPatients = await patientService.getAll(5000); // 5000 pacientes
```

---

### **4. FEEDBACKS - Via Código**

#### **Usando Hook:**
```typescript
import { useFeedbacks } from '@/hooks/use-supabase-data';

// Buscar todos os feedbacks (sem limite)
const { data: allFeedbacks } = useFeedbacks(null); // null = sem limite

// Ou buscar com limite maior
const { data: manyFeedbacks } = useFeedbacks(5000); // 5000 registros
```

#### **Usando Service Diretamente:**
```typescript
import { feedbackService } from '@/lib/supabase-services';

// Buscar todos os feedbacks
const allFeedbacks = await feedbackService.getAll(null); // null = sem limite

// Ou buscar com limite maior
const manyFeedbacks = await feedbackService.getAll(5000); // 5000 registros
```

---

### **5. BODY COMPOSITION (Bioimpedância) - Via Código**

#### **Usando Hook:**
```typescript
import { useBodyComposition } from '@/hooks/use-body-composition';

// Buscar todas as avaliações (sem limite)
const { data: allBio } = useBodyComposition(telefone, 9999); // Limite muito alto

// Ou modificar o hook para aceitar null
```

#### **Modificando Temporariamente o Código:**
```typescript
// src/pages/PatientEvolution.tsx
// Linha ~373-377
const { data: bioData } = await supabase
  .from('body_composition')
  .select('*')
  .eq('telefone', telefone)
  .order('data_avaliacao', { ascending: false });
  // .limit(50); // ← Remover ou comentar esta linha temporariamente
```

---

## 🛠️ SOLUÇÕES RÁPIDAS

### **Solução 1: Adicionar Controle na Interface (Recomendado)**

Adicionar um botão similar ao de checkins para outras páginas:

#### **Para PatientEvolution (Bioimpedância):**
```typescript
// Adicionar estado
const [bioLimit, setBioLimit] = useState<number | null>(50);

// Usar no hook
const { data: bioData } = useBodyComposition(telefone, bioLimit);

// Adicionar botão na interface
<Button onClick={() => setBioLimit(null)}>
  Ver todas as avaliações
</Button>
```

---

### **Solução 2: Usar Funções de Período**

Para checkins antigos, use funções específicas:

```typescript
import { checkinService } from '@/lib/checkin-service';

// Buscar checkins de um período específico
const oldCheckins = await checkinService.getByPeriod(
  '2024-01-01',
  '2024-12-31',
  null // null = sem limite
);

// Buscar checkins antigos (antes de uma data)
const veryOldCheckins = await checkinService.getOldCheckins(
  '2024-01-01',
  null // null = sem limite
);
```

---

## 📝 RESUMO POR TIPO DE DADO

| Tipo | Limite Padrão | Como Ver Todos |
|------|---------------|----------------|
| **Checkins (Lista)** | 200 | ✅ **Interface:** Botão "Limite: X" → "Todos" |
| **Checkins (Por Telefone)** | 500 | ⚠️ **Código:** Modificar `getByPhone()` ou usar hook com `null` |
| **Pacientes** | 1000 | ⚠️ **Código:** `usePatients(null)` ou `patientService.getAll(null)` |
| **Feedbacks** | 1000 | ⚠️ **Código:** `useFeedbacks(null)` ou `feedbackService.getAll(null)` |
| **Bioimpedância** | 50 | ⚠️ **Código:** Modificar query ou usar hook com limite alto |

---

## ⚠️ ATENÇÃO

### **Ao Remover Limites:**
- ⚠️ **Aumenta o tempo de carregamento**
- ⚠️ **Aumenta o uso de egress do Supabase**
- ⚠️ **Pode sobrecarregar o navegador** (muitos registros)

### **Recomendações:**
- ✅ Use limites quando possível
- ✅ Use "Todos" apenas quando realmente necessário
- ✅ Para análises, use limites maiores (500, 1000, 2000) em vez de "Todos"
- ✅ Para buscar registros específicos, use filtros ou funções de período

---

## 🎯 PRÓXIMOS PASSOS (Opcional)

Se quiser adicionar controles na interface para outros tipos de dados:

1. **Bioimpedância:** Adicionar botão similar ao de checkins
2. **Pacientes:** Adicionar controle de limite na lista de pacientes
3. **Feedbacks:** Adicionar controle de limite na lista de feedbacks

**Por enquanto:** Use os métodos via código quando precisar ver todos os registros! ✅
