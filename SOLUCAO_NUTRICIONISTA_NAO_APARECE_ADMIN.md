# 🔧 Solução: Nutricionista não aparece na página de Admin

## 📋 Problema Identificado

O nutricionista foi cadastrado no sistema de autenticação (`auth.users`), mas não tem um registro correspondente na tabela `user_profiles`. A página de admin busca usuários apenas da tabela `user_profiles`, por isso o nutricionista não aparece.

## ✅ Solução

Execute os seguintes scripts SQL no Supabase para corrigir o problema:

### 1. **Corrigir usuários existentes** (Execute PRIMEIRO)

Execute o arquivo `sql/fix-missing-user-profiles.sql` no SQL Editor do Supabase:

- Este script cria perfis para todos os usuários que já existem em `auth.users` mas não têm perfil
- Também cria a trigger para futuros cadastros

**Como executar:**
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Clique em **New query**
4. Copie e cole o conteúdo de `sql/fix-missing-user-profiles.sql`
5. Clique em **Run**

### 2. **Adicionar política RLS para admin** (Execute DEPOIS)

Execute o arquivo `sql/add-admin-policy-user-profiles.sql`:

- Este script cria uma função auxiliar `is_admin_user()` que verifica se o usuário é admin
- Adiciona uma política RLS que permite ao admin ver todos os perfis
- Necessário para a página de admin funcionar corretamente

**Como executar:**
1. No SQL Editor do Supabase
2. Copie e cole o conteúdo de `sql/add-admin-policy-user-profiles.sql`
3. Clique em **Run**

**⚠️ IMPORTANTE**: Se você já executou este script antes, execute novamente para atualizar a política com a versão corrigida que usa `SECURITY DEFINER`.

### 3. **Verificar se funcionou**

Após executar os scripts:

1. Acesse a página de admin no sistema
2. O nutricionista deve aparecer na lista de usuários
3. Novos cadastros criarão perfis automaticamente

## 🔄 Para Futuros Cadastros

A trigger criada automaticamente cria um perfil em `user_profiles` quando um novo usuário se cadastra. Não é necessário fazer nada manualmente.

## 📝 Arquivos Criados

1. **`sql/fix-missing-user-profiles.sql`** - Corrige usuários existentes e cria trigger
2. **`sql/add-admin-policy-user-profiles.sql`** - Adiciona política RLS para admin
3. **`sql/create-auto-user-profile-trigger.sql`** - Apenas a trigger (já incluída no fix)

## ⚠️ Importante

- Execute os scripts na ordem indicada
- O email do admin está configurado como: `fabriciomouratreinador@gmail.com`
- Se precisar alterar o email do admin, edite o arquivo `sql/add-admin-policy-user-profiles.sql` antes de executar

