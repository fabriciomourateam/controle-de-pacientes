-- Script para verificar e atualizar dados de vendas no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR SITUAÇÃO ATUAL
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN "COMPROU" = '1' THEN 1 ELSE 0 END) as comprou_atual,
  SUM(CASE WHEN "NÃO COMPROU" = '1' THEN 1 ELSE 0 END) as nao_comprou_atual,
  SUM(CASE WHEN "NO SHOW" = '1' THEN 1 ELSE 0 END) as no_show_atual,
  SUM(CASE WHEN "COMPROU" = '0' AND "NÃO COMPROU" = '0' AND "NO SHOW" = '0' THEN 1 ELSE 0 END) as sem_classificacao
FROM "Total de Vendas";

-- 2. VER OS 70 REGISTROS SEM CLASSIFICAÇÃO
-- Execute esta query para ver quais registros precisam ser classificados
SELECT 
  id,
  "MÊS",
  "DATA",
  "FUNIL",
  "COMPROU",
  "NÃO COMPROU",
  "NO SHOW"
FROM "Total de Vendas"
WHERE "COMPROU" = '0' AND "NÃO COMPROU" = '0' AND "NO SHOW" = '0'
ORDER BY id;

-- 3. IMPORTANTE: ANTES DE ATUALIZAR
-- Você precisa saber como classificar esses 70 registros
-- Eles devem ser distribuídos entre COMPROU, NÃO COMPROU e NO SHOW
-- para chegar nos totais do Excel:
-- 
-- COMPROU: precisa de 113 a mais (de 91 para 204)
-- NÃO COMPROU: precisa de 39 a mais (de 71 para 110)  
-- NO SHOW: precisa REMOVER 83 (de 170 para 87)
--
-- Mas você tem apenas 70 registros sem classificação!
-- 
-- Isso significa que você também precisa RECLASSIFICAR alguns registros
-- que estão como NO SHOW para COMPROU ou NÃO COMPROU
--
-- Total de mudanças necessárias:
-- - 70 registros sem classificação precisam ser classificados
-- - 83 registros que estão como NO SHOW="1" precisam ser mudados para outra categoria
-- 
-- PERGUNTA: Como você identifica no Excel se um registro é COMPROU, NÃO COMPROU ou NO SHOW?
-- Existe algum campo que indica isso? (ex: coluna de STATUS, RESULTADO, etc.)








