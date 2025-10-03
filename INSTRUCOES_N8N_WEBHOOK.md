# Configuração N8N Webhook para Métricas Comerciais

## Visão Geral
Esta integração permite que a página "Métricas Comerciais" busque dados diretamente do N8N via webhook, garantindo dados completos e atualizados.

## Configuração do N8N

### 1. Criar Workflow no N8N

1. Acesse seu N8N
2. Crie um novo workflow
3. Configure os seguintes nós:

#### Nó 1: Webhook (Trigger)
- **Tipo**: Webhook
- **HTTP Method**: GET
- **Path**: `/commercial-metrics`
- **Response Mode**: "On Received"

#### Nó 2: Buscar Dados da Planilha
- **Tipo**: Google Sheets
- **Operation**: "Read"
- **Spreadsheet ID**: `1BTzBftwg_C6rxzNYmIHTvlCGNH1GuyjIQHzGQlkQQuo`
- **Sheet Name**: `RELATÓRIO DE LEADS (SDR)`
- **Range**: `A2:Z100`

#### Nó 3: Processar Dados
- **Tipo**: Code (JavaScript)
- **Código**:

```javascript
// Processar dados da planilha
const rows = $input.all();

const dailyLeads = [];
const dailyCalls = [];

// Processar cada linha
for (const row of rows) {
  const data = row.json;
  
  if (data && data.length >= 10 && data[0]) {
    const date = data[0]; // Coluna A - DATA
    
    // Leads
    const google = parseNumber(data[1] || '0');
    const googleForms = parseNumber(data[2] || '0');
    const instagram = parseNumber(data[3] || '0');
    const facebook = parseNumber(data[4] || '0');
    const seller = parseNumber(data[5] || '0');
    const indicacao = parseNumber(data[6] || '0');
    const outros = parseNumber(data[7] || '0');
    const total = parseNumber(data[8] || '0');
    
    // Calls
    const callsAgendadas = parseNumber(data[17] || '0'); // Coluna R
    
    dailyLeads.push({
      date: formatDate(date),
      google,
      googleForms,
      instagram,
      facebook,
      seller,
      indicacao,
      outros,
      total
    });
    
    dailyCalls.push({
      date: formatDate(date),
      scheduled: callsAgendadas,
      completed: Math.round(callsAgendadas * 0.8) // Estimativa
    });
  }
}

// Calcular métricas mensais
const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();
const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

const currentMonthLeads = dailyLeads
  .filter(item => {
    const itemDate = new Date(item.date);
    return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
  })
  .reduce((sum, item) => sum + item.total, 0);

const previousMonthLeads = dailyLeads
  .filter(item => {
    const itemDate = new Date(item.date);
    return itemDate.getMonth() === previousMonth && itemDate.getFullYear() === previousYear;
  })
  .reduce((sum, item) => sum + item.total, 0);

const currentMonthCalls = dailyCalls
  .filter(item => {
    const itemDate = new Date(item.date);
    return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
  })
  .reduce((sum, item) => sum + item.scheduled, 0);

const previousMonthCalls = dailyCalls
  .filter(item => {
    const itemDate = new Date(item.date);
    return itemDate.getMonth() === previousMonth && itemDate.getFullYear() === previousYear;
  })
  .reduce((sum, item) => sum + item.scheduled, 0);

const totalLeads = dailyLeads.reduce((sum, item) => sum + item.total, 0);
const totalCalls = dailyCalls.reduce((sum, item) => sum + item.scheduled, 0);
const conversionRate = totalLeads > 0 ? (totalCalls / totalLeads) * 100 : 0;

// Funções auxiliares
function parseNumber(value) {
  if (!value || value.toString().trim() === '') return 0;
  const cleaned = value.toString().replace(/[^\d,.-]/g, '');
  const normalized = cleaned.replace(',', '.');
  return parseFloat(normalized) || 0;
}

function formatDate(dateStr) {
  // Tenta diferentes formatos de data
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,   // YYYY-MM-DD
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,   // DD-MM-YYYY
  ];

  for (const format of formats) {
    const match = dateStr.toString().match(format);
    if (match) {
      if (format === formats[0]) { // DD/MM/YYYY
        const date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
        return date.toISOString().split('T')[0];
      } else if (format === formats[1]) { // YYYY-MM-DD
        const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        return date.toISOString().split('T')[0];
      } else { // DD-MM-YYYY
        const date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
        return date.toISOString().split('T')[0];
      }
    }
  }

  // Fallback
  return new Date(dateStr).toISOString().split('T')[0];
}

// Retornar dados processados
return {
  success: true,
  data: {
    dailyLeads: dailyLeads.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    dailyCalls: dailyCalls.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    monthlyLeads: {
      current: currentMonthLeads,
      previous: previousMonthLeads,
      growth: previousMonthLeads > 0 ? ((currentMonthLeads - previousMonthLeads) / previousMonthLeads) * 100 : 0
    },
    monthlyCalls: {
      current: currentMonthCalls,
      previous: previousMonthCalls,
      growth: previousMonthCalls > 0 ? ((currentMonthCalls - previousMonthCalls) / previousMonthCalls) * 100 : 0
    },
    totalLeads,
    totalCalls,
    conversionRate
  },
  lastUpdated: new Date().toISOString()
};
```

