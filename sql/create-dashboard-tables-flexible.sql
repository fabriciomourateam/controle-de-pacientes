-- =====================================================
-- CRIAÇÃO DAS TABELAS PARA DASHBOARD - VERSÃO FLEXÍVEL
-- =====================================================

-- IMPORTANTE: Execute primeiro o arquivo remove-dashboard-smart.sql
-- Esta versão aceita todos os tipos de dados, assim como a tabela patients

-- Tabela principal para dados do dashboard (flexível como patients)
CREATE TABLE dashboard_dados (
    id SERIAL PRIMARY KEY,
    -- Campos de identificação
    mes TEXT,
    ano TEXT,
    mes_numero TEXT,
    data_referencia TEXT,
    
    -- Campos de métricas (todos como TEXT para flexibilidade)
    ativos_total_inicio_mes TEXT,
    saldo_entrada_saida TEXT,
    entraram TEXT,
    sairam TEXT,
    vencimentos TEXT,
    nao_renovou TEXT,
    desistencia TEXT,
    congelamento TEXT,
    percentual_renovacao TEXT,
    percentual_churn TEXT,
    churn_max TEXT,
    
    -- Campos adicionais para dados do Notion (como na tabela patients)
    nome TEXT,
    apelido TEXT,
    cpf TEXT,
    email TEXT,
    telefone TEXT,
    genero TEXT,
    data_nascimento TEXT,
    inicio_acompanhamento TEXT,
    plano TEXT,
    tempo_acompanhamento TEXT,
    vencimento TEXT,
    dias_para_vencer TEXT,
    valor TEXT,
    ticket_medio TEXT,
    rescisao_30_percent TEXT,
    pagamento TEXT,
    observacao TEXT,
    indicacoes TEXT,
    lembrete TEXT,
    telefone_filtro TEXT,
    antes_depois TEXT,
    
    -- Campos de meses (como na tabela patients)
    janeiro TEXT,
    fevereiro TEXT,
    marco TEXT,
    abril TEXT,
    maio TEXT,
    junho TEXT,
    julho TEXT,
    agosto TEXT,
    setembro TEXT,
    outubro TEXT,
    novembro TEXT,
    dezembro TEXT,
    
    -- Campos de controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_dashboard_dados_data_referencia ON dashboard_dados(data_referencia);
CREATE INDEX idx_dashboard_dados_ano_mes ON dashboard_dados(ano, mes_numero);
CREATE INDEX idx_dashboard_dados_telefone ON dashboard_dados(telefone);

-- Tabela para alertas do dashboard (flexível)
CREATE TABLE alertas_dashboard (
    id SERIAL PRIMARY KEY,
    tipo TEXT,
    mensagem TEXT,
    valor TEXT,
    limite TEXT,
    data_referencia TEXT,
    prioridade TEXT DEFAULT 'media',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para alertas
CREATE INDEX idx_alertas_dashboard_prioridade ON alertas_dashboard(prioridade);
CREATE INDEX idx_alertas_dashboard_ativo ON alertas_dashboard(ativo);
CREATE INDEX idx_alertas_dashboard_data_referencia ON alertas_dashboard(data_referencia);

-- =====================================================
-- VIEWS PARA CÁLCULOS AUTOMÁTICOS
-- =====================================================

-- View para métricas calculadas (com conversão de tipos)
CREATE OR REPLACE VIEW dashboard_metricas AS
SELECT 
    id,
    mes,
    ano,
    mes_numero,
    data_referencia,
    
    -- Conversão segura de TEXT para números
    COALESCE(CAST(ativos_total_inicio_mes AS INTEGER), 0) as ativos_total_inicio_mes,
    COALESCE(CAST(saldo_entrada_saida AS INTEGER), 0) as saldo_entrada_saida,
    COALESCE(CAST(entraram AS INTEGER), 0) as entraram,
    COALESCE(CAST(sairam AS INTEGER), 0) as sairam,
    COALESCE(CAST(vencimentos AS INTEGER), 0) as vencimentos,
    COALESCE(CAST(nao_renovou AS INTEGER), 0) as nao_renovou,
    COALESCE(CAST(desistencia AS INTEGER), 0) as desistencia,
    COALESCE(CAST(congelamento AS INTEGER), 0) as congelamento,
    COALESCE(CAST(percentual_renovacao AS DECIMAL(5,2)), 0.00) as percentual_renovacao,
    COALESCE(CAST(percentual_churn AS DECIMAL(5,2)), 0.00) as percentual_churn,
    COALESCE(CAST(churn_max AS INTEGER), 0) as churn_max,
    
    -- Cálculos automáticos
    CASE 
        WHEN CAST(ativos_total_inicio_mes AS INTEGER) > 0 
        THEN ROUND((CAST(entraram AS INTEGER)::DECIMAL / CAST(ativos_total_inicio_mes AS INTEGER)) * 100, 2)
        ELSE 0 
    END as taxa_crescimento,
    
    CASE 
        WHEN CAST(entraram AS INTEGER) > 0 
        THEN ROUND((CAST(nao_renovou AS INTEGER)::DECIMAL / CAST(entraram AS INTEGER)) * 100, 2)
        ELSE 0 
    END as taxa_churn_calculada,
    
    -- Indicador de saúde do negócio
    CASE 
        WHEN CAST(percentual_renovacao AS DECIMAL) >= 80 THEN 'Excelente'
        WHEN CAST(percentual_renovacao AS DECIMAL) >= 70 THEN 'Bom'
        WHEN CAST(percentual_renovacao AS DECIMAL) >= 60 THEN 'Regular'
        ELSE 'Atenção'
    END as status_saude,
    
    created_at,
    updated_at
FROM dashboard_dados
ORDER BY CAST(ano AS INTEGER) DESC, CAST(mes_numero AS INTEGER) DESC;

-- View para últimos 6 meses
CREATE OR REPLACE VIEW ultimos_6_meses AS
SELECT *
FROM dashboard_metricas
WHERE CAST(ano AS INTEGER) >= EXTRACT(YEAR FROM NOW()) - 1
ORDER BY CAST(ano AS INTEGER) DESC, CAST(mes_numero AS INTEGER) DESC
LIMIT 6;

-- =====================================================
-- FUNÇÃO PARA GERAR ALERTAS
-- =====================================================

CREATE OR REPLACE FUNCTION gerar_alertas_dashboard()
RETURNS VOID AS $$
DECLARE
    rec RECORD;
BEGIN
    -- Limpar alertas antigos
    DELETE FROM alertas_dashboard WHERE ativo = true;
    
    -- Gerar alertas baseados nos dados mais recentes
    FOR rec IN 
        SELECT 
            *,
            CAST(percentual_churn AS DECIMAL) as churn_num,
            CAST(percentual_renovacao AS DECIMAL) as renovacao_num,
            CAST(entraram AS INTEGER) as entraram_num,
            CAST(sairam AS INTEGER) as sairam_num
        FROM dashboard_metricas 
        ORDER BY CAST(ano AS INTEGER) DESC, CAST(mes_numero AS INTEGER) DESC 
        LIMIT 1
    LOOP
        -- Alerta: Churn alto
        IF rec.churn_num > 30 THEN
            INSERT INTO alertas_dashboard (tipo, mensagem, valor, limite, data_referencia, prioridade)
            VALUES (
                'churn_alto',
                'Taxa de churn acima de 30%',
                rec.churn_num,
                30,
                rec.data_referencia,
                'alta'
            );
        END IF;
        
        -- Alerta: Renovação baixa
        IF rec.renovacao_num < 70 THEN
            INSERT INTO alertas_dashboard (tipo, mensagem, valor, limite, data_referencia, prioridade)
            VALUES (
                'renovacao_baixa',
                'Taxa de renovação abaixo de 70%',
                rec.renovacao_num,
                70,
                rec.data_referencia,
                'media'
            );
        END IF;
        
        -- Alerta: Crescimento negativo
        IF rec.entraram_num < rec.sairam_num THEN
            INSERT INTO alertas_dashboard (tipo, mensagem, valor, limite, data_referencia, prioridade)
            VALUES (
                'crescimento_negativo',
                'Mais pacientes saíram do que entraram',
                rec.entraram_num - rec.sairam_num,
                rec.sairam_num,
                rec.data_referencia,
                'alta'
            );
        END IF;
        
        -- Alerta: Muitos vencimentos
        IF CAST(rec.vencimentos AS INTEGER) > 10 THEN
            INSERT INTO alertas_dashboard (tipo, mensagem, valor, limite, data_referencia, prioridade)
            VALUES (
                'vencimentos_altos',
                'Muitos vencimentos no período',
                CAST(rec.vencimentos AS INTEGER),
                10,
                rec.data_referencia,
                'media'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_dashboard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dashboard_dados_updated_at
    BEFORE UPDATE ON dashboard_dados
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_updated_at();

CREATE TRIGGER update_alertas_dashboard_updated_at
    BEFORE UPDATE ON alertas_dashboard
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE dashboard_dados ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_dashboard ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Allow read access to all dashboard data" ON dashboard_dados
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert dashboard data" ON dashboard_dados
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update dashboard data" ON dashboard_dados
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete dashboard data" ON dashboard_dados
    FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow read access to all alerts" ON alertas_dashboard
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage alerts" ON alertas_dashboard
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Tabela vazia - dados serão inseridos via sincronização do Notion
-- O dashboard processará os dados reais dos pacientes sincronizados

-- Gerar alertas baseados nos dados
SELECT gerar_alertas_dashboard();



















