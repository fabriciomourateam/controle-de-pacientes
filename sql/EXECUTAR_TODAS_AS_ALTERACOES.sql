-- =====================================================
-- SCRIPT COMPLETO - EXECUTAR TODAS AS ALTERAÇÕES
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Ele criará todas as estruturas necessárias para:
-- 1. Controle de peso diário
-- 2. Sistema de exames laboratoriais
-- 3. Campos de peso em jejum no checkin
-- 4. Configurações de branding para PDF
-- =====================================================

-- IMPORTANTE: Execute na ordem abaixo!

-- 1. Criar tabela de controle de peso diário (weight_tracking)
\i sql/create-weight-tracking-table.sql

-- 2. Criar sistema de exames laboratoriais
\i sql/create-laboratory-exams.sql

-- 3. Adicionar campos de peso em jejum na tabela checkin
-- ⚠️ IMPORTANTE: Execute este para permitir pré-preenchimento de check-ins
\i sql/add-checkin-weight-fields.sql

-- 4. Configurações de branding para PDF
\i sql/create-branding-config.sql

-- 5. Triggers de multi-tenancy para novas tabelas
\i sql/create-multi-tenancy-new-tables.sql

-- =====================================================
-- ORDEM DE EXECUÇÃO MANUAL (se o \i não funcionar):
-- =====================================================
-- 
-- 1. sql/create-weight-tracking-table.sql
-- 2. sql/create-laboratory-exams.sql
-- 3. sql/add-checkin-weight-fields.sql  ← IMPORTANTE!
-- 4. sql/create-branding-config.sql
-- 5. sql/create-multi-tenancy-new-tables.sql
--
-- =====================================================





