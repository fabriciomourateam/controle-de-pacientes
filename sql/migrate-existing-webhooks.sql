-- =====================================================
-- MIGRAR WEBHOOKS EXISTENTES PARA TABELA user_webhook_configs
-- =====================================================
-- Este script insere os webhooks que você já tem configurados
-- na plataforma para a nova tabela de configurações
-- =====================================================

-- 1. Obter seu user_id pelo email
DO $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT := 'fabriciomouratreinador@gmail.com';
BEGIN
    -- Buscar user_id pelo email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_user_email
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado. Verifique o email.', v_user_email;
    END IF;

    RAISE NOTICE 'User ID encontrado: %', v_user_id;

    -- 2. Inserir webhook de Auto-sync Dashboard
    INSERT INTO user_webhook_configs (
        user_id,
        webhook_type,
        webhook_url,
        enabled,
        config
    ) VALUES (
        v_user_id,
        'autosync',
        'https://n8n.shapepro.shop/webhook/atualizardash',
        true,
        jsonb_build_object(
            'description', 'Sincronização automática do dashboard',
            'source', 'dashboard',
            'created_at', NOW()
        )
    )
    ON CONFLICT (user_id, webhook_type) 
    DO UPDATE SET
        webhook_url = EXCLUDED.webhook_url,
        enabled = EXCLUDED.enabled,
        config = EXCLUDED.config,
        updated_at = NOW();

    RAISE NOTICE '✅ Webhook autosync inserido/atualizado';

    -- 3. Inserir webhook de Métricas Comerciais
    INSERT INTO user_webhook_configs (
        user_id,
        webhook_type,
        webhook_url,
        enabled,
        config
    ) VALUES (
        v_user_id,
        'commercial_metrics',
        'https://n8n.shapepro.shop/webhook/leads',
        true,
        jsonb_build_object(
            'description', 'Atualização de métricas comerciais',
            'source', 'dashboard',
            'trigger', 'manual',
            'created_at', NOW()
        )
    )
    ON CONFLICT (user_id, webhook_type) 
    DO UPDATE SET
        webhook_url = EXCLUDED.webhook_url,
        enabled = EXCLUDED.enabled,
        config = EXCLUDED.config,
        updated_at = NOW();

    RAISE NOTICE '✅ Webhook commercial_metrics inserido/atualizado';

    -- 4. Inserir webhook de Sincronização de Métricas
    INSERT INTO user_webhook_configs (
        user_id,
        webhook_type,
        webhook_url,
        enabled,
        config
    ) VALUES (
        v_user_id,
        'metrics_sync',
        'https://n8n.shapepro.shop/webhook/controle',
        true,
        jsonb_build_object(
            'description', 'Sincronização de métricas via N8N',
            'source', 'dashboard_metrics',
            'trigger', 'metrics_sync',
            'created_at', NOW()
        )
    )
    ON CONFLICT (user_id, webhook_type) 
    DO UPDATE SET
        webhook_url = EXCLUDED.webhook_url,
        enabled = EXCLUDED.enabled,
        config = EXCLUDED.config,
        updated_at = NOW();

    RAISE NOTICE '✅ Webhook metrics_sync inserido/atualizado';

    -- 5. Verificar webhooks inseridos
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Webhooks configurados para: %', v_user_email;
    RAISE NOTICE '========================================';

END $$;

-- 6. Verificar todos os webhooks inseridos
SELECT 
    u.email as user_email,
    wc.webhook_type,
    wc.webhook_url,
    wc.enabled,
    wc.config->>'description' as description,
    wc.created_at,
    wc.updated_at
FROM user_webhook_configs wc
JOIN auth.users u ON u.id = wc.user_id
WHERE u.email = 'fabriciomouratreinador@gmail.com'
ORDER BY wc.webhook_type;

-- =====================================================
-- NOTAS
-- =====================================================
-- 1. Este script busca seu user_id pelo email
-- 2. Insere 3 webhooks principais que você já usa:
--    - autosync: Sincronização automática do dashboard
--    - commercial_metrics: Métricas comerciais
--    - metrics_sync: Sincronização de métricas
-- 3. Se algum webhook já existir, ele será atualizado
-- 4. Você pode adicionar mais webhooks editando este script
-- =====================================================

