-- Remove colunas de pacientes que foram adicionadas incorretamente na tabela dashboard_dados
-- Estas colunas pertencem à tabela patients, não ao dashboard de métricas

-- Primeiro, vamos verificar se as colunas existem antes de tentar removê-las
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Lista de colunas que devem ser removidas
    DECLARE
        columns_to_remove text[] := ARRAY[
            'apelido', 'cpf', 'email', 'telefone', 'genero', 'data_nascimento',
            'inicio_acompanhamento', 'plano', 'tempo_acompanhamento', 'vencimento',
            'dias_para_vencer', 'valor', 'ticket_medio', 'rescisao_30_percent',
            'pagamento', 'observacao', 'indicacoes', 'lembrete', 'telefone_filtro',
            'antes_depois', 'janeiro', 'fevereiro', 'marco', 'abril', 'maio',
            'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ];
        col_name text;
    BEGIN
        FOREACH col_name IN ARRAY columns_to_remove
        LOOP
            -- Verificar se a coluna existe
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'dashboard_dados' 
                AND column_name = col_name
                AND table_schema = 'public'
            ) INTO column_exists;
            
            -- Se a coluna existe, removê-la
            IF column_exists THEN
                EXECUTE format('ALTER TABLE dashboard_dados DROP COLUMN IF EXISTS %I', col_name);
                RAISE NOTICE 'Coluna % removida da tabela dashboard_dados', col_name;
            ELSE
                RAISE NOTICE 'Coluna % não existe na tabela dashboard_dados', col_name;
            END IF;
        END LOOP;
    END;
END $$;

-- Verificar o resultado final
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'dashboard_dados' 
AND table_schema = 'public'
ORDER BY ordinal_position;














