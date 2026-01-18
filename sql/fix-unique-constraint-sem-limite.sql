-- SOLUÇÃO: Remover constraint UNIQUE completamente
-- Permite múltiplos check-ins de qualquer tipo na mesma data
-- Execute este SQL no Supabase SQL Editor

BEGIN;

-- 1. Remover constraint antiga
ALTER TABLE checkin 
DROP CONSTRAINT IF EXISTS unique_checkin_per_month_user;

-- 2. Remover constraint nova (se existir)
ALTER TABLE checkin 
DROP CONSTRAINT IF EXISTS unique_checkin_per_type_date_user;

-- 3. NÃO criar nenhuma constraint de unicidade
-- Agora permite quantos check-ins quiser na mesma data

COMMIT;

-- Verificar que não há mais constraints UNIQUE relacionadas a data
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE c.conrelid = 'checkin'::regclass
  AND conname LIKE '%unique%';
