# 🚀 Instruções para Configurar o Dashboard de Métricas

## ⚠️ **Problemas Corrigidos:**

### 1. **Erro do Select Component**
- ✅ **Problema**: Select não pode ter `value=""` (string vazia)
- ✅ **Solução**: Alterado para usar `undefined` e valor "all" para "Todos os anos"

### 2. **Erro do Supabase - Tabelas Não Existem**
- ✅ **Problema**: Tabelas `dashboard_dados`, `alertas_dashboard` não existem
- ✅ **Solução**: Criado script SQL completo com todas as tabelas e dados de exemplo

---

## 📋 **Passos para Configurar:**

### **1. Execute o Script SQL no Supabase**

1. **Acesse o Supabase Dashboard**
2. **Vá para SQL Editor**
3. **Copie e cole o conteúdo do arquivo**: `sql/create-dashboard-tables.sql`
4. **Execute o script**

### **2. O que será criado:**

#### **📊 Tabelas:**
- `dashboard_dados` - Dados mensais de métricas
- `alertas_dashboard` - Sistema de alertas automáticos

#### **📈 Views:**
- `dashboard_metricas` - Métricas calculadas automaticamente
- `ultimos_6_meses` - Dados dos últimos 6 meses
- `alertas_dashboard_ativos` - Alertas ativos ordenados

#### **🔧 Funções:**
- `gerar_alertas_dashboard()` - Gera alertas automáticos
- `update_updated_at_column()` - Atualiza timestamps

#### **📊 Dados de Exemplo:**
- 12 meses de dados (Janeiro 2024 - Dezembro 2024)
- Alertas automáticos baseados nos dados

---

## 🎯 **Como Usar o Dashboard:**

### **1. Acesse o Dashboard**
- URL: `http://localhost:5173/metrics`
- Ou clique em "Métricas" na sidebar

### **2. Funcionalidades Disponíveis**
- ✅ **KPIs em tempo real**
- ✅ **Gráficos interativos**
- ✅ **Filtros por ano e período**
- ✅ **Tabela com dados detalhados**
- ✅ **Exportação para CSV**
- ✅ **Sistema de alertas**

### **3. Filtros**
- **Por Ano**: Selecione um ano específico ou "Todos os anos"
- **Por Período**: Últimos 3, 6, 12 ou 24 meses

---

## 📊 **Estrutura dos Dados:**

### **Tabela `dashboard_dados`:**
```sql
- id (SERIAL PRIMARY KEY)
- mes (TEXT) - Nome do mês
- ano (INTEGER) - Ano
- mes_numero (INTEGER) - Número do mês (1-12)
- data_referencia (DATE) - Data de referência
- ativos_total_inicio_mes (INTEGER) - Pacientes ativos no início
- entraram (INTEGER) - Novos pacientes
- sairam (INTEGER) - Pacientes que saíram
- vencimentos (INTEGER) - Vencimentos do mês
- nao_renovou (INTEGER) - Não renovaram
- desistencia (INTEGER) - Desistiram
- congelamento (INTEGER) - Congelaram
- percentual_renovacao (DECIMAL) - % de renovação
- percentual_churn (DECIMAL) - % de churn
```

### **Alertas Automáticos:**
- **Churn Alto** (> 10%)
- **Renovação Baixa** (< 70%)
- **Crescimento Negativo**
- **Vencimentos Altos** (> 20)

---

## 🔄 **Manutenção dos Dados:**

### **Para Inserir Novos Dados Mensais:**
```sql
INSERT INTO dashboard_dados (
    mes, ano, mes_numero, data_referencia,
    ativos_total_inicio_mes, entraram, sairam, vencimentos,
    nao_renovou, desistencia, congelamento,
    percentual_renovacao, percentual_churn
) VALUES (
    'Janeiro', 2025, 1, '2025-01-31',
    250, 30, 15, 20, 5, 6, 4,
    85.0, 8.5
);
```

### **Para Gerar Novos Alertas:**
```sql
SELECT gerar_alertas_dashboard();
```

### **Para Consultar Métricas:**
```sql
SELECT * FROM dashboard_metricas ORDER BY data_referencia DESC;
```

---

## 🎨 **Personalização:**

### **Cores dos KPIs:**
- **Azul**: Total Ativos
- **Verde**: Taxa Renovação
- **Vermelho**: Churn Médio
- **Roxo**: Crescimento

### **Alertas por Prioridade:**
- **🔴 Alta**: Requer ação imediata
- **🟡 Média**: Monitoramento ativo
- **🔵 Baixa**: Observação

---

## 🚨 **Troubleshooting:**

### **Se o Dashboard não carregar:**
1. Verifique se as tabelas foram criadas no Supabase
2. Confirme se há dados na tabela `dashboard_dados`
3. Verifique os logs do console do navegador

### **Se os gráficos estiverem vazios:**
1. Confirme se há dados nos últimos 6 meses
2. Verifique se as datas estão corretas
3. Teste os filtros de período

### **Se os alertas não aparecerem:**
1. Execute: `SELECT gerar_alertas_dashboard();`
2. Verifique se há dados que gerem alertas
3. Confirme se a view `alertas_dashboard_ativos` existe

---

## 🎯 **Próximos Passos:**

1. **Execute o script SQL** no Supabase
2. **Teste o dashboard** com os dados de exemplo
3. **Personalize** as métricas conforme necessário
4. **Configure** alertas automáticos
5. **Integre** com seu sistema de dados real

---

**Dashboard de Métricas FMTeam** - Agora funcionando perfeitamente! 🚀✨


