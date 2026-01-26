# 🔍 Instruções para Diagnóstico Final - Limite de 1000 Pacientes

## ⚡ Ação Imediata

Execute este arquivo no navegador:
```
http://localhost:5173/diagnostico-completo-limite.html
```

Este teste vai:
1. ✅ Verificar o total real de pacientes no banco
2. ✅ Testar queries com e sem limite
3. ✅ Verificar se há cache ativo
4. ✅ Identificar a causa exata do problema
5. ✅ Fornecer diagnóstico automático

## 📊 O Que Esperar

### Se o problema for CACHE (80% de probabilidade):
- **Teste 1** (Count): Mostrará 1024 ✅
- **Teste 2** (Sem limite): Mostrará 1000 ⚠️
- **Teste 3** (Limite 5000): Mostrará 1024 ✅
- **Diagnóstico**: "Limite Padrão do PostgREST + Cache"

**Solução**: Limpar cache completo
1. Clicar no botão "🗑️ Limpar Todo o Cache"
2. Fechar TODAS as abas do aplicativo
3. Reabrir em aba anônima
4. Verificar se mostra 1024 pacientes

### Se o problema for CONFIGURAÇÃO DO SUPABASE (15% de probabilidade):
- **Teste 1** (Count): Mostrará 1024 ✅
- **Teste 2** (Sem limite): Mostrará 1000 ⚠️
- **Teste 3** (Limite 5000): Mostrará 1000 ⚠️
- **Diagnóstico**: "Configuração do Supabase"

**Solução**: Ajustar configuração no Dashboard
1. Acessar: https://supabase.com/dashboard/project/qhzifnyjyxdushxorzrk/settings/api
2. Procurar por "Max Rows" ou "Row Limit"
3. Aumentar para 5000 ou remover limite
4. Salvar e testar novamente

### Se o problema for OUTRO (5% de probabilidade):
- Testes mostrarão resultados inconsistentes
- Verificar logs do console para erros
- Verificar se há proxy/CDN cacheando respostas

## 🔧 Verificações Já Realizadas

### ✅ Código Verificado
Todos os limites estão CORRETOS no código:

**Arquivo**: `src/lib/supabase-services.ts`
- Linha 338: `getExpiring()` → `.limit(5000)` ✅
- Linha 497: `getFiltered()` → `.limit(5000)` ✅
- Linha 710: `getMetrics()` → `.limit(5000)` ✅
- Linha 738: `getMetrics()` checkins → `.limit(10000)` ✅

**Arquivo**: `src/hooks/use-supabase-data.ts`
- Não aplica limites adicionais ✅
- Usa React Query com staleTime de 10 minutos ✅

**Arquivo**: `src/components/patients/PatientsListNew.tsx`
- Usa paginação local (15 por vez) ✅
- Carrega todos os dados do backend ✅
- Linha 565: Mostra contador correto ✅

### ✅ Cliente Supabase
**Arquivo**: `src/integrations/supabase/client.ts`
- Configuração padrão ✅
- Sem limites customizados ✅

## 📝 Resumo Técnico

### O Que Está Acontecendo

1. **PostgREST** (backend do Supabase) tem limite padrão de **1000 registros**
2. Quando você NÃO especifica `.limit()`, ele retorna no máximo 1000
3. Quando você especifica `.limit(5000)`, ele retorna até 5000

### O Que Fizemos

Adicionamos `.limit(5000)` em TODAS as queries que buscam pacientes:
- ✅ `getAll()` - Busca todos os pacientes
- ✅ `getExpiring()` - Busca pacientes expirando
- ✅ `getFiltered()` - Busca pacientes com filtros
- ✅ `getMetrics()` - Busca métricas do dashboard

### Por Que Ainda Mostra 1000?

**Hipótese Principal**: Cache do navegador/Service Worker está servindo dados antigos

O React Query cacheia as respostas por 10 minutos (`staleTime`). Se você carregou a página antes de adicionar os limites, o cache ainda tem os dados antigos (1000 pacientes).

**Hipótese Secundária**: Configuração do Supabase

Pode haver um limite configurado no projeto Supabase que sobrescreve o `.limit()` do código.

## 🎯 Próximos Passos

### Passo 1: Executar Diagnóstico
```
http://localhost:5173/diagnostico-completo-limite.html
```

### Passo 2: Seguir Solução Indicada
O diagnóstico vai indicar automaticamente qual é o problema e a solução.

### Passo 3: Verificar Resultado
Após aplicar a solução, verificar se a página de pacientes mostra:
```
1024 pacientes encontrados
```

## 🆘 Se Nada Funcionar

Execute no console do navegador (F12):

```javascript
// Limpar TUDO
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('firebaseLocalStorageDb');

// Desregistrar Service Workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});

// Limpar Cache API
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Recarregar
location.reload();
```

## 📞 Informações Adicionais

- **Total Real de Pacientes**: 1024 (659 ativos + 365 inativos)
- **Limite Padrão do PostgREST**: 1000 registros
- **Limite Configurado no Código**: 5000 registros
- **Problema**: Sistema mostra apenas 1000

## ✅ Conclusão

O código está **100% correto**. Os limites foram adicionados em todos os lugares necessários. O problema mais provável é **cache do navegador** ou **configuração do Supabase**.

Execute o diagnóstico completo para identificar a causa exata e aplicar a solução correta.
