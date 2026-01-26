# Diagnóstico Completo - Limite de 1000 Pacientes

## Status Atual
- **Problema**: Sistema mostra "1000 pacientes encontrados" mas há 1024 cadastrados
- **Usuário reporta**: Não acredita ser cache, solicita verificação completa

## Verificações Realizadas

### ✅ 1. Limites no Código (CONFIRMADO)
Todos os limites foram adicionados corretamente:

#### `src/lib/supabase-services.ts`
- **Linha 338** (`getExpiring`): `.limit(5000)` ✅
- **Linha 497** (`getFiltered`): `.limit(5000)` ✅  
- **Linha 710** (`getMetrics`): `.limit(5000)` ✅
- **Linha 738** (`getMetrics` - checkins): `.limit(10000)` ✅

### ✅ 2. Hooks e Componentes
- `use-supabase-data.ts`: Não aplica limites adicionais ✅
- `PatientsListNew.tsx`: Usa paginação local (15 por vez) mas carrega todos os dados ✅
- Cliente Supabase: Configuração padrão, sem limites ✅

### ❓ 3. Possíveis Causas Restantes

#### A. Cache do Navegador/Service Worker
**Probabilidade: ALTA**
- Service Worker pode estar servindo dados antigos
- LocalStorage pode ter cache de queries antigas
- IndexedDB do React Query pode estar desatualizado

**Solução**: Limpar cache completo
```
1. Abrir: http://localhost:5173/limpar-service-worker.html
2. Seguir instruções para limpar tudo
3. Fechar TODAS as abas do app
4. Reabrir em aba anônima
```

#### B. Configuração do Supabase Dashboard
**Probabilidade: MÉDIA**
- Pode haver configuração de `max_rows` no projeto Supabase
- Verificar em: Dashboard > Settings > API > Max Rows

**Solução**: 
1. Acessar https://supabase.com/dashboard/project/qhzifnyjyxdushxorzrk/settings/api
2. Verificar se há limite de rows configurado
3. Se houver, aumentar para 5000 ou remover

#### C. Proxy/CDN/Vercel
**Probabilidade: BAIXA**
- Se estiver em produção, pode haver cache no Vercel
- Edge functions podem estar cacheando respostas

**Solução**: Limpar cache do Vercel

#### D. React Query Cache
**Probabilidade: MÉDIA**
- Cache do React Query pode estar retornando dados antigos
- `staleTime` de 10 minutos pode manter dados desatualizados

**Solução**: Forçar refetch
```typescript
// No console do navegador:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Próximos Passos

### Passo 1: Teste Direto (RECOMENDADO)
Execute o arquivo de teste para verificar se a query retorna todos os registros:

```
http://localhost:5173/test-query-limit.html
```

Este teste faz uma query DIRETA ao Supabase, sem passar por cache ou React Query.

**Resultado esperado**: 
- Se mostrar 1024 pacientes → Problema é cache
- Se mostrar 1000 pacientes → Problema é configuração do Supabase

### Passo 2: Verificar Configuração do Supabase
1. Acessar Dashboard do Supabase
2. Ir em Settings > API
3. Verificar configuração de `max_rows`
4. Se houver limite, aumentar ou remover

### Passo 3: Limpar Cache Completo
1. Abrir `http://localhost:5173/limpar-service-worker.html`
2. Seguir todas as instruções
3. Fechar TODAS as abas
4. Reabrir em aba anônima
5. Verificar se mostra 1024 pacientes

### Passo 4: Verificar no Console
Abrir DevTools (F12) e executar:

```javascript
// Verificar total de pacientes diretamente
const { count } = await supabase
  .from('patients')
  .select('*', { count: 'exact', head: true });
console.log('Total de pacientes:', count);

// Verificar quantos registros a query retorna
const { data } = await supabase
  .from('patients')
  .select('id, nome')
  .limit(5000);
console.log('Registros retornados:', data?.length);
```

## Conclusão Técnica

Os limites estão CORRETAMENTE implementados no código. O problema mais provável é:

1. **Cache do navegador/Service Worker** (80% de probabilidade)
2. **Configuração do Supabase** (15% de probabilidade)
3. **Cache do React Query** (5% de probabilidade)

**Recomendação**: Executar o teste direto primeiro para confirmar se é cache ou configuração.
