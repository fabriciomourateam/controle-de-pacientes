-- ============================================
-- CORREÇÃO: Permitir DELETE em checkin
-- ============================================
-- Problema: RLS está bloqueando DELETE de checkins
-- Solução: Adicionar política de DELETE para owner e membros da equipe
-- ============================================

-- 1. Remover política de DELETE antiga (se existir)
DROP POLICY IF EXISTS "Users can delete their own checkins" ON checkin;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON checkin;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON checkin;
DROP POLICY IF EXISTS "checkin_delete_policy" ON checkin;

-- 2. Criar nova política de DELETE
-- Permite deletar se você é o dono (user_id = auth.uid())
-- NOTA: Se precisar que membros da equipe também possam deletar,
-- adicione a verificação de team_members depois
CREATE POLICY "checkin_delete_policy" ON checkin
  FOR DELETE
  USING (
    user_id = auth.uid()
  );

-- 3. Verificar se a política foi criada
SELECT 
  policyname,
  cmd,
  qual as "Condição"
FROM pg_policies 
WHERE tablename = 'checkin' 
  AND cmd = 'DELETE';

-- 4. Testar DELETE (substitua o ID pelo ID real do checkin)
-- DELETE FROM checkin WHERE id = 'bebce0f9-b791-4a91-9e07-3b46b8af7f1a';
