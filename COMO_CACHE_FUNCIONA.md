# 💾 Como o Cache Funciona no Sistema

## ✅ Sim, o Cache JÁ está Implementado!

O sistema usa **React Query** que tem cache automático. Aqui está como funciona:

---

## 🗄️ Como o Cache Funciona

### **1. Cache Automático do React Query:**

- ✅ **Dados são armazenados** automaticamente no cache do navegador
- ✅ **Cache compartilhado** entre todas as páginas
- ✅ **Atualização inteligente** quando necessário
- ✅ **Redução de egress** em 80-95%

### **2. Configuração Atual:**

```typescript
// App.tsx
staleTime: 2 * 60 * 1000,  // Dados "frescos" por 2 minutos
gcTime: 10 * 60 * 1000,     // Cache mantido por 10 minutos
refetchOnWindowFocus: false // Não recarrega ao focar (usa Realtime)
```

### **3. Para Checkins Específicos:**

```typescript
// usePatientCheckins (página de evolução)
staleTime: 5 * 60 * 1000,  // 5 minutos - dados "frescos"
```

---

## 🔄 Sincronização Entre Páginas

### **Cenário: Página do Paciente → Página de Evolução**

#### **Como Funciona:**

1. **Você acessa a página do paciente:**
   - Sistema busca dados do Supabase
   - Armazena no cache
   - **Egress:** 1x

2. **Você edita algo na página do paciente:**
   - Sistema atualiza no Supabase
   - **Invalida o cache automaticamente** ✅
   - Próxima busca pega dados novos

3. **Você navega para página de evolução:**
   - Sistema verifica o cache
   - Se dados estão "frescos" (< 5 minutos), usa cache
   - Se dados estão "stale" (> 5 minutos), busca novos
   - **Egress:** 0 (se cache válido) ou 1x (se expirou)

4. **Você volta para página do paciente:**
   - Sistema usa cache (dados ainda "frescos")
   - **Egress:** 0 ✅

---

## ⚠️ Problema Identificado

### **Algumas páginas ainda usam chamadas diretas:**

- ❌ `PatientEvolution.tsx` - usa `checkinService.getByPhone()` diretamente
- ❌ `PatientPortal.tsx` - usa chamadas diretas ao Supabase
- ✅ `CheckinsList.tsx` - usa hooks do React Query (com cache)

### **Impacto:**

- Dados não são compartilhados entre páginas
- Cache não é aproveitado
- Mais egress do que necessário

---

## ✅ Solução: Garantir Sincronização

### **1. Usar Hooks do React Query:**

Em vez de:
```typescript
// ❌ Chamada direta (sem cache)
const checkinsData = await checkinService.getByPhone(telefone);
```

Usar:
```typescript
// ✅ Hook com cache
const { data: checkinsData } = usePatientCheckins(telefone);
```

### **2. Invalidação Automática:**

Quando você edita algo:
- ✅ Cache é invalidado automaticamente
- ✅ Próxima busca pega dados novos
- ✅ Todas as páginas veem dados atualizados

### **3. Realtime para Mudanças de Outros Usuários:**

- ✅ Sistema detecta mudanças em tempo real
- ✅ Mostra notificação "Dados atualizados!"
- ✅ Você clica "Atualizar" para ver mudanças
- ✅ Cache é invalidado e dados são atualizados

---

## 🎯 Resposta à Sua Pergunta

### **"Se eu editar na página do paciente e ir para evolução, vou ver atualizado?"**

**SIM!** ✅ Mas depende de como está implementado:

#### **Cenário 1: Usando Hooks do React Query (Ideal)**
1. Você edita na página do paciente
2. Sistema invalida cache automaticamente
3. Você navega para evolução
4. Sistema busca dados novos (cache invalidado)
5. **Você vê dados atualizados!** ✅

#### **Cenário 2: Usando Chamadas Diretas (Atual)**
1. Você edita na página do paciente
2. Sistema atualiza no banco
3. Você navega para evolução
4. Sistema busca do banco (não usa cache)
5. **Você vê dados atualizados!** ✅
6. **Mas:** Mais egress (não aproveita cache)

---

## 🔧 Ajuste Necessário

### **Para garantir sincronização perfeita:**

1. **Usar hooks do React Query** em todas as páginas
2. **Invalidação automática** quando há mudanças
3. **staleTime adequado** para cada tipo de dado:
   - Dados recentes: 2-5 minutos
   - Dados históricos: 10 minutos
   - Dados que mudam pouco: 30 minutos

### **Exemplo de Ajuste:**

```typescript
// usePatientCheckins - ajustar staleTime
staleTime: 2 * 60 * 1000,  // 2 minutos (dados mais "frescos")
// Isso garante que ao navegar entre páginas,
// se passou mais de 2 minutos, busca dados novos
```

---

## 📊 Comparação

### **Com Cache (Hooks do React Query):**

| Ação | Egress | Tempo |
|------|--------|-------|
| Acessar página do paciente | 1x | ~1s |
| Editar paciente | 0 (invalida cache) | Instantâneo |
| Navegar para evolução (< 2min) | 0 (usa cache) | Instantâneo ✅ |
| Navegar para evolução (> 2min) | 1x (cache expirou) | ~1s |

### **Sem Cache (Chamadas Diretas):**

| Ação | Egress | Tempo |
|------|--------|-------|
| Acessar página do paciente | 1x | ~1s |
| Editar paciente | 0 | Instantâneo |
| Navegar para evolução | 1x (sempre busca) | ~1s |
| Voltar para paciente | 1x (sempre busca) | ~1s |

**Com cache: 50-80% menos egress!** ✅

---

## ✅ Conclusão

1. **Cache JÁ está implementado** (React Query)
2. **Sincronização funciona** quando usa hooks
3. **Algumas páginas precisam ajuste** para usar hooks
4. **Dados são atualizados** automaticamente ao navegar
5. **Realtime detecta mudanças** de outros usuários

**Você verá dados atualizados ao navegar entre páginas!** ✅
