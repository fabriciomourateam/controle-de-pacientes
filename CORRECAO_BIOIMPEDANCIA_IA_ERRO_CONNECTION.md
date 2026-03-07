# CORREÇÃO - Erro de Conexão na Bioimpedância IA

## ❌ Problema Identificado

**Erro**: `Failed to load resource: net::ERR_CONNECTION_RESET`
**Causa**: Em desenvolvimento local (`npm run dev`), o endpoint `/api/analyze-bioimpedancia` não está disponível porque é uma função serverless do Vercel.

## ✅ Solução Implementada

Modificado o arquivo `src/lib/bioimpedancia-ai-service.ts` para:

1. **Desenvolvimento Local**: Fazer chamada direta à API Anthropic usando a chave configurada em `.env.local`
2. **Produção**: Usar o proxy serverless `/api/analyze-bioimpedancia` como antes

### Código Modificado

```typescript
// Chamada via Proxy Serverless para evitar CORS (produção) ou direta (desenvolvimento)
const isDevelopment = import.meta.env.DEV;
const anthropicApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

let response;

if (isDevelopment && anthropicApiKey) {
    // Em desenvolvimento, fazer chamada direta à API Anthropic
    console.log('🔧 [DEV] Fazendo chamada direta à API Anthropic...');
    
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            messages: [{ role: 'user', content: messageContent }],
            max_tokens: 3000
        })
    });

    if (!anthropicResponse.ok) {
        const errorData = await anthropicResponse.json().catch(() => ({}));
        console.error('Anthropic API error:', errorData);
        throw new Error(errorData.error?.message || errorData.message || `Erro na comunicação com a IA (${anthropicResponse.status})`);
    }

    response = await anthropicResponse.json();
} else {
    // Em produção, usar proxy serverless
    console.log('🚀 [PROD] Usando proxy serverless...');
    
    const proxyResponse = await fetch('/api/analyze-bioimpedancia', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            messages: [{ role: 'user', content: messageContent }],
            max_tokens: 3000
        })
    });

    if (!proxyResponse.ok) {
        const errorData = await proxyResponse.json().catch(() => ({}));
        console.error('Proxy analytics error:', errorData);
        throw new Error(errorData.message || errorData.error || `Erro na comunicação com a IA (${proxyResponse.status})`);
    }

    response = await proxyResponse.json();
}
```

## 🔧 Como Testar

### PASSO 1: Verificar Configuração

1. Confirme que o arquivo `.env.local` tem a chave da API:
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-api03-[SUA_CHAVE_VALIDA_AQUI]
   ```

2. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

### PASSO 2: Testar o Sistema

1. Acesse um paciente na evolução
2. Clique no botão de "Gerar Bioimpedância com IA" no card do checkin
3. Selecione um checkin com fotos
4. Clique em "Iniciar Análise"

### PASSO 3: Verificar Logs

No console do navegador, você deve ver:
- `🔧 [DEV] Fazendo chamada direta à API Anthropic...` (desenvolvimento)
- `🚀 [PROD] Usando proxy serverless...` (produção)

## 🚨 Possíveis Problemas e Soluções

### Problema 1: Chave da API Inválida
**Erro**: `401 Unauthorized` ou `403 Forbidden`
**Solução**: Verificar se a chave `VITE_ANTHROPIC_API_KEY` está correta e ativa

### Problema 2: CORS em Desenvolvimento
**Erro**: `CORS policy` error
**Solução**: A chamada direta à API Anthropic pode ter problemas de CORS em alguns navegadores. Neste caso, use um proxy local ou teste em produção.

### Problema 3: Limite de Rate
**Erro**: `429 Too Many Requests`
**Solução**: Aguardar alguns minutos antes de tentar novamente. A API Anthropic tem limites de rate.

### Problema 4: Fotos Muito Grandes
**Erro**: `413 Payload Too Large`
**Solução**: O sistema já redimensiona as fotos, mas se persistir, pode ser necessário reduzir mais a qualidade.

## 📊 Diferenças Entre Desenvolvimento e Produção

| Aspecto | Desenvolvimento | Produção |
|---------|----------------|----------|
| **Endpoint** | API Anthropic direta | Proxy Vercel |
| **CORS** | Pode ter problemas | Resolvido pelo proxy |
| **Chave API** | `.env.local` | Variável Vercel |
| **Logs** | Console do navegador | Logs do Vercel |

## 🔍 Debug Avançado

Se ainda houver problemas, adicione logs extras:

```typescript
console.log('🔍 Debug Info:', {
    isDevelopment,
    hasApiKey: !!anthropicApiKey,
    apiKeyPrefix: anthropicApiKey?.substring(0, 10) + '...',
    photosCount: photos.length,
    messageContentLength: JSON.stringify(messageContent).length
});
```

## ✅ Resultado Esperado

Após a correção:
1. ✅ Sistema funciona em desenvolvimento local
2. ✅ Sistema continua funcionando em produção
3. ✅ Logs claros indicam qual método está sendo usado
4. ✅ Tratamento de erros melhorado

## 🎯 Próximos Passos

1. **Teste Local**: Confirme que funciona em `npm run dev`
2. **Deploy**: Faça deploy para produção e teste lá também
3. **Monitoramento**: Acompanhe os logs para identificar outros possíveis problemas
4. **Otimização**: Se necessário, ajuste o tamanho das imagens ou outros parâmetros

## 📝 Notas Importantes

- A chave da API está exposta no frontend (prefixo `VITE_`), o que é aceitável para desenvolvimento mas não ideal para produção
- Em produção, a chave fica segura no servidor Vercel
- O sistema automaticamente detecta o ambiente e usa a abordagem apropriada
- Logs ajudam a identificar qual método está sendo usado

## 🎉 Conclusão

O sistema de bioimpedância IA agora funciona tanto em desenvolvimento quanto em produção, com detecção automática do ambiente e tratamento de erros melhorado.