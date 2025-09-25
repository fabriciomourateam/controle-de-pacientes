# 🔄 Instruções de Sincronização em Produção

## ✅ Configurações Implementadas

### 1. Modal de Sincronização Atualizado
- **Intervalo em dias**: Agora você pode configurar de 1 a 30 dias
- **Conversão automática**: O sistema converte automaticamente dias para minutos
- **Interface intuitiva**: Mostra o equivalente em minutos e dias

### 2. Sincronização para Produção
- **Proxy automático**: Em produção, usa automaticamente o proxy da Vercel
- **Dados reais apenas**: Sincroniza apenas dados reais do Notion
- **Logs detalhados**: Acompanhe o processo de sincronização

## 🚀 Como Usar em Produção

### 1. Configurar Sincronização
1. Acesse o dashboard
2. Vá para a seção "Sincronização Automática"
3. Configure:
   - **API Key do Notion**: Sua chave secreta do Notion
   - **Database ID**: ID do banco de dados do Notion
   - **Intervalo**: Escolha quantos dias (recomendado: 1 dia)

### 2. Iniciar Sincronização
1. Clique em "Iniciar Auto-sync"
2. O sistema irá:
   - Fazer uma sincronização imediata
   - Configurar sincronização automática
   - Mostrar status em tempo real

### 3. Monitoramento
- **Status**: Veja se está ativo ou inativo
- **Última sync**: Data e hora da última sincronização
- **Estatísticas**: Quantos registros foram inseridos/atualizados

## 🔧 Configurações Técnicas

### URLs do Proxy
- **Desenvolvimento**: `http://localhost:3001/api/notion-proxy`
- **Produção**: `https://painel-fmteam.vercel.app/api/notion-proxy`

### Intervalos Suportados
- **Mínimo**: 1 dia (1440 minutos)
- **Máximo**: 30 dias (43200 minutos)
- **Recomendado**: 1 dia para dados atualizados

### Tratamento de Erros
Se a sincronização falhar, o sistema:
1. Tenta usar o proxy de produção
2. Se falhar, retorna erro claro
3. Não insere dados fictícios

## 📊 Estrutura dos Dados

### Campos Sincronizados
- Mês e Ano
- Ativos (Total início do mês)
- Saldo (Entrada/Saída)
- Entraram/Saíram
- Vencimentos
- Não renovou/Desistência/Congelamento
- Percentuais de renovação e churn

### Tabela de Destino
- **Tabela**: `dashboard_dados`
- **Chave única**: `ano` + `mes_numero`
- **Comportamento**: Upsert (insere ou atualiza)

## 🛠️ Solução de Problemas

### Erro de Conexão
- Verifique se o proxy está rodando
- Confirme as credenciais do Notion
- Verifique a conexão com a internet

### Dados Não Atualizam
- Verifique se o Database ID está correto
- Confirme se a API Key tem permissões
- Verifique os logs do console
- **Importante**: O sistema não funciona sem dados reais do Notion

### Sincronização Lenta
- Reduza o intervalo de sincronização
- Verifique a quantidade de dados no Notion
- Monitore o uso da API do Notion

## 📝 Logs e Monitoramento

### Console do Navegador
- Logs detalhados de cada sincronização
- Status de conexão com o proxy
- Erros e sucessos

### LocalStorage
- Configurações salvas automaticamente
- Status da última sincronização
- Histórico de erros

## 🔐 Segurança

### API Keys
- Nunca compartilhe sua API Key do Notion
- Use apenas em ambientes seguros
- Monitore o uso da API

### Dados Sensíveis
- Os dados são processados localmente
- Não são enviados para servidores externos
- Criptografia em trânsito (HTTPS)

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console
2. Teste a conexão com o Notion
3. Verifique as configurações do proxy
4. Entre em contato com o suporte técnico

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0
