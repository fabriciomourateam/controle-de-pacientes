# 🔧 Como Aumentar Limites para Buscar Dados Antigos

## 📍 Onde Modificar os Limites

### **1. Checkins** (`src/hooks/use-checkin-data.ts`)

#### ✅ **AGORA É MAIS FÁCIL!** Os hooks já aceitam limite como parâmetro:

```typescript
// ✅ Opção 1: Usar o hook com limite customizado (RECOMENDADO)
import { useCheckins } from '@/hooks/use-checkin-data';

function CheckinsList() {
  // Padrão (500 registros)
  const { data: checkins } = useCheckins();
  
  // Com limite maior (2000 registros)
  const { data: moreCheckins } = useCheckins(2000);
  
  // TODOS os checkins (sem limite)
  const { data: allCheckins } = useCheckins(null);
}
```

#### Novos hooks disponíveis:

```typescript
// Buscar checkins por período específico
import { useCheckinsByPeriod } from '@/hooks/use-checkin-data';

function HistoricalCheckins() {
  // Buscar checkins de 2024 (sem limite)
  const { data } = useCheckinsByPeriod('2024-01-01', '2024-12-31');
  
  // Buscar checkins de 2024 (com limite de 1000)
  const { data: limited } = useCheckinsByPeriod('2024-01-01', '2024-12-31', 1000);
}

// Buscar checkins antigos (antes de uma data)
import { useOldCheckins } from '@/hooks/use-checkin-data';

function OldCheckins() {
  // Todos os checkins antes de 2024
  const { data } = useOldCheckins('2024-01-01');
  
  // Apenas 500 checkins antigos
  const { data: limited } = useOldCheckins('2024-01-01', 500);
}
```

---

### **2. Pacientes** (`src/hooks/use-supabase-data.ts`)

#### ✅ **AGORA É MAIS FÁCIL!** O hook já aceita limite como parâmetro:

```typescript
// ✅ Usar o hook com limite customizado
import { usePatients } from '@/hooks/use-supabase-data';

function PatientsList() {
  // Padrão (sem limite, mas otimizado)
  const { data: patients } = usePatients();
  
  // Com limite específico (5000 registros)
  const { data: limitedPatients } = usePatients(5000);
  
  // TODOS os pacientes (sem limite)
  const { data: allPatients } = usePatients(null);
}
```

---

### **3. Feedbacks** (`src/hooks/use-supabase-data.ts`)

#### ✅ **AGORA É MAIS FÁCIL!** O hook já aceita limite como parâmetro:

```typescript
// ✅ Usar o hook com limite customizado
import { useFeedbacks } from '@/hooks/use-supabase-data';

function FeedbacksList() {
  // Padrão (1000 registros)
  const { data: feedbacks } = useFeedbacks();
  
  // Com limite maior (5000 registros)
  const { data: moreFeedbacks } = useFeedbacks(5000);
  
  // TODOS os feedbacks (sem limite)
  const { data: allFeedbacks } = useFeedbacks(null);
}
```

---

### **4. Métricas Comerciais** (`src/hooks/use-commercial-metrics.ts`)

#### Localização atual:
```typescript
// src/hooks/use-commercial-metrics.ts (linha ~120)
export function useTotalDeVendas() {
  return useQuery({
    queryKey: ['total-de-vendas'],
    queryFn: () => commercialMetricsService.getTotalDeVendas(), // ← Limite padrão: 1000
    staleTime: 10 * 60 * 1000,
    // ...
  });
}
```

#### Como aumentar:
```typescript
// Opção 1: Modificar diretamente
export function useTotalDeVendas() {
  return useQuery({
    queryKey: ['total-de-vendas'],
    queryFn: () => commercialMetricsService.getTotalDeVendas(5000), // ← Aumentar
    staleTime: 10 * 60 * 1000,
    // ...
  });
}

// Opção 2: Criar hook customizado
export function useTotalDeVendasWithLimit(limit: number = 5000) {
  return useQuery({
    queryKey: ['total-de-vendas', 'limit', limit],
    queryFn: () => commercialMetricsService.getTotalDeVendas(limit),
    staleTime: 10 * 60 * 1000,
    // ...
  });
}
```

