-- =====================================================
-- FUNÇÃO PARA ADMIN ATRIBUIR TRIALS
-- =====================================================
-- Esta função permite que o admin atribua trials para usuários
-- usando SECURITY DEFINER para contornar políticas RLS
-- =====================================================

-- Função auxiliar para verificar se o usuário é admin
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

-- Função para admin atribuir trial para um usuário específico
CREATE OR REPLACE FUNCTION admin_assign_trial(
  p_user_id UUID,
  p_plan_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_trial_end TIMESTAMP WITH TIME ZONE;
  v_user_created_at TIMESTAMP WITH TIME ZONE;
  v_result JSONB;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT is_admin_user() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas o admin pode atribuir trials'
    );
  END IF;

  -- Verificar se o usuário já tem assinatura
  IF EXISTS (
    SELECT 1 FROM user_subscriptions 
    WHERE user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário já possui assinatura'
    );
  END IF;

  -- Buscar data de cadastro do usuário
  SELECT created_at INTO v_user_created_at
  FROM user_profiles
  WHERE id = p_user_id;
  
  -- Se não encontrar, usar data atual
  IF v_user_created_at IS NULL THEN
    v_user_created_at := NOW();
  END IF;
  
  -- Calcular data de término do trial (30 dias a partir do cadastro do usuário)
  v_trial_end := v_user_created_at + INTERVAL '30 days';

  -- Criar assinatura trial
  INSERT INTO user_subscriptions (
    user_id,
    subscription_plan_id,
    status,
    current_period_start,
    current_period_end,
    trial_end
  ) VALUES (
    p_user_id,
    p_plan_id,
    'trial',
    v_user_created_at,
    v_trial_end,
    v_trial_end
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Trial atribuído com sucesso',
    'trial_end', v_trial_end
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON FUNCTION is_admin_user() IS 'Verifica se o usuário autenticado é o admin';
COMMENT ON FUNCTION admin_assign_trial(UUID, UUID) IS 'Permite que o admin atribua trial de 30 dias para um usuário específico';

