-- Corrigir permissões RLS da tabela checkin para permitir SELECT por telefone
-- Problema: Erro 406 ao buscar peso do checkin ao elaborar dieta

-- 1. Verificar policies existentes
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'checkin' AND cmd = 'SELECT';

-- 2. Criar policy para permitir que usuários autenticados busquem checkins
-- (necessário para buscar peso mais recente ao elaborar dieta)
DROP POLICY IF EXISTS "users_can_select_checkin_by_phone" ON checkin;

CREATE POLICY "users_can_select_checkin_by_phone"
ON checkin
FOR SELECT
TO authenticated
USING (
  -- Usuário autenticado pode ver checkins se:
  -- 1. É o dono do checkin (user_id corresponde)
  auth.uid() = user_id
  OR
  -- 2. É membro da equipe do dono do checkin
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.owner_id = checkin.user_id
    AND tm.user_id = auth.uid()
    AND tm.is_active = true
  )
  OR
  -- 3. Tem role de admin ou nutricionista
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'nutricionista')
  )
);

-- 3. Verificar se a policy foi criada
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'checkin' AND policyname = 'users_can_select_checkin_by_phone';
