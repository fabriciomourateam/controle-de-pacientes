-- ============================================
-- VERIFICAR FORMATO DO TELEFONE DO PACIENTE
-- ============================================

-- 1. Buscar paciente e ver o telefone exato
SELECT 
  'Telefone exato no banco' as info,
  id,
  nome,
  telefone,
  LENGTH(telefone) as tamanho_telefone,
  telefone LIKE '55%' as comeca_com_55,
  telefone LIKE '5511989330147%' as contem_5511989330147
FROM patients
WHERE nome ILIKE '%Barbara%Zara%Lamonica%'
   OR telefone LIKE '%5511989330147%'
   OR telefone LIKE '%11989330147%';

-- 2. Testar diferentes formatos de busca
SELECT 
  'Teste formato 1: 5511989330147' as formato,
  COUNT(*) as encontrados
FROM patients
WHERE telefone = '5511989330147';

SELECT 
  'Teste formato 2: 11989330147' as formato,
  COUNT(*) as encontrados
FROM patients
WHERE telefone = '11989330147';

SELECT 
  'Teste formato 3: LIKE %5511989330147%' as formato,
  COUNT(*) as encontrados
FROM patients
WHERE telefone LIKE '%5511989330147%';

SELECT 
  'Teste formato 4: LIKE %11989330147%' as formato,
  COUNT(*) as encontrados
FROM patients
WHERE telefone LIKE '%11989330147%';

-- 3. Ver todos os telefones similares
SELECT 
  'Telefones similares' as info,
  id,
  nome,
  telefone
FROM patients
WHERE telefone LIKE '%1989330147%'
   OR telefone LIKE '%89330147%'
ORDER BY telefone;
