-- =====================================================
-- SCRIPT DE MIGRAÇÃO - VINCULAR DADOS EXISTENTES AO USUÁRIO
-- =====================================================
-- Este script vincula todos os dados existentes ao seu usuário atual.
-- 
-- ⚠️ ATENÇÃO: Execute este script APENAS UMA VEZ após adicionar as colunas user_id!
-- ⚠️ Substitua 'SEU_EMAIL_AQUI' pelo email da sua conta no Supabase
-- =====================================================

-- =====================================================
-- ETAPA 1: Identificar seu user_id
-- =====================================================
-- Primeiro, vamos ver qual é o seu user_id
-- Execute esta query separadamente para descobrir seu ID:

-- SELECT id, email FROM auth.users WHERE email = 'SEU_EMAIL_AQUI';

-- =====================================================
-- ETAPA 2: Migrar dados para seu usuário
-- =====================================================
-- Substitua 'SEU_USER_ID_AQUI' pelo UUID retornado na query acima

-- 2.1. Migrar pacientes existentes
DO $$
DECLARE
    current_user_id UUID;
    user_email TEXT := 'SEU_EMAIL_AQUI'; -- ⚠️ ALTERE AQUI COM SEU EMAIL
BEGIN
    -- Buscar user_id pelo email
    SELECT id INTO current_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado com email: %', user_email;
    END IF;
    
    -- Verificar se a tabela existe antes de atualizar
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'patients'
    ) THEN
        -- Atualizar pacientes sem user_id
        UPDATE patients 
        SET user_id = current_user_id 
        WHERE user_id IS NULL;
        
        RAISE NOTICE 'Migrados % pacientes para o usuário %', 
            (SELECT COUNT(*) FROM patients WHERE user_id = current_user_id),
            current_user_id;
    ELSE
        RAISE NOTICE 'Tabela patients não existe, pulando...';
    END IF;
END $$;

-- 2.2. Migrar checkins existentes (se existir)
DO $$
DECLARE
    current_user_id UUID;
    user_email TEXT := 'SEU_EMAIL_AQUI'; -- ⚠️ ALTERE AQUI COM SEU EMAIL
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'checkin'
    ) THEN
        SELECT id INTO current_user_id 
        FROM auth.users 
        WHERE email = user_email;
        
        IF current_user_id IS NULL THEN
            RAISE EXCEPTION 'Usuário não encontrado com email: %', user_email;
        END IF;
        
        -- Atualizar checkins sem user_id
        UPDATE checkin 
        SET user_id = current_user_id 
        WHERE user_id IS NULL;
        
        RAISE NOTICE 'Migrados % checkins para o usuário %', 
            (SELECT COUNT(*) FROM checkin WHERE user_id = current_user_id),
            current_user_id;
    ELSE
        RAISE NOTICE 'Tabela checkin não existe, pulando...';
    END IF;
END $$;

-- 2.3. Migrar feedback records existentes (se existir)
DO $$
DECLARE
    current_user_id UUID;
    user_email TEXT := 'SEU_EMAIL_AQUI'; -- ⚠️ ALTERE AQUI COM SEU EMAIL
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'patient_feedback_records'
    ) THEN
        SELECT id INTO current_user_id 
        FROM auth.users 
        WHERE email = user_email;
        
        IF current_user_id IS NULL THEN
            RAISE EXCEPTION 'Usuário não encontrado com email: %', user_email;
        END IF;
        
        -- Atualizar feedback sem user_id
        UPDATE patient_feedback_records 
        SET user_id = current_user_id 
        WHERE user_id IS NULL;
        
        RAISE NOTICE 'Migrados % registros de feedback para o usuário %', 
            (SELECT COUNT(*) FROM patient_feedback_records WHERE user_id = current_user_id),
            current_user_id;
    ELSE
        RAISE NOTICE 'Tabela patient_feedback_records não existe, pulando...';
    END IF;
END $$;

-- 2.4. Migrar dashboard_dados (se existir)
DO $$
DECLARE
    current_user_id UUID;
    user_email TEXT := 'SEU_EMAIL_AQUI'; -- ⚠️ ALTERE AQUI COM SEU EMAIL
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'dashboard_dados'
    ) THEN
        SELECT id INTO current_user_id 
        FROM auth.users 
        WHERE email = user_email;
        
        IF current_user_id IS NULL THEN
            RAISE EXCEPTION 'Usuário não encontrado com email: %', user_email;
        END IF;
        
        UPDATE dashboard_dados 
        SET user_id = current_user_id 
        WHERE user_id IS NULL;
        
        RAISE NOTICE 'Migrados % registros de dashboard para o usuário %', 
            (SELECT COUNT(*) FROM dashboard_dados WHERE user_id = current_user_id),
            current_user_id;
    END IF;
END $$;

-- 2.5. Migrar leads (se existir)
DO $$
DECLARE
    current_user_id UUID;
    user_email TEXT := 'SEU_EMAIL_AQUI'; -- ⚠️ ALTERE AQUI COM SEU EMAIL
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'leads_que_entraram'
    ) THEN
        SELECT id INTO current_user_id 
        FROM auth.users 
        WHERE email = user_email;
        
        IF current_user_id IS NULL THEN
            RAISE EXCEPTION 'Usuário não encontrado com email: %', user_email;
        END IF;
        
        UPDATE leads_que_entraram 
        SET user_id = current_user_id 
        WHERE user_id IS NULL;
        
        RAISE NOTICE 'Migrados % leads para o usuário %', 
            (SELECT COUNT(*) FROM leads_que_entraram WHERE user_id = current_user_id),
            current_user_id;
    END IF;
END $$;

-- =====================================================
-- ETAPA 3: Verificar migração
-- =====================================================
-- Execute estas queries para verificar se tudo foi migrado corretamente:

-- 3.1. Verificar dashboard_dados migrados (execute logado com sua conta)
-- SELECT COUNT(*) as total_metricas
-- FROM dashboard_dados
-- WHERE user_id = auth.uid();

-- 3.2. Verificar se há dados sem user_id (deve retornar 0)
-- SELECT COUNT(*) as dados_sem_user
-- FROM dashboard_dados
-- WHERE user_id IS NULL;

-- 3.3. Verificar seus dados de dashboard
-- SELECT 
--     id,
--     mes,
--     ano,
--     ativos_total_inicio_mes,
--     entraram,
--     sairam,
--     user_id
-- FROM dashboard_dados
-- WHERE user_id = auth.uid()
-- ORDER BY ano DESC, mes_numero DESC
-- LIMIT 10;

-- 3.4. Verificar leads migrados (se existirem)
-- SELECT COUNT(*) as total_leads
-- FROM leads_que_entraram
-- WHERE user_id = auth.uid();

-- 3.5. Verificar pacientes sem user_id (deve retornar 0, se tabela existir)
-- SELECT COUNT(*) as pacientes_sem_user FROM patients WHERE user_id IS NULL;

-- 3.6. Verificar checkins sem user_id (deve retornar 0, se tabela existir)
-- SELECT COUNT(*) as checkins_sem_user FROM checkin WHERE user_id IS NULL;

-- =====================================================
-- CONCLUSÃO
-- =====================================================
-- 
-- Após executar este script:
-- 1. Verifique se todos os dados foram migrados (queries acima)
-- 2. Teste o sistema fazendo login com sua conta
-- 3. Certifique-se de que você consegue ver todos os seus dados
-- 4. Crie uma conta de teste e verifique que ela não vê seus dados
--
-- =====================================================

