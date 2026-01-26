-- Verificar total de pacientes no banco de dados
-- Execute este SQL no Supabase SQL Editor para ver quantos pacientes você realmente tem

-- 1. Total geral de pacientes
SELECT COUNT(*) as total_pacientes 
FROM patients;

-- 2. Total por plano
SELECT 
  plano,
  COUNT(*) as quantidade
FROM patients
GROUP BY plano
ORDER BY quantidade DESC;

-- 3. Total de pacientes ativos (excluindo inativos)
SELECT COUNT(*) as pacientes_ativos
FROM patients
WHERE plano NOT IN ('INATIVO', '⛔ Negativado', 'RESCISÃO', 'CONGELADO');

-- 4. Verificar se há limite sendo aplicado
-- (Se você ver exatamente 636 aqui, o problema está no banco)
SELECT 
  COUNT(*) as total,
  MIN(created_at) as primeiro_cadastro,
  MAX(created_at) as ultimo_cadastro
FROM patients;

-- 5. Verificar distribuição por data de criação
SELECT 
  DATE_TRUNC('month', created_at) as mes,
  COUNT(*) as novos_pacientes
FROM patients
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC
LIMIT 12;
