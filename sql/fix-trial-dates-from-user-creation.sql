-- =====================================================
-- CORRIGIR DATAS DE TRIALS BASEADO NA DATA DE CADASTRO DO USUÁRIO
-- =====================================================
-- Este script atualiza as datas de trial para contar 30 dias
-- a partir da data de CADASTRO do usuário (user_profiles.created_at),
-- não da data de criação da assinatura
-- =====================================================

-- Atualizar trials para usar data de cadastro do usuário como base
UPDATE user_subscriptions us
SET 
  current_period_start = up.created_at,
  trial_end = up.created_at + INTERVAL '30 days',
  current_period_end = up.created_at + INTERVAL '30 days'
FROM user_profiles up
WHERE us.status = 'trial'
AND us.user_id = up.id
AND up.created_at IS NOT NULL;

-- Verificar resultado
SELECT 
  us.id,
  up.email,
  up.created_at::date as data_cadastro_usuario,
  us.created_at::date as data_criacao_assinatura,
  us.trial_end::date as vencimento_trial,
  (us.trial_end::date - up.created_at::date) as dias_desde_cadastro,
  CASE 
    WHEN (us.trial_end::date - up.created_at::date) = 30 THEN '✅ CORRETO (30 dias desde cadastro)'
    ELSE '❌ INCORRETO'
  END as validacao
FROM user_subscriptions us
JOIN user_profiles up ON us.user_id = up.id
WHERE us.status = 'trial'
ORDER BY up.created_at DESC;







