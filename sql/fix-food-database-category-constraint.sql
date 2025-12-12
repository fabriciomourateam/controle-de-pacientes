-- Remover constraint de categoria se existir
DO $$ 
BEGIN
  -- Verificar e remover constraint se existir
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'food_database_category_check'
  ) THEN
    ALTER TABLE food_database DROP CONSTRAINT food_database_category_check;
    RAISE NOTICE 'Constraint food_database_category_check removida';
  ELSE
    RAISE NOTICE 'Constraint food_database_category_check não encontrada';
  END IF;
END $$;

-- Verificar se há outras constraints na coluna category
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'food_database'::regclass
  AND conname LIKE '%category%';










