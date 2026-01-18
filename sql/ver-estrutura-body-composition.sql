-- Ver a estrutura real da tabela body_composition
-- Execute este SQL no Supabase SQL Editor

-- 1. Ver todas as colunas da tabela
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'body_composition'
ORDER BY ordinal_position;

-- 2. Ver todos os dados (sem especificar colunas)
SELECT *
FROM body_composition
ORDER BY created_at DESC
LIMIT 10;

-- 3. Contar total de registros
SELECT COUNT(*) as total_registros
FROM body_composition;

-- 4. Ver registros recentes com as colunas que o modal usa
SELECT 
  id,
  telefone,
  data_avaliacao,
  percentual_gordura,
  peso,
  massa_gorda,
  massa_magra,
  imc,
  tmb,
  classificacao,
  observacoes,
  created_at
FROM body_composition
ORDER BY created_at DESC
LIMIT 5;
