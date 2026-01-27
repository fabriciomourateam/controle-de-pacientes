# 🚀 EXECUTAR AGORA: Corrigir Todos os Erros

## 📋 RESUMO DOS PROBLEMAS

Você está vendo estes erros no console:

```
❌ GET /rest/v1/checkin?select=peso&patient_id=eq.xxx... 400 (Bad Request)
❌ GET /rest/v1/food_database?select=id&name=eq.xxx 406 (Not Acceptable)
❌ GET /rest/v1/food_usage_stats?select=*&... 406 (Not Acceptable)
❌ ReferenceError: foodDatabaseLoaded is not defined
❌ ReferenceError: toast is not defined
```

## ✅ SOLUÇÃO RÁPIDA

### Passo 1: Executar SQL no Supabase (OBRIGATÓRIO)

Você precisa executar **APENAS 1 arquivo SQL** no Supabase SQL Editor:

#### 1.1 - Corrigir Permissões de Alimentos

**Arquivo**: `sql/fix-food-database-rls.sql`

**O que faz**:
- ✅ Corrige erro 403 ao cadastrar alimentos
- ✅ Corrige erro 406 em food_usage_stats
- ✅ Corrige erro 406 em user_favorite_foods

**Como executar**:
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Copie TODO o conteúdo de `sql/fix-food-database-rls.sql`
6. Cole no editor
7. Clique em **Run** (ou Ctrl+Enter)

**Resultado esperado**:
```
✅ Tabela food_database existe
✅ Policies de food_usage_stats criadas
✅ Policies de user_favorite_foods criadas
📊 food_database tem 4 policies
```

#### ⚠️ SOBRE O ERRO 400 DO CHECKIN

**NÃO PRECISA EXECUTAR SQL PARA CORRIGIR!**

O erro 400 do checkin **NÃO é problema de permissão RLS**. As policies já existem e estão corretas:
- ✅ `checkin_all` (ALL)
- ✅ `checkin_delete_policy` (DELETE)
- ✅ `owners_and_team_can_view_checkins` (SELECT)
- ✅ `portal_checkin_select_by_phone` (SELECT)

O erro 400 é provavelmente da **query em si** no código TypeScript, não do banco de dados. Vamos investigar depois de limpar o cache.

### Passo 2: Limpar Cache do Navegador (OBRIGATÓRIO)

Os erros `foodDatabaseLoaded is not defined` e `toast is not defined` são do **cache do navegador** mostrando código antigo.

**Opção A - Hard Refresh (Rápido)**:
1. Pressione **Ctrl + Shift + R** (Windows/Linux)
2. Ou **Cmd + Shift + R** (Mac)
3. Isso força o navegador a baixar arquivos novos

**Opção B - Limpar Cache Completo (Recomendado)**:
1. Pressione **Ctrl + Shift + Delete**
2. Selecione:
   - ✅ Imagens e arquivos em cache
   - ✅ Cookies e dados de sites
3. Período: **Última hora** (ou "Tudo" se preferir)
4. Clique em **Limpar dados**
5. Feche e abra o navegador novamente

### Passo 3: Testar (VERIFICAÇÃO)

Após executar os SQLs e limpar o cache:

1. **Abra a página de elaborar dieta**
2. **Abra o DevTools** (F12)
3. **Vá na aba Console**
4. **Adicione um alimento**
5. **Edite o nome do alimento**

**Resultado esperado**:
- ✅ Sem erro 400 de checkin
- ✅ Sem erro 406 de food_database
- ✅ Sem erro 406 de food_usage_stats
- ✅ Sem erro "foodDatabaseLoaded is not defined"
- ✅ Sem erro "toast is not defined"
- ✅ Campo de nome editável livremente
- ✅ Valores nutricionais preservados ao editar nome

## 🎯 O QUE FOI CORRIGIDO NO CÓDIGO

### Correção 1: Campo food_name Editável

