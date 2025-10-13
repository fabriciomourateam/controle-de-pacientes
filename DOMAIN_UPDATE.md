# Atualização de Domínio

## 🌐 Novo Domínio de Produção

O domínio de produção foi alterado de:
- ❌ `https://painel-fmteam.vercel.app/` (não funcionava)
- ✅ `https://dashboard-fmteam.vercel.app/` (funcionando)

## 📝 Arquivos Atualizados

### Arquivos Principais:
- ✅ `src/lib/config.ts` - URL do proxy atualizada
- ✅ `src/lib/n8n-webhook-service.ts` - URLs do webhook atualizadas  
- ✅ `src/components/commercial-metrics/ConnectionTest.tsx` - URL exibida na interface

### URLs de API Atualizadas:
- **Proxy Notion**: `https://dashboard-fmteam.vercel.app/api/notion-proxy`
- **Webhook N8N**: `https://dashboard-fmteam.vercel.app/api/public-webhook`
- **Dados N8N**: `https://dashboard-fmteam.vercel.app/api/get-n8n-data`

## 🔧 Configurações do N8N

Se você estiver usando o N8N, atualize as URLs para:
- **Webhook Principal**: `https://dashboard-fmteam.vercel.app/api/public-webhook`
- **Proxy Notion**: `https://dashboard-fmteam.vercel.app/api/notion-proxy`

## ✅ Status

- ✅ Domínio funcionando
- ✅ Arquivos JavaScript carregando
- ✅ Credenciais Notion pré-preenchidas
- ✅ Webhook N8N configurado
- ✅ Todas as funcionalidades operacionais

## 📱 Acesso

**URL de Produção**: https://dashboard-fmteam.vercel.app/

Data da atualização: $(date)
