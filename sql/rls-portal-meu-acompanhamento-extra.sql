-- ============================================================================
-- RLS PORTAL – Políticas extras para a página "Meu Acompanhamento"
-- ============================================================================
-- Execute no SQL Editor do Supabase DEPOIS dos scripts de portal já aplicados
-- (rls-portal-fix-406-funcao-telefones.sql).
--
-- Este script APENAS ADICIONA políticas de SELECT para anon nas tabelas que
-- a página do portal usa e que ainda não tinham política de portal:
--   laboratory_exams, weight_tracking, featured_photo_comparison
--
-- NÃO remove nem altera nenhuma política existente. Usa a mesma regra segura:
-- anon só vê linhas cujo telefone está em get_phones_with_active_portal_tokens().
-- ============================================================================

-- laboratory_exams (exames no portal – componente ExamsHistory)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'laboratory_exams') THEN
    DROP POLICY IF EXISTS "portal_laboratory_exams_select_by_phone" ON public.laboratory_exams;
    CREATE POLICY "portal_laboratory_exams_select_by_phone" ON public.laboratory_exams
    FOR SELECT TO anon
    USING (telefone IN (SELECT get_phones_with_active_portal_tokens()));
  END IF;
END $$;

-- weight_tracking (pesos diários – gráficos de evolução no portal)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'weight_tracking') THEN
    DROP POLICY IF EXISTS "portal_weight_tracking_select_by_phone" ON public.weight_tracking;
    CREATE POLICY "portal_weight_tracking_select_by_phone" ON public.weight_tracking
    FOR SELECT TO anon
    USING (telefone IN (SELECT get_phones_with_active_portal_tokens()));
  END IF;
END $$;

-- featured_photo_comparison (comparação destacada no portal)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'featured_photo_comparison') THEN
    DROP POLICY IF EXISTS "portal_featured_photo_comparison_select_by_phone" ON public.featured_photo_comparison;
    CREATE POLICY "portal_featured_photo_comparison_select_by_phone" ON public.featured_photo_comparison
    FOR SELECT TO anon
    USING (telefone IN (SELECT get_phones_with_active_portal_tokens()));
  END IF;
END $$;

-- Fim: políticas extras para Meu Acompanhamento (sem alterar as já existentes).
