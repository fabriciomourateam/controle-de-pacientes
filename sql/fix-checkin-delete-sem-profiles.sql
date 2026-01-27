-- ============================================
-- SOLUÇÃO FINAL: Permitir deletar checkins SEM profiles
-- ============================================
-- Problema: Usuário não tem registro em profiles
-- Solução: Permitir deletar qualquer checkin se você está autenticado
-- ============================================

-- 1. Remover política antiga
DROP POLICY IF EXISTS "checkin_delete_policy" ON checkin;

-- 2. Criar nova política SIMPLES
-- Permite deletar se você é o dono OU se você está autenticado
CREATE POLICY "checkin_delete_policy" ON checkin
  FOR DELETE
  USING (
    -- Você é o dono do checkin
    user_id = auth.uid()
    OR
    -- Você está autenticado (qualquer usuário logado pode deletar)
    auth.uid() IS NOT NULL
  );

-- 3. Verificar se a política foi criada
SELECT 
  '✅ Política criada' as status,
  policyname,
  cmd,
  qual as "Condição"
FROM pg_policies 
WHERE tablename = 'checkin' 
  AND cmd = 'DELETE';
