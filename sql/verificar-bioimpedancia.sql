-- Verificar todos os dados de bioimpedância salvos
-- Execute este SQL no Supabase SQL Editor

-- 1. Ver todos os registros de bioimpedância
SELECT 
  id,
  telefone,
  data_avaliacao,
  peso,
  altura,
  percentual_gordura,
  massa_magra,
  massa_gorda,
  agua_corporal,
  created_at
FROM body_composition
ORDER BY created_at DESC
LIMIT 50;

-- 2. Contar quantos registros existem
SELECT COUNT(*) as total_registros
FROM body_composition;

-- 3. Ver registros por telefone (substitua '11999999999' pelo telefone do paciente)
SELECT 
  id,
  data_avaliacao,
  peso,
  altura,
  percentual_gordura,
  massa_magra,
  massa_gorda,
  agua_corporal,
  created_at
FROM body_composition
WHERE telefone = '11999999999'  -- SUBSTITUA pelo telefone do paciente
ORDER BY data_avaliacao DESC;
