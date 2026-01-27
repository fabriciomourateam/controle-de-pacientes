-- Solução mais permissiva para erro 406 do checkin
-- Remove todas as policies SELECT existentes e cria uma nova mais permissiva

-- 1. Ver policies atuais
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'checkin';

-- 2. Remover TODAS as policies SELECT existentes
DROP POLICY IF EXISTS "checkin_all" ON checkin;
DROP POLICY IF EXISTS "owners_and_team_can_view_checkins" ON checkin;
DROP POLICY IF EXISTS "portal_checkin_select_by_phone" ON checkin;
DROP POLICY IF EXISTS "users_can_select_checkin_by_phone" ON checkin;

-- 3. Criar UMA policy SELECT simples e permissiva
CREATE POLICY "authenticated_users_can_select_checkins"
ON checkin
FOR SELECT
TO authenticated
USING (true); -- Permite que qualquer usuário autenticado veja checkins

-- 4. Verificar resultado
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'checkin' AND cmd = 'SELECT';
