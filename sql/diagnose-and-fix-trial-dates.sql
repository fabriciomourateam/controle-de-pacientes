-- =====================================================
-- DIAGNOSTICAR E CORRIGIR DATAS DE TRIALS
-- =====================================================
-- Este script primeiro mostra o estado atual e depois corrige
-- =====================================================

-- 1. VERIFICAR ESTADO ATUAL (ANTES DA CORREÇÃO)
SELECT 
  id,
  user_id,
  status,
  created_at,
  current_period_start,
  current_period_end,
  trial_end,
  created_at + INTERVAL '30 days' as data_correta_trial,
  trial_end - created_at as dias_atuais,
  CASE 
    WHEN trial_end != created_at + INTERVAL '30 days' THEN 'INCORRETO'
    ELSE 'CORRETO'
  END as status_data
FROM user_subscriptions
WHERE status = 'trial'
ORDER BY created_at DESC;

-- 2. CORRIGIR DATAS (usando created_at como base)
UPDATE user_subscriptions
SET 
  current_period_start = created_at,
  current_period_end = created_at + INTERVAL '30 days',
  trial_end = created_at + INTERVAL '30 days'
WHERE status = 'trial';

-- 3. VERIFICAR RESULTADO (APÓS CORREÇÃO)
SELECT 
  id,
  user_id,
  status,
  created_at::date as data_criacao,
  current_period_end::date as vencimento_periodo,
  trial_end::date as vencimento_trial,
  (trial_end::date - created_at::date) as dias_calculados,
  CASE 
    WHEN (trial_end::date - created_at::date) = 30 THEN '✅ CORRETO (30 dias)'
    ELSE '❌ INCORRETO'
  END as validacao
FROM user_subscriptions
WHERE status = 'trial'
ORDER BY created_at DESC;







