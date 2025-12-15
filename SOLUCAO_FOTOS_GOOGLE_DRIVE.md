# Solução: Fotos do Google Drive Não Carregam

## Problema Identificado

As fotos estão armazenadas no Google Drive com URLs como:
- `https://drive.google.com/open?id=16McOS0NTffv4JOD1nt0zIlOnzDlGpxU7`
- `https://drive.google.com/open?id=1QohfYHBemdb287Cey0zrk8-ff2GyLvFT`

O sistema converte para:
- `https://lh3.googleusercontent.com/d/16McOS0NTffv4JOD1nt0zIlOnzDlGpxU7`

**Mas essas URLs falham** porque o Google Drive não permite acesso direto via `googleusercontent.com` para arquivos privados.

## Solução Implementada

Atualizei a conversão de URL para usar:
```
https://drive.google.com/uc?export=view&id=FILE_ID
```

Este formato funciona **SE** os arquivos do Google Drive estiverem com permissão:
**"Qualquer pessoa com o link pode visualizar"**

## Como Verificar e Corrigir as Permissões

### 1. Verificar Permissão Atual

Para cada foto, abra a URL original no navegador:
- `https://drive.google.com/open?id=16McOS0NTffv4JOD1nt0zIlOnzDlGpxU7`

Se pedir login ou mostrar "Você precisa de permissão", o arquivo está privado.

### 2. Tornar Público (Compartilhamento)

No Google Drive:
1. Clique com botão direito no arquivo
2. Selecione "Compartilhar"
3. Em "Acesso geral", escolha: **"Qualquer pessoa com o link"**
4. Permissão: **"Leitor"**
5. Clique em "Concluído"

### 3. Testar Novamente

Após ajustar as permissões, recarregue a página de evolução.

## Solução Definitiva Recomendada

### ⚠️ Problema com Google Drive

O Google Drive **NÃO é ideal** para hospedar imagens em aplicações web porque:
- Requer permissões públicas (risco de segurança)
- Pode ter limite de visualizações
- URLs podem mudar
- Performance não é otimizada para imagens

### ✅ Solução Recomendada: Migrar para Supabase Storage

#### Vantagens:
- ✅ Controle total de permissões via RLS
- ✅ URLs permanentes e confiáveis
- ✅ Performance otimizada
- ✅ Integração nativa com o sistema
- ✅ Sem limites de visualização

#### Como Migrar:

1. **Criar bucket no Supabase**
```sql
-- No Supabase SQL Editor
insert into storage.buckets (id, name, public)
values ('patient-photos', 'patient-photos', true);
```

2. **Configurar políticas de acesso**
```sql
-- Permitir upload para usuários autenticados
create policy "Usuários podem fazer upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'patient-photos');

-- Permitir visualização pública
create policy "Fotos são públicas"
on storage.objects for select
to public
using (bucket_id = 'patient-photos');
```

3. **Script de migração** (já existe em `src/lib/photo-migration-service.ts`)

O sistema já tem suporte para migração automática de fotos do Typebot.
Podemos criar um script similar para migrar do Google Drive.

## Teste Rápido

Para testar se as permissões estão corretas, abra estas URLs no navegador:

**Formato novo (deve funcionar se público):**
```
https://drive.google.com/uc?export=view&id=16McOS0NTffv4JOD1nt0zIlOnzDlGpxU7
https://drive.google.com/uc?export=view&id=1QohfYHBemdb287Cey0zrk8-ff2GyLvFT
https://drive.google.com/uc?export=view&id=1u0ZiSljDYrrZlwofKJi9MPdYBuKJbK1g
```

Se abrir a imagem diretamente = ✅ Funcionará no sistema
Se pedir login ou permissão = ❌ Precisa ajustar permissões

## Próximos Passos

1. **Curto prazo:** Ajustar permissões dos arquivos no Google Drive
2. **Médio prazo:** Migrar fotos existentes para Supabase Storage
3. **Longo prazo:** Configurar upload direto no Supabase (sem passar pelo Google Drive)
