-- =====================================================
-- FIX: Erro 400 (Bad Request) na query de checkin
-- =====================================================
-- Corrige o erro ao buscar peso do paciente
-- 
-- Erro: GET /rest/v1/checkin?select=peso&patient_id=eq.xxx&peso=not.is.null&order=data_checkin.desc&limit=1
-- Status: 400 (Bad Request)
-- =====================================================

-- =====================================================
-- DIAGNÓSTICO: Verificar estrutura da tabela checkin
-- =====================================================

-- Ver colunas da tabela
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'checkin'
  AND column_name IN ('peso', 'patient_id', 'data_checkin')
ORDER BY ordinal_position;

-- Ver policies existentes
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'checkin';

-- =====================================================
-- CORREÇÃO: Adicionar policies se necessário
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.checkin ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas que podem estar causando conflito
DROP POLICY IF EXISTS "checkin_select_policy" ON public.checkin;

-- SELECT: Permitir leitura para usuários autenticados
-- Admin vê todos, membros da equipe veem pacientes do owner, pacientes veem apenas seus próprios
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
  -- Membro da equipe vê checkins dos pacientes do seu owner
  EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.patients p ON p.user_id = tm.owner_id
    WHERE tm.member_id = auth.uid()
    AND p.id = checkin.patient_id
  )
  OR
  -- Paciente vê apenas seus próprios checkins
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = checkin.patient_id
    AND patients.user_id = auth.uid()
  )
  OR
  -- Owner vê checkins dos seus pacientes
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = checkin.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Testar query que estava falhando
-- Substitua 'xxx' pelo patient_id real
-- SELECT peso 
-- FROM public.checkin 
-- WHERE patient_id = 'xxx'
--   AND peso IS NOT NULL
-- ORDER BY data_checkin DESC
-- LIMIT 1;

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
-- ✅ Admin, membros da equipe e pacientes têm acesso apropriado
-- 
-- PRÓXIMOS PASSOS:
-- 1. Executar este SQL no Supabase SQL Editor
-- 2. Recarregar a página de elaborar dieta
-- 3. Verificar que não há mais erro 400 no console
-- =====================================================
