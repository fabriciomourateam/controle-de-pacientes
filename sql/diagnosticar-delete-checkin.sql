-- ============================================
-- DIAGNÓSTICO: Problema de DELETE em checkin
-- ============================================
-- Problema: DELETE retorna {data: [], error: null}
-- Causa: RLS está bloqueando a exclusão
-- ============================================

-- 1. Ver todas as políticas da tabela checkin
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'checkin'
ORDER BY cmd, policyname;

-- 2. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'checkin';

-- 3. Testar se o checkin existe e se você pode vê-lo
SELECT 
  id,
  telefone,
  data_checkin,
  user_id,
  created_at
FROM checkin 
WHERE id = 'bebce0f9-b791-4a91-9e07-3b46b8af7f1a';

-- 4. Ver seu user_id atual
SELECT auth.uid() as meu_user_id;

-- 5. Verificar se há política de DELETE
SELECT 
  policyname,
  qual as "Condição DELETE"
FROM pg_policies 
WHERE tablename = 'checkin' 
  AND cmd = 'DELETE';
