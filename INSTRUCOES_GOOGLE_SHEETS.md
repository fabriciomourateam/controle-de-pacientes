# Configuração da Integração com Google Sheets

## Visão Geral
Esta integração permite que a página "Métricas Comerciais" busque dados automaticamente do Google Sheets, mantendo as informações sempre atualizadas.

## Configuração Necessária

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google Sheets API**:
   - Vá em "APIs e Serviços" > "Biblioteca"
   - Procure por "Google Sheets API"
   - Clique em "Ativar"

### 2. Criar Chave de API

1. Vá em "APIs e Serviços" > "Credenciais"
2. Clique em "Criar Credenciais" > "Chave de API"
3. Copie a chave gerada
4. (Opcional) Restrinja a chave para maior segurança:
   - Clique na chave criada
   - Em "Restrições de API", selecione "Google Sheets API"

### 3. Configuração Atual

✅ **Já configurado!** A integração está pronta com:
- **ID da Planilha**: `1BTzBftwg_C6rxzNYmIHTvlCGNH1GuyjIQHzGQlkQQuo`
- **Aba**: `RELATÓRIO DE LEADS (SDR)`
- **Chave da API**: Configurada diretamente no código

Se quiser usar variáveis de ambiente no futuro, crie um arquivo `.env` na raiz do projeto:

```env
VITE_GOOGLE_SHEETS_API_KEY=sua_chave_aqui
```

### 4. Estrutura da Planilha

A planilha já está configurada para usar a aba "RELATÓRIO DE LEADS (SDR)" com a seguinte estrutura:

#### Mapeamento das Colunas:
- **Coluna A**: DATA
- **Coluna B**: GOOGLE
- **Coluna C**: GOOGLE-FORMS  
- **Coluna D**: INSTAGRAM
- **Coluna E**: FACEBOOK
- **Coluna F**: SELLER
- **Coluna G**: INDICAÇÃO
- **Coluna H**: OUTROS
- **Coluna I**: TOTAL
- **Coluna J**: GOOGLE CALL
- **Coluna K**: GOOGLE-FORMS CALL
- **Coluna L**: INSTA CALL
- **Coluna M**: FACE CALL
- **Coluna N**: SELLER CALL
- **Coluna O**: INDIC CALL
- **Coluna P**: OUTRO CALL
- **Coluna Q**: TOTAL DE LEADS
- **Coluna R**: CALLS AGENDADAS

#### Agrupamento dos Funis:
- **Funil 1**: Google + Google Forms
- **Funil 2**: Instagram + Facebook  
- **Funil 3**: Seller + Indicação + Outros

### 5. Compartilhar Planilha

1. Abra sua planilha no Google Sheets
2. Clique em "Compartilhar" (canto superior direito)
3. Defina como "Qualquer pessoa com o link pode visualizar"
4. Copie o ID da planilha da URL:
   ```
   https://docs.google.com/spreadsheets/d/1BTzBftwg_C6rxzNYmIHTvlCGNH1GuyjIQHzGQlkQQuo/edit
   ```
   O ID é: `1BTzBftwg_C6rxzNYmIHTvlCGNH1GuyjIQHzGQlkQQuo`

## Configuração Alternativa via N8N

Se preferir usar N8N como intermediário:

### 1. Configurar Webhook no N8N
1. Crie um workflow no N8N
2. Adicione um nó "Webhook" como trigger
3. Configure para receber dados da planilha
4. Adicione um nó "Google Sheets" para ler dados
5. Configure um endpoint para servir os dados

### 2. Modificar o Serviço
Substitua a URL no `commercial-metrics-service.ts`:
```typescript
private static readonly API_URL = 'https://seu-n8n-instance.com/webhook/commercial-metrics';
```

## Testando a Integração

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse a página "Métricas Comerciais" no menu lateral

3. Verifique se os dados estão sendo carregados corretamente

## Atualização Automática

### Opção 1: Google Apps Script (Recomendado)
1. Vá em "Extensões" > "Apps Script" na sua planilha
2. Crie um script que atualize os dados automaticamente
3. Configure um trigger para executar diariamente

### Opção 2: N8N Schedule
1. Configure um workflow no N8N com trigger de tempo
2. Configure para executar diariamente às 6h
3. O workflow pode sincronizar dados e notificar o sistema

## Solução de Problemas

### Erro: "API key not configured"
- Verifique se a variável `VITE_GOOGLE_SHEETS_API_KEY` está definida no `.env`
- Reinicie o servidor após adicionar a variável

### Erro: "403 Forbidden"
- Verifique se a API do Google Sheets está ativada
- Verifique se a chave de API está correta
- Verifique se a planilha está compartilhada publicamente

### Erro: "404 Not Found"
- Verifique se o ID da planilha está correto
- Verifique se as abas "Leads" e "Calls" existem
- Verifique se os dados estão nas linhas esperadas (A2:E100)

### Dados não aparecem
- Verifique se a estrutura da planilha está correta
- Verifique se há dados nas abas
- Abra o console do navegador para ver erros detalhados

## Monitoramento

A página mostra:
- Última atualização dos dados
- Botão para atualizar manualmente
- Indicadores de carregamento
- Dados mock em caso de erro (para desenvolvimento)

## Segurança

- Mantenha a chave de API segura
- Use restrições de API quando possível
- Monitore o uso da API no Google Cloud Console
- Considere usar N8N para maior controle de acesso
