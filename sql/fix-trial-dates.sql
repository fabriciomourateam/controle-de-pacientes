-- =====================================================
-- CORRIGIR DATAS DE TRIALS EXISTENTES
-- =====================================================
-- Este script atualiza as datas de trial_end e current_period_end
-- para 30 dias a partir da data de criação (created_at)
-- =====================================================

-- Atualizar datas de trial_end e current_period_end para 30 dias a partir de created_at
-- FORÇAR atualização de TODOS os trials (sem condições complexas)
UPDATE user_subscriptions
SET 
  current_period_start = created_at,
  trial_end = created_at + INTERVAL '30 days',
  current_period_end = created_at + INTERVAL '30 days'
WHERE status = 'trial';

-- Verificar resultados
SELECT 
  id,
  user_id,
  status,
  created_at,
  trial_end,
  current_period_end,
  trial_end - created_at as dias_trial,
  current_period_end - created_at as dias_periodo
FROM user_subscriptions
WHERE status = 'trial'
ORDER BY created_at DESC;

-- Comentário
COMMENT ON TABLE user_subscriptions IS 'Tabela de assinaturas. Trials devem ter trial_end e current_period_end = created_at + 30 dias';

