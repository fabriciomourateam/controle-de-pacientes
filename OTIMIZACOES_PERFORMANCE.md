# Otimizações de Performance - Página de Checkins

## Análise dos Problemas Identificados

### 1. **Problemas de Carregamento Lento**

A página de checkins está carregando TODOS os dados de uma vez, incluindo:
- Todos os checkins (200-2000+ registros)
- Dados completos de cada paciente
- Feedbacks de IA para cada checkin
- Histórico completo de checkins anteriores
- Gráficos e estatísticas

### 2. **Componentes Pesados Renderizados Simultaneamente**

Cada `CheckinFeedbackCard` renderiza:
- Tabela de evolução completa (14 linhas)
- Histórico de checkins anteriores (pode ser 10+ checkins)
- Colunas históricas com dados de todos os checkins
- Fotos e comparações
- Feedback de IA

**Problema**: Se há 50 checkins visíveis, são 50 componentes pesados renderizados ao mesmo tempo!

### 3. **Erros do Supabase (406, 500, ERR_FAILED)**

Esses erros NÃO são causados pelas mudanças de cor. São problemas de:
- **406**: Políticas RLS (Row Level Security) bloqueando acesso
- **500**: Erro interno do servidor (pode ser timeout ou query complexa)
- **ERR_FAILED**: Falha de rede ou CORS

## Soluções Implementadas

### ✅ Já Implementado

1. **Limite de Checkins Carregados**
   - Padrão: 200 checkins
   - Opções: 200, 500, 1000, 2000, ou todos
   - Reduz dados iniciais carregados

2. **Debounce na Busca**
   - 300ms de delay
   - Evita queries desnecessárias

3. **Memoização de Cálculos**
   - `useMemo` para filtros
   - `useMemo` para ordenação
   - `useMemo` para gráficos

4. **React Query com Cache Inteligente**
   - `staleTime: Infinity` (não refaz queries automaticamente)
   - `refetchOnWindowFocus: false`
   - Cache de 24h

5. **Componente Memoizado**
   - `CheckinFeedbackCard` usa `React.memo`

## Otimizações Necessárias

### 🔴 CRÍTICO: Virtualização da Lista

**Problema**: Renderizar 50+ componentes pesados simultaneamente trava a página.

**Solução**: Usar virtualização (renderizar apenas itens visíveis)

```bash
npm install @tanstack/react-virtual
```

**Implementação**:
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// Dentro do componente
const parentRef = useRef<HTMLDivElement>(null);

const rowVirtualizer = useVirtualizer({
  count: displayedCheckins.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 400, // Altura estimada de cada card
  overscan: 5, // Renderizar 5 itens extras acima/abaixo
});

// No render
<div ref={parentRef} style={{ height: '800px', overflow: 'auto' }}>
  <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
      const checkin = displayedCheckins[virtualRow.index];
      return (
        <div
          key={checkin.id}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          <CheckinFeedbackCard ... />
        </div>
      );
    })}
  </div>
</div>
```

**Benefício**: Renderiza apenas 10-15 cards visíveis ao invés de 50+

### 🟡 IMPORTANTE: Lazy Loading do CheckinFeedbackCard

**Problema**: Componente muito pesado carregado para todos os checkins.

**Solução**: Carregar apenas quando expandido

```tsx
const [expandedCheckins, setExpandedCheckins] = useState<Set<string>>(new Set());

// No render
{expandedCheckins.has(checkin.id) && (
  <CheckinFeedbackCard
    checkin={checkin}
    totalCheckins={totalPatientCheckins}
    onUpdate={refetch}
    expanded={true}
    onExpandedChange={(expanded) => {
      if (!expanded) {
        setExpandedCheckins(prev => {
          const newSet = new Set(prev);
          newSet.delete(checkin.id);
          return newSet;
        });
      }
    }}
  />
)}
```

**Benefício**: Reduz renderizações iniciais em 90%

### 🟡 IMPORTANTE: Paginação Server-Side

**Problema**: Buscar 2000 checkins do banco é lento.

**Solução**: Implementar paginação no backend

```typescript
// No checkin-service.ts
async getAllWithPatient(page: number = 1, pageSize: number = 50) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error, count } = await supabase
    .from('checkin')
    .select(`
      *,
      patient:patients!inner(id, nome, apelido, telefone, plano)
    `, { count: 'exact' })
    .order('data_checkin', { ascending: false })
    .range(from, to);
    
  return { data, count, page, pageSize };
}
```

**Benefício**: Carrega apenas 50 registros por vez

### 🟢 RECOMENDADO: Infinite Scroll

**Problema**: Botão "Carregar mais" requer clique manual.

**Solução**: Carregar automaticamente ao rolar

```bash
npm install react-intersection-observer
```

```tsx
import { useInView } from 'react-intersection-observer';

