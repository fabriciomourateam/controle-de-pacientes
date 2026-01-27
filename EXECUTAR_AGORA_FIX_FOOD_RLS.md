# EXECUTAR AGORA: Correção de Permissões RLS - Food Database

## ⚠️ PROBLEMA IDENTIFICADO

Erro ao executar SQL anterior:
```
ERROR: 42703: column "user_id" does not exist
```

**Causa**: A tabela `food_database` não possui coluna `user_id`, mas o SQL estava tentando criar policies que verificavam essa coluna.

## ✅ SOLUÇÃO

### Passo 1: Diagnosticar Estrutura (OPCIONAL)

Se quiser ver a estrutura da tabela antes de corrigir:

```sql
-- Executar no Supabase SQL Editor:
-- Arquivo: sql/diagnosticar-food-database.sql
```

Isso mostrará:
- Colunas existentes na tabela
- Policies atuais
- Status do RLS

### Passo 2: Executar Correção (OBRIGATÓRIO)

```sql
-- Executar no Supabase SQL Editor:
-- Arquivo: sql/fix-food-database-rls.sql
```

**O que o SQL faz:**

1. **food_database**:
   - ✅ SELECT: Todos podem ler (banco compartilhado)
   - ✅ INSERT: Todos podem cadastrar novos alimentos
   - ✅ UPDATE: Todos podem atualizar (banco compartilhado)
   - ✅ DELETE: Todos podem deletar (banco compartilhado)

2. **food_usage_stats** (se existir):
   - ✅ SELECT/INSERT/UPDATE/DELETE: Apenas próprio user_id

3. **user_favorite_foods** (se existir):
   - ✅ SELECT/INSERT/UPDATE/DELETE: Apenas próprio user_id

## 📋 COMO EXECUTAR

### No Supabase Dashboard:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Cole o conteúdo de `sql/fix-food-database-rls.sql`
6. Clique em **Run** (ou pressione Ctrl+Enter)

### Resultado Esperado:

```
✅ Tabela food_database existe
✅ Policies de food_usage_stats criadas (se existir)
✅ Policies de user_favorite_foods criadas (se existir)
📊 food_database tem 4 policies
📊 food_usage_stats tem 4 policies (se existir)
📊 user_favorite_foods tem 4 policies (se existir)
```

## 🧪 TESTAR APÓS EXECUÇÃO

### Teste 1: Buscar Alimento no Banco
1. Abrir página de elaborar dieta
2. Adicionar alimento
3. Digitar nome de alimento existente
4. Clicar no botão "Buscar" (ícone de pacote)
5. ✅ Deve preencher valores sem erro 403

### Teste 2: Cadastrar Novo Alimento
1. Digitar nome de alimento não cadastrado
2. Clicar em "Buscar"
3. Sistema informa que não encontrou
4. Preencher valores manualmente
5. Salvar plano
6. ✅ Não deve ter erro 403 ao salvar

### Teste 3: Verificar Console
1. Abrir DevTools (F12)
2. Ir na aba Console
3. Adicionar/editar alimentos
4. ✅ Não deve ter erros 403 ou 406

## 🔍 ERROS CORRIGIDOS

### Antes (❌):
```
food_database INSERT: 403 Forbidden
food_usage_stats: 406 Not Acceptable
user_favorite_foods: 406 Not Acceptable
```

### Depois (✅):
```
✅ Todos os INSERTs funcionam
✅ Sem erros 406
✅ Busca e cadastro funcionando
```

## 📝 OBSERVAÇÕES IMPORTANTES

### Banco Compartilhado

A tabela `food_database` é tratada como **banco compartilhado**:
- Todos os usuários podem adicionar alimentos
- Todos podem editar/deletar (cuidado!)
- Não há isolamento por usuário

**Por quê?**
- Tabela não tem coluna `user_id`
- Alimentos são recursos compartilhados
- Facilita colaboração entre nutricionistas

### Se Precisar de Isolamento no Futuro

Para restringir edição/exclusão apenas ao criador:

1. Adicionar coluna `user_id`:
```sql
ALTER TABLE public.food_database 
ADD COLUMN user_id UUID REFERENCES auth.users(id);
```

2. Atualizar policies para verificar `user_id`
3. Preencher `user_id` em registros existentes

## ⚠️ TROUBLESHOOTING

### Erro: "policy already exists"
**Solução**: O SQL já remove policies antigas. Se persistir:
```sql
DROP POLICY IF EXISTS "food_database_select_policy" ON public.food_database;
DROP POLICY IF EXISTS "food_database_insert_policy" ON public.food_database;
DROP POLICY IF EXISTS "food_database_update_policy" ON public.food_database;
DROP POLICY IF EXISTS "food_database_delete_policy" ON public.food_database;
```

### Erro: "table does not exist"
**Solução**: Verificar nome correto da tabela:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%food%';
```

### Ainda tem erro 403/406
**Solução**: 
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Fazer logout e login novamente
3. Verificar se SQL foi executado com sucesso
4. Executar diagnóstico: `sql/diagnosticar-food-database.sql`

## ✅ PRÓXIMOS PASSOS

Após executar o SQL:

1. ✅ Testar busca de alimentos
2. ✅ Testar cadastro de novos alimentos
3. ✅ Testar edição de nome sem perder valores
4. ✅ Verificar que não há erros no console
5. ✅ Fazer commit das alterações no código

## 🎯 RESUMO

**Problema**: Coluna `user_id` não existe em `food_database`

**Solução**: Policies sem verificação de `user_id` (banco compartilhado)

**Resultado**: Todos podem cadastrar e usar alimentos livremente

**Status**: ✅ Pronto para executar
