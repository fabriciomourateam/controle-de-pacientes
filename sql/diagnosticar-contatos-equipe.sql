-- Diagnóstico de contatos da equipe
-- Execute no Supabase SQL Editor

-- 1. Ver seu user_id atual
SELECT auth.uid() as seu_user_id;

-- 2. Ver membros da sua equipe
SELECT 
  id,
  user_id as membro_user_id,
  owner_id,
  name as nome_membro,
  email,
  is_active
FROM team_members
WHERE owner_id = auth.uid()
   OR user_id = auth.uid();

-- 3. Ver TODOS os contatos de hoje (sem filtro de user_id)
SELECT 
  ch.id,
  ch.user_id,
  ch.telefone,
  ch.patient_name,
  ch.contact_date,
  ch.contact_type
FROM contact_history ch
WHERE ch.contact_date >= CURRENT_DATE
ORDER BY ch.contact_date DESC;

-- 4. Ver contatos de hoje filtrados pela equipe
WITH team_users AS (
  SELECT COALESCE(
    (SELECT owner_id FROM team_members WHERE user_id = auth.uid() AND is_active = true LIMIT 1),
    auth.uid()
  ) as owner_id
),
all_team_members AS (
  SELECT owner_id as user_id FROM team_users
  UNION
  SELECT tm.user_id FROM team_members tm
  JOIN team_users tu ON tm.owner_id = tu.owner_id
  WHERE tm.is_active = true AND tm.user_id IS NOT NULL
)
SELECT 
  ch.id,
  ch.user_id,
  ch.telefone,
  ch.patient_name,
  ch.contact_date,
  CASE 
    WHEN ch.user_id = auth.uid() THEN 'VOCÊ'
    ELSE 'MEMBRO DA EQUIPE'
  END as quem_fez
FROM contact_history ch
JOIN all_team_members atm ON ch.user_id = atm.user_id
WHERE ch.contact_date >= CURRENT_DATE
ORDER BY ch.contact_date DESC;

-- 5. Contar contatos por pessoa da equipe hoje
WITH team_users AS (
  SELECT COALESCE(
    (SELECT owner_id FROM team_members WHERE user_id = auth.uid() AND is_active = true LIMIT 1),
    auth.uid()
  ) as owner_id
),
all_team_members AS (
  SELECT owner_id as user_id FROM team_users
  UNION
  SELECT tm.user_id FROM team_members tm
  JOIN team_users tu ON tm.owner_id = tu.owner_id
  WHERE tm.is_active = true AND tm.user_id IS NOT NULL
)
SELECT 
  ch.user_id,
  tm.name as nome_membro,
  COUNT(*) as total_contatos_hoje
FROM contact_history ch
JOIN all_team_members atm ON ch.user_id = atm.user_id
LEFT JOIN team_members tm ON tm.user_id = ch.user_id
WHERE ch.contact_date >= CURRENT_DATE
GROUP BY ch.user_id, tm.name
ORDER BY total_contatos_hoje DESC;