---

## 🎯 Exemplos Práticos de Uso

### **Exemplo 1: Buscar Checkins Antigos em um Componente**

```typescript
// src/components/checkins/CheckinsList.tsx

// ✅ Opção A: Usar hook com limite (MAIS FÁCIL!)
import { useCheckins, useCheckinsByPeriod, useOldCheckins } from '@/hooks/use-checkin-data';

function CheckinsList() {
  // Buscar 2000 checkins em vez de 500
  const { data: checkins } = useCheckins(2000);
  
  // Buscar checkins de um período específico
  const { data: historicalCheckins } = useCheckinsByPeriod(
    '2024-01-01',
    '2024-12-31'
    // Sem limite = busca todos do período
  );
  
  // Buscar checkins antigos (antes de 2024)
  const { data: oldCheckins } = useOldCheckins('2024-01-01');
  
  // ...
}

// Opção B: Chamada direta quando necessário (para ações específicas)
import { checkinService } from '@/lib/checkin-service';

function CheckinsList() {
  const [checkins, setCheckins] = useState([]);
  
  const loadOldCheckins = async () => {
    // Buscar checkins antigos (antes de 2024)
    const oldCheckins = await checkinService.getOldCheckins('2024-01-01');
    setCheckins(oldCheckins);
  };
  
  // ...
}
```

---

### **Exemplo 2: Buscar Todos os Pacientes para Relatório**

```typescript
// src/pages/Reports.tsx

// ✅ Opção A: Usar hook (RECOMENDADO)
import { usePatients } from '@/hooks/use-supabase-data';

function ReportsPage() {
  // Buscar TODOS os pacientes (sem limite)
  const { data: allPatients } = usePatients(null);
  
  // Processar relatório completo
  // ...
}

// Opção B: Chamada direta (para ações específicas)
import { patientService } from '@/lib/supabase-services';

function ReportsPage() {
  const generateFullReport = async () => {
    // Buscar TODOS os pacientes (sem limite)
    const allPatients = await patientService.getAll(null);
    
    // Processar relatório completo
    // ...
  };
  
  // ...
}
```

---

### **Exemplo 3: Buscar Vendas Históricas**

```typescript
// src/pages/CommercialMetrics.tsx

import { commercialMetricsService } from '@/lib/commercial-metrics-service';

function CommercialMetrics() {
  const loadHistoricalData = async () => {
    // Buscar todas as vendas de 2023
    const vendas2023 = await commercialMetricsService.getVendasByMonth(
      'Dezembro',
      null // Sem limite
    );
    
    // Ou buscar mais registros
    const vendas = await commercialMetricsService.getTotalDeVendas(5000);
  };
  
  // ...
}
```

---

## 🔧 Criando Hooks Customizados (Recomendado)

### **Arquivo: `src/hooks/use-checkin-data-extended.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { checkinService } from '@/lib/checkin-service';
import { checkinQueryKeys } from './query-keys';

/**
 * Hook para buscar checkins com limite customizado
 * @param limit - Limite de registros (padrão: 500, null = todos)
 */
export function useCheckinsWithLimit(limit: number | null = 500) {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'limit', limit],
    queryFn: () => checkinService.getAll(limit ?? undefined),
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * Hook para buscar checkins por período
 * @param startDate - Data inicial (YYYY-MM-DD)
 * @param endDate - Data final (YYYY-MM-DD)
 * @param limit - Limite opcional (null = todos)
 */
