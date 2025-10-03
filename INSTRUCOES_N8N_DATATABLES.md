# Configuração N8N DataTables para Métricas Comerciais

## Visão Geral
Esta integração busca dados diretamente das tabelas nativas do N8N, utilizando a API oficial do N8N. Isso garante acesso a todos os dados processados pelo seu workflow.

## Configuração da API N8N

### 1. Obter API Key do N8N

1. Acesse seu N8N
2. Vá em **Settings** > **API Keys**
3. Clique em **Create API Key**
4. Dê um nome (ex: "Métricas Comerciais")
5. Selecione as permissões necessárias:
   - ✅ **Read** para DataTables
   - ✅ **Read** para Workflows (opcional)
6. Copie a API Key gerada

### 2. Configurar URL e API Key

Atualize o arquivo `src/lib/n8n-datatable-service.ts`:

```typescript
private static readonly N8N_BASE_URL = 'https://SEU-N8N-INSTANCE.com';
private static readonly API_KEY = 'SUA-API-KEY-AQUI';
```

### 3. Verificar IDs das Tabelas

Os IDs das tabelas já estão configurados baseados no seu workflow:

```typescript
private static readonly TABLES = {
  LEADS_QUE_ENTRARAM: '07P5hv4Q2O4fRA7t', // "Leads que Entraram"
  TOTAL_LEADS_MES: '6qM6zJYfYvGhhSTM', // "Total de Leads"
  CALLS_AGENDADAS: 'd3CAyQhEPlaMKw6e', // "Total de Calls Agendadas"
  LEADS_FUNIS: 'aRnjDkWWRPIKW5TW', // "Total de Leads por Funil"
  AGEND_FUNIS: '7TZHcivegKRPI083', // "Total de Agendamentos por Funil"
};
```

## Estrutura dos Dados

### 📊 **Tabela: Leads que Entraram** (`07P5hv4Q2O4fRA7t`)
```json
{
  "DATA": "2024-01-15",
  "GOOGLE": 10,
  "GOOGLE_FORMS": 5,
  "INSTAGRAM": 8,
  "FACEBOOK": 3,
  "SELLER": 2,
  "INDICACAO": 4,
  "OUTROS": 1,
  "TOTAL": 33
}
```

### 📞 **Tabela: Total de Calls Agendadas** (`d3CAyQhEPlaMKw6e`)
```json
{
  "AGENDADAS": "2024-01-15",
  "TOTAL_DE_CALLS_AGENDADAS": 25,
  "PERCENT_QUE_VAI_PRA_CALL": "75.8%"
}
```

### 📈 **Tabela: Total de Leads** (`6qM6zJYfYvGhhSTM`)
```json
{
  "LEADS": "2024-01",
  "TOTAL_DE_LEADS": 150,
  "LEAD_GOOGLE": 50,
  "LEAD_GOOGLE_FORMS": 25,
  "LEAD_INSTAGRAM": 40,
  "LEAD_FACEBOOK": 15,
  "LEAD_SELLER": 10,
  "LEAD_INDICACAO": 8,
  "LEAD_OUTROS": 2
}
```

## Funcionalidades Implementadas

### ✅ **Busca Automática de Dados:**
- **Leads Diários**: Dados detalhados por fonte
- **Calls Diários**: Agendamentos e estimativa de completadas
- **Métricas Mensais**: Comparação com mês anterior
- **Totais Gerais**: Leads totais, calls totais, taxa de conversão

### ✅ **Processamento Inteligente:**
- **Formatação de Datas**: Suporte a múltiplos formatos
- **Conversão de Números**: Limpeza e normalização
- **Cálculos Automáticos**: Crescimento, conversão, totais
- **Ordenação Temporal**: Dados ordenados por data

### ✅ **Tratamento de Erros:**
- **Timeout**: 10 segundos por requisição
- **Fallback**: Dados vazios se tabela não disponível
- **Logs Detalhados**: Para debugging
- **Validação**: Verificação de dados antes do processamento

## Testando a Integração

### 1. Teste de Conexão
- Acesse "Métricas Comerciais"
- Clique em "Testar Conexão"
- Verifique se retorna sucesso

### 2. Verificação de Dados
- Verifique se os dados aparecem corretamente
- Compare com as tabelas no N8N
- Confirme se as datas estão corretas

### 3. Atualização Forçada
- Use o botão "Forçar Atualização N8N"
- Verifique se os dados são atualizados
- Confirme se não há erros

## Solução de Problemas

### ❌ **Erro: "401 Unauthorized"**
- **Causa**: API Key inválida ou expirada
- **Solução**: Gere uma nova API Key no N8N

### ❌ **Erro: "404 Not Found"**
- **Causa**: URL do N8N incorreta
- **Solução**: Verifique a URL base no código

### ❌ **Erro: "403 Forbidden"**
- **Causa**: API Key sem permissões
- **Solução**: Verifique as permissões da API Key

### ❌ **Dados Vazios**
- **Causa**: Tabelas vazias ou IDs incorretos
- **Solução**: Verifique se o workflow está rodando e populando as tabelas

### ❌ **Dados Incorretos**
- **Causa**: Estrutura das tabelas diferente do esperado
- **Solução**: Ajuste o mapeamento no código

## Monitoramento

### 📊 **Métricas Disponíveis:**
- **Leads por Fonte**: Google, Google Forms, Instagram, Facebook, Seller, Indicação, Outros
- **Calls Agendadas**: Por dia e por mês
- **Taxa de Conversão**: Leads que viram calls
- **Crescimento Mensal**: Comparação com mês anterior
- **Totais Gerais**: Leads e calls totais

### 🔄 **Atualização Automática:**
- **Frequência**: A cada carregamento da página
- **Forçar Atualização**: Botão para refresh manual
- **Cache**: Dados ficam em cache durante a sessão

## Vantagens da Integração N8N DataTables

### ✅ **Benefícios:**
- **Dados Completos**: Acesso a todos os dados processados
- **Performance**: API nativa do N8N é mais rápida
- **Confiabilidade**: Dados já processados e validados
- **Flexibilidade**: Fácil de modificar e expandir
- **Monitoramento**: Logs detalhados para debugging

### 🚀 **Próximos Passos:**
1. Configure a API Key do N8N
2. Teste a conexão
3. Verifique se os dados aparecem corretamente
4. Monitore a performance e ajuste se necessário

Com essa configuração, você terá acesso completo a todos os dados do N8N de forma eficiente e confiável! 🎉
