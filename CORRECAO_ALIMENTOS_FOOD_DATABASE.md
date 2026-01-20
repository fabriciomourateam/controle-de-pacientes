# Correção: Alimentos não aparecem na página de elaborar dieta

## ✅ PROBLEMA RESOLVIDO

**Causa raiz identificada**: A função `loadFoodDatabase()` nunca era chamada! O código tinha lazy loading implementado, mas não havia nenhum `useEffect` que chamasse a função quando o modal de seleção de alimentos era aberto.

## Solução Implementada

### 1. Adicionado useEffect para carregar alimentos

Em `DietPlanForm.tsx`, foi adicionado um `useEffect` que monitora quando o modal de seleção de alimentos é aberto e carrega os alimentos automaticamente:

```typescript
// Carregar alimentos quando o modal de seleção for aberto
useEffect(() => {
  if (foodSelectionModalOpen && !foodDatabaseLoaded && !foodDatabaseLoading) {
    console.log('🔄 [DietPlanForm] Modal de seleção aberto, carregando alimentos...');
    loadFoodDatabase();
  }
}, [foodSelectionModalOpen, foodDatabaseLoaded, foodDatabaseLoading, loadFoodDatabase]);
```

### 2. Adicionados logs de debug

Para facilitar o diagnóstico de problemas futuros, foram adicionados logs detalhados:

**Em `diet-service.ts`:**
```typescript
async getFoodDatabase() {
  console.log('🔍 [diet-service] getFoodDatabase() chamado');
  const { data, error } = await supabase
    .from('food_database')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ [diet-service] Erro ao buscar alimentos:', error);
    throw error;
  }
  
  console.log('✅ [diet-service] Alimentos retornados:', {
    count: data?.length || 0,
    firstFoods: data?.slice(0, 3).map(f => f.name) || []
  });
  
  return data;
}
```

**Em `DietPlanForm.tsx`:**
- Logs na função `loadFoodDatabase()`
- Logs na função `loadFoodDatabaseFromServer()`
- Logs mostram: cache verificado, chamada ao servidor, resposta recebida, salvamento no state

## Diagnóstico Anterior (RLS)

O diagnóstico inicial focou em RLS, que estava correto:

### ✅ Tabela existe e tem dados
- 5 alimentos visíveis: Frango grelhado, Arroz integral, Batata doce, Ovo, Aveia

### ✅ RLS está habilitado e funcionando
- Políticas RLS corretas:
  - SELECT: Todos os usuários autenticados podem ver alimentos ativos
  - INSERT/UPDATE/DELETE: Apenas service_role

### ✅ SQL funciona no Supabase
- Query retorna alimentos corretamente no SQL Editor

## Problema Real

O problema NÃO era RLS, mas sim que a função JavaScript nunca era executada:

1. ❌ `loadFoodDatabase()` nunca era chamada
2. ❌ Não havia `useEffect` monitorando abertura do modal
3. ❌ `foodDatabase` state permanecia vazio
4. ❌ Modal de seleção não tinha alimentos para mostrar

## Verificação

Após a correção, ao abrir o modal de seleção de alimentos, você verá no console:

```
🔄 [DietPlanForm] Modal de seleção aberto, carregando alimentos...
🔍 [DietPlanForm] loadFoodDatabase() chamado, force: false
💾 [DietPlanForm] Cache verificado: { hasCached: false, cachedCount: 0 }
📡 [DietPlanForm] Carregando alimentos do servidor
🔍 [DietPlanForm] loadFoodDatabaseFromServer() chamado
📡 [DietPlanForm] Chamando dietService.getFoodDatabase()...
🔍 [diet-service] getFoodDatabase() chamado
✅ [diet-service] Alimentos retornados: { count: 5, firstFoods: ['Arroz integral', 'Aveia', 'Batata doce'] }
📦 [DietPlanForm] Resposta recebida: { foodsCount: 5, firstFoods: ['Arroz integral', 'Aveia', 'Batata doce'] }
✅ [DietPlanForm] Salvando alimentos no state
✅ [DietPlanForm] Alimentos salvos com sucesso
🏁 [DietPlanForm] loadFoodDatabaseFromServer() finalizado
```

## Arquivos Modificados

1. ✅ `src/lib/diet-service.ts` - Adicionados logs de debug
2. ✅ `src/components/diets/DietPlanForm.tsx` - Adicionado useEffect e logs
3. ✅ `CORRECAO_ALIMENTOS_FOOD_DATABASE.md` - Documentação atualizada

---

## Documentação Original (RLS - Mantida para referência)

## Problema

Usuários não conseguem ver os alimentos do banco de dados (Tabela TACO) na página de elaborar dieta.

## Causa Provável

As políticas RLS (Row Level Security) da tabela `food_database` estão muito restritivas ou incorretas, impedindo que usuários autenticados leiam os dados.

## Diagnóstico

### Passo 1: Verificar estrutura e políticas

Execute o script de diagnóstico:

```sql
-- Arquivo: sql/diagnosticar-food-database-rls.sql
```

