-- ============================================
-- TESTE: Deletar paciente DIRETAMENTE (bypass RLS)
-- ============================================
-- ATENÇÃO: Isso vai REALMENTE deletar o paciente!
-- Use apenas para teste com um paciente que você pode perder

-- 1. Ver pacientes disponíveis
SELECT id, nome, telefone 
FROM patients 
LIMIT 10;

-- 2. DELETAR UM PACIENTE ESPECÍFICO (substitua o ID)
-- DESCOMENTE a linha abaixo e coloque o ID de um paciente de teste:
-- DELETE FROM patients WHERE id = 'COLE_O_ID_AQUI';

-- 3. Verificar se foi deletado
-- SELECT id, nome FROM patients WHERE id = 'COLE_O_ID_AQUI';
