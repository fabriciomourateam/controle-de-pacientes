-- Solução DEFINITIVA para erro 406 do checkin
-- OPÇÃO 2: Manter RLS ativo mas permitir acesso a usuários autenticados

-- 1. Remover TODAS as policies existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'checkin')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON checkin';
    END LOOP;
END $$;

-- 2. Criar UMA policy universal que permite tudo para usuários autenticados
CREATE POLICY "allow_all_authenticated"
ON checkin
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Verificar resultado
SELECT 
    tablename, 
    rowsecurity as "RLS Ativo"
FROM pg_tables 
WHERE tablename = 'checkin';

SELECT 
    policyname as "Nome da Policy", 
    cmd as "Comando"
FROM pg_policies 
WHERE tablename = 'checkin';