#### Nó 4: Responder Webhook
- **Tipo**: Respond to Webhook
- **Response Code**: 200
- **Response Body**: `{{ $json }}`

### 2. Configurar Webhook Adicional para Atualização

Crie um segundo webhook para forçar atualização:

#### Nó 1: Webhook (Trigger)
- **Tipo**: Webhook
- **HTTP Method**: POST
- **Path**: `/commercial-metrics/refresh`

#### Nó 2-4: Mesmos nós do workflow principal

### 3. Configurar URL no Código

Atualize a URL do webhook no arquivo `src/lib/n8n-metrics-service.ts`:

```typescript
private static readonly N8N_WEBHOOK_URL = 'https://SEU-N8N-INSTANCE.com/webhook/commercial-metrics';
```

### 4. Testar a Integração

1. Acesse "Métricas Comerciais" no sistema
2. Use o botão "Testar Conexão" na seção Configuração
3. Verifique se os dados são carregados corretamente

## Vantagens da Integração N8N

### ✅ **Benefícios:**
- **Dados Completos**: Acesso a todos os dados do N8N
- **Processamento Robusto**: Lógica de processamento no N8N
- **Fallback Automático**: Google Sheets como backup
- **Atualização Forçada**: Endpoint para refresh manual
- **Controle Total**: Você controla como os dados são processados

### 🔧 **Configurações Avançadas:**

#### Agendamento Automático
- Configure um trigger de tempo no N8N
- Execute o workflow diariamente às 6h
- Mantenha os dados sempre atualizados

#### Cache de Dados
- Adicione um nó de cache no N8N
- Reduza chamadas desnecessárias à planilha
- Melhore a performance

#### Logs e Monitoramento
- Adicione logs no N8N
- Monitore falhas e performance
- Configure alertas

## Solução de Problemas

### Erro: "N8N não disponível"
- Verifique se o N8N está rodando
- Confirme a URL do webhook
- Teste o webhook diretamente no navegador

### Erro: "Dados incompletos"
- Verifique se a planilha está acessível
- Confirme as permissões do Google Sheets
- Revise a lógica de processamento no N8N

### Erro: "Timeout"
- Aumente o timeout no código (atualmente 10s)
- Otimize o workflow no N8N
- Considere usar cache

## Monitoramento

A página mostra:
- Status da conexão N8N
- Última atualização dos dados
- Botão para forçar atualização
- Fallback automático para Google Sheets

Com essa configuração, você terá acesso a todos os dados do N8N de forma confiável e com fallback automático!
