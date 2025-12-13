-- =====================================================
-- CRIAR BUCKET DE STORAGE PARA RESULTADOS DE EXAMES
-- =====================================================
-- Este script cria o bucket 'exam-results' para armazenar
-- os arquivos de resultados de exames laboratoriais.
-- Limite de 20MB por arquivo.
--
-- ⚠️ IMPORTANTE: Execute este script no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- ETAPA 1: Criar o bucket 'exam-results' (se não existir)
-- =====================================================

-- Nota: A criação de buckets via SQL não é diretamente suportada no Supabase.
-- Você precisa criar o bucket manualmente no Dashboard do Supabase:
--
-- 1. Acesse Supabase Dashboard > Storage
-- 2. Clique em "New bucket"
-- 3. Nome: exam-results
-- 4. Public: Não (privado)
-- 5. File size limit: 20971520 (20MB em bytes)
-- 6. Allowed MIME types: image/*,application/pdf (opcional, mas recomendado)
--
-- OU execute via Supabase Management API se tiver acesso.

-- =====================================================
-- ETAPA 2: Criar políticas RLS para o bucket
-- =====================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can upload exam results" ON storage.objects;
DROP POLICY IF EXISTS "Users can view exam results" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete exam results" ON storage.objects;
DROP POLICY IF EXISTS "Users can update exam results" ON storage.objects;
DROP POLICY IF EXISTS "Public can view exam results" ON storage.objects;

-- Política para INSERT: Usuários autenticados podem fazer upload de resultados
CREATE POLICY "Users can upload exam results"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-results'
);

-- Política para SELECT: Usuários autenticados podem visualizar resultados
-- Permite visualização de arquivos no bucket exam-results
CREATE POLICY "Users can view exam results"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-results'
);

-- Política para DELETE: Usuários autenticados podem deletar resultados
CREATE POLICY "Users can delete exam results"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'exam-results'
);

-- Política para UPDATE: Usuários autenticados podem atualizar metadados
CREATE POLICY "Users can update exam results"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exam-results'
);

-- =====================================================
-- ETAPA 3: Verificar se o bucket existe e está configurado
-- =====================================================

-- Listar buckets existentes (para verificação)
SELECT 
  name,
  id,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets
WHERE name = 'exam-results';

-- =====================================================
-- NOTA: O bucket já foi criado com as seguintes configurações:
-- - Nome: exam-results
-- - Público: false (privado)
-- - Limite de arquivo: 31457280 bytes (30MB)
-- - Tipos MIME permitidos: image/*, application/pdf
-- =====================================================

-- =====================================================
-- INSTRUÇÕES PARA CRIAR O BUCKET MANUALMENTE
-- =====================================================
--
-- Se o bucket não existir, siga estes passos:
--
-- 1. Acesse o Supabase Dashboard: https://app.supabase.com
-- 2. Vá para o seu projeto
-- 3. Clique em "Storage" no menu lateral
-- 4. Clique em "New bucket"
-- 5. Preencha:
--    - Name: exam-results
--    - Public bucket: Desmarcado (privado)
--    - File size limit: 20971520 (20MB)
--    - Allowed MIME types: image/*,application/pdf
-- 6. Clique em "Create bucket"
--
-- Após criar o bucket, execute novamente este script para criar as políticas.
-- =====================================================

