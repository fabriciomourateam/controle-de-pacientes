# Correção do Erro 400 ao Inserir Check-in

## 🔴 PROBLEMA IDENTIFICADO

**Erro:** `POST https://...supabase.co/rest/v1/checkin 400 (Bad Request)`

**Causa Raiz:** Constraint UNIQUE na tabela `checkin` está impedindo a inserção de múltiplos check-ins na mesma data.

### Constraint Problemática
```sql
CONSTRAINT unique_checkin_per_month_user UNIQUE (data_checkin, telefone, user_id)
```

Esta constraint impede que o mesmo paciente (telefone + user_id) tenha mais de um check-in na mesma data, **independente do tipo**.

### Cenários que Causam o Erro

1. **Adicionar Dados Iniciais** - tenta criar check-in tipo 'inicial' na mesma data de um check-in 'completo'
2. **Adicionar Dados de Evolução** - tenta criar check-in tipo 'evolucao' na mesma data de um check-in 'completo'
3. **Check-in duplicado** - tenta criar dois check-ins do mesmo tipo na mesma data

## ✅ SOLUÇÕES DISPONÍVEIS

Escolha uma das 3 opções abaixo conforme sua necessidade:

### OPÇÃO 1: Permitir 1 check-in de cada tipo por data (RECOMENDADO)

Permite 1 'completo' + 1 'evolucao' + 1 'inicial' na mesma data.

Execute o arquivo `sql/fix-unique-constraint-checkin.sql`:

```sql
-- Remover constraint antiga
ALTER TABLE checkin 
DROP CONSTRAINT IF EXISTS unique_checkin_per_month_user;

-- Criar nova constraint incluindo tipo_checkin
ALTER TABLE checkin
ADD CONSTRAINT unique_checkin_per_type_date_user 
UNIQUE (telefone, data_checkin, user_id, tipo_checkin);
```

**Resultado:** ✅ 1 'completo' + ✅ 1 'evolucao' + ✅ 1 'inicial' por data

---

### OPÇÃO 2: Permitir múltiplos check-ins de evolução (SEM LIMITE)

Permite quantos check-ins de 'evolucao' quiser na mesma data, mas bloqueia múltiplos 'completo'.

Execute o arquivo `sql/fix-unique-constraint-apenas-completo.sql`:

```sql
-- Remover constraints antigas
ALTER TABLE checkin 
DROP CONSTRAINT IF EXISTS unique_checkin_per_month_user;
ALTER TABLE checkin 
DROP CONSTRAINT IF EXISTS unique_checkin_per_type_date_user;

-- Criar constraint parcial (apenas para tipo 'completo')
CREATE UNIQUE INDEX unique_completo_per_date_user 
ON checkin (telefone, data_checkin, user_id)
WHERE tipo_checkin = 'completo';
```

**Resultado:** ✅ 1 'completo' + ✅ MÚLTIPLOS 'evolucao' + ✅ MÚLTIPLOS 'inicial' por data

---

### OPÇÃO 3: Sem limite nenhum (TOTAL LIBERDADE)

Permite quantos check-ins quiser de qualquer tipo na mesma data.

Execute o arquivo `sql/fix-unique-constraint-sem-limite.sql`:

```sql
-- Remover todas as constraints
ALTER TABLE checkin 
DROP CONSTRAINT IF EXISTS unique_checkin_per_month_user;
ALTER TABLE checkin 
DROP CONSTRAINT IF EXISTS unique_checkin_per_type_date_user;
```

**Resultado:** ✅ MÚLTIPLOS de qualquer tipo por data

---

### Passo 2: Verificar a Correção

Execute `sql/verificar-constraint-unique.sql` para confirmar que a constraint foi modificada corretamente.

## 📊 COMPORTAMENTO APÓS CORREÇÃO

### OPÇÃO 1 (Recomendado)
✅ **1 check-in 'completo'** por data/paciente
✅ **1 check-in 'evolucao'** por data/paciente  
✅ **1 check-in 'inicial'** por data/paciente
❌ **NÃO permite** dois check-ins do **mesmo tipo** na mesma data

### OPÇÃO 2 (Múltiplos de evolução)
✅ **1 check-in 'completo'** por data/paciente
✅ **MÚLTIPLOS check-ins 'evolucao'** por data/paciente  
✅ **MÚLTIPLOS check-ins 'inicial'** por data/paciente
❌ **NÃO permite** dois check-ins **'completo'** na mesma data

### OPÇÃO 3 (Sem limite)
✅ **MÚLTIPLOS check-ins de qualquer tipo** por data/paciente
✅ **Total liberdade** para criar quantos check-ins quiser

### Exemplos Permitidos

```
Paciente: (11) 99999-9999
Data: 2025-01-17

✅ Check-in tipo 'completo'   - OK
✅ Check-in tipo 'evolucao'   - OK (mesma data, tipo diferente)
✅ Check-in tipo 'inicial'    - OK (mesma data, tipo diferente)
```

### Exemplos Bloqueados

```
Paciente: (11) 99999-9999
Data: 2025-01-17

✅ Check-in tipo 'completo'   - OK (primeiro)
❌ Check-in tipo 'completo'   - ERRO (duplicado do mesmo tipo)
```

## 🔍 DIAGNÓSTICO

Se o erro persistir após executar o SQL:

1. Execute `sql/verificar-constraint-unique.sql` para ver duplicatas existentes
2. Verifique o Console do navegador (F12) para ver a mensagem de erro completa
3. Confirme que a constraint antiga foi removida e a nova foi criada

## 📝 ARQUIVOS RELACIONADOS

- `sql/fix-unique-constraint-checkin.sql` - **OPÇÃO 1:** 1 de cada tipo por data
- `sql/fix-unique-constraint-apenas-completo.sql` - **OPÇÃO 2:** Múltiplos de evolução
- `sql/fix-unique-constraint-sem-limite.sql` - **OPÇÃO 3:** Sem limite nenhum
- `sql/verificar-constraint-unique.sql` - SQL de diagnóstico
- `sql/diagnosticar-erro-400-checkin.sql` - SQL de análise completa

## ⚠️ IMPORTANTE

Esta correção é **essencial** para o funcionamento correto de:
- Sistema de Dados Iniciais
- Sistema de Evolução Comparativa
- Timeline de Check-ins
- Feedback Card com histórico

Sem esta correção, o sistema não consegue criar registros de evolução e dados iniciais.
