-- =====================================================
-- CRIAÇÃO DAS TABELAS PARA DASHBOARD - VERSÃO SIMPLES
-- =====================================================

-- IMPORTANTE: Execute primeiro o arquivo remove-dashboard-tables.sql
-- Este script apenas cria as tabelas sem tentar remover nada

-- Tabela principal para dados do dashboard
CREATE TABLE dashboard_dados (
    id SERIAL PRIMARY KEY,
    mes TEXT NOT NULL,
    ano INTEGER NOT NULL,
    mes_numero INTEGER NOT NULL,
    data_referencia DATE NOT NULL,
    ativos_total_inicio_mes INTEGER DEFAULT 0,
    saldo_entrada_saida INTEGER DEFAULT 0,
    entraram INTEGER DEFAULT 0,
    sairam INTEGER DEFAULT 0,
    vencimentos INTEGER DEFAULT 0,
    nao_renovou INTEGER DEFAULT 0,
    desistencia INTEGER DEFAULT 0,
    congelamento INTEGER DEFAULT 0,
    percentual_renovacao DECIMAL(5,2) DEFAULT 0.00,
    percentual_churn DECIMAL(5,2) DEFAULT 0.00,
    churn_max INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_dashboard_dados_data_referencia ON dashboard_dados(data_referencia);
CREATE INDEX idx_dashboard_dados_ano_mes ON dashboard_dados(ano, mes_numero);
CREATE UNIQUE INDEX idx_dashboard_dados_unique_period ON dashboard_dados(ano, mes_numero);

-- Tabela para alertas do dashboard
CREATE TABLE alertas_dashboard (
    id SERIAL PRIMARY KEY,
    tipo TEXT NOT NULL CHECK (tipo IN ('churn_alto', 'renovacao_baixa', 'crescimento_negativo', 'vencimentos_altos')),
    mensagem TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    limite DECIMAL(10,2),
    data_referencia DATE NOT NULL,
    prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta')),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para alertas
CREATE INDEX idx_alertas_dashboard_prioridade ON alertas_dashboard(prioridade);
CREATE INDEX idx_alertas_dashboard_data ON alertas_dashboard(data_referencia);
CREATE INDEX idx_alertas_dashboard_ativo ON alertas_dashboard(ativo);

-- View para métricas calculadas
CREATE VIEW dashboard_metricas AS
SELECT 
    *,
    -- Calcular crescimento mensal
    CASE 
        WHEN LAG(ativos_total_inicio_mes) OVER (ORDER BY data_referencia) > 0 
        THEN ROUND(
            ((ativos_total_inicio_mes - LAG(ativos_total_inicio_mes) OVER (ORDER BY data_referencia))::DECIMAL / 
             LAG(ativos_total_inicio_mes) OVER (ORDER BY data_referencia)) * 100, 2
        )
        ELSE 0
    END as crescimento_mensal,
    
    -- Taxa de retenção média (últimos 6 meses)
    ROUND(
        AVG(percentual_renovacao) OVER (
            ORDER BY data_referencia 
            ROWS BETWEEN 5 PRECEDING AND CURRENT ROW
        ), 2
    ) as taxa_retencao_media,
    
    -- Eficiência de conversão (entradas vs saídas)
    CASE 
        WHEN sairam > 0 
        THEN ROUND((entraram::DECIMAL / sairam) * 100, 2)
        ELSE 0
    END as eficiencia_conversao,
    
    -- Projeção próximo mês (baseada na tendência)
    CASE 
        WHEN LAG(ativos_total_inicio_mes) OVER (ORDER BY data_referencia) > 0 
        THEN ROUND(
            ativos_total_inicio_mes * (
                1 + ((ativos_total_inicio_mes - LAG(ativos_total_inicio_mes) OVER (ORDER BY data_referencia))::DECIMAL / 
                     LAG(ativos_total_inicio_mes) OVER (ORDER BY data_referencia))
            )
        )
        ELSE ativos_total_inicio_mes
    END as projecao_proximo_mes
    
FROM dashboard_dados
ORDER BY data_referencia DESC;

-- View separada para indicador de saúde (que usa eficiencia_conversao)
CREATE VIEW dashboard_saude AS
SELECT 
    *,
    -- Indicador de saúde do negócio (0-100)
    LEAST(100, GREATEST(0, 
        (percentual_renovacao * 0.4) + 
        ((100 - percentual_churn) * 0.4) + 
        (eficiencia_conversao * 0.2)
    )) as indicador_saude
FROM dashboard_metricas;

-- View para últimos 6 meses
CREATE VIEW ultimos_6_meses AS
SELECT *
FROM dashboard_dados
WHERE data_referencia >= CURRENT_DATE - INTERVAL '6 months'
ORDER BY data_referencia DESC;

-- View para alertas ativos
CREATE VIEW alertas_dashboard_ativos AS
SELECT *
FROM alertas_dashboard
WHERE ativo = TRUE
ORDER BY 
    CASE prioridade 
        WHEN 'alta' THEN 1 
        WHEN 'media' THEN 2 
        WHEN 'baixa' THEN 3 
    END,
    data_referencia DESC;

-- Função para gerar alertas automáticos
CREATE FUNCTION gerar_alertas_dashboard()
RETURNS VOID AS $$
BEGIN
    -- Limpar alertas antigos
    DELETE FROM alertas_dashboard WHERE created_at < CURRENT_DATE - INTERVAL '30 days';
    
    -- Alerta para churn alto (> 10%)
    INSERT INTO alertas_dashboard (tipo, mensagem, valor, limite, data_referencia, prioridade)
    SELECT 
        'churn_alto',
        'Taxa de churn está acima do limite recomendado',
        percentual_churn,
        10.00,
        data_referencia,
        CASE 
            WHEN percentual_churn > 15 THEN 'alta'
            WHEN percentual_churn > 12 THEN 'media'
            ELSE 'baixa'
        END
    FROM dashboard_dados
    WHERE percentual_churn > 10
    AND data_referencia >= CURRENT_DATE - INTERVAL '3 months'
    ON CONFLICT DO NOTHING;
    
    -- Alerta para renovação baixa (< 70%)
    INSERT INTO alertas_dashboard (tipo, mensagem, valor, limite, data_referencia, prioridade)
    SELECT 
        'renovacao_baixa',
        'Taxa de renovação está abaixo do esperado',
        percentual_renovacao,
        70.00,
        data_referencia,
        CASE 
            WHEN percentual_renovacao < 50 THEN 'alta'
            WHEN percentual_renovacao < 60 THEN 'media'
            ELSE 'baixa'
        END
    FROM dashboard_dados
    WHERE percentual_renovacao < 70
    AND data_referencia >= CURRENT_DATE - INTERVAL '3 months'
    ON CONFLICT DO NOTHING;
    
    -- Alerta para crescimento negativo
    INSERT INTO alertas_dashboard (tipo, mensagem, valor, limite, data_referencia, prioridade)
    SELECT 
        'crescimento_negativo',
        'Crescimento negativo detectado',
        crescimento_mensal,
        0.00,
        data_referencia,
        CASE 
            WHEN crescimento_mensal < -10 THEN 'alta'
            WHEN crescimento_mensal < -5 THEN 'media'
            ELSE 'baixa'
        END
    FROM dashboard_saude
    WHERE crescimento_mensal < 0
    AND data_referencia >= CURRENT_DATE - INTERVAL '3 months'
    ON CONFLICT DO NOTHING;
    
    -- Alerta para vencimentos altos
    INSERT INTO alertas_dashboard (tipo, mensagem, valor, limite, data_referencia, prioridade)
    SELECT 
        'vencimentos_altos',
        'Alto número de vencimentos detectado',
        vencimentos,
        20.00,
        data_referencia,
        CASE 
            WHEN vencimentos > 50 THEN 'alta'
            WHEN vencimentos > 30 THEN 'media'
            ELSE 'baixa'
        END
    FROM dashboard_dados
    WHERE vencimentos > 20
    AND data_referencia >= CURRENT_DATE - INTERVAL '1 month'
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas
CREATE TRIGGER update_dashboard_dados_updated_at
    BEFORE UPDATE ON dashboard_dados
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alertas_dashboard_updated_at
    BEFORE UPDATE ON alertas_dashboard
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Tabela vazia - dados serão inseridos via sincronização do Notion
-- O dashboard processará os dados reais dos pacientes sincronizados

-- Gerar alertas baseados nos dados
SELECT gerar_alertas_dashboard();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE dashboard_dados IS 'Dados mensais para dashboard de métricas de negócio';
COMMENT ON TABLE alertas_dashboard IS 'Sistema de alertas automáticos para métricas críticas';
COMMENT ON VIEW dashboard_metricas IS 'View com métricas calculadas automaticamente';
COMMENT ON VIEW dashboard_saude IS 'View com indicador de saúde do negócio';
COMMENT ON VIEW ultimos_6_meses IS 'View com dados dos últimos 6 meses';
COMMENT ON VIEW alertas_dashboard_ativos IS 'View com alertas ativos ordenados por prioridade';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se tudo foi criado corretamente
SELECT 'Tabelas criadas:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('dashboard_dados', 'alertas_dashboard');

SELECT 'Views criadas:' as status;
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('dashboard_metricas', 'dashboard_saude', 'ultimos_6_meses', 'alertas_dashboard_ativos');

SELECT 'Dados inseridos:' as status;
SELECT COUNT(*) as total_registros FROM dashboard_dados;

SELECT 'Alertas gerados:' as status;
SELECT COUNT(*) as total_alertas FROM alertas_dashboard;
