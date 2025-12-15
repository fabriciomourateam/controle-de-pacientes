# Diagnóstico de Fotos Não Carregando

## Problema
As fotos aparecem como "Imagem não disponível" na página de evolução.

## Passos para Diagnosticar

### 1. Verificar se as fotos existem no banco de dados

Execute o SQL em `sql/check-patient-photos.sql` no Supabase:

```sql
SELECT 
  id, nome, telefone,
  foto_inicial_frente,
  foto_inicial_lado,
  foto_inicial_lado_2,
  foto_inicial_costas,
  peso_inicial,
  altura_inicial,
  data_fotos_iniciais
FROM patients
WHERE telefone = '5511961752137';
```

**O que verificar:**
- ✅ Se os campos `foto_inicial_*` têm URLs válidas
- ✅ Se as URLs começam com `https://`
- ✅ Se são URLs do Google Drive, Supabase Storage ou outro serviço

### 2. Verificar logs do navegador

Abra o Console do navegador (F12) e procure por:
- 🔍 Mensagens começando com `📸 PhotoComparison`
- ❌ Erros de CORS (Cross-Origin)
- ❌ Erros 404 (arquivo não encontrado)
- ❌ Erros 403 (sem permissão)

### 3. Testar URLs manualmente

Abra o arquivo `debug-patient-photos.html` no navegador:
```
http://localhost:5173/debug-patient-photos.html
```

Isso vai:
- Buscar os dados do paciente
- Mostrar todas as URLs das fotos
- Tentar carregar cada foto
- Indicar com borda vermelha se houver erro

### 4. Problemas Comuns e Soluções

#### A) URLs do Google Drive não carregam
**Causa:** Google Drive bloqueia acesso direto por CORS

**Solução:** As fotos precisam estar em:
- Supabase Storage (recomendado)
- Servidor próprio com CORS habilitado
- CDN público

#### B) URLs do Supabase Storage com erro 403
**Causa:** Bucket privado ou políticas RLS bloqueando

**Solução:**
1. Ir no Supabase Dashboard
2. Storage > Buckets
3. Verificar se o bucket é público
4. Verificar políticas de acesso

#### C) URLs quebradas ou inválidas
**Causa:** URLs mal formatadas no banco

**Solução:** Atualizar as URLs no banco de dados

### 5. Como adicionar fotos corretamente

#### Opção 1: Upload direto no Supabase Storage
```javascript
// No componente InitialDataInput
const { data, error } = await supabase.storage
  .from('patient-photos')
  .upload(`${telefone}/initial-frente.jpg`, file);
```

#### Opção 2: Usar URLs públicas
- Imgur
- Cloudinary
- Outro CDN público

### 6. Verificar se o problema é específico deste paciente

Teste com outro paciente que você sabe que tem fotos funcionando.

Se funcionar com outros pacientes, o problema é específico das URLs deste paciente.

## Próximos Passos

1. Execute o SQL para ver as URLs
2. Abra o Console do navegador e veja os logs
3. Teste as URLs manualmente
4. Me informe o que encontrou para eu ajudar a resolver
