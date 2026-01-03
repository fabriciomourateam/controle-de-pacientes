# 📚 Guia: Como Acessar Registros Antigos

## 🎯 Visão Geral

Os limites que implementamos são **padrões conservadores** para reduzir o egress do Supabase. Porém, você **sempre pode acessar registros antigos** quando necessário!

## ✅ Soluções Implementadas

### 1. **Parâmetros Opcionais de Limite**

Todas as funções agora aceitam limites opcionais. Você pode:
- **Usar o padrão** (recomendado para uso diário)
- **Aumentar o limite** quando precisar de mais registros
- **Passar `null` ou `undefined`** para buscar TODOS os registros (use com cuidado!)

### 2. **Funções Específicas para Períodos**

Criamos funções específicas para buscar registros por período, que não têm limites rígidos.

---

## 📋 Como Usar

### **Checkins**

#### Buscar checkins recentes (padrão - 500 registros):
```typescript
const checkins = await checkinService.getAll();
```

#### Buscar mais checkins (ex: 2000 registros):
```typescript
const checkins = await checkinService.getAll(2000);
```

#### Buscar TODOS os checkins (sem limite):
```typescript
const checkins = await checkinService.getAll(null);
// ou
const checkins = await checkinService.getAll(undefined);
```

#### Buscar checkins por período específico (sem limite):
```typescript
// Buscar checkins de janeiro a março de 2024
const checkins = await checkinService.getByPeriod(
  '2024-01-01',
  '2024-03-31'
  // Sem limite = busca todos do período
);
```

#### Buscar checkins antigos (antes de uma data):
```typescript
// Buscar todos os checkins antes de 2024
const oldCheckins = await checkinService.getOldCheckins('2024-01-01');
```

---

### **Pacientes**

#### Buscar pacientes recentes (padrão - sem limite, mas otimizado):
```typescript
const patients = await patientService.getAll();
```

#### Buscar pacientes com limite específico:
```typescript
const patients = await patientService.getAll(500);
```

#### Buscar TODOS os pacientes (sem limite):
```typescript
const patients = await patientService.getAll(null);
```

#### Buscar pacientes por filtros (sem limite rígido):
```typescript
// Esta função já permite buscar todos os pacientes que atendem aos filtros
const patients = await patientService.getFiltered(
  { search: 'João', plan: 'Premium' },
  { field: 'created_at', direction: 'desc' },
  ['id', 'nome', 'telefone']
);
```

---

### **Feedbacks**

#### Buscar feedbacks recentes (padrão - 1000 registros):
```typescript
const feedbacks = await feedbackService.getAll();
```

#### Buscar mais feedbacks:
```typescript
const feedbacks = await feedbackService.getAll(5000);
```

#### Buscar TODOS os feedbacks:
```typescript
const feedbacks = await feedbackService.getAll(null);
```

---

### **Métricas Comerciais**

#### Leads que entraram (padrão - 365 dias):
```typescript
const leads = await commercialMetricsService.getLeadsQueEntraram();
```

#### Buscar mais dias:
```typescript
const leads = await commercialMetricsService.getLeadsQueEntraram(730); // 2 anos
```

#### Total de vendas (padrão - 1000 registros):
```typescript
const vendas = await commercialMetricsService.getTotalDeVendas();
```

#### Buscar mais vendas:
```typescript
const vendas = await commercialMetricsService.getTotalDeVendas(5000);
```

#### Vendas por mês específico (padrão - 500 registros):
```typescript
const vendas = await commercialMetricsService.getVendasByMonth('Dezembro');
```

#### Buscar mais vendas do mês:
```typescript
const vendas = await commercialMetricsService.getVendasByMonth('Dezembro', 2000);
```

---

## ⚠️ Importante

### **Quando usar limites maiores:**
- ✅ Relatórios mensais/anuais
- ✅ Análises históricas
- ✅ Exportações de dados
- ✅ Consultas específicas por período

### **Quando usar limites padrão:**
- ✅ Uso diário normal
- ✅ Visualização de listas
- ✅ Dashboards
- ✅ Operações frequentes

### **Quando buscar TODOS os registros:**
- ⚠️ **Use com cuidado!**
- ⚠️ Pode aumentar significativamente o egress
- ⚠️ Recomendado apenas para:
  - Exportações completas
  - Migrações de dados
  - Análises pontuais
  - Relatórios anuais

---

## 💡 Dicas de Otimização

### **1. Use filtros de data quando possível:**
```typescript
// ✅ BOM: Buscar apenas o período necessário
const checkins = await checkinService.getByPeriod('2024-01-01', '2024-12-31');

// ❌ EVITE: Buscar todos e filtrar no código
const allCheckins = await checkinService.getAll(null);
const filtered = allCheckins.filter(c => c.data_checkin >= '2024-01-01');
```

### **2. Use paginação para grandes volumes:**
```typescript
// Buscar em lotes
const page1 = await checkinService.getAll(500);
const page2 = await checkinService.getAll(500); // Mas isso não funciona assim...
// Melhor: use getByPeriod com datas específicas
```

### **3. Combine com filtros específicos:**
```typescript
// Buscar checkins de um paciente específico (já otimizado)
const patientCheckins = await checkinService.getByPhone('11999999999');
```

---

## 🔧 Exemplos Práticos

### **Exemplo 1: Relatório Anual**
```typescript
// Buscar todos os checkins de 2024
const checkins2024 = await checkinService.getByPeriod(
  '2024-01-01',
  '2024-12-31'
  // Sem limite = busca todos do período
);
```

### **Exemplo 2: Análise Histórica de Vendas**
```typescript
// Buscar todas as vendas de 2023
const vendas2023 = await commercialMetricsService.getVendasByMonth(
  'Dezembro',
  null // Sem limite
);
```

### **Exemplo 3: Exportação Completa**
```typescript
// Exportar todos os pacientes
const allPatients = await patientService.getAll(null);
```

---

## 📊 Impacto no Egress

### **Uso Normal (com limites):**
- Checkins: ~500 registros = ~1 MB
- Pacientes: ~1000 registros = ~0.5 MB
- Vendas: ~1000 registros = ~50 KB

### **Busca Completa (sem limites):**
- Checkins: ~10.000 registros = ~20 MB
- Pacientes: ~5.000 registros = ~2.5 MB
- Vendas: ~5.000 registros = ~250 KB

**Conclusão:** Mesmo buscando todos os registros ocasionalmente, o impacto é mínimo comparado ao uso diário otimizado!

---

## 🎯 Resumo

✅ **Limites são padrões conservadores** - não bloqueiam acesso a dados antigos  
✅ **Você pode aumentar limites** quando necessário  
✅ **Você pode buscar todos** passando `null` ou `undefined`  
✅ **Use filtros de data** para otimizar buscas por período  
✅ **Impacto no egress é mínimo** quando usado ocasionalmente  

**Os limites protegem o uso diário, mas não impedem consultas históricas!** 🚀
