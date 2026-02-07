-- ============================================================================
-- CORREÇÃO: desbloquear busca de paciente por telefone no login do portal
-- ============================================================================
-- O login do app dos alunos faz: SELECT ... FROM patients WHERE telefone = ?
-- Se alguma RLS está bloqueando, o anon não vê o paciente mesmo com token ativo.
--
-- Este script APENAS garante:
-- 1) A função get_phones_with_active_portal_tokens existe e anon pode executá-la.
-- 2) A política portal_patients_select_by_phone existe em patients para anon.
--
-- Não remove nem altera políticas de authenticated (nutri). Execute no SQL Editor.
-- ============================================================================

-- 1) Função (anon precisa poder executar para a policy funcionar)
CREATE OR REPLACE FUNCTION public.get_phones_with_active_portal_tokens()
RETURNS SETOF text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT telefone FROM public.patient_portal_tokens
  WHERE is_active = true AND (expires_at IS NULL OR expires_at > now());
$$;

GRANT EXECUTE ON FUNCTION public.get_phones_with_active_portal_tokens() TO anon;
GRANT EXECUTE ON FUNCTION public.get_phones_with_active_portal_tokens() TO authenticated;

-- 2) Política em patients: anon pode SELECT apenas linhas cujo telefone tem token ativo
DROP POLICY IF EXISTS "portal_patients_select_by_phone" ON public.patients;
CREATE POLICY "portal_patients_select_by_phone" ON public.patients
FOR SELECT TO anon
USING (telefone IN (SELECT get_phones_with_active_portal_tokens()));

-- Garantir que RLS está ligado em patients (não desliga se já estiver)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
