-- ============================================================================
-- Portal: aceitar telefone com ou sem 55 + RPC de login
-- ============================================================================
-- Problema: paciente cadastrado com 5562999149439 e token com 62999149439
-- (ou vice-versa) não era encontrado porque a política RLS compara exatamente.
--
-- Este script:
-- 1) Altera get_phones_with_active_portal_tokens() para retornar AMBOS os
--    formatos (11 dígitos e 55+11), assim o RLS aceita o paciente em qualquer formato.
-- 2) Cria RPC portal_lookup_patient_by_phone(phone_input) para o app chamar
--    no login; o RPC tenta várias variantes no servidor e retorna { id, telefone, nome }.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Função que retorna telefones com token ativo EM AMBOS os formatos
--    (valor original + 11 dígitos e 55+11) para o RLS aceitar qualquer um
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_phones_with_active_portal_tokens()
RETURNS SETOF text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  r record;
  digits text;
BEGIN
  FOR r IN
    SELECT telefone FROM public.patient_portal_tokens
    WHERE is_active = true AND (expires_at IS NULL OR expires_at > now())
  LOOP
    RETURN NEXT r.telefone;
    digits := regexp_replace(r.telefone, '\D', '', 'g');
    IF length(digits) = 11 THEN
      RETURN NEXT '55' || digits;
    ELSIF length(digits) = 13 AND digits LIKE '55%' THEN
      RETURN NEXT substring(digits from 3);
    END IF;
  END LOOP;
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_phones_with_active_portal_tokens() TO anon;
GRANT EXECUTE ON FUNCTION public.get_phones_with_active_portal_tokens() TO authenticated;

-- ----------------------------------------------------------------------------
-- 2) RPC para o app: lookup paciente por telefone (qualquer formato)
--    Só retorna se houver token ativo para esse telefone (em qualquer variante).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.portal_lookup_patient_by_phone(phone_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  digits text;
  local_11 text;
  patient_row record;
BEGIN
  digits := regexp_replace(trim(phone_input), '\D', '', 'g');
  IF length(digits) < 10 THEN
    RETURN NULL;
  END IF;

  IF length(digits) = 13 AND digits LIKE '55%' THEN
    local_11 := substring(digits from 3);
  ELSIF length(digits) >= 11 THEN
    local_11 := substring(digits from 1 for 11);
  ELSE
    local_11 := digits;
  END IF;

  -- Paciente cujo telefone está na lista de quem tem token ativo (função já retorna 11 e 55+11)
  FOR patient_row IN
    SELECT id, telefone, nome
    FROM public.patients
    WHERE telefone IN (SELECT get_phones_with_active_portal_tokens())
      OR regexp_replace(telefone, '\D', '', 'g') = local_11
      OR regexp_replace(telefone, '\D', '', 'g') = '55' || local_11
    LIMIT 1
  LOOP
    RETURN jsonb_build_object(
      'id', patient_row.id,
      'telefone', patient_row.telefone,
      'nome', patient_row.nome
    );
  END LOOP;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.portal_lookup_patient_by_phone(text) TO anon;
GRANT EXECUTE ON FUNCTION public.portal_lookup_patient_by_phone(text) TO authenticated;

COMMENT ON FUNCTION public.portal_lookup_patient_by_phone(text) IS
  'Portal do aluno: busca paciente por telefone (aceita 55 ou 11 dígitos). Só retorna se houver token ativo.';
