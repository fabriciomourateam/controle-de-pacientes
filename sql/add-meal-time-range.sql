-- Adiciona campos de intervalo de horário para refeições
-- Permite definir horário inicial e final (ex: 08:00 - 09:00)

DO $$
BEGIN
  -- Adicionar campo start_time se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diet_meals' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE diet_meals ADD COLUMN start_time TEXT;
    RAISE NOTICE 'Campo start_time adicionado em diet_meals';
  END IF;

  -- Adicionar campo end_time se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diet_meals' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE diet_meals ADD COLUMN end_time TEXT;
    RAISE NOTICE 'Campo end_time adicionado em diet_meals';
  END IF;

  -- Migrar dados existentes de suggested_time para start_time
  UPDATE diet_meals
  SET start_time = suggested_time::TEXT
  WHERE suggested_time IS NOT NULL AND start_time IS NULL;

  RAISE NOTICE 'Migração de dados concluída';
END $$;
