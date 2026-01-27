-- Diagnóstico completo do RLS da tabela checkin

-- 1. Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'checkin';

-- 2. Ver TODAS as policies da tabela checkin
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'checkin'
ORDER BY cmd, policyname;

-- 3. Verificar se há policies RESTRICTIVE (que bloqueiam tudo)
SELECT policyname, cmd, permissive
FROM pg_policies 
WHERE tablename = 'checkin' AND permissive = 'RESTRICTIVE';

-- 4. Ver o owner da tabela
SELECT tableowner 
FROM pg_tables 
WHERE tablename = 'checkin';
