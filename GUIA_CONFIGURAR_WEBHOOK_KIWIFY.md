# 🔗 Guia: Configurar Webhook da Kiwify

## ✅ **ENDPOINT CRIADO**

O endpoint de webhook foi criado em: `/api/kiwify-webhook.js`

**URL do Webhook:**
```
https://SEU_DOMINIO.vercel.app/api/kiwify-webhook
```

---

## 📝 **PASSO A PASSO: Configurar na Kiwify**

### **1. Acessar Configurações de Webhook**

1. Acesse https://kiwify.com.br
2. Faça login na sua conta
3. Vá em **"Configurações"** ou **"Integrações"**
4. Procure por **"Webhooks"** ou **"Notificações"**

### **2. Adicionar Novo Webhook**

1. Clique em **"Adicionar Webhook"** ou **"Criar Webhook"**
2. Preencha os dados:

**URL do Webhook:**
```
https://SEU_DOMINIO.vercel.app/api/kiwify-webhook
```

**⚠️ IMPORTANTE:** Substitua `SEU_DOMINIO` pelo domínio real do seu site no Vercel.

**Eventos para Escutar** (marque todos):
- ✅ `order.paid` - Pagamento aprovado
- ✅ `order.refunded` - Reembolso
- ✅ `subscription.canceled` - Assinatura cancelada
- ✅ `subscription.renewed` - Assinatura renovada

**Método:** `POST`

**Headers** (se solicitado):
- `Content-Type: application/json`

3. Clique em **"Salvar"** ou **"Criar Webhook"**

---

## 🧪 **TESTAR O WEBHOOK**

### **1. Testar Endpoint (GET)**

Acesse no navegador:
```
https://SEU_DOMINIO.vercel.app/api/kiwify-webhook
```

Deve retornar:
```json
{
  "success": true,
  "message": "Webhook Kiwify funcionando",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "endpoint": "/api/kiwify-webhook"
}
```

### **2. Testar com Kiwify**

A Kiwify geralmente oferece um botão **"Testar Webhook"** ou **"Enviar Teste"** nas configurações do webhook.

### **3. Verificar Logs**

Após um teste, verifique:
- **Logs do Vercel:** Vercel Dashboard → Deployments → Logs
- **Tabela `payment_webhooks`:** No Supabase, verifique se o webhook foi salvo

---

## 🔧 **CONFIGURAR VARIÁVEIS NO VERCEL**

O webhook precisa da **Service Role Key** do Supabase para funcionar.

### **Adicionar no Vercel:**

1. Acesse Vercel → Seu Projeto → **Settings** → **Environment Variables**
2. Adicione:

```
VITE_SUPABASE_SERVICE_ROLE_KEY
Valor: SUA_SERVICE_ROLE_KEY_AQUI
Ambientes: Production, Preview, Development (marque todos)
```

**⚠️ IMPORTANTE:** 
- Obtenha a Service Role Key em: Supabase Dashboard → Settings → API → `service_role` key
- Esta chave tem acesso total ao banco (bypassa RLS)
- **NUNCA** exponha esta chave no frontend

3. Clique em **"Save"**
4. Faça um **redeploy**

---

## 📋 **O QUE O WEBHOOK FAZ**

### **Quando recebe `order.paid`:**
1. ✅ Salva o webhook na tabela `payment_webhooks`
2. ✅ Identifica o usuário (via metadata ou email)
3. ✅ Busca o plano correspondente
4. ✅ Cria/atualiza a assinatura como `active`
5. ✅ Registra o pagamento na tabela `payments`
6. ✅ Marca o webhook como processado

### **Quando recebe `order.refunded`:**
1. ✅ Atualiza o pagamento como `refunded`
2. ✅ Cancela a assinatura se houver

### **Quando recebe `subscription.canceled`:**
1. ✅ Atualiza a assinatura como `canceled`

### **Quando recebe `subscription.renewed`:**
1. ✅ Atualiza o período da assinatura
2. ✅ Registra o novo pagamento

---

## ✅ **CHECKLIST DE CONFIGURAÇÃO**

- [ ] Endpoint criado (`/api/kiwify-webhook.js`)
- [ ] Webhook configurado na Kiwify
- [ ] URL do webhook correta (com domínio real)
- [ ] Eventos selecionados (order.paid, order.refunded, etc.)
- [ ] Service Role Key configurada no Vercel
- [ ] Redeploy feito após configurar variáveis
- [ ] Teste do endpoint funcionando (GET)
- [ ] Teste do webhook funcionando (via Kiwify)

---

## 🐛 **TROUBLESHOOTING**

### ❌ Webhook não recebe eventos

**Verificar:**
1. URL está correta no Kiwify?
2. Endpoint está acessível publicamente?
3. Teste GET funciona?
4. Verifique logs do Vercel

### ❌ Erro "Configuração do servidor incompleta"

**Solução:**
1. Verifique se `VITE_SUPABASE_URL` está no Vercel
2. Verifique se `VITE_SUPABASE_SERVICE_ROLE_KEY` está no Vercel
3. Faça redeploy após adicionar variáveis

### ❌ Erro "Metadata inválida"

**Solução:**
O webhook tenta identificar o usuário de duas formas:
1. Via `metadata.userId` e `metadata.planName` (passados na URL do checkout)
2. Via email do cliente (fallback)

Se nenhuma funcionar, verifique:
- Se os parâmetros estão sendo passados na URL do checkout
- Se o email do cliente na Kiwify corresponde ao email no banco

### ❌ Assinatura não é ativada

**Verificar:**
1. Logs do webhook no Vercel
2. Tabela `payment_webhooks` no Supabase (ver se há erros)
3. Tabela `user_subscriptions` (ver se foi criada/atualizada)

---

## 📚 **PRÓXIMOS PASSOS**

Após configurar o webhook:

1. ✅ **Testar fluxo completo:**
   - Usuário clica em "Assinar Agora"
   - É redirecionado para Kiwify
   - Faz o pagamento
   - Webhook recebe notificação
   - Assinatura é ativada automaticamente

2. ✅ **Monitorar:**
   - Verificar tabela `payment_webhooks` regularmente
   - Verificar logs do Vercel
   - Verificar se assinaturas estão sendo ativadas

3. ✅ **Melhorias futuras:**
   - Adicionar notificações por email quando assinatura é ativada
   - Dashboard para ver webhooks recebidos
   - Alertas para webhooks com erro

---

**Pronto!** Agora o sistema está completo e automatizado! 🎉

