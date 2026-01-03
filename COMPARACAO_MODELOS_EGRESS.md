# 📊 Comparação de Modelos de Egress - Supabase

## 🎯 Cenários Comparados

### **Modelo Atual** (Com refetchInterval ativo)
- Queries com refetch automático a cada 2-5 minutos
- Sem limites em várias queries
- Muitas queries com `select('*')`

### **Modelo Proposto** (4x ao dia + sob demanda)
- Atualização automática: 4x ao dia (06h, 12h, 15h, 18h)
- Atualização sob demanda: quando você acessa a página ou clica em "Atualizar"
- Realtime: notificação quando há mudanças
- Limites e campos específicos em todas as queries

---

## 📈 Cálculo Detalhado por Categoria

### 1. **Pacientes (usePatients)**

#### Modelo Atual:
- **Refetch:** A cada 5 minutos = 288 chamadas/dia
- **Registros:** ~1.000 pacientes (sem limite)
- **Tamanho:** ~1KB por registro (campos específicos)
- **Total:** 288 × 1.000 × 1KB = **288 MB/dia**

#### Modelo Proposto:
- **Automático:** 4 chamadas/dia
- **Sob demanda:** ~15 acessos/dia (estimativa conservadora)
- **Total chamadas:** 4 + 15 = **19 chamadas/dia**
- **Registros:** ~1.000 pacientes (com limite de segurança)
- **Tamanho:** ~1KB por registro
- **Total:** 19 × 1.000 × 1KB = **19 MB/dia**

**Redução: 93.4%** ✅

---

### 2. **Feedbacks (useFeedbacks)**

#### Modelo Atual:
- **Refetch:** A cada 2 minutos = 720 chamadas/dia
- **Registros:** ~1.000 pacientes (sem limite)
- **Tamanho:** ~2KB por registro (`select('*')`)
- **Total:** 720 × 1.000 × 2KB = **1.4 GB/dia**

#### Modelo Proposto:
- **Automático:** 4 chamadas/dia
- **Sob demanda:** ~15 acessos/dia
- **Total chamadas:** 4 + 15 = **19 chamadas/dia**
- **Registros:** ~1.000 pacientes (com limite)
- **Tamanho:** ~1KB por registro (campos específicos)
- **Total:** 19 × 1.000 × 1KB = **19 MB/dia**

**Redução: 98.6%** ✅

---

### 3. **Checkins**

#### Modelo Atual:
- **Refetch:** Já otimizado (sem refetch automático) ✅
- **Acesso:** ~20 acessos/dia à página de checkins
- **Registros:** ~10.000 checkins (sem limite em `getAll()`)
- **Tamanho:** ~3KB por registro (`select('*')`)
- **Total:** 20 × 10.000 × 3KB = **600 MB/dia**

#### Modelo Proposto:
- **Automático:** 4 chamadas/dia (já implementado)
- **Sob demanda:** ~20 acessos/dia
- **Total chamadas:** 4 + 20 = **24 chamadas/dia**
- **Registros:** ~200 checkins (com limite)
- **Tamanho:** ~2KB por registro (campos específicos)
- **Total:** 24 × 200 × 2KB = **9.6 MB/dia**

**Redução: 98.4%** ✅

---

### 4. **Métricas Comerciais (9 queries)**

#### Modelo Atual:
- **Refetch:** A cada 5 minutos = 288 chamadas/dia por query
- **Queries:** 9 queries diferentes
- **Total chamadas:** 9 × 288 = **2.592 chamadas/dia**
- **Registros:** Varia (50-500 por query, sem limite)
- **Tamanho médio:** ~50KB por query
- **Total:** 2.592 × 50KB = **130 MB/dia**

#### Modelo Proposto:
- **Automático:** 4 chamadas/dia por query
- **Sob demanda:** ~5 acessos/dia à página de métricas
- **Total chamadas:** (4 + 5) × 9 = **81 chamadas/dia**
- **Registros:** Com limites apropriados
- **Tamanho médio:** ~30KB por query (campos específicos)
- **Total:** 81 × 30KB = **2.4 MB/dia**

