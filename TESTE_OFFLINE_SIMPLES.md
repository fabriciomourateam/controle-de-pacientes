# 🧪 Teste Offline Simples - N8N Data

## ✅ **Solução 100% Offline**

O sistema agora funciona completamente offline, sem depender de webhooks externos.

## 🎯 **Como Testar**

### **Passo 1: Abrir Arquivo de Debug**
1. Abra o arquivo `debug-n8n-data.html` no navegador
2. **Não precisa de servidor** - funciona direto no navegador

### **Passo 2: Testar Processamento**
1. Clique em **"Simular Dados N8N"**
2. Clique em **"Mostrar Dados"**
3. Deve aparecer dados de leads e calls

### **Passo 3: Testar no Site**
1. Acesse a página **"Métricas Comerciais"**
2. Clique em **"Simular Dados N8N"**
3. Os dados devem aparecer na interface

## 📊 **Dados que Devem Aparecer**

### **Leads de Hoje:**
- Google: 15
- Google Forms: 8
- Instagram: 12
- Facebook: 6
- Seller: 4
- Indicação: 3
- Outros: 2
- **Total: 50**

### **Leads de Ontem:**
- Google: 12
- Google Forms: 6
- Instagram: 10
- Facebook: 5
- Seller: 3
- Indicação: 2
- Outros: 1
- **Total: 39**

### **Calls:**
- Hoje: 25 agendadas
- Ontem: 18 agendadas

## 🔧 **Se Não Funcionar**

### **Verificar Console:**
1. Abra o console do navegador (F12)
2. Procure por mensagens de erro
3. Verifique se há logs do processamento

### **Limpar e Recarregar:**
1. Clique em **"Limpar Dados"**
2. Clique em **"Simular Dados N8N"** novamente
3. Clique em **"Mostrar Dados"**

### **Verificar localStorage:**
1. Abra o console (F12)
2. Digite: `localStorage.getItem('n8n_metrics_data')`
3. Deve retornar um JSON com os dados

## 🎉 **Resultado Esperado**

- ✅ **Dados aparecem** na interface
- ✅ **Gráficos funcionam** corretamente
- ✅ **Tabelas mostram** os dados
- ✅ **KPIs calculados** automaticamente
- ✅ **Sistema funciona** offline

## 🚀 **Próximos Passos**

1. **Teste offline** primeiro
2. **Confirme que funciona** localmente
3. **Configure N8N** para enviar dados reais
4. **Use webhook** quando estiver funcionando

**O sistema agora funciona 100% offline!** 🎯
