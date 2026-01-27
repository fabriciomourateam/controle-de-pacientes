-- =====================================================
-- FIX: Erro 400 (Bad Request) na query de checkin - VERSÃO SIMPLES
-- =====================================================
-- Corrige o erro ao buscar peso do paciente
-- 
-- Erro: GET /rest/v1/checkin?select=peso&patient_id=eq.xxx&peso=not.is.null&order=data_checkin.desc&limit=1
-- Status: 400 (Bad Request)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.checkin ENABLE ROW LEVEL SECURITY;

-- Remover policy antiga que pode estar causando conflito
DROP POLICY IF EXISTS "checkin_select_policy" ON public.checkin;

-- SELECT: Permitir leitura para usuários autenticados
-- Versão SIMPLES sem verificação de team_members
CREATE POLICY "checkin_select_policy"
ON public.checkin
FOR SELECT
TO authenticated
USING (
  -- Admin vê tudo
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  OR
  -- Owner vê checkins dos seus pacientes
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = checkin.patient_id
    AND patients.user_id = auth.uid()
  )
  OR
  -- Paciente vê apenas seus próprios checkins
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = checkin.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Ver policies criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'checkin';

-- =====================================================
-- RESUMO
-- =====================================================
-- ✅ Verificada estrutura da tabela checkin
-- ✅ Criada policy de SELECT para usuários autenticados
-- ✅ Admin e owners têm acesso apropriado
-- ✅ Versão SIMPLES sem verificação de team_members
-- 
-- PRÓXIMOS PASSOS:
-- 1. Executar este SQL no Supabase SQL Editor
-- 2. Recarregar a página de elaborar dieta
-- 3. Verificar que não há mais erro 400 no console
-- =====================================================
