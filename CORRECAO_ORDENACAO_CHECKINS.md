# Correção: Cards Mudando de Ordem ao Atualizar Status/Responsável

## 🔴 PROBLEMA IDENTIFICADO

**Sintoma:** Ao mudar o status ou responsável de um check-in, o card muda de posição na lista.

**Causa Raiz:** A ordenação padrão é por `data_preenchimento` (data de envio), e quando você atualiza o check-in, o React Query **refaz a query** e **reordena** a lista baseado nos critérios de ordenação.

### Por que acontece?

```tsx
// Ordenação padrão por data de envio
if (sortBy === 'date') {
  const dateA = new Date(a.data_preenchimento || a.data_checkin || 0).getTime();
  const dateB = new Date(b.data_preenchimento || b.data_checkin || 0).getTime();
  comparison = dateA - dateB;
}
```

**Fluxo do problema:**
1. Você muda o status/responsável de um check-in
2. React Query refaz a query (refetch)
3. `sortedCheckins` recalcula com `useMemo`
4. Lista é reordenada baseado em `sortBy` e `sortOrder`
5. Card "pula" para nova posição

## ✅ SOLUÇÕES DISPONÍVEIS

### SOLUÇÃO 1: Usar ID como critério de desempate (RECOMENDADO)

Adicionar o ID como critério secundário de ordenação para manter posição estável:

```tsx
const sortedCheckins = useMemo(() => {
  const sorted = [...filteredCheckins].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'date') {
      const dateA = new Date(a.data_preenchimento || a.data_checkin || 0).getTime();
      const dateB = new Date(b.data_preenchimento || b.data_checkin || 0).getTime();
      comparison = dateA - dateB;
    } else if (sortBy === 'name') {
      const nameA = (a.patient?.nome || '').toLowerCase();
      const nameB = (b.patient?.nome || '').toLowerCase();
      comparison = nameA.localeCompare(nameB, 'pt-BR');
    } else if (sortBy === 'status') {
      const statusA = (a.status || 'pendente').toLowerCase();
      const statusB = (b.status || 'pendente').toLowerCase();
      comparison = statusA.localeCompare(statusB);
    } else if (sortBy === 'score') {
      const scoreA = parseFloat(a.total_pontuacao || '0');
      const scoreB = parseFloat(b.total_pontuacao || '0');
      comparison = scoreA - scoreB;
    }
    
    // ✅ NOVO: Usar ID como critério de desempate para manter ordem estável
    if (comparison === 0) {
      comparison = a.id.localeCompare(b.id);
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}, [filteredCheckins, sortBy, sortOrder]);
```

**Benefícios:**
- ✅ Mantém ordem estável quando valores são iguais
- ✅ Cards não "pulam" ao atualizar
- ✅ Ordenação previsível e consistente

---

### SOLUÇÃO 2: Desabilitar refetch automático após update

Evitar que React Query refaça a query automaticamente:

```tsx
const { updateCheckinStatus, updateCheckinAssignee } = useCheckinManagement({
  onSuccess: () => {
    // NÃO refazer query automaticamente
    // queryClient.invalidateQueries(['checkins']);
  }
});
```

**Benefícios:**
- ✅ Cards não mudam de posição
- ❌ Dados podem ficar desatualizados
- ❌ Precisa refresh manual

---

### SOLUÇÃO 3: Atualização otimista (Optimistic Update)

Atualizar o cache localmente sem refetch:

```tsx
const updateCheckinStatusOptimistic = async (checkinId: string, newStatus: CheckinStatus) => {
  // Atualizar cache local
  queryClient.setQueryData(['checkins'], (old: any) => {
    return old.map((checkin: any) => 
      checkin.id === checkinId 
        ? { ...checkin, status: newStatus }
        : checkin
    );
  });
  
  // Atualizar no banco em background
  await updateCheckinStatus(checkinId, newStatus);
};
```

**Benefícios:**
- ✅ UI atualiza instantaneamente
- ✅ Sem mudança de ordem
- ✅ Melhor UX

---

## 🎯 RECOMENDAÇÃO

Use a **SOLUÇÃO 1** (critério de desempate por ID) porque:
- ✅ Simples de implementar
- ✅ Mantém dados atualizados
- ✅ Ordem estável e previsível
- ✅ Sem efeitos colaterais

## 📊 OUTRAS CAUSAS DE LENTIDÃO NA PÁGINA

### 1. Re-renderizações Excessivas

**Problema:** Componentes grandes re-renderizam a cada mudança de estado.

**Solução:** Já aplicada - `useMemo` e `useCallback` para otimizar.

### 2. Queries Pesadas

**Problema:** Buscar todos os check-ins com pacientes pode ser lento.

**Solução Atual:**
```tsx
// Já implementado: displayLimit para limitar registros
const displayedCheckins = useMemo(() => {
  return sortedCheckins.slice(0, displayLimit);
}, [sortedCheckins, displayLimit]);
```

**Melhorias Possíveis:**
- ✅ Paginação no backend (LIMIT/OFFSET no SQL)
- ✅ Infinite scroll ao invés de "Carregar mais"
- ✅ Virtual scrolling para listas grandes

### 3. Cálculos Pesados em Loop

**Problema:** Calcular métricas para cada check-in pode ser lento.

**Solução:** Usar `useMemo` para cachear cálculos:

```tsx
const chartData = useMemo(() => {
  // Cálculos pesados aqui
  return recentCheckins.map(/* ... */);
}, [recentCheckins]);
```

### 4. Imagens Não Otimizadas

**Problema:** Carregar muitas imagens de perfil pode ser lento.

**Solução:**
- ✅ Lazy loading de imagens
- ✅ Usar thumbnails ao invés de imagens full size
- ✅ Implementar skeleton loading

### 5. Debounce na Busca

**Problema:** Busca em tempo real pode causar lag.

**Solução Atual:**
```tsx
const debouncedSearchTerm = useDebounce(searchTerm, 300);
```

✅ Já implementado!

## 🔧 IMPLEMENTAÇÃO DA SOLUÇÃO 1

Vou aplicar a correção do critério de desempate por ID.

## 📝 ARQUIVOS RELACIONADOS

- `src/components/checkins/CheckinsList.tsx` - Lista de check-ins
- `src/hooks/use-checkin-management.ts` - Gerenciamento de check-ins
- `src/hooks/use-checkin-data.ts` - Queries de dados

## 🎯 RESULTADO ESPERADO

Após a correção:
- ✅ Cards mantêm posição ao atualizar status/responsável
- ✅ Ordenação estável e previsível
- ✅ Melhor experiência do usuário
- ✅ Sem "pulos" inesperados na lista
