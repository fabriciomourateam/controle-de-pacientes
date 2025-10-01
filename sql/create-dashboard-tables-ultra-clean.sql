-- =====================================================
-- CRIAÇÃO DAS TABELAS PARA DASHBOARD DE MÉTRICAS - VERSÃO ULTRA LIMPA
-- =====================================================

-- Script para limpar completamente e recriar tudo do zero
-- Execute este script se houver qualquer conflito

-- Primeiro, remover TODOS os objetos relacionados (ignorando erros)
DO $$
BEGIN
    -- Remover views
    DROP VIEW IF EXISTS alertas_dashboard_ativos CASCADE;
    DROP VIEW IF EXISTS ultimos_6_meses CASCADE;
    DROP VIEW IF EXISTS dashboard_saude CASCADE;
    DROP VIEW IF EXISTS dashboard_metricas CASCADE;
    DROP VIEW IF EXISTS alertas_dashboard CASCADE;
    DROP VIEW IF EXISTS dashboard_dados CASCADE;
    
    -- Remover tabelas
    DROP TABLE IF EXISTS alertas_dashboard CASCADE;
    DROP TABLE IF EXISTS dashboard_dados CASCADE;
    
    -- Remover funções
    DROP FUNCTION IF EXISTS gerar_alertas_dashboard() CASCADE;
    DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Ignorar erros e continuar
        NULL;
END $$;

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
-- DADOS DE EXEMPLO
-- =====================================================

-- Inserir alguns dados de exemplo para teste
INSERT INTO dashboard_dados (
    mes, ano, mes_numero, data_referencia,
    ativos_total_inicio_mes, entraram, sairam, vencimentos,
    nao_renovou, desistencia, congelamento,
    percentual_renovacao, percentual_churn
) VALUES 
-- Janeiro 2024
('Janeiro', 2024, 1, '2024-01-31', 100, 15, 8, 12, 2, 3, 3, 85.5, 8.0),
-- Fevereiro 2024
('Fevereiro', 2024, 2, '2024-02-29', 107, 12, 5, 8, 1, 2, 2, 90.2, 5.2),
-- Março 2024
('Março', 2024, 3, '2024-03-31', 114, 18, 7, 10, 2, 3, 2, 87.8, 6.8),
-- Abril 2024
('Abril', 2024, 4, '2024-04-30', 125, 20, 9, 15, 3, 4, 2, 82.4, 9.2),
-- Maio 2024
('Maio', 2024, 5, '2024-05-31', 136, 16, 6, 11, 2, 2, 2, 88.9, 5.9),
-- Junho 2024
('Junho', 2024, 6, '2024-06-30', 146, 22, 8, 14, 2, 3, 3, 85.7, 7.1),
-- Julho 2024
('Julho', 2024, 7, '2024-07-31', 160, 19, 10, 16, 3, 4, 3, 81.2, 8.8),
-- Agosto 2024
('Agosto', 2024, 8, '2024-08-31', 169, 17, 7, 12, 2, 3, 2, 88.3, 6.7),
-- Setembro 2024
('Setembro', 2024, 9, '2024-09-30', 179, 21, 9, 15, 2, 4, 3, 84.4, 7.6),
-- Outubro 2024
('Outubro', 2024, 10, '2024-10-31', 191, 24, 8, 18, 3, 3, 2, 86.1, 6.9),
-- Novembro 2024
('Novembro', 2024, 11, '2024-11-30', 207, 26, 10, 20, 3, 4, 3, 83.0, 8.0),
-- Dezembro 2024
('Dezembro', 2024, 12, '2024-12-31', 223, 28, 12, 24, 4, 5, 3, 79.2, 9.8);

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












