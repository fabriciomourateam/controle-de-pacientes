# Guia de Configuração: Webhook de Contato

Este guia explica como configurar o webhook de contato para enviar mensagens de áudio automaticamente aos pacientes.

## 📋 Funcionalidade

O botão **"Contatar"** foi adicionado em todas as listas de retenção:
- ✅ Tarefas do Dia
- ✅ Alunos Críticos
- ✅ Alunos em Atenção

Ao clicar no botão, o sistema:
1. Busca o webhook configurado para o nutricionista atual
2. Se não encontrar, usa o webhook padrão de teste
3. Envia uma requisição POST com:
   - `telefone`: Número do paciente (apenas dígitos)
   - `nome`: Nome do paciente
   - `timestamp`: Data/hora do envio

## 🔧 Configuração do Webhook

### Opção 1: Usar o Webhook Padrão (Produção)

Por padrão, o sistema usa o webhook de produção:
```
https://n8n.shapepro.shop/webhook/enviarmsg
```

Não é necessário fazer nada se você quiser usar este webhook.

### Opção 2: Configurar Webhook Personalizado por Nutricionista

Cada nutricionista pode ter seu próprio webhook configurado na tabela `user_webhook_configs`.

#### Via SQL (Supabase Dashboard):

1. Acesse o **SQL Editor** no Supabase
2. Execute o seguinte SQL (substitua a URL pelo seu webhook de produção):

```sql
INSERT INTO user_webhook_configs (user_id, webhook_type, webhook_url, enabled, config)
VALUES (
  auth.uid(), -- ID do usuário atual
  'contact',
  'https://seu-webhook-de-producao.com/webhook/enviarmsg', -- Seu webhook
  true,
  '{}'::jsonb
)
ON CONFLICT (user_id, webhook_type) 
DO UPDATE SET 
  webhook_url = EXCLUDED.webhook_url,
  enabled = EXCLUDED.enabled,
  updated_at = NOW();
```

#### Via Interface (Futuro):

Uma interface de configuração pode ser adicionada na página de Configurações para gerenciar webhooks visualmente.

## 📡 Formato da Requisição

O webhook recebe uma requisição POST com o seguinte formato:

```json
{
  "telefone": "5511999999999",
  "nome": "João Silva",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Headers:**
```
Content-Type: application/json
```

## 🔐 Segurança

- Cada nutricionista só pode ver e configurar seus próprios webhooks
- O sistema usa Row Level Security (RLS) para garantir isolamento de dados
- Se o webhook não estiver configurado, usa o padrão de teste

## ✅ Testando

1. Acesse o Dashboard de Retenção
2. Clique no botão **"Contatar"** em qualquer paciente
3. Verifique o console do navegador para logs
4. Verifique se o webhook foi chamado no seu n8n

## 🐛 Troubleshooting

### Webhook não está sendo chamado

1. Verifique se o webhook está habilitado (`enabled = true`)
2. Verifique os logs do console do navegador
3. Verifique se o usuário está autenticado

### Erro 404 ou 500

1. Verifique se a URL do webhook está correta
2. Verifique se o webhook está ativo no n8n
3. Verifique os logs do n8n para ver o que foi recebido

### Webhook padrão não funciona

1. Verifique se a URL `https://n8n.shapepro.shop/webhook/enviarmsg` está acessível
2. Configure um webhook personalizado usando a Opção 2 acima

## 📝 Notas

- O webhook padrão é o de produção: `https://n8n.shapepro.shop/webhook/enviarmsg`
- Cada nutricionista pode configurar seu próprio webhook personalizado se necessário
- O telefone é enviado sem formatação (apenas dígitos)
- O nome é enviado exatamente como está no banco de dados

