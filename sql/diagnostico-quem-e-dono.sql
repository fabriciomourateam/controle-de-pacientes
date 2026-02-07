-- ============================================================================
-- DIAGNÓSTICO: Quem é o dono dos dados? (user_id por tabela)
-- ============================================================================
-- Execute no SQL Editor do Supabase.
-- Mostra, para cada tabela, quantos registros têm cada user_id e o email.
-- NULL = registro ainda sem dono (precisa popular no passo 0.2).
-- ============================================================================

-- Patients
SELECT 'patients' AS tabela, p.user_id, u.email, COUNT(*) AS total
FROM public.patients p
LEFT JOIN auth.users u ON u.id = p.user_id
GROUP BY p.user_id, u.email
ORDER BY total DESC;

-- Checkin
SELECT 'checkin' AS tabela, c.user_id, u.email, COUNT(*) AS total
FROM public.checkin c
LEFT JOIN auth.users u ON u.id = c.user_id
GROUP BY c.user_id, u.email
ORDER BY total DESC;

-- Diet plans (usa user_id ou created_by)
SELECT 'diet_plans' AS tabela, COALESCE(dp.user_id, dp.created_by) AS user_id, u.email, COUNT(*) AS total
FROM public.diet_plans dp
LEFT JOIN auth.users u ON u.id = COALESCE(dp.user_id, dp.created_by)
GROUP BY COALESCE(dp.user_id, dp.created_by), u.email
ORDER BY total DESC;

-- Body composition (se existir)
SELECT 'body_composition' AS tabela, bc.user_id, u.email, COUNT(*) AS total
FROM public.body_composition bc
LEFT JOIN auth.users u ON u.id = bc.user_id
GROUP BY bc.user_id, u.email
ORDER BY total DESC;

-- Weight tracking (se existir)
SELECT 'weight_tracking' AS tabela, wt.user_id, u.email, COUNT(*) AS total
FROM public.weight_tracking wt
LEFT JOIN auth.users u ON u.id = wt.user_id
GROUP BY wt.user_id, u.email
ORDER BY total DESC;

-- Contact history (se existir)
SELECT 'contact_history' AS tabela, ch.user_id, u.email, COUNT(*) AS total
FROM public.contact_history ch
LEFT JOIN auth.users u ON u.id = ch.user_id
GROUP BY ch.user_id, u.email
ORDER BY total DESC;

-- Dashboard dados (se existir)
SELECT 'dashboard_dados' AS tabela, dd.user_id, u.email, COUNT(*) AS total
FROM public.dashboard_dados dd
LEFT JOIN auth.users u ON u.id = dd.user_id
GROUP BY dd.user_id, u.email
ORDER BY total DESC;

-- Alertas dashboard (se existir)
SELECT 'alertas_dashboard' AS tabela, ad.user_id, u.email, COUNT(*) AS total
FROM public.alertas_dashboard ad
LEFT JOIN auth.users u ON u.id = ad.user_id
GROUP BY ad.user_id, u.email
ORDER BY total DESC;

-- Retention exclusions (se existir)
SELECT 'retention_exclusions' AS tabela, re.user_id, u.email, COUNT(*) AS total
FROM public.retention_exclusions re
LEFT JOIN auth.users u ON u.id = re.user_id
GROUP BY re.user_id, u.email
ORDER BY total DESC;

-- Plans (planos de assinatura; user_id NULL = plano público)
SELECT 'plans' AS tabela, pl.user_id, u.email, COUNT(*) AS total
FROM public.plans pl
LEFT JOIN auth.users u ON u.id = pl.user_id
GROUP BY pl.user_id, u.email
ORDER BY total DESC;
