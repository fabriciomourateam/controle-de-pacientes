# 🚀 Guia Completo: Integração Kiwify - Configuração de ProductIds

Este guia vai te mostrar **exatamente** como configurar a integração com Kiwify usando productIds reais.

---

## 📋 **PRÉ-REQUISITOS**

Antes de começar, você precisa ter:
- ✅ Conta na Kiwify (https://kiwify.com.br)
- ✅ Acesso ao painel administrativo da Kiwify
- ✅ Os 4 planos já criados no banco de dados (Trial, Basic, Silver, Black)

---

## 📝 **PASSO 1: Criar Produtos na Kiwify**

### 1.1 Acessar o Painel Kiwify

1. Acesse https://kiwify.com.br
2. Faça login na sua conta
3. No menu lateral, clique em **"Produtos"**

### 1.2 Criar o Produto "Basic" (R$ 49,90/mês)

1. Clique em **"Novo Produto"** ou **"Criar Produto"**
2. Preencha os dados:
   - **Nome do Produto**: `Grow Nutri - Plano Basic`
   - **Preço**: `R$ 49,90`
   - **Tipo**: Selecione **"Assinatura Recorrente"** (mensal)
   - **Descrição**: 
     ```
     Plano Basic - Até 49 pacientes
     Ideal para nutricionistas que estão começando
     ```
3. Clique em **"Salvar"** ou **"Criar Produto"**
4. **IMPORTANTE**: Após criar, copie o **Product ID** (geralmente aparece na URL ou nas configurações do produto)
   - Exemplo: `abc123def456` ou `prod_xyz789`
   - **ANOTE ESTE ID** - você vai precisar dele!

### 1.3 Criar o Produto "Silver" (R$ 89,90/mês)

1. Repita o processo acima com:
   - **Nome**: `Grow Nutri - Plano Silver`
   - **Preço**: `R$ 89,90`
   - **Tipo**: Assinatura Recorrente (mensal)
   - **Descrição**: `Plano Silver - Até 99 pacientes`
2. **Copie o Product ID** e anote

### 1.4 Criar o Produto "Black" (R$ 149,90/mês)

1. Repita o processo com:
   - **Nome**: `Grow Nutri - Plano Black`
   - **Preço**: `R$ 149,90`
   - **Tipo**: Assinatura Recorrente (mensal)
   - **Descrição**: `Plano Black - 100+ pacientes`
2. **Copie o Product ID** e anote

### 1.5 Onde encontrar o Product ID?

O Product ID pode estar em diferentes lugares:

**Opção 1 - Na URL do produto:**
```
https://kiwify.com.br/products/SEU_PRODUCT_ID_AQUI
```

**Opção 2 - Nas configurações do produto:**
- Vá em **Produtos** > Clique no produto > **Configurações** ou **Detalhes**
- Procure por "ID do Produto" ou "Product ID"

**Opção 3 - Via API (se tiver acesso):**
- Use a API da Kiwify para listar produtos

---

## 📝 **PASSO 2: Obter API Key da Kiwify**

### 2.1 Acessar Configurações de API

1. No painel Kiwify, vá em **"Configurações"** ou **"Integrações"**
2. Procure por **"API"** ou **"Webhooks"**
3. Clique em **"Criar API Key"** ou **"Gerar Chave"**

### 2.2 Configurar a API Key

1. Dê um nome: `Grow Nutri Integration`
2. Selecione as permissões necessárias:
   - ✅ **Criar Checkouts**
   - ✅ **Ler Produtos**
   - ✅ **Ler Assinaturas**
3. Clique em **"Gerar"**
4. **COPIE A API KEY** - você só verá ela uma vez!
   - Exemplo: `kiw_live_abc123def456xyz789`
   - **ANOTE ESTA CHAVE** em local seguro

---

## 📝 **PASSO 3: Configurar Variáveis de Ambiente**

### 3.1 Criar arquivo `.env.local`

No diretório raiz do projeto, crie ou edite o arquivo `.env.local`:

```bash
# Kiwify Configuration
VITE_KIWIFY_API_KEY=kiw_live_SUA_API_KEY_AQUI
VITE_KIWIFY_PRODUCT_BASIC=SEU_PRODUCT_ID_BASIC
VITE_KIWIFY_PRODUCT_SILVER=SEU_PRODUCT_ID_SILVER
VITE_KIWIFY_PRODUCT_BLACK=SEU_PRODUCT_ID_BLACK
```

**Substitua:**
- `kiw_live_SUA_API_KEY_AQUI` pela sua API Key real
- `SEU_PRODUCT_ID_BASIC` pelo Product ID do plano Basic
- `SEU_PRODUCT_ID_SILVER` pelo Product ID do plano Silver
- `SEU_PRODUCT_ID_BLACK` pelo Product ID do plano Black

### 3.2 Exemplo Real:

```bash
# Kiwify Configuration
VITE_KIWIFY_API_KEY=kiw_live_abc123def456xyz789
VITE_KIWIFY_PRODUCT_BASIC=prod_basic_xyz123
VITE_KIWIFY_PRODUCT_SILVER=prod_silver_abc456
VITE_KIWIFY_PRODUCT_BLACK=prod_black_def789
```

### 3.3 Importante:

- ⚠️ **NUNCA** commite o arquivo `.env.local` no Git
- ✅ O arquivo `.env.local` já está no `.gitignore`
- ✅ Use `.env.example` como template (sem valores reais)

---

## 📝 **PASSO 4: Atualizar o Código**

O código já está preparado para usar as variáveis de ambiente. Você só precisa verificar se está tudo configurado corretamente.

### 4.1 Verificar arquivo `src/lib/kiwify-config.ts`

Este arquivo será criado automaticamente e vai mapear os planos para os productIds:

```typescript
export const kiwifyConfig = {
  apiKey: import.meta.env.VITE_KIWIFY_API_KEY || '',
  products: {
    basic: import.meta.env.VITE_KIWIFY_PRODUCT_BASIC || '',
    intermediate: import.meta.env.VITE_KIWIFY_PRODUCT_SILVER || '',
    advanced: import.meta.env.VITE_KIWIFY_PRODUCT_BLACK || '',
  }
};
```

### 4.2 Verificar arquivo `src/pages/Pricing.tsx`

O arquivo já está configurado para usar os productIds do `kiwifyConfig`.

---

## 📝 **PASSO 5: Testar a Integração**

### 5.1 Testar em Desenvolvimento

1. Certifique-se de que o arquivo `.env.local` está configurado
2. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Acesse a página de planos: `http://localhost:5173/pricing`
4. Clique em "Assinar Agora" em um plano pago
5. Verifique se você é redirecionado para o checkout da Kiwify

### 5.2 Verificar no Console

Abra o Console do navegador (F12) e verifique se não há erros relacionados à Kiwify.

### 5.3 Testar Checkout

1. Preencha os dados do checkout na Kiwify
2. Use um cartão de teste (se disponível)
3. Complete o pagamento
4. Verifique se o webhook foi recebido (ver próximo passo)

---

## 📝 **PASSO 6: Configurar Webhook da Kiwify**

### 6.1 Criar Endpoint de Webhook

O endpoint de webhook será criado no próximo passo. Por enquanto, você precisa saber a URL:

**URL do Webhook:**
```
https://SEU_DOMINIO.com/api/webhooks/kiwify
```

Ou se estiver usando Supabase Edge Functions:
```
https://SEU_PROJETO.supabase.co/functions/v1/kiwify-webhook
```

### 6.2 Configurar na Kiwify

1. No painel Kiwify, vá em **"Configurações"** > **"Webhooks"**
2. Clique em **"Adicionar Webhook"**
3. Preencha:
   - **URL**: `https://SEU_DOMINIO.com/api/webhooks/kiwify`
   - **Eventos** (selecione todos):
     - ✅ `order.paid` - Pagamento aprovado
     - ✅ `order.refunded` - Reembolso
     - ✅ `subscription.canceled` - Assinatura cancelada
     - ✅ `subscription.renewed` - Assinatura renovada
4. Clique em **"Salvar"**

### 6.3 Testar Webhook

A Kiwify geralmente oferece um botão "Testar Webhook" para verificar se está funcionando.

---

## 📝 **PASSO 7: Verificar Mapeamento de Planos**

### 7.1 Verificar Nomes dos Planos no Banco

Execute no Supabase SQL Editor:

```sql
SELECT id, name, display_name, price_monthly 
FROM subscription_plans 
ORDER BY price_monthly;
```

Você deve ver:
- `free` - Trial (R$ 0,00)
- `basic` - Basic (R$ 49,90)
- `intermediate` - Silver (R$ 89,90)
- `advanced` - Black (R$ 149,90)

### 7.2 Verificar Mapeamento no Código

O mapeamento está em `src/lib/kiwify-config.ts`:
- `basic` → `VITE_KIWIFY_PRODUCT_BASIC`
- `intermediate` → `VITE_KIWIFY_PRODUCT_SILVER`
- `advanced` → `VITE_KIWIFY_PRODUCT_BLACK`

---

## 🔧 **TROUBLESHOOTING**

### ❌ Erro: "Product ID não encontrado"

**Solução:**
1. Verifique se o Product ID está correto no `.env.local`
2. Verifique se o nome do plano no banco corresponde ao mapeamento
3. Verifique os logs do console para mais detalhes

### ❌ Erro: "API Key inválida"

**Solução:**
1. Verifique se a API Key está correta no `.env.local`
2. Certifique-se de que copiou a API Key completa (sem espaços)
3. Reinicie o servidor após alterar `.env.local`

### ❌ Checkout não abre

**Solução:**
1. Verifique se o Product ID está correto
2. Verifique se o produto está ativo na Kiwify
3. Verifique o console do navegador para erros

### ❌ Webhook não funciona

**Solução:**
1. Verifique se a URL do webhook está correta
2. Verifique se o endpoint está acessível publicamente
3. Verifique os logs do servidor/webhook

---

## ✅ **CHECKLIST FINAL**

Antes de considerar a integração completa, verifique:

- [ ] 4 produtos criados na Kiwify (Basic, Silver, Black)
- [ ] Product IDs anotados e configurados no `.env.local`
- [ ] API Key da Kiwify configurada no `.env.local`
- [ ] Servidor reiniciado após configurar `.env.local`
- [ ] Teste de checkout funcionando
- [ ] Webhook configurado na Kiwify
- [ ] Teste de webhook funcionando
- [ ] Mapeamento de planos verificado

---

## 📞 **PRÓXIMOS PASSOS**

Após completar este guia:

1. ✅ **Criar endpoint de webhook** (próximo passo)
2. ✅ **Testar fluxo completo** (criar checkout → pagar → receber webhook)
3. ✅ **Configurar em produção** (usar variáveis de ambiente do Vercel/Netlify)

---

## 📚 **RECURSOS ÚTEIS**

- [Documentação Kiwify](https://developers.kiwify.com.br)
- [API Kiwify](https://developers.kiwify.com.br/api)
- [Webhooks Kiwify](https://developers.kiwify.com.br/webhooks)

---

**Dúvidas?** Verifique os logs do console ou entre em contato com o suporte da Kiwify.

