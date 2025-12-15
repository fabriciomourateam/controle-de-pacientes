-- ============================================
-- ADICIONAR OWNER_ID E CORRIGIR POLÍTICAS RLS
-- ============================================
-- Este script:
-- 1. Adiciona coluna owner_id nas tabelas principais
-- 2. Popula owner_id com o usuário atual (para dados existentes)
-- 3. Cria políticas RLS para isolamento e acesso de equipe

-- ============================================
-- PASSO 1: ADICIONAR COLUNA OWNER_ID
-- ============================================

-- Tabela: patients
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);

-- Tabela: checkin
ALTER TABLE checkin 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_checkin_user_id ON checkin(user_id);

-- ============================================
-- PASSO 2: POPULAR OWNER_ID COM DADOS EXISTENTES
-- ============================================

-- IMPORTANTE: Você precisa definir qual é o ID do usuário owner
-- Opção 1: Se você é o único usuário, use seu ID
-- Opção 2: Se há múltiplos usuários, execute manualmente para cada um

-- Para descobrir seu user_id, execute:
-- SELECT id, email FROM auth.users;

-- Depois, substitua 'SEU_USER_ID_AQUI' pelo ID real e execute:

-- UPDATE patients SET user_id = 'SEU_USER_ID_AQUI' WHERE user_id IS NULL;
-- UPDATE checkin SET user_id = 'SEU_USER_ID_AQUI' WHERE user_id IS NULL;

-- OU, se você quer atribuir ao usuário logado atualmente:
-- UPDATE patients SET user_id = auth.uid() WHERE user_id IS NULL;
-- UPDATE checkin SET user_id = auth.uid() WHERE user_id IS NULL;

-- ============================================
-- PASSO 3: HABILITAR RLS
-- ============================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 4: REMOVER POLÍTICAS ANTIGAS
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

-- Checkin
DROP POLICY IF EXISTS "Users can only see their own checkins" ON checkin;
DROP POLICY IF EXISTS "Users can insert their own checkins" ON checkin;
DROP POLICY IF EXISTS "Users can update their own checkins" ON checkin;
DROP POLICY IF EXISTS "Users can delete their own checkins" ON checkin;
DROP POLICY IF EXISTS "Enable read access for all users" ON checkin;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON checkin;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON checkin;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON checkin;

-- ============================================
-- PASSO 5: CRIAR NOVAS POLÍTICAS RLS
-- ============================================

-- ============================================
-- TABELA: patients
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
    WHERE user_id = auth.uid() 
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
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- DELETE: Apenas owner
CREATE POLICY "only_owners_can_delete_patients"
ON patients FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- TABELA: checkin
-- ============================================

-- SELECT: Owner ou membro da equipe do owner
CREATE POLICY "owners_and_team_can_view_checkins"
ON checkin FOR SELECT
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE user_id = auth.uid() 
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
    WHERE user_id = auth.uid() 
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
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- DELETE: Apenas owner
CREATE POLICY "only_owners_can_delete_checkins"
ON checkin FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- PASSO 6: CRIAR FUNÇÃO PARA AUTO-ATRIBUIR USER_ID
-- ============================================

-- Função para atribuir automaticamente user_id ao inserir paciente
CREATE OR REPLACE FUNCTION set_user_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para patients
DROP TRIGGER IF EXISTS set_user_id_on_patients_insert ON patients;
CREATE TRIGGER set_user_id_on_patients_insert
  BEFORE INSERT ON patients
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_on_insert();

-- Trigger para checkin
DROP TRIGGER IF EXISTS set_user_id_on_checkin_insert ON checkin;
CREATE TRIGGER set_user_id_on_checkin_insert
  BEFORE INSERT ON checkin
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_on_insert();

-- ============================================
-- PASSO 7: VERIFICAÇÃO
-- ============================================

-- Verificar estrutura das tabelas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('patients', 'checkin')
AND column_name = 'user_id';

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

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================

/*
PASSO A PASSO:

1. Execute este script no SQL Editor do Supabase

2. Descubra seu user_id:
   SELECT id, email FROM auth.users;

3. Popule os dados existentes com seu user_id:
   UPDATE patients SET user_id = 'SEU_USER_ID_AQUI' WHERE user_id IS NULL;
   UPDATE checkin SET user_id = 'SEU_USER_ID_AQUI' WHERE user_id IS NULL;

4. Teste o acesso:
   - Faça login como owner
   - Verifique se vê seus pacientes
   - Adicione um membro da equipe
   - Faça login como o membro
   - Verifique se ele vê os pacientes do owner

5. Confirme o isolamento:
   - Crie outra conta de nutricionista
   - Adicione pacientes
   - Verifique que cada um vê apenas seus dados

IMPORTANTE:
- Novos pacientes e check-ins terão user_id atribuído automaticamente
- Membros da equipe verão dados do owner que os adicionou
- Cada owner vê apenas seus próprios dados
*/
