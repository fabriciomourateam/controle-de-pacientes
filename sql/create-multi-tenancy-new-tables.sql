-- =====================================================
-- MULTI-TENANCY PARA NOVAS TABELAS
-- =====================================================
-- Este script garante que as novas tabelas (weight_tracking e laboratory_exams)
-- tenham suporte completo a multi-tenancy
-- =====================================================

-- Verificar se a função set_user_id existe, se não, criar
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        NEW.user_id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- WEIGHT_TRACKING - Triggers
-- =====================================================
DROP TRIGGER IF EXISTS set_user_id_weight_tracking ON weight_tracking;
CREATE TRIGGER set_user_id_weight_tracking
    BEFORE INSERT ON weight_tracking
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- =====================================================
-- LABORATORY_EXAMS - Triggers
-- =====================================================
DROP TRIGGER IF EXISTS set_user_id_laboratory_exams ON laboratory_exams;
CREATE TRIGGER set_user_id_laboratory_exams
    BEFORE INSERT ON laboratory_exams
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();





