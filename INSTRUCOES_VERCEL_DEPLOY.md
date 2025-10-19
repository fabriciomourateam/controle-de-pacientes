# 🚀 Instruções para Deploy no Vercel

## ✅ Build Local Funcionando
O build local está funcionando corretamente. O problema é na configuração do Vercel.

## 📝 Passos para Configurar o Vercel

### 1. **Configurar Variáveis de Ambiente**

Acesse o painel do Vercel → Settings → Environment Variables e adicione:

```bash
# Supabase (OBRIGATÓRIO)
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_do_supabase

# Notion (Opcional - já tem valores padrão)
VITE_NOTION_API_KEY=ntn_E50356294261kVEmTcoS17ZLs24AVhXystP6D6Th84L8Yb
VITE_NOTION_DATABASE_ID=631cf85b608d4c1693b772bfe0822f64

# Google Sheets (Opcional)
VITE_GOOGLE_SHEETS_API_KEY=sua_api_key_do_google
```

**IMPORTANTE:** 
- Todas as variáveis que começam com `VITE_` precisam ser adicionadas
- Sem essas variáveis, o build vai falhar ou a aplicação não funcionará

### 2. **Configurações do Projeto no Vercel**

Na página de configuração do projeto, verifique:

#### Build & Development Settings:
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 3. **Fazer o Deploy**

Após configurar as variáveis de ambiente:

```bash
git add .
git commit -m "fix: atualizar configuração do Vercel"
git push
```

O Vercel fará o deploy automaticamente.

## 🔍 Checklist de Problemas Comuns

- [ ] Variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` configuradas?
- [ ] Framework configurado como `Vite` no Vercel?
- [ ] Build Command é `npm run build`?
- [ ] Output Directory é `dist`?
- [ ] vercel.json atualizado?

## 📊 Verificar Logs no Vercel

Se ainda assim falhar:

1. Acesse o painel do Vercel
2. Clique no deployment que falhou
3. Veja a aba "Build Logs" para encontrar o erro específico
4. Procure por mensagens de erro como:
   - `VITE_SUPABASE_URL is not defined`
   - `Module not found`
   - `Build failed`

## 🆘 Solução Rápida

Se você estiver vendo erro de variável de ambiente:

1. Vá para: https://vercel.com/seu-usuario/seu-projeto/settings/environment-variables
2. Adicione as variáveis do Supabase
3. Vá em Deployments → Redeploy

## 📦 Arquivo vercel.json Atualizado

O arquivo `vercel.json` foi atualizado com:
- Configuração otimizada para Vite
- Rotas para as funções de API
- Headers CORS para as APIs
- Cache para assets

## ✨ Próximos Passos

1. Configure as variáveis de ambiente no Vercel
2. Faça um novo commit e push
3. Verifique os logs do build
4. Se ainda houver erro, envie os logs do build para análise

