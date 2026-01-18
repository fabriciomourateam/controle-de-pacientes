-- SOLUÇÃO ALTERNATIVA: Bloquear apenas check-ins 'completo' duplicados
-- Permite múltiplos check-ins de 'evolucao' e 'inicial' na mesma data
-- Mas bloqueia múltiplos check-ins 'completo' na mesma data
-- Execute este SQL no Supabase SQL Editor

BEGIN;

-- 1. Remover constraints antigas
ALTER TABLE checkin 
DROP CONSTRAINT IF EXISTS unique_checkin_per_month_user;

ALTER TABLE checkin 
DROP CONSTRAINT IF EXISTS unique_checkin_per_type_date_user;

-- 2. Criar constraint parcial (apenas para tipo 'completo')
-- Isso permite múltiplos 'evolucao' e 'inicial', mas apenas 1 'completo' por data
CREATE UNIQUE INDEX unique_completo_per_date_user 
ON checkin (telefone, data_checkin, user_id)
WHERE tipo_checkin = 'completo';

COMMIT;

-- Verificar a nova constraint
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'checkin'
  AND indexname = 'unique_completo_per_date_user';
