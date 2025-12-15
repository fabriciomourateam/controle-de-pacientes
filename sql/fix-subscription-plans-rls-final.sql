-- ============================================================================
-- CORRIGIR RLS DE SUBSCRIPTION_PLANS (SOLUÇÃO CIRÚRGICA)
-- ============================================================================
-- Problema: subscription_plans não tem política RLS, causando erro 406 no JOIN
-- Solução: Adicionar política de leitura pública (não afeta outras tabelas)
-- ============================================================================

-- 1. Garantir que RLS está habilitado
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- 2. Remover política antiga se existir
DROP POLICY IF EXISTS "subscription_plans_public_read" ON subscription_plans;

-- 3. Criar política que permite TODOS os usuários autenticados lerem os planos
-- (Isso é seguro porque os planos são públicos - todos devem ver os mesmos planos)
CREATE POLICY "subscription_plans_public_read"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- EXPLICAÇÃO:
-- - Esta política permite que qualquer usuário autenticado leia os planos
-- - Não afeta user_subscriptions (que já tem sua própria política)
-- - Não afeta nenhuma outra tabela do sistema
-- - É seguro porque os planos são informações públicas (como preços em um site)
-- ============================================================================