**Redução: 98.2%** ✅

---

### 5. **Dashboard Metrics (2 queries)**

#### Modelo Atual:
- **Refetch:** A cada 5 minutos = 288 chamadas/dia por query
- **Queries:** 2 queries (metrics + chart)
- **Total chamadas:** 2 × 288 = **576 chamadas/dia**
- **Registros:** ~50 registros (com limite)
- **Tamanho:** ~20KB por query (`select('*')`)
- **Total:** 576 × 20KB = **11.5 MB/dia**

#### Modelo Proposto:
- **Automático:** 4 chamadas/dia por query
- **Sob demanda:** ~10 acessos/dia ao dashboard
- **Total chamadas:** (4 + 10) × 2 = **28 chamadas/dia**
- **Registros:** ~50 registros (com limite)
- **Tamanho:** ~15KB por query (campos específicos)
- **Total:** 28 × 15KB = **0.4 MB/dia**

**Redução: 96.5%** ✅

---

### 6. **Pacientes Expirando (useExpiringPatients)**

#### Modelo Atual:
- **Refetch:** A cada 5 minutos = 288 chamadas/dia
- **Registros:** ~100 pacientes (filtrados)
- **Tamanho:** ~1KB por registro
- **Total:** 288 × 100 × 1KB = **28.8 MB/dia**

#### Modelo Proposto:
- **Automático:** 4 chamadas/dia
- **Sob demanda:** ~5 acessos/dia (quando verifica expirações)
- **Total chamadas:** 4 + 5 = **9 chamadas/dia**
- **Registros:** ~100 pacientes
- **Tamanho:** ~1KB por registro
- **Total:** 9 × 100 × 1KB = **0.9 MB/dia**

**Redução: 96.9%** ✅

---

### 7. **Body Composition (CheckinsList)**

#### Modelo Atual:
- **Acesso:** Toda vez que a página de checkins carrega = ~20 chamadas/dia
- **Registros:** Todos os registros (sem limite)
- **Tamanho:** ~0.5KB por registro (só telefone)
- **Total:** 20 × 5.000 × 0.5KB = **50 MB/dia**

#### Modelo Proposto:
- **Com React Query:** Cache + sob demanda
- **Acesso:** ~20 acessos/dia (mas com cache)
- **Cache hit rate:** ~80% (dados não mudam muito)
- **Chamadas reais:** ~4 chamadas/dia
- **Registros:** Com limite de 1.000
- **Tamanho:** ~0.5KB por registro
- **Total:** 4 × 1.000 × 0.5KB = **2 MB/dia**

**Redução: 96%** ✅

---

### 8. **Outras Queries (PatientEvolution, PatientPortal, etc.)**

#### Modelo Atual:
- **Acesso:** ~30 acessos/dia (páginas individuais)
- **Queries por acesso:** ~3 queries (patient, checkins, bio)
- **Total chamadas:** 30 × 3 = **90 chamadas/dia**
- **Registros:** Varia, mas muitas com `select('*')`
- **Tamanho médio:** ~50KB por acesso
- **Total:** 90 × 50KB = **4.5 MB/dia**

#### Modelo Proposto:
- **Com React Query:** Cache + sob demanda
- **Acesso:** ~30 acessos/dia
- **Cache hit rate:** ~70% (dados mudam pouco)
- **Chamadas reais:** ~9 chamadas/dia
- **Registros:** Com limites e campos específicos
- **Tamanho médio:** ~30KB por acesso
- **Total:** 9 × 30KB = **0.3 MB/dia**

**Redução: 93.3%** ✅

---

## 📊 RESUMO COMPARATIVO

### **Modelo Atual (Com refetchInterval):**

