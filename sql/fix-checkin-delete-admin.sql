-- ============================================
-- SOLUÇÃO: Permitir ADMIN deletar qualquer checkin
-- ============================================
-- Problema: Checkin foi criado por outra pessoa
-- Solução: Admin pode deletar qualquer checkin
-- ============================================

-- 1. Remover política antiga
DROP POLICY IF EXISTS "checkin_delete_policy" ON checkin;

-- 2. Criar nova política que permite:
-- a) Deletar seus próprios checkins
-- b) Admin pode deletar qualquer checkin
CREATE POLICY "checkin_delete_policy" ON checkin
  FOR DELETE
  USING (
    -- Você é o dono do checkin
    user_id = auth.uid()
    OR
    -- Você é admin (verifica na tabela profiles)
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 3. Verificar se a política foi criada
SELECT 
  policyname,
  cmd,
  qual as "Condição"
FROM pg_policies 
WHERE tablename = 'checkin' 
  AND cmd = 'DELETE';
