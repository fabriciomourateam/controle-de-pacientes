# Solução CORS para N8N

## ❌ Problema Identificado
O N8N não permite requisições diretas do navegador devido à política CORS (Cross-Origin Resource Sharing).

## ✅ Solução Implementada: Proxy Local

Criamos um proxy local que contorna o problema de CORS.

### 🚀 Como Usar:

#### **Passo 1: Iniciar o Proxy**
Execute o arquivo `iniciar-proxy-n8n.bat`:
- Clique duas vezes no arquivo
- Aguarde a instalação das dependências
- Mantenha a janela aberta

#### **Passo 2: Verificar se Funcionou**
- O proxy deve estar rodando na porta 3002
- Você verá mensagens como "Proxy N8N rodando na porta 3002"

#### **Passo 3: Testar no Site**
- Acesse "Métricas Comerciais"
- Clique em "Testar Conexão"
- Deve retornar sucesso

### 📁 Arquivos Criados:

1. **`proxy-n8n.js`** - Servidor proxy
2. **`iniciar-proxy-n8n.bat`** - Script para iniciar
3. **`package-proxy.json`** - Dependências do proxy

### 🔧 Como Funciona:

```
Frontend (localhost:5173) 
    ↓ (requisição)
Proxy Local (localhost:3001)
    ↓ (com API Key)
N8N (n8n.shapepro.shop)
    ↓ (resposta)
Proxy Local (adiciona CORS headers)
    ↓ (resposta)
Frontend (dados recebidos)
```

### 📊 Endpoints do Proxy:

- **`GET /health`** - Status do proxy
- **`GET /test-n8n`** - Teste de conexão com N8N
- **`GET /api/*`** - Proxy para todas as APIs do N8N

### 🔍 Verificação:

#### **Teste Manual:**
Abra no navegador: `http://localhost:3002/health`
Deve retornar: `{"status":"ok","message":"Proxy N8N funcionando"}`

#### **Teste de Conexão N8N:**
Abra no navegador: `http://localhost:3002/test-n8n`
Deve retornar: `{"success":true,"message":"Conexão com N8N OK"}`

### ⚠️ Importante:

1. **Mantenha o proxy rodando** enquanto usar o site
2. **Não feche a janela** do proxy
3. **Se der erro**, reinicie o proxy
4. **O proxy roda na porta 3001** - não mude

### 🛠️ Solução de Problemas:

#### **Erro: "Cannot GET /health"**
- O proxy não está rodando
- Execute `iniciar-proxy-n8n.bat` novamente

#### **Erro: "Failed to fetch"**
- Verifique se o proxy está na porta 3001
- Reinicie o proxy

#### **Erro: "Connection refused"**
- O N8N pode estar offline
- Verifique se `https://n8n.shapepro.shop` está acessível

### 🎯 Próximos Passos:

1. **Execute o proxy** (`iniciar-proxy-n8n.bat`)
2. **Teste a conexão** no site
3. **Verifique se os dados aparecem** nas métricas
4. **Mantenha o proxy rodando** sempre que usar o site

Com essa solução, o CORS é contornado e você pode acessar os dados do N8N normalmente! 🎉