export function useCheckinsByPeriod(
  startDate: string,
  endDate: string,
  limit?: number | null
) {
  return useQuery({
    queryKey: ['checkins', 'period', startDate, endDate, limit],
    queryFn: () => checkinService.getByPeriod(startDate, endDate, limit ?? undefined),
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!startDate && !!endDate,
  });
}
```

---

## 📝 Passo a Passo: Modificar um Hook Existente

### **Cenário: Quer buscar 2000 checkins em vez de 500**

1. **Abra o arquivo:**
   ```
   src/hooks/use-checkin-data.ts
   ```

2. **Localize a função `useCheckins()`:**
   ```typescript
   export function useCheckins() {
     return useQuery({
       queryKey: checkinQueryKeys.lists(),
       queryFn: () => checkinService.getAll(), // ← Aqui
       // ...
     });
   }
   ```

3. **Modifique para:**
   ```typescript
   export function useCheckins() {
     return useQuery({
       queryKey: checkinQueryKeys.lists(),
       queryFn: () => checkinService.getAll(2000), // ← Adicione o limite
       // ...
     });
   }
   ```

4. **Salve o arquivo** - A mudança será aplicada automaticamente!

---

## 🎨 Interface do Usuário: Adicionar Controle de Limite

### **Exemplo: Botão "Carregar Mais" ou "Ver Todos"**

```typescript
// src/components/checkins/CheckinsList.tsx

function CheckinsList() {
  const [limit, setLimit] = useState(500);
  const { data: checkins } = useCheckinsWithLimit(limit);
  
  return (
    <div>
      {/* Lista de checkins */}
      <div>
        {checkins?.slice(0, limit).map(checkin => (
          // ...
        ))}
      </div>
      
      {/* Botão para aumentar limite */}
      <Button onClick={() => setLimit(prev => prev + 500)}>
        Carregar Mais (500)
      </Button>
      
      {/* Botão para buscar todos */}
      <Button onClick={() => setLimit(null)}>
        Ver Todos os Checkins
      </Button>
      
      {/* Mostrar quantos registros estão sendo exibidos */}
      <p>Mostrando {checkins?.length || 0} de {limit || 'todos'} checkins</p>
    </div>
  );
}
```

---

## ⚠️ Importante

### **Quando Modificar os Hooks:**
- ✅ **Modificar diretamente:** Se você quer que **sempre** busque mais registros
- ✅ **Criar hook customizado:** Se você quer ter **ambas as opções** (padrão e estendido)
- ✅ **Chamada direta:** Se você quer buscar dados **apenas em situações específicas**

### **Impacto no Egress:**
- **Limite 500 → 2000:** Aumenta ~4x o egress dessa query
- **Limite → null (todos):** Pode aumentar significativamente (depende do total de registros)
- **Uso ocasional:** Impacto mínimo no egress mensal
- **Uso frequente:** Pode aumentar o egress consideravelmente

### **Recomendações:**
1. **Use limites maiores apenas quando necessário**
2. **Prefira filtros de data** em vez de buscar todos
3. **Crie hooks customizados** para não afetar o uso diário
4. **Monitore o egress** após fazer mudanças

---

## 📊 Resumo dos Locais

| Dado | Hook | Arquivo | Limite Padrão |
|------|------|---------|---------------|
| Checkins | `useCheckins()` | `src/hooks/use-checkin-data.ts` | 500 |
| Pacientes | `usePatients()` | `src/hooks/use-supabase-data.ts` | Sem limite (otimizado) |
| Feedbacks | `useFeedbacks()` | `src/hooks/use-supabase-data.ts` | 1000 |
| Vendas | `useTotalDeVendas()` | `src/hooks/use-commercial-metrics.ts` | 1000 |
| Leads | `useLeadsQueEntraram()` | `src/hooks/use-commercial-metrics.ts` | 365 dias |

---

## 🚀 Próximos Passos

1. **Decida qual limite você precisa**
2. **Escolha a abordagem** (modificar hook, criar customizado, ou chamada direta)
3. **Faça a modificação** seguindo os exemplos acima
4. **Teste** para garantir que funciona
5. **Monitore o egress** no Supabase

**Dúvidas? Consulte o `GUIA_ACESSO_REGISTROS_ANTIGOS.md` para mais detalhes!**