const { ref, inView } = useInView({
  threshold: 0,
});

useEffect(() => {
  if (inView && hasMore && !checkinsLoading) {
    setDisplayLimit(prev => prev + 10);
  }
}, [inView, hasMore, checkinsLoading]);

// No final da lista
<div ref={ref} className="h-10" />
```

### 🟢 RECOMENDADO: Otimizar Queries do Supabase

**Problema**: Queries complexas com múltiplos JOINs.

**Solução**: Criar views materializadas ou índices

```sql
-- Criar índice para acelerar busca por telefone
CREATE INDEX IF NOT EXISTS idx_checkin_telefone 
ON checkin(telefone);

-- Criar índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_checkin_data_checkin 
ON checkin(data_checkin DESC);

-- Criar índice composto para filtros comuns
CREATE INDEX IF NOT EXISTS idx_checkin_status_assigned 
ON checkin(status, assigned_to);
```

### 🟢 RECOMENDADO: Suspense e Error Boundaries

**Problema**: Erros travam toda a página.

**Solução**: Isolar componentes com boundaries

```tsx
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary fallback={<ErrorFallback />}>
  <Suspense fallback={<CheckinItemSkeleton />}>
    <CheckinsList />
  </Suspense>
</ErrorBoundary>
```

## Sobre os Erros do Supabase

### Erro 406 (Not Acceptable)

**Causa**: Políticas RLS bloqueando acesso a `body_composition`

**Solução**: Verificar e ajustar políticas RLS

```sql
-- Verificar políticas atuais
SELECT * FROM pg_policies WHERE tablename = 'body_composition';

-- Ajustar política se necessário
DROP POLICY IF EXISTS "Users can view own body composition" ON body_composition;

CREATE POLICY "Users can view own body composition"
ON body_composition FOR SELECT
USING (
  telefone IN (
    SELECT telefone FROM patients 
    WHERE user_id = auth.uid()
  )
);
```

### Erro 500 (Internal Server Error)

**Causa**: Query muito complexa ou timeout

**Solução**: 
1. Simplificar queries
2. Adicionar índices
3. Aumentar timeout do Supabase (se possível)

### ERR_FAILED (Network Error)

**Causa**: Falha de rede ou CORS

**Solução**:
1. Verificar configuração CORS no Supabase
2. Verificar se o token de autenticação está válido
3. Implementar retry automático

```typescript
// No React Query
retry: 3,
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
```

## Priorização de Implementação

### Fase 1 - Rápido (1-2 horas)
1. ✅ Lazy loading do CheckinFeedbackCard (expandir apenas quando clicado)
2. ✅ Adicionar índices no Supabase
3. ✅ Implementar Error Boundaries

### Fase 2 - Médio (3-4 horas)
1. ⏳ Virtualização da lista com @tanstack/react-virtual
2. ⏳ Infinite scroll
3. ⏳ Otimizar queries (remover JOINs desnecessários)

### Fase 3 - Longo (1-2 dias)
1. ⏳ Paginação server-side
2. ⏳ Cache distribuído (Redis)
3. ⏳ Background sync com Service Workers

## Métricas de Sucesso

### Antes
- ❌ Tempo de carregamento inicial: 5-10s
- ❌ Renderização de 50+ componentes pesados
- ❌ Scroll travado
- ❌ Erros frequentes (406, 500)

### Depois (Meta)
- ✅ Tempo de carregamento inicial: <2s
- ✅ Renderização de apenas 10-15 componentes visíveis
- ✅ Scroll fluido (60fps)
- ✅ Tratamento de erros com retry automático

## Comandos para Implementar

```bash
# Instalar dependências
npm install @tanstack/react-virtual react-intersection-observer

# Rodar dev server
npm run dev
```

## Próximos Passos

1. Implementar lazy loading (mais rápido)
2. Adicionar virtualização (maior impacto)
3. Corrigir erros RLS do Supabase
4. Adicionar índices no banco
5. Implementar infinite scroll
6. Otimizar queries complexas

---

**Nota**: As mudanças de cor NÃO causaram os problemas de performance. Os problemas já existiam e são relacionados à arquitetura de renderização e queries do banco de dados.
