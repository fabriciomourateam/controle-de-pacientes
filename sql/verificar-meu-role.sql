-- Ver qual é o seu role atual
SELECT 
  'Seu role atual' as info,
  id,
  role
FROM profiles 
WHERE id = auth.uid();
