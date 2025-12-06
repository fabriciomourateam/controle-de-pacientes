# 🔧 Resolver: Deploy Falhando no Vercel

## 🔍 **PASSO 1: Verificar Logs do Vercel**

1. Acesse: https://vercel.com
2. Vá em seu projeto → **Deployments**
3. Clique no deployment que falhou (com ❌)
4. Clique em **"View Build Logs"** ou **"Logs"**
5. Role até o final e procure por mensagens de erro

**Erros comuns:**
- `VITE_SUPABASE_URL is not defined`
- `Module not found`
- `Build failed`
- `Syntax error`

---

## 🎯 **PASSO 2: Verificar Variáveis de Ambiente**

### **Variáveis OBRIGATÓRIAS no Vercel:**

1. Acesse: Vercel → Seu Projeto → **Settings** → **Environment Variables**

2. Verifique se estas variáveis existem:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_SERVICE_ROLE_KEY (para webhooks)
VITE_KIWIFY_CHECKOUT_BASIC
VITE_KIWIFY_CHECKOUT_SILVER
VITE_KIWIFY_CHECKOUT_BLACK
VITE_KIWIFY_CLIENT_ID
VITE_KIWIFY_CLIENT_SECRET
VITE_KIWIFY_ACCOUNT_ID
```

3. **IMPORTANTE:** Marque todas para:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

---

## 🔧 **PASSO 3: Verificar Configuração do Projeto**

No Vercel → Seu Projeto → **Settings** → **General**:

- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

---

## 🐛 **PASSO 4: Erros Comuns e Soluções**

### **Erro: "VITE_SUPABASE_URL is not defined"**

**Solução:**
1. Adicione a variável no Vercel
2. Faça redeploy

### **Erro: "Module not found"**

**Solução:**
1. Verifique se todas as dependências estão no `package.json`
2. Execute `npm install` localmente para verificar
3. Se funcionar local, o problema é no Vercel

### **Erro: "Build failed" ou "Syntax error"**

**Solução:**
1. Verifique os logs completos
2. Procure pela linha específica do erro
3. Corrija o erro no código
4. Faça commit e push novamente

### **Erro: "Deployment failed" sem detalhes**

**Solução:**
1. Verifique os logs completos do build
2. Procure por mensagens de erro no final
3. Pode ser timeout - tente fazer redeploy

---

## ✅ **SOLUÇÃO RÁPIDA**

### **Opção 1: Redeploy Manual**

1. Vercel → Deployments
2. Clique nos **3 pontos** do último deployment que funcionou
3. Clique em **"Redeploy"**
4. Aguarde concluir

### **Opção 2: Fazer Novo Commit**

```bash
# Adicione um arquivo qualquer para forçar novo deploy
echo "# Deploy fix" >> .vercelignore
git add .
git commit -m "fix: forçar novo deploy"
git push
```

---

## 📋 **CHECKLIST DE VERIFICAÇÃO**

- [ ] Logs do Vercel verificados
- [ ] Erro específico identificado
- [ ] Variáveis de ambiente configuradas
- [ ] Todas as variáveis marcadas para Production/Preview/Development
- [ ] Configuração do projeto verificada
- [ ] Build local funciona (`npm run build`)
- [ ] Novo deploy tentado

---

## 🆘 **PRÓXIMOS PASSOS**

1. **Me envie os logs do Vercel** (copie e cole a parte do erro)
2. Ou me diga qual é a mensagem de erro específica
3. Vou ajudar a resolver o problema exato

---

**A mensagem de erro específica vai ajudar muito a resolver rapidamente!** 🔍

