-- ============================================================================
-- CORRIGIR APENAS RLS DAS TABELAS DE ASSINATURA EXISTENTES
-- ============================================================================

-- 1. Remover políticas antigas
DROP POLICY IF EXISTS "subscription_plans_public_read" ON subscription_plans;
DROP POLICY IF EXISTS "user_subscriptions_own_read" ON user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_own_write" ON user_subscriptions;

-- 2. Criar políticas RLS para subscription_plans (todos podem ler)
CREATE POLICY "subscription_plans_public_read"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (true);

-- 3. Criar políticas RLS para user_subscriptions (apenas próprias)
CREATE POLICY "user_subscriptions_own_read"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_subscriptions_own_write"
  ON user_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Garantir que RLS está habilitado
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIM
-- ============================================================================
