# 🚀 Solução Deploy Local - Enquanto Vercel é Corrigido

## ❌ **Problema Identificado**
- Vercel retornando HTML em vez de JavaScript
- Erro de MIME type no deploy
- Site não carrega corretamente

## ✅ **Solução: Executar Localmente**

### **Passo 1: Instalar Dependências**
```bash
npm install
```

### **Passo 2: Executar em Desenvolvimento**
```bash
npm run dev
```

### **Passo 3: Acessar o Site**
```
http://localhost:5173
```

## 🔧 **Configuração para N8N**

### **Opção 1: Usar webhook.site (Recomendado)**

1. **Acesse**: https://webhook.site/
2. **Copie a URL** gerada
3. **Configure no N8N** com esta URL

### **Opção 2: Usar ngrok (Para webhook local)**

1. **Instale ngrok**: https://ngrok.com/download
2. **Execute**: `ngrok http 5173`
3. **Use a URL** gerada no N8N

## 🎯 **Como Testar**

### **1. Teste Local**
1. Execute `npm run dev`
2. Acesse `http://localhost:5173`
3. Vá para "Métricas Comerciais"
4. Clique em "Simular Dados N8N"

### **2. Teste com N8N**
1. Configure N8N com webhook.site
2. Execute o workflow
3. Verifique se os dados são enviados

## 📊 **Dados que Devem Aparecer**

- **Leads de hoje**: 50 total
- **Leads de ontem**: 39 total
- **Calls de hoje**: 25 agendadas
- **Calls de ontem**: 18 agendadas

## 🔍 **Debug**

### **Se não funcionar localmente:**
1. **Verifique o console** (F12)
2. **Procure por erros** em vermelho
3. **Limpe o cache** do navegador
4. **Reinicie o servidor** (`Ctrl+C` e `npm run dev`)

### **Se N8N não enviar dados:**
1. **Use webhook.site** temporariamente
2. **Verifique a URL** no N8N
3. **Teste manualmente** o workflow

## 🚀 **Próximos Passos**

1. **Execute localmente** para testar
2. **Configure N8N** com webhook.site
3. **Aguarde correção** do Vercel
4. **Migre para produção** quando estiver funcionando

## 📋 **Comandos Úteis**

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

**Execute localmente enquanto o Vercel é corrigido!** 🎉
