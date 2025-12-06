# ✅ Configuração Kiwify - Dados Fornecidos

## 📋 **DADOS CONFIGURADOS**

Você forneceu os seguintes dados da Kiwify:

### **URLs de Checkout:**
- **Basic**: `https://pay.kiwify.com.br/46MiJGu`
- **Silver**: `https://pay.kiwify.com.br/zjREgXM`
- **Black**: `https://pay.kiwify.com.br/K8Ykpu5`

### **Credenciais (para webhooks):**
- **Client ID**: `25c35e55-4929-4948-a040-e3f84cecbbfc`
- **Client Secret**: `844242ec3447e0b43ae5de6cb0c2ae9f91444f33c938de1d08bb18698637ae46`
- **Account ID**: `6Brjl5ktTiUoD9s`

### **Página de Vendas:**
- `https://kiwify.app/Rm6eu0a`

---

## 🔧 **CONFIGURAÇÃO NO PROJETO**

### **1. Criar/Editar arquivo `.env.local`**

No diretório raiz do projeto, crie ou edite o arquivo `.env.local` e adicione:

```bash
# URLs de Checkout Kiwify
VITE_KIWIFY_CHECKOUT_BASIC=https://pay.kiwify.com.br/46MiJGu
VITE_KIWIFY_CHECKOUT_SILVER=https://pay.kiwify.com.br/zjREgXM
VITE_KIWIFY_CHECKOUT_BLACK=https://pay.kiwify.com.br/K8Ykpu5

# Credenciais para Webhooks (opcional - necessário apenas para processar webhooks)
VITE_KIWIFY_CLIENT_ID=25c35e55-4929-4948-a040-e3f84cecbbfc
VITE_KIWIFY_CLIENT_SECRET=844242ec3447e0b43ae5de6cb0c2ae9f91444f33c938de1d08bb18698637ae46
VITE_KIWIFY_ACCOUNT_ID=6Brjl5ktTiUoD9s
```

### **2. Reiniciar o Servidor**

```bash
# Pare o servidor (Ctrl+C) e inicie novamente
npm run dev
```

### **3. Testar**

1. Acesse: `http://localhost:5173/pricing`
2. Clique em **"Assinar Agora"** em um plano pago
3. Deve redirecionar para o checkout da Kiwify

---

## ✅ **PRONTO!**

A integração está configurada! Agora quando um usuário clicar em "Assinar Agora", ele será redirecionado para o checkout da Kiwify.

---

## 🔄 **PRÓXIMO PASSO: Webhook**

Para receber notificações automáticas quando um pagamento for aprovado, precisamos configurar o webhook da Kiwify. Isso será feito no próximo passo.

---

## 📝 **NOTAS IMPORTANTES**

- ⚠️ **NUNCA** commite o arquivo `.env.local` no Git (já está no `.gitignore`)
- ✅ As URLs de checkout já estão configuradas no código
- ✅ O código adiciona automaticamente o email do usuário na URL do checkout
- ✅ Os dados do usuário (userId, planName) são passados via metadata na URL

---

## 🐛 **TROUBLESHOOTING**

### ❌ Checkout não abre
- Verifique se o arquivo `.env.local` está configurado corretamente
- Verifique se reiniciou o servidor após configurar
- Verifique o console do navegador (F12) para erros

### ❌ URL incorreta
- Verifique se copiou as URLs completas (com `https://`)
- Verifique se não há espaços extras nas URLs

---

**Dúvidas?** Verifique os logs do console ou consulte a documentação da Kiwify.

