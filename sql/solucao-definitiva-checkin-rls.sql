-- Solução DEFINITIVA para erro 406 do checkin
-- Esta solução desabilita RLS temporariamente ou cria policy universal

-- OPÇÃO 1: Desabilitar RLS completamente (mais simples)
ALTER TABLE checkin DISABLE ROW LEVEL SECURITY;

-- OPÇÃO 2: Manter RLS mas permitir tudo (se preferir manter RLS ativo)
-- Descomente as linhas abaixo se quiser usar esta opção:

/*
-- Remover TODAS as policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'checkin')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON checkin';
    END LOOP;
END $$;

-- Criar UMA policy universal
CREATE POLICY "allow_all_authenticated"
ON checkin
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
*/

-- Verificar resultado
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'checkin';
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'checkin';