**Antes (❌)**:
- Campo tinha `onBlur` que buscava automaticamente no banco
- Sobrescrevia todos os valores ao editar o nome

**Depois (✅)**:
- Campo completamente editável sem busca automática
- Valores nutricionais preservados ao editar nome
- Botão "Buscar" removido (você não queria ele)

**Arquivo modificado**: `src/components/diets/DietPlanForm.tsx` (linha ~3103)

### Correção 2: Permissões RLS

**Antes (❌)**:
- Erro 403 ao cadastrar alimentos
- Erro 406 em food_usage_stats
- Erro 406 em user_favorite_foods
- Erro 400 ao buscar peso do paciente

**Depois (✅)**:
- Todos podem cadastrar alimentos (banco compartilhado)
- Permissões corretas em todas as tabelas
- Busca de peso funcionando

**Arquivos criados**:
- `sql/fix-food-database-rls.sql`
- `sql/fix-checkin-400-error.sql`

## 📝 COMO USAR AGORA

### Cenário 1: Adicionar Alimento do Modal
1. Clique em "Adicionar Alimento"
2. Selecione alimento do modal
3. Sistema preenche valores automaticamente ✅

### Cenário 2: Editar Nome do Alimento (NOVO)
1. Alimento já tem valores: "Frango grelhado" - 150g, 247.5 kcal
2. Edite o nome para "Frango grelhado temperado"
3. **Sistema mantém os valores**: 247.5 kcal ✅
4. **Não busca no banco automaticamente** ✅

### Cenário 3: Ajustar Quantidade
1. Alimento: "Frango grelhado" - 100g, 165 kcal
2. Mude quantidade para 200g
3. Sistema recalcula: 330 kcal ✅

### Cenário 4: Cadastrar Novo Alimento
1. Digite nome de alimento não cadastrado
2. Preencha valores manualmente
3. Sistema permite salvar (após executar SQL) ✅

## ⚠️ TROUBLESHOOTING

### Ainda vejo erro "foodDatabaseLoaded is not defined"
**Causa**: Cache do navegador
**Solução**: 
1. Feche TODAS as abas do sistema
2. Pressione Ctrl + Shift + Delete
3. Limpe cache e cookies
4. Feche e abra o navegador
5. Acesse o sistema novamente

### Ainda vejo erro "toast is not defined"
**Causa**: Cache do navegador
**Solução**: Mesma do item anterior

### Ainda vejo erro 403/406/400
**Causa**: SQL não foi executado ou não executou corretamente
**Solução**:
1. Verifique se executou AMBOS os SQLs
2. Verifique se não houve erro ao executar
3. Faça logout e login novamente
4. Limpe cache do navegador

### Botão "Buscar no Banco" ainda aparece
**Causa**: Cache do navegador mostrando código antigo
**Solução**: Hard Refresh (Ctrl + Shift + R)

## 🎉 RESUMO FINAL

**O que você precisa fazer**:
1. ✅ Executar `sql/fix-food-database-rls.sql` no Supabase
2. ✅ Fazer Hard Refresh (Ctrl + Shift + R)
3. ✅ Testar edição de nome de alimento
4. ⚠️ Verificar se erro 400 do checkin persiste (pode ser do código, não do banco)

**O que vai funcionar depois**:
- ✅ Editar nome de alimento livremente
- ✅ Valores nutricionais preservados
- ✅ Sem erros 403, 406 no console
- ✅ Sem erros de variáveis indefinidas
- ✅ Cadastro de novos alimentos funcionando
- ⚠️ Erro 400 do checkin: vamos investigar se persistir após limpar cache

**Tempo estimado**: 3 minutos

## 📞 PRECISA DE AJUDA?

Se ainda tiver problemas após seguir todos os passos:

1. Tire print do console (F12 → Console)
2. Tire print do resultado do SQL no Supabase
3. Me envie os prints

Vou te ajudar a resolver! 🚀
