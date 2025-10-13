# 📊 Dashboard de Métricas - FMTeam

## 🎯 Visão Geral

Dashboard completo para análise de métricas de negócio, incluindo renovação, churn, crescimento e alertas automáticos dos pacientes.

## 🚀 Funcionalidades

### 📈 **KPIs Principais**
- **Total de Ativos**: Número total de pacientes ativos
- **Taxa de Renovação**: Percentual médio de renovação
- **Churn Médio**: Taxa média de cancelamento
- **Crescimento**: Crescimento mensal de pacientes

### 📊 **Gráficos Interativos**
- **Crescimento de Ativos**: Evolução temporal dos pacientes ativos
- **Renovação vs Churn**: Comparativo entre taxas de renovação e churn

### 📋 **Tabela Detalhada**
- Histórico completo de métricas mensais
- Dados de entrada/saída de pacientes
- Taxas de renovação e churn por período
- Exportação para CSV

### 🚨 **Sistema de Alertas**
- Alertas automáticos para métricas críticas
- Classificação por prioridade (Alta/Média/Baixa)
- Notificações em tempo real

## 🗄️ **Estrutura do Banco de Dados**

### Tabela Principal: `dashboard_dados`
```sql
- id (SERIAL PRIMARY KEY)
- mes (TEXT) 
- ano (INTEGER)
- mes_numero (INTEGER)
- data_referencia (DATE)
- ativos_total_inicio_mes (INTEGER)
- saldo_entrada_saida (INTEGER)
- entraram (INTEGER)
- sairam (INTEGER)
- vencimentos (INTEGER)
- nao_renovou (INTEGER)
- desistencia (INTEGER)
- congelamento (INTEGER)
- percentual_renovacao (DECIMAL 5,2)
- percentual_churn (DECIMAL 5,2)
- churn_max (INTEGER)
```

### Views Disponíveis
- `dashboard_metricas` - Métricas calculadas automaticamente
- `ultimos_6_meses` - Dados dos últimos 6 meses
- `alertas_dashboard` - Sistema de alertas automáticos

## 🎨 **Design e UX**

### **Características Visuais**
- **Dark Mode**: Tema escuro como padrão
- **Gradientes**: Efeitos visuais modernos
- **Responsivo**: Mobile-first design
- **Animações**: Transições suaves e loading states
- **Cores Inteligentes**: Sistema de cores baseado em status

### **Componentes**
- **KPICards**: Cards com métricas principais e variações
- **GrowthChart**: Gráfico de área para crescimento
- **ChurnChart**: Gráfico de barras para renovação vs churn
- **MetricsTable**: Tabela responsiva com todos os dados
- **AlertsPanel**: Painel de alertas com prioridades

## 🔧 **Tecnologias Utilizadas**

- **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Recharts** para gráficos interativos
- **Supabase** para backend e banco de dados
- **React Router** para navegação
- **Lucide React** para ícones

## 📁 **Estrutura de Arquivos**

```
src/
├── types/
│   └── dashboard.ts              # Tipos TypeScript
├── lib/
│   └── dashboard-service.ts      # Serviços Supabase
├── hooks/
│   └── use-dashboard-metrics.ts  # Hook personalizado
├── components/dashboard/
│   ├── KPICards.tsx             # Cards de métricas
│   ├── GrowthChart.tsx          # Gráfico de crescimento
│   ├── ChurnChart.tsx           # Gráfico de churn
│   ├── MetricsTable.tsx         # Tabela de dados
│   └── AlertsPanel.tsx          # Painel de alertas
└── pages/
    └── MetricsDashboard.tsx     # Página principal
```

## 🚀 **Como Usar**

### **1. Acesso**
- Navegue para `/metrics` no sistema
- Ou clique em "Métricas" na sidebar

### **2. Filtros**
- **Por Ano**: Selecione um ano específico
- **Por Período**: Últimos 3, 6, 12 ou 24 meses

### **3. Funcionalidades**
- **Atualizar**: Botão para refresh dos dados
- **Exportar**: Download dos dados em CSV
- **Alertas**: Visualização de notificações importantes

## 📊 **Interpretação dos Dados**

### **KPIs**
- **Taxa de Renovação > 80%**: Excelente
- **Taxa de Renovação 60-80%**: Bom
- **Taxa de Renovação < 60%**: Precisa atenção

- **Churn < 5%**: Baixo (Bom)
- **Churn 5-10%**: Médio (Atenção)
- **Churn > 10%**: Alto (Crítico)

### **Alertas**
- **Alta Prioridade**: Requer ação imediata
- **Média Prioridade**: Monitoramento ativo
- **Baixa Prioridade**: Observação

## 🔄 **Atualizações Automáticas**

- **Real-time**: Dados atualizados automaticamente
- **Cache**: Sistema de cache para performance
- **Error Handling**: Tratamento robusto de erros
- **Loading States**: Estados de carregamento visuais

## 🎯 **Próximos Passos**

1. **Integração com Notificações**: Sistema de notificações push
2. **Relatórios Agendados**: Envio automático de relatórios
3. **Dashboards Personalizados**: Criação de dashboards customizados
4. **Integração com APIs**: Conectores com sistemas externos
5. **Machine Learning**: Predições e insights automáticos

## 📞 **Suporte**

Para dúvidas ou problemas com o dashboard de métricas:
- Verifique os logs do console
- Confirme a estrutura do banco de dados
- Teste as conexões com o Supabase
- Consulte a documentação das APIs

---

**Dashboard de Métricas FMTeam** - Análise inteligente para crescimento sustentável! 🚀



















