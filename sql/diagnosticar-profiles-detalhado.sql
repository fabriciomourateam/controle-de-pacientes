-- Diagnóstico detalhado da tabela profiles

-- 1. Ver estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Ver todos os registros (sem RLS - rode como service_role ou desabilite RLS temporariamente)
-- SELECT * FROM profiles LIMIT 10;

-- 3. Ver políticas atuais
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Verificar se existe registro com esse ID específico
SELECT EXISTS (
  SELECT 1 FROM profiles WHERE id = 'a9798432-60bd-4ac8-a035-d139a47ad59b'::uuid
) as existe_profile;
