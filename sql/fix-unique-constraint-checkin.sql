-- SOLUÇÃO: Modificar constraint UNIQUE para permitir múltiplos tipos de check-in na mesma data
-- Execute este SQL no Supabase SQL Editor

-- OPÇÃO 1: Remover a constraint antiga e criar nova incluindo tipo_checkin
-- Isso permite que o mesmo paciente tenha check-ins de tipos diferentes na mesma data

BEGIN;

-- 1. Remover constraint antiga
ALTER TABLE checkin 
DROP CONSTRAINT IF EXISTS unique_checkin_per_month_user;

-- 2. Criar nova constraint incluindo tipo_checkin
-- Agora permite: 1 check-in 'completo' + 1 'evolucao' + 1 'inicial' na mesma data
ALTER TABLE checkin
ADD CONSTRAINT unique_checkin_per_type_date_user 
UNIQUE (telefone, data_checkin, user_id, tipo_checkin);

COMMIT;

-- Verificar se a nova constraint foi criada
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conname = 'unique_checkin_per_type_date_user';
