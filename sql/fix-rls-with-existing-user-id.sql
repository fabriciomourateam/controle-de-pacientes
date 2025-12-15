-- ============================================
-- CORRIGIR POLÍTICAS RLS (COM USER_ID EXISTENTE)
-- ============================================
-- Este script assume que:
-- 1. patients JÁ TEM coluna user_id
-- 2. checkin está ligado a patients por telefone
-- 3. checkin NÃO TEM user_id (usa telefone para filtrar)

-- ============================================
-- PASSO 1: HABILITAR RLS
-- ============================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 2: REMOVER POLÍTICAS ANTIGAS
-- ============================================

-- Patients
DROP POLICY IF EXISTS "Users can only see their own patients" ON patients;
DROP POLICY IF EXISTS "Users can insert their own patients" ON patients;
DROP POLICY IF EXISTS "Users can update their own patients" ON patients;
DROP POLICY IF EXISTS "Users can delete their own patients" ON patients;
DROP POLICY IF EXISTS "Enable read access for all users" ON patients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON patients;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON patients;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON patients;
DROP POLICY IF EXISTS "owners_and_team_can_view_patients" ON patients;
DROP POLICY IF EXISTS "only_owners_can_insert_patients" ON patients;
DROP POLICY IF EXISTS "owners_and_team_can_update_patients" ON patients;
DROP POLICY IF EXISTS "only_owners_can_delete_patients" ON patients;

-- Checkin
DROP POLICY IF EXISTS "Users can only see their own checkins" ON checkin;
DROP POLICY IF EXISTS "Users can insert their own checkins" ON checkin;
DROP POLICY IF EXISTS "Users can update their own checkins" ON checkin;
DROP POLICY IF EXISTS "Users can delete their own checkins" ON checkin;
DROP POLICY IF EXISTS "Enable read access for all users" ON checkin;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON checkin;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON checkin;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON checkin;
DROP POLICY IF EXISTS "owners_and_team_can_view_checkins" ON checkin;
DROP POLICY IF EXISTS "owners_and_team_can_insert_checkins" ON checkin;
DROP POLICY IF EXISTS "owners_and_team_can_update_checkins" ON checkin;
DROP POLICY IF EXISTS "only_owners_can_delete_checkins" ON checkin;

-- ============================================
-- PASSO 3: CRIAR POLÍTICAS PARA PATIENTS
-- ============================================

-- SELECT: Owner ou membro da equipe do owner
CREATE POLICY "owners_and_team_can_view_patients"
ON patients FOR SELECT
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- INSERT: Apenas owner (atribui automaticamente o user_id)
CREATE POLICY "only_owners_can_insert_patients"
ON patients FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE: Owner ou membro com permissão
CREATE POLICY "owners_and_team_can_update_patients"
ON patients FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- DELETE: Apenas owner
CREATE POLICY "only_owners_can_delete_patients"
ON patients FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- PASSO 4: CRIAR POLÍTICAS PARA CHECKIN
-- ============================================
-- Checkin tem user_id E está ligado a patients por telefone
-- Usamos user_id para melhor performance

-- SELECT: Owner ou membro da equipe do owner
CREATE POLICY "owners_and_team_can_view_checkins"
ON checkin FOR SELECT
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- INSERT: Owner ou membro da equipe
CREATE POLICY "owners_and_team_can_insert_checkins"
ON checkin FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- UPDATE: Owner ou membro da equipe
CREATE POLICY "owners_and_team_can_update_checkins"
ON checkin FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- DELETE: Apenas owner pode deletar
CREATE POLICY "only_owners_can_delete_checkins"
ON checkin FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- PASSO 5: VERIFICAÇÃO
-- ============================================

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('patients', 'checkin')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('patients', 'checkin');

-- Testar acesso (deve retornar apenas seus dados)
SELECT COUNT(*) as meus_pacientes FROM patients;
SELECT COUNT(*) as meus_checkins FROM checkin;

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================

/*
PASSO A PASSO:

1. Execute este script no SQL Editor do Supabase

2. Teste o acesso:
   - Faça login como owner
   - Verifique se vê seus pacientes: SELECT * FROM patients;
   - Verifique se vê seus check-ins: SELECT * FROM checkin;

3. Adicione um membro da equipe:
   - Vá em Gestão de Equipe
   - Adicione um membro com perfil "Assistente"
   - Anote o email e senha

4. Teste acesso do membro:
   - Faça logout
   - Faça login com o email do membro
   - Verifique se ele vê os pacientes do owner
   - Verifique se ele vê os check-ins do owner

5. Confirme o isolamento:
   - Crie outra conta de nutricionista
   - Adicione pacientes
   - Faça login como o primeiro membro
   - Verifique que ele NÃO vê pacientes do segundo nutricionista

IMPORTANTE:
- Membros da equipe verão dados do owner que os adicionou
- Cada owner vê apenas seus próprios dados
- As políticas RLS filtram automaticamente os dados
*/
