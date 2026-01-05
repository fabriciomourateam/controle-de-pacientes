-- ============================================
-- CORRIGIR POLÍTICAS DE STORAGE: PATIENT-PHOTOS
-- ============================================
-- Este SQL garante que o bucket patient-photos está configurado corretamente
-- e que membros da equipe podem acessar as fotos dos pacientes do owner

-- 1. Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-photos', 'patient-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Remover políticas antigas
DROP POLICY IF EXISTS "Permitir upload de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Fotos são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Public can view photos" ON storage.objects;

-- 3. Criar políticas de INSERT (upload)
-- Permitir que usuários autenticados façam upload
CREATE POLICY "Authenticated users can upload patient photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-photos');

-- 4. Criar políticas de SELECT (visualização)
-- Permitir visualização pública (todos podem ver)
CREATE POLICY "Public can view patient photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'patient-photos');

-- 5. Criar políticas de UPDATE (atualização)
-- Permitir que usuários autenticados atualizem
CREATE POLICY "Authenticated users can update patient photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'patient-photos')
WITH CHECK (bucket_id = 'patient-photos');

-- 6. Criar políticas de DELETE (exclusão)
-- Permitir que usuários autenticados excluam
CREATE POLICY "Authenticated users can delete patient photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'patient-photos');

-- 7. Verificar configuração do bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'patient-photos';

-- 8. Verificar políticas criadas
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%patient%'
ORDER BY policyname;