| Categoria | Chamadas/Dia | Egress/Dia | Egress/Mês |
|-----------|--------------|------------|------------|
| Pacientes | 288 | 288 MB | 8.6 GB |
| Feedbacks | 720 | 1.4 GB | 42 GB |
| Checkins | 20 | 600 MB | 18 GB |
| Métricas Comerciais | 2.592 | 130 MB | 3.9 GB |
| Dashboard | 576 | 11.5 MB | 345 MB |
| Pacientes Expirando | 288 | 28.8 MB | 864 MB |
| Body Composition | 20 | 50 MB | 1.5 GB |
| Outras | 90 | 4.5 MB | 135 MB |
| **TOTAL** | **4.594** | **~2.5 GB** | **~75 GB/mês** ❌ |

---

### **Modelo Proposto (4x ao dia + sob demanda):**

| Categoria | Chamadas/Dia | Egress/Dia | Egress/Mês |
|-----------|--------------|------------|------------|
| Pacientes | 19 | 19 MB | 570 MB |
| Feedbacks | 19 | 19 MB | 570 MB |
| Checkins | 24 | 9.6 MB | 288 MB |
| Métricas Comerciais | 81 | 2.4 MB | 72 MB |
| Dashboard | 28 | 0.4 MB | 12 MB |
| Pacientes Expirando | 9 | 0.9 MB | 27 MB |
| Body Composition | 4 | 2 MB | 60 MB |
| Outras | 9 | 0.3 MB | 9 MB |
| **TOTAL** | **193** | **~54 MB** | **~1.6 GB/mês** ✅ |

---

## 🎯 COMPARAÇÃO FINAL

### **Redução Total:**
- **Chamadas:** 4.594 → 193 = **95.8% de redução** ✅
- **Egress diário:** 2.5 GB → 54 MB = **97.8% de redução** ✅
- **Egress mensal:** 75 GB → 1.6 GB = **97.9% de redução** ✅

---

## 💰 Impacto Financeiro

### **Supabase Free Plan:**
- **Limite:** 5 GB/mês de egress
- **Modelo Atual:** 75 GB/mês = **15x acima do limite** ❌
- **Modelo Proposto:** 1.6 GB/mês = **32% do limite** ✅

### **Economia:**
- **Antes:** Necessário upgrade para Pro ($25/mês) ou mais
- **Depois:** Pode continuar no Free Plan ✅
- **Economia:** **$25-50/mês** 💰

---

## 📅 Cenários de Uso

### **Cenário Conservador (10 acessos/dia):**
- **Egress mensal:** ~1.2 GB
- **Redução:** 98.4%

### **Cenário Moderado (20 acessos/dia - usado no cálculo):**
- **Egress mensal:** ~1.6 GB
- **Redução:** 97.9%

### **Cenário Intensivo (50 acessos/dia):**
- **Egress mensal:** ~2.5 GB
- **Redução:** 96.7%

**Mesmo no cenário mais intensivo, ainda fica dentro do Free Plan!** ✅

---

## ✅ Vantagens do Modelo Proposto

1. **Economia Massiva:** 97.9% de redução no egress
2. **Dentro do Free Plan:** Não precisa fazer upgrade
3. **Dados Sempre Atualizados:** Realtime detecta mudanças
4. **Controle Total:** Você decide quando atualizar
5. **Performance:** Cache reduz tempo de carregamento
6. **Escalável:** Funciona mesmo com muito uso

---

## ⚠️ Considerações

### **Quando os dados são atualizados:**
- ✅ **Automaticamente:** 4x ao dia (06h, 12h, 15h, 18h)
- ✅ **Ao acessar:** Quando você abre uma página
- ✅ **Ao atualizar:** Quando você clica em "Atualizar"
- ✅ **Em tempo real:** Quando outra pessoa faz mudanças (Realtime)

### **Se você precisar de dados mais atualizados:**
- Clicar no botão "Atualizar" sempre que necessário
- Os dados são atualizados imediatamente
- Realtime notifica quando há mudanças

---

## 🎯 Conclusão

O **Modelo Proposto (4x ao dia + sob demanda)** é **muito superior** ao modelo atual:

- ✅ **97.9% menos egress**
- ✅ **Dentro do Free Plan**
- ✅ **Economia de $25-50/mês**
- ✅ **Dados sempre atualizados quando necessário**
- ✅ **Melhor experiência do usuário**

**Recomendação: Implementar imediatamente!** 🚀
