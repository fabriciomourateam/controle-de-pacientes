-- =====================================================
-- REMOVER TABELAS DO DASHBOARD - SCRIPT CORRIGIDO
-- =====================================================

-- Script para remover APENAS as tabelas do dashboard
-- Execute este script ANTES de executar o create-dashboard-tables

-- Remover views primeiro (para evitar dependências)
DROP VIEW IF EXISTS alertas_dashboard_ativos CASCADE;
DROP VIEW IF EXISTS ultimos_6_meses CASCADE;
DROP VIEW IF EXISTS dashboard_saude CASCADE;
DROP VIEW IF EXISTS dashboard_metricas CASCADE;

-- Remover tabelas específicas
DROP TABLE IF EXISTS alertas_dashboard CASCADE;
DROP TABLE IF EXISTS dashboard_dados CASCADE;

-- Remover funções específicas
DROP FUNCTION IF EXISTS gerar_alertas_dashboard() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Verificar se foi removido
SELECT 'Objetos removidos com sucesso!' as status;
