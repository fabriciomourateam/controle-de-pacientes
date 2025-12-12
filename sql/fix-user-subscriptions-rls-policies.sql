-- =====================================================
-- CORRIGIR POLÍTICAS RLS PARA USER_SUBSCRIPTIONS
-- =====================================================
-- Este script remove todas as políticas antigas e cria
-- políticas corretas que permitem:
-- 1. Usuários verem e criarem sua própria assinatura
-- 2. Admin ver e gerenciar todas as assinaturas
-- =====================================================

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- REMOVER TODAS AS POLÍTICAS ANTIGAS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can create their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Admin can manage all subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can only see their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can only insert their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can only update their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can view all subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can manage all subscriptions" ON user_subscriptions;

-- =====================================================
-- CRIAR FUNÇÃO AUXILIAR PARA VERIFICAR SE É ADMIN
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'fabriciomouratreinador@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CRIAR POLÍTICAS RLS CORRETAS
-- =====================================================

-- Política para SELECT - usuários veem sua própria assinatura OU admin vê todas
CREATE POLICY "Users can view their own subscription or admin views all" ON user_subscriptions
  FOR SELECT 
  USING (
    auth.uid() = user_id
    OR is_admin_user()
  );

-- Política para INSERT - usuários podem criar sua própria assinatura
-- Apenas se não tiverem outra assinatura ativa
CREATE POLICY "Users can create their own subscription" ON user_subscriptions
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM user_subscriptions 
      WHERE user_id = auth.uid()
    )
  );

-- Política para UPDATE - usuários podem atualizar sua própria assinatura OU admin pode atualizar qualquer uma
CREATE POLICY "Users can update their own subscription or admin updates all" ON user_subscriptions
  FOR UPDATE 
  USING (
    auth.uid() = user_id
    OR is_admin_user()
  )
  WITH CHECK (
    auth.uid() = user_id
    OR is_admin_user()
  );

-- Política para DELETE - apenas admin pode deletar
CREATE POLICY "Only admin can delete subscriptions" ON user_subscriptions
  FOR DELETE 
  USING (is_admin_user());

-- Política adicional para admin fazer INSERT em qualquer assinatura (para atribuir trials)
CREATE POLICY "Admin can create any subscription" ON user_subscriptions
  FOR INSERT 
  WITH CHECK (is_admin_user());

-- =====================================================
-- VERIFICAR POLÍTICAS CRIADAS
-- =====================================================

-- Listar todas as políticas da tabela
SELECT 
    policyname,
    cmd as operacao,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Ver dados'
        WHEN cmd = 'INSERT' THEN 'Inserir dados'
        WHEN cmd = 'UPDATE' THEN 'Atualizar dados'
        WHEN cmd = 'DELETE' THEN 'Deletar dados'
        ELSE cmd
    END as descricao
FROM pg_policies
WHERE tablename = 'user_subscriptions'
ORDER BY cmd, policyname;

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION is_admin_user() IS 'Verifica se o usuário autenticado é o admin';
COMMENT ON POLICY "Users can view their own subscription or admin views all" ON user_subscriptions IS 
  'Permite que usuários vejam sua própria assinatura e admin veja todas';
COMMENT ON POLICY "Users can create their own subscription" ON user_subscriptions IS 
  'Permite que usuários criem sua própria assinatura trial (apenas se não tiverem outra)';
COMMENT ON POLICY "Users can update their own subscription or admin updates all" ON user_subscriptions IS 
  'Permite que usuários atualizem sua própria assinatura e admin atualize qualquer uma';
COMMENT ON POLICY "Only admin can delete subscriptions" ON user_subscriptions IS 
  'Apenas admin pode deletar assinaturas';
COMMENT ON POLICY "Admin can create any subscription" ON user_subscriptions IS 
  'Permite que admin crie assinaturas para qualquer usuário (para atribuir trials)';


