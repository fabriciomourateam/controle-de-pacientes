# 📋 Como Ver Todos os Checkins

## 🎯 Controle de Limite de Checkins

Na página de **Checkins**, você pode controlar quantos checkins são carregados para reduzir o tempo de carregamento e economizar egress do Supabase.

---

## 🔍 Como Acessar o Controle

### **1. Localizar o Botão "Limite"**

Na página de Checkins, procure pelo botão que mostra:
- `Limite: 200` (padrão)
- `Limite: 500`
- `Limite: 1000`
- `Limite: 2000`
- `Sem limite` (quando selecionado "Todos")

**Localização:** No topo da página, próximo aos filtros e botão de atualizar.

---

## 📊 Opções Disponíveis

### **Limites Pré-definidos:**
1. **200 checkins** (padrão) - ✅ Recomendado para uso diário
2. **500 checkins** - Para análises mais amplas
3. **1.000 checkins** - Para relatórios completos
4. **2.000 checkins** - Para análises extensas

### **Sem Limite:**
- **"Todos os checkins"** - Carrega TODOS os checkins do banco de dados
  - ⚠️ **Atenção:** Pode demorar mais para carregar
  - ⚠️ **Atenção:** Aumenta o uso de egress do Supabase
  - 💡 **Dica:** Use apenas quando realmente precisar ver todos os registros

---

## 🚀 Como Usar

### **Passo 1: Clique no Botão "Limite: X"**
```
[Limite: 200 ▼]
```

### **Passo 2: Selecione a Opção Desejada**
Um menu dropdown aparecerá com as opções:
```
┌─────────────────────────────┐
│ Quantos checkins carregar?   │
├─────────────────────────────┤
│ [200 checkins]              │
│ [500 checkins]              │
│ [1.000 checkins]            │
│ [2.000 checkins]            │
│ [Todos os checkins (sem limite)] │
├─────────────────────────────┤
│ ⚠️ Limites maiores aumentam │
│    o tempo de carregamento  │
│ 💡 Use "Todos" apenas quando│
│    necessário               │
└─────────────────────────────┘
```

### **Passo 3: Aguarde o Carregamento**
Após selecionar, os checkins serão recarregados automaticamente com o novo limite.

---

## 💡 Dicas de Uso

### **Para Uso Diário:**
- ✅ Use **200 checkins** (padrão)
- ✅ Suficiente para ver checkins recentes
- ✅ Carregamento rápido
- ✅ Economiza egress

### **Para Análises:**
- ✅ Use **500-1000 checkins**
- ✅ Para ver histórico mais amplo
- ✅ Ainda razoavelmente rápido

### **Para Ver Tudo:**
- ⚠️ Use **"Todos os checkins"** apenas quando necessário
- ⚠️ Pode demorar mais para carregar
- ⚠️ Aumenta o uso de egress
- 💡 **Dica:** Use quando precisar buscar um checkin muito antigo

---

## 🔄 Atualização Automática

O limite selecionado é mantido durante a sessão. Quando você:
- Atualizar a página manualmente (botão "Atualizar")
- Aguardar atualização automática (06h, 12h, 15h, 18h)

Os checkins serão recarregados respeitando o limite escolhido.

---

## 📊 Exemplo Visual

```
┌─────────────────────────────────────────┐
│ Checkins dos Pacientes                  │
│                                         │
│ [Buscar...] [Filtros...] [Limite: 200 ▼]│
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Total: 200 checkins                 │ │
│ │ (de 5.000 total no banco)           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Lista de checkins...]                 │
└─────────────────────────────────────────┘
```

---

## ✅ Resumo

1. **Localize** o botão "Limite: X" no topo da página
2. **Clique** para abrir o menu
3. **Selecione** a opção desejada (200, 500, 1000, 2000 ou "Todos")
4. **Aguarde** o carregamento automático

**Para ver TODOS os checkins:** Selecione "Todos os checkins (sem limite)" no menu! ✅
