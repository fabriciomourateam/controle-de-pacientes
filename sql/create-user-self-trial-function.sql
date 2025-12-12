-- =====================================================
-- FUNÇÃO PARA USUÁRIOS CRIAREM SEU PRÓPRIO TRIAL
-- =====================================================
-- Esta função permite que qualquer usuário autenticado
-- crie sua própria assinatura trial de 30 dias
-- =====================================================

-- Função para usuário criar seu próprio trial
CREATE OR REPLACE FUNCTION create_self_trial(
  p_plan_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_trial_end TIMESTAMP WITH TIME ZONE;
  v_user_created_at TIMESTAMP WITH TIME ZONE;
  v_result JSONB;
BEGIN
  -- Obter ID do usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não autenticado'
    );
  END IF;

  -- Verificar se o usuário já tem assinatura
  IF EXISTS (
    SELECT 1 FROM user_subscriptions 
    WHERE user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário já possui assinatura'
    );
  END IF;

  -- Buscar data de cadastro do usuário
  SELECT created_at INTO v_user_created_at
  FROM user_profiles
  WHERE id = v_user_id;
  
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
    v_user_id,
    p_plan_id,
    'trial',
    v_user_created_at,
    v_trial_end,
    v_trial_end
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Trial de 30 dias criado com sucesso',
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

-- Comentário para documentação
COMMENT ON FUNCTION create_self_trial(UUID) IS 'Permite que usuários autenticados criem sua própria assinatura trial de 30 dias';

