# 🧪 Guia: Testar Webhook da Kiwify

## ✅ **CONFIGURAÇÃO COMPLETA**

Você já configurou:
- ✅ Service Role Key no Vercel
- ✅ Redeploy feito
- ✅ Webhook configurado na Kiwify
- URL: `https://dashboard-fmteam.vercel.app/api/kiwify-webhook`

---

## 🧪 **TESTE 1: Verificar se o Endpoint Está Acessível**

### **Teste no Navegador:**

1. Abra o navegador
2. Acesse: `https://dashboard-fmteam.vercel.app/api/kiwify-webhook`
3. Deve retornar um JSON:

```json
{
  "success": true,
  "message": "Webhook Kiwify funcionando",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "endpoint": "/api/kiwify-webhook"
}
```

**Se retornar isso:** ✅ Endpoint está funcionando!

**Se der erro 404 ou 500:** ❌ Há um problema. Veja troubleshooting abaixo.

---

## 🧪 **TESTE 2: Testar com cURL (Terminal)**

Abra o terminal/PowerShell e execute:

```bash
curl https://dashboard-fmteam.vercel.app/api/kiwify-webhook
```

Ou no PowerShell:

```powershell
Invoke-WebRequest -Uri "https://dashboard-fmteam.vercel.app/api/kiwify-webhook" -Method GET
```

**Deve retornar:** JSON com `"success": true`

---

## 🧪 **TESTE 3: Simular Webhook da Kiwify (POST)**

### **Usando cURL:**

```bash
curl -X POST https://dashboard-fmteam.vercel.app/api/kiwify-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.paid",
    "data": {
      "id": "test_123",
      "customer": {
        "email": "teste@exemplo.com"
      },
      "payment": {
        "amount": 49.90,
        "method": "credit_card"
      },
      "metadata": {
        "userId": "SEU_USER_ID_AQUI",
        "planName": "basic"
      }
    }
  }'
```

### **Usando PowerShell:**

```powershell
$body = @{
    event = "order.paid"
    data = @{
        id = "test_123"
        customer = @{
            email = "teste@exemplo.com"
        }
        payment = @{
            amount = 49.90
            method = "credit_card"
        }
        metadata = @{
            userId = "SEU_USER_ID_AQUI"
            planName = "basic"
        }
    }
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "https://dashboard-fmteam.vercel.app/api/kiwify-webhook" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**⚠️ IMPORTANTE:** Substitua `SEU_USER_ID_AQUI` pelo ID real de um usuário do seu banco.

---

## 🧪 **TESTE 4: Verificar Logs do Vercel**

1. Acesse: https://vercel.com
2. Vá em seu projeto → **Deployments**
3. Clique no último deployment
4. Vá em **"Functions"** ou **"Logs"**
5. Procure por logs do `/api/kiwify-webhook`
6. Verifique se há erros

---

## 🧪 **TESTE 5: Verificar no Supabase**

### **Verificar se Webhooks Foram Salvos:**

1. Acesse: Supabase Dashboard
2. Vá em **Table Editor**
3. Abra a tabela `payment_webhooks`
4. Verifique se há registros novos após testar

---

## 🧪 **TESTE 6: Testar com Kiwify (Real)**

### **Opção 1: Botão de Teste na Kiwify**

1. Acesse: https://kiwify.com.br
2. Vá em **Configurações** → **Webhooks**
3. Encontre o webhook que você criou
4. Procure por um botão **"Testar"** ou **"Enviar Teste"**
5. Clique e verifique se recebeu

### **Opção 2: Fazer Pagamento de Teste**

1. Acesse sua página de planos: `https://dashboard-fmteam.vercel.app/pricing`
2. Clique em **"Assinar Agora"** em um plano
3. Complete o pagamento (use cartão de teste se disponível)
4. Verifique se:
   - Webhook foi recebido (logs do Vercel)
   - Assinatura foi ativada (tabela `user_subscriptions`)
   - Pagamento foi registrado (tabela `payments`)

---

## 🐛 **TROUBLESHOOTING**

### ❌ **Erro 404 - Endpoint não encontrado**

**Possíveis causas:**
1. Arquivo não foi deployado
2. Rota não está configurada no `vercel.json`

**Solução:**
1. Verifique se o arquivo `api/kiwify-webhook.js` existe
2. Faça commit e push:
   ```bash
   git add api/kiwify-webhook.js
   git commit -m "Adicionar webhook Kiwify"
   git push
   ```
3. Aguarde o deploy no Vercel

### ❌ **Erro 500 - Erro interno do servidor**

**Possíveis causas:**
1. Service Role Key não configurada
2. Variáveis de ambiente faltando
3. Erro no código

**Solução:**
1. Verifique logs do Vercel (Deployments → Logs)
2. Verifique se `VITE_SUPABASE_SERVICE_ROLE_KEY` está no Vercel
3. Verifique se `VITE_SUPABASE_URL` está no Vercel
4. Faça redeploy após adicionar variáveis

### ❌ **Webhook não recebe eventos da Kiwify**

**Possíveis causas:**
1. URL incorreta na Kiwify
2. Eventos não selecionados
3. Kiwify não consegue acessar o endpoint

**Solução:**
1. Verifique a URL na Kiwify (deve ser exatamente: `https://dashboard-fmteam.vercel.app/api/kiwify-webhook`)
2. Verifique se os eventos estão selecionados
3. Teste o endpoint manualmente primeiro (Teste 1)
4. Verifique logs do Vercel para ver se há tentativas de acesso

### ❌ **"Metadata inválida" no webhook**

**Causa:** O webhook não consegue identificar o usuário.

**Solução:**
O webhook tenta identificar o usuário de duas formas:
1. Via `metadata.userId` e `metadata.planName` (passados na URL do checkout)
2. Via email do cliente (fallback)

**Verificar:**
- Se os parâmetros estão sendo passados na URL do checkout
- Se o email do cliente na Kiwify corresponde ao email no banco (`user_profiles`)

---

## ✅ **CHECKLIST DE TESTE**

- [ ] Teste GET funciona (retorna JSON de sucesso)
- [ ] Teste POST funciona (simula webhook)
- [ ] Logs do Vercel mostram requisições
- [ ] Tabela `payment_webhooks` recebe registros
- [ ] Webhook da Kiwify está configurado corretamente
- [ ] Service Role Key está no Vercel
- [ ] Redeploy foi feito após configurar variáveis

---

## 📞 **PRÓXIMOS PASSOS**

Após confirmar que os testes funcionam:

1. ✅ **Fazer um pagamento real de teste**
2. ✅ **Verificar se assinatura é ativada automaticamente**
3. ✅ **Monitorar webhooks recebidos**
4. ✅ **Configurar alertas para erros (opcional)**

---

## 🔍 **VERIFICAR SE ESTÁ FUNCIONANDO**

### **Após um pagamento real, verifique:**

1. **Tabela `user_subscriptions`:**
   - Deve ter uma assinatura com `status = 'active'`
   - Deve ter `payment_provider = 'kiwify'`

2. **Tabela `payments`:**
   - Deve ter um registro com `status = 'paid'`
   - Deve ter `payment_provider = 'kiwify'`

3. **Tabela `payment_webhooks`:**
   - Deve ter um registro com `event_type = 'order.paid'`
   - Deve ter `processed = true`

---

**Dúvidas?** Verifique os logs do Vercel ou entre em contato!

