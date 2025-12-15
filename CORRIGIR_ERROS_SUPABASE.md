# 🔧 Corrigir Erros do Supabase - Gestão de Equipe

## ❌ Erros Encontrados:

1. **406 (Not Acceptable)** - `team_members` e `team_roles`
2. **404 (Not Found)** - `profiles`

---

## ✅ Solução Passo a Passo:

### 1. Verificar se as Tabelas Existem

Acesse o Supabase Dashboard → SQL Editor e execute:

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('team_roles', 'team_members', 'team_audit_log', 'profiles');
```

**Se não aparecer `team_roles` e `team_members`:**
- Execute o arquivo `sql/team-management-system.sql` no SQL Editor

**Se não aparecer `profiles`:**
- A tabela profiles deve ser criada. Execute:

```sql
-- Criar tabela profiles se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Política: Criar perfil automaticamente
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

### 2. Verificar Políticas RLS

Execute no SQL Editor:

```sql
-- Ver políticas das tabelas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('team_roles', 'team_members', 'profiles')
ORDER BY tablename, policyname;
```

---

### 3. Corrigir Políticas RLS (se necessário)

Se as políticas não existirem ou estiverem erradas, execute:

```sql
-- ============================================
-- TEAM_ROLES - Políticas
-- ============================================

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Owners can manage roles" ON team_roles;
DROP POLICY IF EXISTS "Members can view roles" ON team_roles;

-- Criar políticas corretas
CREATE POLICY "Owners can manage roles"
  ON team_roles
  FOR ALL
  USING (
    owner_id = auth.uid()
  );

CREATE POLICY "Members can view roles"
  ON team_roles
  FOR SELECT
  USING (
    owner_id IN (
      SELECT owner_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- ============================================
-- TEAM_MEMBERS - Políticas
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Owners can manage members" ON team_members;
DROP POLICY IF EXISTS "Members can view own data" ON team_members;

-- Criar políticas corretas
CREATE POLICY "Owners can manage members"
  ON team_members
  FOR ALL
  USING (
    owner_id = auth.uid()
  );

CREATE POLICY "Members can view own data"
  ON team_members
  FOR SELECT
  USING (
    user_id = auth.uid() OR owner_id = auth.uid()
  );
```

---

### 4. Criar Perfil para Usuário Atual

Execute no SQL Editor (substitua o UUID pelo seu):

```sql
-- Inserir perfil para o usuário atual
INSERT INTO public.profiles (id, full_name, role, department)
VALUES (
  'a9798432-60bd-4ac8-a035-d139a47ad59b', -- Seu user_id
  'Fabricio Moura',
  'admin',
  'Nutrição'
)
ON CONFLICT (id) DO UPDATE
SET 
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();
```

---

### 5. Verificar se Funcionou

Execute no SQL Editor:

```sql
-- Testar acesso às tabelas
SELECT COUNT(*) as total_roles FROM team_roles;
SELECT COUNT(*) as total_members FROM team_members;
SELECT COUNT(*) as total_profiles FROM profiles;

-- Ver seus dados
SELECT * FROM profiles WHERE id = auth.uid();
SELECT * FROM team_roles WHERE owner_id = auth.uid();
SELECT * FROM team_members WHERE owner_id = auth.uid();
```

---

## 🔍 Diagnóstico Rápido

### Erro 406 (Not Acceptable)
**Causa:** Políticas RLS bloqueando acesso
**Solução:** Executar passo 3 (Corrigir Políticas RLS)

### Erro 404 (Not Found)
**Causa:** Tabela não existe ou está vazia
**Solução:** Executar passo 1 (Criar tabelas) e passo 4 (Criar perfil)

---

## 📝 Checklist

- [ ] Tabelas `team_roles`, `team_members` e `profiles` existem
- [ ] RLS está habilitado nas 3 tabelas
- [ ] Políticas RLS estão criadas corretamente
- [ ] Perfil do usuário atual existe na tabela `profiles`
- [ ] Consegue fazer SELECT nas tabelas sem erro

---

## 🆘 Se Ainda Não Funcionar

1. **Desabilitar RLS temporariamente** (apenas para teste):
```sql
ALTER TABLE team_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
```

2. **Testar se funciona** - Se funcionar, o problema é nas políticas RLS

3. **Reabilitar RLS**:
```sql
ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
```

4. **Recriar políticas** usando o passo 3

---

## ✅ Após Corrigir

1. Recarregue a página: `Ctrl + Shift + R`
2. Acesse `/team`
3. Tente adicionar um membro
4. Tente editar um perfil

**Os erros 406 e 404 devem desaparecer!** 🎉
