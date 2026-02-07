-- Adiciona coluna exclude_from_macros em diet_meals
-- Quando true, a refeição não entra nos totais de calorias/macros do plano

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'diet_meals' AND column_name = 'exclude_from_macros'
  ) THEN
    ALTER TABLE public.diet_meals ADD COLUMN exclude_from_macros BOOLEAN DEFAULT false;
    RAISE NOTICE 'Coluna exclude_from_macros adicionada em diet_meals';
  ELSE
    RAISE NOTICE 'Coluna exclude_from_macros já existe em diet_meals';
  END IF;
END $$;
