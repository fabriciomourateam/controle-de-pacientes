# 🚀 Guia: Configurar Kiwify em Produção (Vercel)

## ✅ **ARQUIVO `.env.local` CRIADO**

O arquivo `.env.local` foi criado com sucesso! Agora você precisa configurar as mesmas variáveis no Vercel para produção.

---

## 📝 **PASSO A PASSO: Configurar no Vercel**

### **1. Acessar o Painel do Vercel**

1. Acesse https://vercel.com
2. Faça login na sua conta
3. Selecione o projeto **controle-de-pacientes** (ou o nome do seu projeto)

### **2. Configurar Variáveis de Ambiente**

1. No menu do projeto, clique em **"Settings"**
2. No menu lateral, clique em **"Environment Variables"**
3. Adicione as seguintes variáveis:

#### **URLs de Checkout:**
```
VITE_KIWIFY_CHECKOUT_BASIC
Valor: https://pay.kiwify.com.br/46MiJGu
Ambientes: Production, Preview, Development (marque todos)
```

```
VITE_KIWIFY_CHECKOUT_SILVER
Valor: https://pay.kiwify.com.br/zjREgXM
Ambientes: Production, Preview, Development (marque todos)
```

```
VITE_KIWIFY_CHECKOUT_BLACK
Valor: https://pay.kiwify.com.br/K8Ykpu5
Ambientes: Production, Preview, Development (marque todos)
```

#### **Credenciais para Webhooks:**
```
VITE_KIWIFY_CLIENT_ID
Valor: 25c35e55-4929-4948-a040-e3f84cecbbfc
Ambientes: Production, Preview, Development (marque todos)
```

```
VITE_KIWIFY_CLIENT_SECRET
Valor: 844242ec3447e0b43ae5de6cb0c2ae9f91444f33c938de1d08bb18698637ae46
Ambientes: Production, Preview, Development (marque todos)
```

```
VITE_KIWIFY_ACCOUNT_ID
Valor: 6Brjl5ktTiUoD9s
Ambientes: Production, Preview, Development (marque todos)
```

### **3. Salvar e Fazer Redeploy**

1. Clique em **"Save"** após adicionar cada variável
2. Vá em **"Deployments"**
3. Clique nos **3 pontos (...)** do último deployment
4. Selecione **"Redeploy"**
5. Aguarde o deploy concluir

---

## ✅ **CHECKLIST DE CONFIGURAÇÃO**

- [ ] Arquivo `.env.local` criado localmente
- [ ] Variável `VITE_KIWIFY_CHECKOUT_BASIC` configurada no Vercel
- [ ] Variável `VITE_KIWIFY_CHECKOUT_SILVER` configurada no Vercel
- [ ] Variável `VITE_KIWIFY_CHECKOUT_BLACK` configurada no Vercel
- [ ] Variável `VITE_KIWIFY_CLIENT_ID` configurada no Vercel
- [ ] Variável `VITE_KIWIFY_CLIENT_SECRET` configurada no Vercel
- [ ] Variável `VITE_KIWIFY_ACCOUNT_ID` configurada no Vercel
- [ ] Todas as variáveis marcadas para Production, Preview e Development
- [ ] Redeploy feito após configurar as variáveis

---

## 🧪 **TESTAR EM PRODUÇÃO**

Após configurar e fazer o redeploy:

1. Acesse sua aplicação em produção
2. Vá para a página de planos: `https://SEU_DOMINIO.com/pricing`
3. Clique em **"Assinar Agora"** em um plano pago
4. Verifique se redireciona para o checkout da Kiwify

---

## 🔍 **VERIFICAR SE ESTÁ FUNCIONANDO**

### **Em Desenvolvimento:**
```bash
# Reinicie o servidor
npm run dev

# Acesse: http://localhost:5173/pricing
# Teste clicando em "Assinar Agora"
```

### **Em Produção:**
1. Acesse o site em produção
2. Abra o Console do navegador (F12)
3. Vá para a página de planos
4. Clique em "Assinar Agora"
5. Verifique se não há erros no console
6. Verifique se redireciona para Kiwify

---

## ⚠️ **IMPORTANTE**

- ✅ O arquivo `.env.local` **NÃO** deve ser commitado no Git (já está no `.gitignore`)
- ✅ As variáveis no Vercel são **obrigatórias** para produção funcionar
- ✅ Após adicionar variáveis no Vercel, **sempre faça um redeploy**
- ✅ Variáveis que começam com `VITE_` são expostas no frontend (isso é normal para URLs de checkout)

---

## 🐛 **TROUBLESHOOTING**

### ❌ Checkout não funciona em produção
- Verifique se todas as variáveis estão configuradas no Vercel
- Verifique se fez redeploy após configurar
- Verifique os logs do Vercel para erros

### ❌ Variáveis não aparecem
- Certifique-se de que as variáveis começam com `VITE_`
- Verifique se marcou os ambientes corretos (Production, Preview, Development)
- Faça um novo deploy após adicionar variáveis

### ❌ Erro "Configuração da Kiwify incompleta"
- Verifique se todas as 3 URLs de checkout estão configuradas
- Verifique se não há espaços extras nas URLs
- Verifique se as URLs estão completas (com `https://`)

---

## 📚 **RECURSOS**

- [Documentação Vercel - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Documentação Kiwify](https://developers.kiwify.com.br)

---

**Pronto!** Agora sua aplicação está configurada tanto para desenvolvimento quanto para produção! 🎉

