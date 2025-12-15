-- ============================================================================
-- CORRIGIR TABELAS DE ASSINATURA
-- ============================================================================
-- Criar ou corrigir tabelas subscription_plans e user_subscriptions
-- ============================================================================

-- 1. Criar tabela subscription_plans se não existir
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2),
  features JSONB DEFAULT '[]'::jsonb,
  max_patients INTEGER,
  max_checkins_per_month INTEGER,
  max_storage_gb INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar constraint UNIQUE se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscription_plans_name_key'
  ) THEN
    ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_name_key UNIQUE (name);
  END IF;
END $$;

-- 2. Criar tabela user_subscriptions se não existir
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription_plan_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'canceled', 'expired', 'trial', 'pending')),
  payment_provider TEXT,
  payment_provider_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar foreign keys e constraints se não existirem
DO $$
BEGIN
  -- Foreign key para auth.users
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_subscriptions_user_id_fkey'
  ) THEN
    ALTER TABLE user_subscriptions 
    ADD CONSTRAINT user_subscriptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Foreign key para subscription_plans
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_subscriptions_subscription_plan_id_fkey'
  ) THEN
    ALTER TABLE user_subscriptions 
    ADD CONSTRAINT user_subscriptions_subscription_plan_id_fkey 
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT;
  END IF;

  -- Constraint UNIQUE para user_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_subscriptions_user_id_key'
  ) THEN
    ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 3. Habilitar RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas antigas
DROP POLICY IF EXISTS "subscription_plans_public_read" ON subscription_plans;
DROP POLICY IF EXISTS "user_subscriptions_own_read" ON user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_own_write" ON user_subscriptions;

-- 5. Criar políticas RLS para subscription_plans (todos podem ler)
CREATE POLICY "subscription_plans_public_read"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (true);

-- 6. Criar políticas RLS para user_subscriptions (apenas próprias)
CREATE POLICY "user_subscriptions_own_read"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_subscriptions_own_write"
  ON user_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 7. Criar índices
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(active);

-- 8. Inserir planos padrão se não existirem
DO $$
BEGIN
  -- Inserir plano free
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'free') THEN
    INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, max_patients, max_checkins_per_month, max_storage_gb, active)
    VALUES (
      'free',
      'Gratuito',
      'Plano básico para começar',
      0.00,
      0.00,
      '["Até 10 pacientes", "Checkins ilimitados", "1GB de armazenamento", "Suporte por email"]'::jsonb,
      10,
      NULL,
      1,
      true
    );
  END IF;

  -- Inserir plano basic
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'basic') THEN
    INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, max_patients, max_checkins_per_month, max_storage_gb, active)
    VALUES (
      'basic',
      'Básico',
      'Para nutricionistas iniciantes',
      49.90,
      499.00,
      '["Até 50 pacientes", "Checkins ilimitados", "5GB de armazenamento", "Suporte prioritário", "Relatórios básicos"]'::jsonb,
      50,
      NULL,
      5,
      true
    );
  END IF;

  -- Inserir plano professional
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'professional') THEN
    INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, max_patients, max_checkins_per_month, max_storage_gb, active)
    VALUES (
      'professional',
      'Profissional',
      'Para nutricionistas estabelecidos',
      99.90,
      999.00,
      '["Até 200 pacientes", "Checkins ilimitados", "20GB de armazenamento", "Suporte prioritário", "Relatórios avançados", "Integração com apps", "Marca personalizada"]'::jsonb,
      200,
      NULL,
      20,
      true
    );
  END IF;

  -- Inserir plano unlimited
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'unlimited') THEN
    INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, max_patients, max_checkins_per_month, max_storage_gb, active)
    VALUES (
      'unlimited',
      'Ilimitado',
      'Para clínicas e grandes profissionais',
      199.90,
      1999.00,
      '["Pacientes ilimitados", "Checkins ilimitados", "100GB de armazenamento", "Suporte VIP 24/7", "Relatórios avançados", "Integração com apps", "Marca personalizada", "API completa", "Gestão de equipe"]'::jsonb,
      NULL,
      NULL,
      100,
      true
    );
  END IF;
END $$;

-- 9. Criar assinatura trial para usuários existentes sem assinatura
DO $$
DECLARE
  v_free_plan_id UUID;
  v_user_record RECORD;
BEGIN
  -- Buscar ID do plano gratuito
  SELECT id INTO v_free_plan_id
  FROM subscription_plans
  WHERE name = 'free'
  LIMIT 1;

  IF v_free_plan_id IS NULL THEN
    RAISE NOTICE 'Plano gratuito não encontrado. Pulando criação de assinaturas.';
    RETURN;
  END IF;

  -- Criar assinatura trial para cada usuário sem assinatura
  FOR v_user_record IN 
    SELECT u.id
    FROM auth.users u
    LEFT JOIN user_subscriptions us ON us.user_id = u.id
    WHERE us.id IS NULL
  LOOP
    INSERT INTO user_subscriptions (
      user_id,
      subscription_plan_id,
      status,
      trial_end,
      current_period_start,
      current_period_end
    )
    VALUES (
      v_user_record.id,
      v_free_plan_id,
      'trial',
      NOW() + INTERVAL '30 days',
      NOW(),
      NOW() + INTERVAL '30 days'
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Assinatura trial criada para usuário: %', v_user_record.id;
  END LOOP;
END $$;

-- 10. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER trigger_update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

DROP TRIGGER IF EXISTS trigger_update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER trigger_update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================================================
-- FIM
-- ============================================================================
