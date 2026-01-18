-- Verificar a constraint UNIQUE que está causando o erro 400
-- Execute este SQL no Supabase SQL Editor

-- 1. Ver a definição completa da constraint
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conname = 'unique_checkin_per_month_user';

-- 2. Verificar se há duplicatas que causariam erro
SELECT 
  telefone,
  data_checkin::date,
  user_id,
  COUNT(*) as total,
  array_agg(id) as ids,
  array_agg(tipo_checkin) as tipos
FROM checkin
GROUP BY telefone, data_checkin::date, user_id
HAVING COUNT(*) > 1
ORDER BY total DESC
LIMIT 20;

-- 3. Ver exemplos de check-ins do mesmo paciente em datas próximas
SELECT 
  id,
  telefone,
  data_checkin,
  tipo_checkin,
  user_id,
  created_at
FROM checkin
WHERE telefone IN (
  SELECT telefone 
  FROM checkin 
  GROUP BY telefone 
  HAVING COUNT(*) > 1
  LIMIT 1
)
ORDER BY data_checkin DESC
LIMIT 10;
