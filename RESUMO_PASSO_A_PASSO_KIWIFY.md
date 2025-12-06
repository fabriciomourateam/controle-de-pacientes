# ✅ RESUMO RÁPIDO: Configuração Kiwify

## 🎯 **O QUE VOCÊ PRECISA FAZER (Passo a Passo Simples)**

### **1️⃣ Criar Produtos na Kiwify** (5 minutos)

1. Acesse https://kiwify.com.br e faça login
2. Vá em **"Produtos"** > **"Novo Produto"**
3. Crie 3 produtos:

| Plano | Nome | Preço | Tipo |
|-------|------|-------|------|
| **Basic** | `Grow Nutri - Plano Basic` | R$ 49,90 | Assinatura Mensal |
| **Silver** | `Grow Nutri - Plano Silver` | R$ 89,90 | Assinatura Mensal |
| **Black** | `Grow Nutri - Plano Black` | R$ 149,90 | Assinatura Mensal |

4. **Copie o Product ID de cada produto** (aparece na URL ou nas configurações)

---

### **2️⃣ Obter API Key** (2 minutos)

1. No painel Kiwify: **"Configurações"** > **"API"**
2. Clique em **"Criar API Key"**
3. Nome: `Grow Nutri Integration`
4. **Copie a API Key** (você só verá ela uma vez!)

---

### **3️⃣ Configurar no Projeto** (3 minutos)

1. No diretório do projeto, crie/edite o arquivo `.env.local`
2. Adicione:

```bash
VITE_KIWIFY_API_KEY=COLE_SUA_API_KEY_AQUI
VITE_KIWIFY_PRODUCT_BASIC=COLE_PRODUCT_ID_BASIC_AQUI
VITE_KIWIFY_PRODUCT_SILVER=COLE_PRODUCT_ID_SILVER_AQUI
VITE_KIWIFY_PRODUCT_BLACK=COLE_PRODUCT_ID_BLACK_AQUI
```

3. **Substitua** os valores pelos seus dados reais
4. Salve o arquivo

---

### **4️⃣ Reiniciar o Servidor** (1 minuto)

```bash
# Pare o servidor (Ctrl+C) e inicie novamente
npm run dev
```

---

### **5️⃣ Testar** (2 minutos)

1. Acesse: `http://localhost:5173/pricing`
2. Clique em **"Assinar Agora"** em um plano pago
3. Deve abrir o checkout da Kiwify

---

## ✅ **PRONTO!**

Se o checkout abrir corretamente, a integração está funcionando! 🎉

---

## 📋 **CHECKLIST**

- [ ] 3 produtos criados na Kiwify
- [ ] Product IDs copiados
- [ ] API Key obtida
- [ ] Arquivo `.env.local` criado e configurado
- [ ] Servidor reiniciado
- [ ] Teste de checkout funcionando

---

## ❓ **DÚVIDAS?**

Consulte o guia completo: `GUIA_INTEGRACAO_KIWIFY.md`

---

## 🔄 **PRÓXIMO PASSO**

Depois de configurar, vamos criar o endpoint de webhook para receber os eventos da Kiwify automaticamente.

