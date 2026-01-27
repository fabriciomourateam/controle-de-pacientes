-- ============================================
-- SOLUÇÃO V2: Permitir ADMIN deletar qualquer checkin
-- ============================================
-- Versão alternativa que testa diferentes condições
-- ============================================

-- 1. Remover TODAS as políticas antigas de DELETE
DROP POLICY IF EXISTS "checkin_delete_policy" ON checkin;
DROP POLICY IF EXISTS "Users can delete their own checkins" ON checkin;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON checkin;
DROP POLICY IF EXISTS "delete_own_checkins" ON checkin;

-- 2. Criar nova política PERMISSIVA (não restritiva)
CREATE POLICY "checkin_delete_admin_policy" ON checkin
  FOR DELETE
  AS PERMISSIVE  -- Importante: PERMISSIVE permite se qualquer condição for verdadeira
  TO authenticated
  USING (
    -- Condição 1: Você é o dono do checkin
    user_id = auth.uid()
    OR
    -- Condição 2: Você é admin (verifica role = 'admin')
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'admin'
    OR
    -- Condição 3: Você é owner (verifica role = 'owner')
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'owner'
    OR
    -- Condição 4: Você é nutricionista (verifica role = 'nutricionista')
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'nutricionista'
  );

-- 3. Verificar se a política foi criada
SELECT 
  '✅ Política criada' as status,
  policyname,
  cmd,
  permissive,
  qual as "Condição"
FROM pg_policies 
WHERE tablename = 'checkin' 
  AND cmd = 'DELETE';

-- 4. Testar se você pode deletar agora
SELECT 
  '🧪 Teste de permissão' as status,
  CASE 
    WHEN (
      -- Você é o dono
      (SELECT user_id FROM checkin WHERE id = 'bebce0f9-b791-4a91-9e07-3b46b8af7f1a') = auth.uid()
    ) THEN '✅ Permitido: Você é o dono'
    WHEN (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('admin', 'owner', 'nutricionista') THEN '✅ Permitido: Você é ' || (SELECT role FROM profiles WHERE id = auth.uid())
    ELSE '❌ BLOQUEADO: Você não tem permissão'
  END as resultado;
