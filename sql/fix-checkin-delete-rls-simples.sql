-- ============================================
-- CORREÇÃO SIMPLES: Permitir DELETE em checkin
-- ============================================
-- Versão simplificada sem verificar coluna 'status'
-- ============================================

-- 1. Remover políticas de DELETE antigas (se existirem)
DROP POLICY IF EXISTS "Users can delete their own checkins" ON checkin;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON checkin;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON checkin;
DROP POLICY IF EXISTS "checkin_delete_policy" ON checkin;

-- 2. Criar nova política de DELETE SIMPLES
-- Permite deletar apenas se você é o dono (user_id = auth.uid())
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

-- 4. Testar se agora você pode ver seus checkins
SELECT 
  id,
  telefone,
  data_checkin,
  user_id
FROM checkin 
WHERE user_id = auth.uid()
LIMIT 5;
