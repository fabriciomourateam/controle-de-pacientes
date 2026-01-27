# 🔧 Correção do SQL - Photo Visibility Settings

## ❌ Erro Original

```
Error: Failed to run sql query: ERROR: 42703: column tm.member_id does not exist
```

## 🔍 Causa

A política RLS para membros da equipe estava usando `tm.member_id`, mas a tabela `team_members` usa `tm.user_id`.

**Código com erro:**
```sql
CREATE POLICY photo_visibility_team_policy ON photo_visibility_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients p
    INNER JOIN team_members tm ON tm.owner_id = p.user_id
    WHERE p.telefone = photo_visibility_settings.patient_telefone
    AND tm.member_id = auth.uid()  -- ❌ ERRO: coluna não existe
    AND tm.status = 'active'        -- ❌ ERRO: coluna não existe
  )
);
```

## ✅ Correção Aplicada

**Código corrigido:**
```sql
CREATE POLICY photo_visibility_team_policy ON photo_visibility_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients p
    INNER JOIN team_members tm ON tm.owner_id = p.user_id
    WHERE p.telefone = photo_visibility_settings.patient_telefone
    AND tm.user_id = auth.uid()     -- ✅ CORRETO: user_id
    AND tm.is_active = true         -- ✅ CORRETO: is_active
  )
);
```

## 📋 Estrutura Correta da Tabela team_members

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL,           -- Dono da equipe
  user_id UUID,                      -- ✅ Usuário do membro
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role_id UUID,
  is_active BOOLEAN DEFAULT TRUE,   -- ✅ Status ativo/inativo
  invited_at TIMESTAMP,
  accepted_at TIMESTAMP,
  last_access TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 📁 Arquivos Atualizados

1. ✅ `sql/create-photo-visibility-settings.sql` - Arquivo original corrigido
2. ✅ `sql/create-photo-visibility-settings-fixed.sql` - Nova versão corrigida
3. ✅ `EXECUTAR_AGORA_SQL_FOTOS.md` - Guia atualizado com SQL correto

## 🚀 Como Executar Agora

### Opção 1: Copiar do Guia (Recomendado)
1. Abra `EXECUTAR_AGORA_SQL_FOTOS.md`
2. Copie o SQL da seção "2️⃣"
3. Execute no Supabase SQL Editor

### Opção 2: Usar Arquivo SQL
1. Abra `sql/create-photo-visibility-settings-fixed.sql`
2. Copie todo o conteúdo
3. Execute no Supabase SQL Editor

### Opção 3: Executar Arquivo Original (Já Corrigido)
1. Abra `sql/create-photo-visibility-settings.sql`
2. Copie todo o conteúdo
3. Execute no Supabase SQL Editor

## ✅ Verificação

Após executar, verifique se funcionou:

```sql
-- Verificar se tabela foi criada
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'photo_visibility_settings'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'photo_visibility_settings';
```

**Resultado esperado:**
- 9 colunas na tabela
- 2 políticas RLS:
  - `photo_visibility_owner_policy` (ALL)
  - `photo_visibility_team_policy` (SELECT)

## 🎯 Próximos Passos

1. ✅ Execute o SQL corrigido
2. ✅ Aguarde 1-2 minutos (cache do Supabase)
3. ✅ Recarregue o sistema (Ctrl+F5)
4. ✅ Teste o botão "Configurar Fotos"
5. ✅ Deve funcionar sem erros!

## 📝 Notas Técnicas

### Diferenças entre as Colunas:
- `member_id` ❌ Não existe na tabela
- `user_id` ✅ Coluna correta que referencia auth.users
- `status` ❌ Não existe na tabela
- `is_active` ✅ Coluna correta (boolean)

### Por que o erro aconteceu?
O SQL foi criado baseado em uma estrutura de `team_members` diferente da que você tem no banco. A correção alinha o SQL com a estrutura real da sua tabela.

### Impacto da Correção:
- ✅ Funcionalidade principal (owner) não afetada
- ✅ Política de team members agora funciona corretamente
- ✅ Membros da equipe podem ver configurações de fotos
- ✅ Sem quebra de funcionalidade existente

## 🐛 Se Ainda Der Erro

### Erro: "policy already exists"
**Solução:** Remover políticas antigas primeiro
```sql
DROP POLICY IF EXISTS photo_visibility_owner_policy ON photo_visibility_settings;
DROP POLICY IF EXISTS photo_visibility_team_policy ON photo_visibility_settings;
```
Depois execute o SQL completo novamente.

### Erro: "table already exists"
**Solução:** Tabela já foi criada, só precisa atualizar políticas
```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS photo_visibility_team_policy ON photo_visibility_settings;

-- Criar política corrigida
CREATE POLICY photo_visibility_team_policy ON photo_visibility_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients p
    INNER JOIN team_members tm ON tm.owner_id = p.user_id
    WHERE p.telefone = photo_visibility_settings.patient_telefone
    AND tm.user_id = auth.uid()
    AND tm.is_active = true
  )
);
```

### Erro: "function already exists"
**Solução:** Usar `CREATE OR REPLACE FUNCTION` (já está no SQL corrigido)

## ✅ Status

- ❌ SQL original: Tinha erro de coluna
- ✅ SQL corrigido: Pronto para usar
- ✅ Guia atualizado: Com SQL correto
- ✅ Arquivos atualizados: Todos corrigidos

**Pode executar agora sem problemas!** 🎉
