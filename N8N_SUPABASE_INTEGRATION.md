# Integração N8N com Supabase - Solução para Problema de "null" String

## Problema Identificado

O erro `invalid input syntax for type integer: "null"` ocorria porque o N8N estava enviando a string `"null"` em vez do valor `null` real para campos INTEGER no Supabase.

## Solução Implementada

### 1. Função de Sanitização

Criamos uma função `sanitizeN8NData` que:
- Converte strings `"null"` para `null` real
- Converte strings vazias `""` para `null`
- Converte strings numéricas para números quando apropriado
- Mantém valores válidos inalterados

### 2. Webhooks Atualizados

#### Webhook para Pacientes (`/api/n8n-webhook.ts`)
- Atualizado para usar sanitização de dados
- Processa dados da tabela `patients`

#### Webhook para Checkins (`/api/n8n-checkin-webhook.ts`)
- Novo webhook específico para dados de checkin
- Sanitização específica para campos da tabela `checkin`
- Campos obrigatórios: `telefone`, `mes_ano`
- Campos opcionais com valores padrão quando necessário

### 3. Serviço N8N Atualizado (`src/lib/n8n-webhook.ts`)
- Classe `N8NWebhookService` com sanitização integrada
- Métodos para processar dados individuais e em lote

## Como Usar

### Para Checkins (Recomendado)

Use o endpoint: `POST /api/n8n-checkin-webhook`

**Dados mínimos necessários:**
```json
{
  "telefone": "11999999999",
  "mes_ano": "2024-01"
}
```

**Exemplo completo:**
```json
{
  "telefone": "11999999999",
  "mes_ano": "2024-01",
  "peso": 70.5,
  "medida": 85.0,
  "treino": "Fiz 3 treinos esta semana",
  "cardio": "30 minutos por dia",
  "pontos_treinos": 8,
  "pontos_cardios": 7,
  "total_pontuacao": 75
}
```

### Para Pacientes

Use o endpoint: `POST /api/n8n-webhook`

## Campos Suportados

### Campos Numéricos (convertidos automaticamente)
- `peso`, `medida`
- `pontos_treinos`, `pontos_cardios`, `pontos_descanso_entre_series`
- `pontos_refeicao_livre`, `pontos_beliscos`, `pontos_agua`
- `pontos_sono`, `pontos_qualidade_sono`, `pontos_stress`
- `pontos_libido`, `total_pontuacao`, `percentual_aproveitamento`

### Campos de Texto
- `treino`, `cardio`, `agua`, `sono`
- `ref_livre`, `beliscos`, `oq_comeu_ref_livre`
- `melhora_visual`, `quais_pontos`, `objetivo`
- `dificuldades`, `stress`, `libido`
- `foto_1`, `foto_2`, `foto_3`, `foto_4`

## Tratamento de Valores Nulos

A função de sanitização trata os seguintes casos:
- `"null"` → `null`
- `""` (string vazia) → `null`
- `undefined` → `null`
- Strings numéricas válidas → Números

## Logs de Debug

Os webhooks incluem logs detalhados para debug:
- Dados recebidos do N8N
- Dados após sanitização
- Erros específicos do Supabase

## Testando a Solução

1. Configure seu fluxo N8N para enviar dados para o webhook correto
2. Verifique os logs no console para confirmar a sanitização
3. Os dados devem ser inseridos no Supabase sem erros de tipo

## Benefícios

- ✅ Aceita qualquer formato de dados do N8N
- ✅ Converte automaticamente tipos de dados
- ✅ Trata valores nulos corretamente
- ✅ Logs detalhados para debug
- ✅ Suporte a inserção em lote
- ✅ Validação de campos obrigatórios
