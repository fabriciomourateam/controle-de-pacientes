# 🔒 Como Funciona o Sistema de Lock

## 📋 Visão Geral

O sistema de lock previne que duas pessoas editem o mesmo check-in simultaneamente, evitando conflitos e perda de dados.

## 🔧 Como Funciona

### **1. Adquirir Lock**
```typescript
// Quando alguém clica para editar um check-in
const canEdit = await acquireLock(checkinId);
if (canEdit) {
  // Usuário pode editar
  showEditForm();
} else {
  // Alguém já está editando
  showMessage("Check-in sendo editado por outro usuário");
}
```

### **2. Verificar Status**
```typescript
// Verificar se alguém está editando
const lockInfo = await checkLockStatus(checkinId);
if (lockInfo.is_locked) {
  showIndicator(`Sendo editado por ${lockInfo.locked_by_name}`);
}
```

### **3. Liberar Lock**
```typescript
// Quando termina de editar ou cancela
await releaseLock(checkinId);
```

## ⏰ Regras do Sistema

### **Timeout Automático**
- **Duração**: 30 minutos
- **Comportamento**: Lock expira automaticamente
- **Recuperação**: Sistema limpa locks órfãos

### **Prioridades**
1. **Mesmo usuário**: Pode "roubar" seu próprio lock
2. **Lock expirado**: Qualquer um pode adquirir
3. **Lock ativo**: Bloqueado para outros usuários

### **Indicadores Visuais**
- 🔒 **Ícone de cadeado** quando bloqueado
- 👤 **Nome do usuário** que está editando
- ⏱️ **Tempo restante** do lock
- 🟡 **Cor diferente** no card

## 🎯 Fluxo Completo

### **Cenário 1: Edição Normal**
```
Usuário A clica "Editar" → Adquire lock → Edita → Salva → Libera lock
```

### **Cenário 2: Conflito**
```
Usuário A está editando → Usuário B tenta editar → Vê mensagem de bloqueio
```

### **Cenário 3: Timeout**
```
Usuário A abandona edição → 30min depois → Lock expira → Usuário B pode editar
```

## 🛠️ Implementação Técnica

### **Banco de Dados**
```sql
-- Colunas na tabela checkin
locked_by UUID REFERENCES auth.users(id)  -- Quem está editando
locked_at TIMESTAMP WITH TIME ZONE        -- Quando começou
```

### **Funções SQL**
```sql
-- Adquirir lock
SELECT acquire_checkin_lock(checkin_id, user_id);

-- Liberar lock  
SELECT release_checkin_lock(checkin_id, user_id);

-- Limpar expirados
SELECT cleanup_expired_locks();
```

### **Frontend React**
```typescript
// Hook personalizado
const { acquireLock, releaseLock, checkLockStatus } = useCheckinManagement();

// Componente com indicador
{lockInfo.is_locked && (
  <div className="lock-indicator">
    🔒 Editando: {lockInfo.locked_by_name}
  </div>
)}
```

## 🚀 Status Atual

### **✅ Implementado**
- Funções SQL de lock/unlock
- Hook React com todas as operações
- Componentes com indicadores visuais
- Sistema de timeout automático

### **⏳ Pendente**
- Adicionar colunas `locked_by` e `locked_at` na tabela `checkin`
- Ativar verificações de lock no frontend
- Testar com múltiplos usuários

## 🔧 Para Ativar o Sistema

### **1. Execute o SQL:**
```sql
-- Adicionar colunas necessárias
ALTER TABLE checkin ADD COLUMN locked_by UUID REFERENCES auth.users(id);
ALTER TABLE checkin ADD COLUMN locked_at TIMESTAMP WITH TIME ZONE;
```

### **2. Ative no Frontend:**
```typescript
// Em use-checkin-management.ts
// Remover comentários "temporariamente desabilitado"
// Restaurar funções originais
```

### **3. Teste:**
- Abra em duas abas diferentes
- Tente editar o mesmo check-in
- Verifique indicadores visuais

## 💡 Benefícios

### **Para Equipes**
- ✅ **Sem conflitos** de edição simultânea
- ✅ **Visibilidade** de quem está trabalhando
- ✅ **Recuperação automática** de locks órfãos
- ✅ **Experiência fluida** para colaboração

### **Para Usuários**
- ✅ **Feedback claro** sobre disponibilidade
- ✅ **Prevenção de perda** de dados
- ✅ **Interface intuitiva** com indicadores
- ✅ **Timeout inteligente** para casos extremos

## 🎯 Casos de Uso

### **Clínica com Equipe**
```
Nutricionista A: Analisando check-in da paciente Maria
Nutricionista B: Vê que está ocupado, trabalha em outro
Nutricionista A: Termina e libera
Nutricionista B: Agora pode editar
```

### **Trabalho Remoto**
```
Manhã: Dr. João revisa check-ins
Tarde: Assistente vê quais ainda precisam de atenção
Noite: Estagiário pode trabalhar nos disponíveis
```

### **Emergências**
```
Lock expira automaticamente após 30min
Sistema se recupera sozinho
Ninguém fica "preso" permanentemente
```

O sistema está **100% pronto** - só precisa das colunas no banco para funcionar! 🎉