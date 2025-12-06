-- =====================================================
-- SCRIPT DE MIGRAÇÃO - PLANOS DOS PACIENTES PARA TABELA PLANS
-- =====================================================
-- Este script migra os planos únicos dos pacientes para a tabela plans.
-- Cada plano será vinculado ao user_id do paciente que o possui.
--
-- ⚠️ ATENÇÃO: Execute este script APENAS UMA VEZ!
-- ⚠️ Este script cria planos baseados nos planos únicos dos pacientes existentes
-- =====================================================

-- =====================================================
-- ETAPA 1: Migrar planos únicos dos pacientes para a tabela plans
-- =====================================================

DO $$
DECLARE
    plan_record RECORD;
    plan_exists BOOLEAN;
    default_type TEXT := 'BASIC';
    default_period TEXT := 'Mensal';
    patients_count INTEGER;
BEGIN
    -- Loop através de todos os planos únicos dos pacientes
    FOR plan_record IN 
        SELECT DISTINCT 
            p.plano as plan_name,
            p.user_id,
            COUNT(*) as total_patients
        FROM patients p
        WHERE p.plano IS NOT NULL 
          AND p.plano != ''
          AND p.user_id IS NOT NULL
        GROUP BY p.plano, p.user_id
        ORDER BY p.user_id, p.plano
    LOOP
        -- Verificar se o plano já existe para este usuário (considerando constraint única)
        -- Como temos constraint unique(name), vamos verificar se já existe
        SELECT EXISTS(
            SELECT 1 FROM plans 
            WHERE name = plan_record.plan_name 
            AND (user_id = plan_record.user_id OR user_id IS NULL)
        ) INTO plan_exists;
        
        -- Se o plano não existe, criar
        IF NOT plan_exists THEN
            -- Determinar tipo baseado no nome do plano
            IF UPPER(plan_record.plan_name) LIKE '%PREMIUM%' OR 
               UPPER(plan_record.plan_name) LIKE '%VIP%' OR
               UPPER(plan_record.plan_name) LIKE '%PREMIUM%' THEN
                default_type := 'PREMIUM';
            ELSE
                default_type := 'BASIC';
            END IF;
            
            -- Determinar período baseado no nome do plano
            IF UPPER(plan_record.plan_name) LIKE '%ANUAL%' OR 
               UPPER(plan_record.plan_name) LIKE '%ANUAL%' THEN
                default_period := 'Anual';
            ELSIF UPPER(plan_record.plan_name) LIKE '%SEMESTRAL%' OR 
                  UPPER(plan_record.plan_name) LIKE '%6 MESES%' THEN
                default_period := 'Semestral';
            ELSIF UPPER(plan_record.plan_name) LIKE '%TRIMESTRAL%' OR 
                  UPPER(plan_record.plan_name) LIKE '%3 MESES%' THEN
                default_period := 'Trimestral';
            ELSIF UPPER(plan_record.plan_name) LIKE '%BIMESTRAL%' OR 
                  UPPER(plan_record.plan_name) LIKE '%2 MESES%' THEN
                default_period := 'Bimestral';
            ELSE
                default_period := 'Mensal';
            END IF;
            
            -- Inserir o plano na tabela plans
            INSERT INTO plans (
                name,
                type,
                period,
                category,
                description,
                active,
                user_id
            ) VALUES (
                plan_record.plan_name,
                default_type,
                default_period,
                'Migrado',
                'Plano migrado automaticamente dos pacientes. ' || plan_record.total_patients || ' paciente(s) usando.',
                true,
                plan_record.user_id
            )
            ON CONFLICT (name) DO NOTHING; -- Se já existir, não fazer nada
            
            RAISE NOTICE 'Plano criado: % para user_id: % (% pacientes)', 
                plan_record.plan_name, 
                plan_record.user_id,
                plan_record.total_patients;
        ELSE
            RAISE NOTICE 'Plano já existe: % - Pulando', plan_record.plan_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migração de planos concluída!';
END $$;

-- =====================================================
-- ETAPA 2: Verificar migração
-- =====================================================

-- Ver quantos planos foram criados
SELECT 
    COUNT(*) as total_plans,
    COUNT(DISTINCT user_id) as total_users_with_plans
FROM plans;

-- Ver planos por usuário
SELECT 
    user_id,
    COUNT(*) as total_plans,
    STRING_AGG(name, ', ' ORDER BY name) as plan_names
FROM plans
WHERE user_id IS NOT NULL
GROUP BY user_id;

-- Ver planos únicos dos pacientes vs planos na tabela plans
SELECT 
    'Planos na tabela plans' as origem,
    COUNT(*) as total
FROM plans
UNION ALL
SELECT 
    'Planos únicos dos pacientes' as origem,
    COUNT(DISTINCT plano)
FROM patients
WHERE plano IS NOT NULL AND plano != '';

-- Verificar se há pacientes com planos que não estão na tabela plans
SELECT DISTINCT
    p.plano as plano_paciente,
    p.user_id,
    COUNT(*) as total_pacientes,
    CASE 
        WHEN pl.id IS NULL THEN '❌ NÃO ESTÁ NA TABELA PLANS'
        ELSE '✅ Está na tabela plans'
    END as status
FROM patients p
LEFT JOIN plans pl ON pl.name = p.plano AND (pl.user_id = p.user_id OR pl.user_id IS NULL)
WHERE p.plano IS NOT NULL AND p.plano != ''
GROUP BY p.plano, p.user_id, pl.id
ORDER BY status, p.user_id, p.plano;

-- =====================================================
-- ETAPA 3: Estatísticas finais
-- =====================================================

-- Estatísticas gerais
SELECT 
    'Total de planos na tabela plans' as metrica,
    COUNT(*)::TEXT as valor
FROM plans
UNION ALL
SELECT 
    'Total de planos únicos nos pacientes' as metrica,
    COUNT(DISTINCT plano)::TEXT
FROM patients
WHERE plano IS NOT NULL AND plano != ''
UNION ALL
SELECT 
    'Total de pacientes com plano' as metrica,
    COUNT(*)::TEXT
FROM patients
WHERE plano IS NOT NULL AND plano != ''
UNION ALL
SELECT 
    'Planos por usuário (média)' as metrica,
    ROUND(AVG(plan_count), 2)::TEXT
FROM (
    SELECT user_id, COUNT(*) as plan_count
    FROM plans
    WHERE user_id IS NOT NULL
    GROUP BY user_id
) sub;







