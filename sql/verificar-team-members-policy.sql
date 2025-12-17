-- Verificar política atual de team_members
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'team_members';

-- Verificar se existe algum registro na tabela
SELECT count(*) as total FROM team_members;

-- Verificar estrutura
SELECT column_name FROM information_schema.columns WHERE table_name = 'team_members';
