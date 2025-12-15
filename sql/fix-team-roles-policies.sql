-- ============================================
-- CORRIGIR POLÍTICAS DE TEAM_ROLES
-- ============================================

-- OPÇÃO 1: Se team_roles NÃO tem owner_id (roles são globais)
-- Todos os usuários autenticados podem gerenciar roles

-- 1. Usuários autenticados podem inserir roles
CREATE POLICY "Authenticated users can insert roles"
  ON team_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. Usuários autenticados podem atualizar roles (exceto roles do sistema)
CREATE POLICY "Authenticated users can update roles"
  ON team_roles
  FOR UPDATE
  TO authenticated
  USING (is_system_role = false)
  WITH CHECK (is_system_role = false);

-- 3. Usuários autenticados podem deletar roles (exceto roles do sistema)
CREATE POLICY "Authenticated users can delete roles"
  ON team_roles
  FOR DELETE
  TO authenticated
  USING (is_system_role = false);

-- ============================================
-- VERIFICAR POLÍTICAS
-- ============================================

-- Ver todas as políticas de team_roles
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'team_roles'
ORDER BY cmd, policyname;
