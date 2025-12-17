-- Verificar se existe seu profile (execute como service_role ou admin)
-- Substitua pelo seu ID se necessário

-- 1. Verificar se existe o registro
SELECT * FROM profiles WHERE id = 'a9798432-60bd-4ac8-a035-d139a47ad59b';

-- 2. Se não existir, criar o registro
-- INSERT INTO profiles (id, email, full_name)
-- VALUES ('a9798432-60bd-4ac8-a035-d139a47ad59b', 'seu@email.com', 'Seu Nome');

-- 3. Ver políticas atuais
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles';
