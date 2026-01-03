# 🎨 Como Aumentar Limites na Interface do App

## 📍 Onde Encontrar o Controle

### **Página de Checkins**

1. **Acesse a página de Checkins** no menu lateral
2. **No topo direito** do card "Checkins Recentes", você verá:
   - Um botão **"Limite: 200"** (ou o limite atual)
   - Um botão **"Atualizar"**

3. **Clique no botão "Limite: X"** para abrir o menu de opções

---

## 🎯 Como Usar

### **Passo a Passo:**

1. **Clique no botão "Limite: 200"** (ou o limite atual)
2. **Um menu aparecerá** com as seguintes opções:
   - ✅ **200 checkins (padrão)** - Recomendado para uso diário
   - ✅ **500 checkins** - Para ver mais histórico
   - ✅ **1.000 checkins** - Para análises mais profundas
   - ✅ **2.000 checkins** - Para relatórios extensos
   - ⚠️ **Todos os checkins (sem limite)** - Use apenas quando necessário

3. **Clique na opção desejada**
4. **Os dados serão recarregados automaticamente** com o novo limite

---

## 📊 Opções Disponíveis

| Opção | Quando Usar | Tempo de Carregamento |
|-------|-------------|----------------------|
| **200 checkins** | Uso diário normal | ~1-2 segundos |
| **500 checkins** | Ver histórico recente | ~2-3 segundos |
| **1.000 checkins** | Análises mensais | ~3-5 segundos |
| **2.000 checkins** | Relatórios trimestrais | ~5-8 segundos |
| **Todos** | Exportações ou análises completas | Pode levar 10+ segundos |

---

## ⚠️ Avisos Importantes

### **Quando usar limites maiores:**
- ✅ Você precisa ver checkins mais antigos
- ✅ Está fazendo uma análise histórica
- ✅ Precisa exportar dados completos
- ✅ Está gerando relatórios

### **Quando usar o padrão (200):**
- ✅ Uso diário normal
- ✅ Visualização rápida
- ✅ Operações frequentes
- ✅ Para economizar egress do Supabase

### **Quando usar "Todos":**
- ⚠️ **Use com cuidado!**
- ⚠️ Pode aumentar significativamente o egress
- ⚠️ Recomendado apenas para:
  - Exportações completas
  - Análises pontuais
  - Relatórios anuais
  - Migrações de dados

---

## 💡 Dicas

1. **Comece com o padrão (200)** e aumente apenas se necessário
2. **Use filtros de data** quando possível em vez de aumentar o limite
3. **O limite escolhido é salvo** enquanto você estiver na página
4. **Ao sair e voltar**, o limite volta para o padrão (200)
5. **O botão mostra o limite atual** para você saber quantos checkins estão carregados

---

## 🔄 Como Funciona

1. **Você escolhe o limite** no menu
2. **O sistema busca** apenas essa quantidade de checkins do banco
3. **Os dados são carregados** e exibidos na lista
4. **Você pode filtrar e ordenar** normalmente
5. **O botão "Atualizar"** recarrega os dados com o limite escolhido

---

## 📱 Visualização

```
┌─────────────────────────────────────────┐
│  Checkins Recentes (150)                │
│                                         │
│  [Limite: 200] [Atualizar]              │ ← Clique aqui!
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Quantos checkins carregar?       │   │
│  │                                  │   │
│  │ [200 checkins (padrão)] ✓       │   │
│  │ [500 checkins]                  │   │
│  │ [1.000 checkins]                │   │
│  │ [2.000 checkins]                │   │
│  │ [Todos os checkins (sem limite)]│   │
│  │                                  │   │
│  │ ⚠️ Limites maiores aumentam     │   │
│  │    o tempo de carregamento      │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🎯 Exemplo Prático

### **Cenário: Você quer ver checkins de 6 meses atrás**

1. **Abra a página de Checkins**
2. **Clique em "Limite: 200"**
3. **Escolha "1.000 checkins"** (ou mais, dependendo de quantos você tem)
4. **Aguarde o carregamento** (alguns segundos)
5. **Use os filtros de data** se disponíveis, ou **role a lista** para ver checkins mais antigos

---

## ❓ Perguntas Frequentes

**P: O limite escolhido fica salvo?**
R: Sim, enquanto você estiver na página. Ao sair e voltar, volta para o padrão (200).

**P: Posso mudar o limite várias vezes?**
R: Sim! Clique no botão e escolha outro limite quando quiser.

**P: O que acontece se eu escolher "Todos"?**
R: O sistema buscará TODOS os checkins do banco. Pode levar mais tempo e usar mais egress.

**P: Preciso clicar em "Atualizar" depois de mudar o limite?**
R: Não! Os dados são recarregados automaticamente quando você escolhe um novo limite.

**P: O limite afeta os filtros?**
R: Não! Os filtros funcionam normalmente sobre os checkins carregados.

---

## 🚀 Pronto!

Agora você sabe como aumentar os limites diretamente na interface do app! 

**Lembre-se:** Use limites maiores apenas quando necessário para economizar egress do Supabase! 💰
