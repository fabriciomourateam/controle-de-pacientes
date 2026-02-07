-- ============================================================================
-- PASSO 0.2 – Popular user_id nos dados existentes (dono: fabriciomouratreinador)
-- ============================================================================
-- Execute ANTES do script rls-isolamento-por-nutri.sql (Passo 0.3).
-- UUID usado: a9798432-60bd-4ac8-a035-d139a47ad59b (fabriciomouratreinador@gmail.com)
-- ============================================================================

-- 1) Garantir que a coluna user_id existe (se não existir, será criada)
-- patients
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'user_id') THEN
    ALTER TABLE public.patients ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
    RAISE NOTICE 'Coluna user_id adicionada em patients';
  END IF;
END $$;

-- checkin
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'checkin' AND column_name = 'user_id') THEN
    ALTER TABLE public.checkin ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_checkin_user_id ON public.checkin(user_id);
    RAISE NOTICE 'Coluna user_id adicionada em checkin';
  END IF;
END $$;

-- patient_feedback_records (se a tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patient_feedback_records') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'patient_feedback_records' AND column_name = 'user_id') THEN
      ALTER TABLE public.patient_feedback_records ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_patient_feedback_records_user_id ON public.patient_feedback_records(user_id);
      RAISE NOTICE 'Coluna user_id adicionada em patient_feedback_records';
    END IF;
  END IF;
END $$;

-- 2) Atribuir SEU user_id a todos os registros que ainda estão NULL
-- (assim, depois do RLS, você continua vendo todos os seus dados)

UPDATE public.patients
SET user_id = 'a9798432-60bd-4ac8-a035-d139a47ad59b'
WHERE user_id IS NULL;

UPDATE public.checkin
SET user_id = 'a9798432-60bd-4ac8-a035-d139a47ad59b'
WHERE user_id IS NULL;

UPDATE public.patient_feedback_records
SET user_id = 'a9798432-60bd-4ac8-a035-d139a47ad59b'
WHERE user_id IS NULL;

-- 3) (Opcional) Outras tabelas que tenham user_id e que sejam só suas:
--    Se body_composition, weight_tracking, contact_history, dashboard_dados,
--    alertas_dashboard, laboratory_exams, retention_exclusions já tiverem
--    a coluna user_id e você quiser que todos os registros existentes sejam seus,
--    descomente e execute os blocos abaixo.

/*
UPDATE public.body_composition
SET user_id = 'a9798432-60bd-4ac8-a035-d139a47ad59b'
WHERE user_id IS NULL;

UPDATE public.weight_tracking
SET user_id = 'a9798432-60bd-4ac8-a035-d139a47ad59b'
WHERE user_id IS NULL;

UPDATE public.contact_history
SET user_id = 'a9798432-60bd-4ac8-a035-d139a47ad59b'
WHERE user_id IS NULL;

UPDATE public.dashboard_dados
SET user_id = 'a9798432-60bd-4ac8-a035-d139a47ad59b'
WHERE user_id IS NULL;

UPDATE public.alertas_dashboard
SET user_id = 'a9798432-60bd-4ac8-a035-d139a47ad59b'
WHERE user_id IS NULL;

UPDATE public.laboratory_exams
SET user_id = 'a9798432-60bd-4ac8-a035-d139a47ad59b'
WHERE user_id IS NULL;

UPDATE public.retention_exclusions
SET user_id = 'a9798432-60bd-4ac8-a035-d139a47ad59b'
WHERE user_id IS NULL;
*/

-- Próximo passo: rodar sql/rls-isolamento-por-nutri.sql (Passo 0.3)