Este script irá mostrar:
- ✅ Estrutura da tabela
- ✅ Se RLS está habilitado
- ✅ Políticas RLS atuais
- ✅ Quantidade de alimentos
- ✅ Alimentos ativos
- ✅ Distribuição por categoria

### Passo 2: Identificar o problema

Verifique se:
1. **RLS está habilitado**: `rowsecurity = true`
2. **Existem políticas SELECT**: Deve haver pelo menos uma política para SELECT
3. **Políticas são permissivas**: Devem permitir acesso a usuários autenticados
4. **Há alimentos ativos**: `is_active = true`

## Solução (RLS)

### Executar script de correção

Execute o script:

```sql
-- Arquivo: sql/fix-food-database-rls.sql
```

Este script irá:
1. ✅ Remover todas as políticas antigas
2. ✅ Habilitar RLS
3. ✅ Criar políticas corretas:
   - **SELECT**: Todos os usuários autenticados podem ver alimentos ativos
   - **INSERT/UPDATE/DELETE**: Apenas service_role (para importação TACO)

### Políticas Criadas

#### 1. SELECT (Leitura)
```sql
CREATE POLICY "Todos podem ver alimentos ativos"
ON food_database
FOR SELECT
TO authenticated
USING (is_active = true);
```

**Explicação**: Qualquer usuário autenticado pode ler alimentos que estão ativos.

#### 2. INSERT (Inserção)
```sql
CREATE POLICY "Service role pode inserir alimentos"
ON food_database
FOR INSERT
TO service_role
WITH CHECK (true);
```

**Explicação**: Apenas o service_role (usado pelo script de importação TACO) pode inserir novos alimentos.

#### 3. UPDATE (Atualização)
```sql
CREATE POLICY "Service role pode atualizar alimentos"
ON food_database
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
```

**Explicação**: Apenas o service_role pode atualizar alimentos.

#### 4. DELETE (Exclusão)
```sql
CREATE POLICY "Service role pode deletar alimentos"
ON food_database
FOR DELETE
TO service_role
USING (true);
```

**Explicação**: Apenas o service_role pode deletar alimentos.

## Verificação

Após executar o script de correção:

### 1. No Supabase SQL Editor

```sql
-- Deve retornar os alimentos
SELECT COUNT(*) FROM food_database WHERE is_active = true;

-- Deve mostrar as 4 políticas criadas
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'food_database';
```

### 2. Na aplicação

1. Acesse a página de elaborar dieta
2. Tente adicionar um alimento
3. O campo de busca deve mostrar os alimentos do banco TACO

## Arquitetura da Tabela food_database

### Características

- **Banco compartilhado**: Todos os usuários veem os mesmos alimentos (Tabela TACO)
- **Sem user_id**: Não há isolamento por usuário
- **Somente leitura**: Usuários apenas leem, não modificam
- **Importação centralizada**: Dados importados via script com service_role

### Diferença de outras tabelas

| Tabela | Isolamento | Modificação |
|--------|-----------|-------------|
| `patients` | Por user_id | Usuário pode modificar seus dados |
| `diet_plans` | Por user_id | Usuário pode modificar suas dietas |
| `food_database` | **Compartilhado** | **Somente leitura** |

## Importação de Dados TACO

Se a tabela estiver vazia, execute o script de importação:

```bash
# No terminal do projeto
npm run import-taco
```

Ou execute manualmente:

```bash
npx tsx scripts/import-taco-data.ts
```

## Troubleshooting

### Problema: Ainda não vejo alimentos

**Verificar 1**: Tabela tem dados?
```sql
SELECT COUNT(*) FROM food_database;
```

Se retornar 0, execute a importação TACO.

**Verificar 2**: Alimentos estão ativos?
```sql
SELECT COUNT(*) FROM food_database WHERE is_active = true;
```

Se retornar 0, ative os alimentos:
```sql
UPDATE food_database SET is_active = true;
```

**Verificar 3**: Políticas estão corretas?
```sql
SELECT * FROM pg_policies WHERE tablename = 'food_database';
```

Deve mostrar 4 políticas (SELECT, INSERT, UPDATE, DELETE).

### Problema: Erro de permissão ao importar TACO

Certifique-se de que está usando o `SUPABASE_SERVICE_KEY` no arquivo `.env`:

```env
SUPABASE_SERVICE_KEY=sua_service_role_key_aqui
```

A service key tem permissões de admin e ignora RLS.

## Resumo

✅ **Problema Real**: Função `loadFoodDatabase()` nunca era chamada  
✅ **Solução**: Adicionado `useEffect` que carrega alimentos quando modal abre  
✅ **Resultado**: Alimentos aparecem corretamente no modal de seleção  
✅ **Bonus**: Logs de debug para facilitar troubleshooting futuro  

## Arquivos Criados/Modificados

1. `sql/diagnosticar-food-database-rls.sql` - Diagnóstico RLS
2. `sql/fix-food-database-rls.sql` - Correção das políticas RLS
3. `src/lib/diet-service.ts` - Adicionados logs de debug
4. `src/components/diets/DietPlanForm.tsx` - Adicionado useEffect e logs
5. `CORRECAO_ALIMENTOS_FOOD_DATABASE.md` - Esta documentação
