# 🔧 Guia de Correção: Gestão de Equipe

## 📋 RESUMO DO PROBLEMA

Você quer que:
1. ✅ Cada nutri veja apenas seus próprios dados
2. ✅ Cada nutri possa adicionar membros à equipe
3. ⚠️ **Membros vejam os mesmos dados do nutri** (PRECISA CORRIGIR)
4. ✅ Membros só vejam as páginas que têm permissão
5. ❓ Membros não vejam campos específicos (OPCIONAL)

**Status Atual:**
- ✅ Itens 1, 2 e 4 estão funcionando
- ⚠️ Item 3 precisa de correção nas políticas RLS
- ❓ Item 5 não está implementado (pode ser feito depois)

---

## 🚀 PASSO A PASSO PARA CORRIGIR

### PASSO 1: Executar SQL de Correção

⚠️ **IMPORTANTE:** Descobri que as tabelas não têm a coluna `owner_id` ainda. Vamos adicionar primeiro!

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie e cole o conteúdo do arquivo: `sql/add-owner-id-and-fix-rls.sql`
5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Aguarde a execução (deve levar alguns segundos)

**O que este SQL faz:**
- Adiciona coluna `user_id` nas tabelas `patients` e `checkin`
- Cria índices para performance
- Habilita Row Level Security (RLS)
- Cria políticas para isolamento e acesso de equipe
- Cria triggers para auto-atribuir `user_id` em novos registros

### PASSO 1.5: Popular Dados Existentes

Após executar o SQL acima, você precisa atribuir seus dados existentes ao seu usuário:

1. Descubra seu `user_id`:
```sql
SELECT id, email FROM auth.users;
```

2. Copie o ID que aparece ao lado do seu email

3. Execute (substituindo `SEU_USER_ID_AQUI` pelo ID copiado):
```sql
UPDATE patients SET user_id = 'SEU_USER_ID_AQUI' WHERE user_id IS NULL;
UPDATE checkin SET user_id = 'SEU_USER_ID_AQUI' WHERE user_id IS NULL;
```

**Exemplo:**
```sql
-- Se seu ID for: 123e4567-e89b-12d3-a456-426614174000
UPDATE patients SET user_id = '123e4567-e89b-12d3-a456-426614174000' WHERE user_id IS NULL;
UPDATE checkin SET user_id = '123e4567-e89b-12d3-a456-426614174000' WHERE user_id IS NULL;
```

### PASSO 2: Testar o Sistema

#### 2.1. Fazer Login como Owner (Nutricionista)
```
Email: fabriciomouratreinador@gmail.com
Senha: [sua senha]
```

#### 2.2. Adicionar um Membro de Teste
1. Vá em **Gestão de Equipe** no menu
2. Clique em **Adicionar Membro**
3. Selecione **Cadastro Direto**
4. Preencha:
   - Nome: "Teste Assistente"
   - Email: "teste@exemplo.com"
   - Senha: "teste123"
5. Selecione perfil: **Assistente**
6. Clique em **Adicionar Membro**

#### 2.3. Fazer Logout e Login como Membro
1. Faça logout
2. Faça login com:
   - Email: teste@exemplo.com
   - Senha: teste123

#### 2.4. Verificar Acesso aos Dados
- ✅ Você deve ver os **mesmos pacientes** do owner
- ✅ Você deve ver os **mesmos check-ins** do owner
- ✅ O menu deve mostrar **apenas** as páginas que você tem permissão
- ✅ Botões de ações devem aparecer/desaparecer baseado em permissões

#### 2.5. Verificar Isolamento
1. Faça logout
2. Crie uma nova conta de nutricionista (outro owner)
3. Adicione alguns pacientes
4. Faça login novamente como "teste@exemplo.com"
5. ✅ Você **NÃO** deve ver os pacientes do outro nutricionista

---

## 🎯 COMO FUNCIONA AGORA

### Estrutura de Acesso

```
┌─────────────────────────────────────────┐
│ Nutricionista A (Owner)                 │
│ - Paciente 1                            │
│ - Paciente 2                            │
│ - Paciente 3                            │
│                                         │
│ Membros da Equipe:                      │
│ ├── Assistente (vê Pacientes 1, 2, 3)  │
│ └── Estagiário (vê Pacientes 1, 2, 3)  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Nutricionista B (Owner)                 │
│ - Paciente 4                            │
│ - Paciente 5                            │
│                                         │
│ Membros da Equipe:                      │
│ └── Vendedor (vê Pacientes 4, 5)       │
└─────────────────────────────────────────┘

❌ Assistente do Nutri A NÃO vê Pacientes 4, 5
❌ Vendedor do Nutri B NÃO vê Pacientes 1, 2, 3
```

### Controle de Permissões

#### Exemplo: Perfil "Assistente"
```json
{
  "patients": {
    "view": true,      ✅ Vê lista de pacientes
    "create": false,   ❌ Não pode adicionar pacientes
    "edit": true,      ✅ Pode editar pacientes
    "delete": false    ❌ Não pode deletar pacientes
  },
  "checkins": {
    "view": true,      ✅ Vê check-ins
    "create": true,    ✅ Pode criar check-ins
    "edit": true,      ✅ Pode editar check-ins
    "delete": false    ❌ Não pode deletar check-ins
  }
}
```

**Resultado:**
- ✅ Menu mostra: Dashboard, Pacientes, Check-ins
- ❌ Menu NÃO mostra: Métricas Comerciais, Gestão de Equipe
- ✅ Botão "Editar Paciente" aparece
- ❌ Botão "Deletar Paciente" NÃO aparece
- ✅ Botão "Novo Check-in" aparece

---

## 🎨 PERSONALIZAR PERMISSÕES

### Criar Perfil Personalizado

1. Vá em **Gestão de Equipe**
2. Clique em **Perfis de Acesso**
3. Clique em **Novo Perfil**
4. Preencha:
   - Nome: "Recepcionista"
   - Descrição: "Apenas visualização e check-ins"
5. Configure permissões:
   - Dashboard: ✅
   - Pacientes: ✅ view
   - Check-ins: ✅ view, ✅ create
   - Planos: ❌ (tudo desmarcado)
   - Métricas: ❌ (tudo desmarcado)
6. Clique em **Salvar**

### Personalizar Permissões de um Membro

1. Na lista de membros, clique em **⋮** (três pontos)
2. Selecione **Editar**
3. Clique em **Personalizar Permissões**
4. Marque/desmarque as permissões desejadas
5. Clique em **Salvar Alterações**

**Exemplo de Personalização:**
- Perfil base: "Assistente"
- Personalização: Adicionar permissão de "deletar check-ins"
- Resultado: Membro tem todas as permissões do Assistente + deletar check-ins

---

## 📊 PERFIS DISPONÍVEIS

### 👑 Administrador
**Acesso:** TOTAL
- ✅ Todas as páginas
- ✅ Todas as ações
- ✅ Pode gerenciar equipe

**Quando usar:** Para gerentes ou sócios

### 🥗 Nutricionista
**Acesso:** Gestão de pacientes e planos
- ✅ Pacientes (view, create, edit)
- ✅ Check-ins (view, create, edit)
- ✅ Planos (view, create, edit, release)
- ✅ Métricas operacionais
- ❌ Não pode deletar
- ❌ Não pode gerenciar equipe

**Quando usar:** Para nutricionistas da equipe

### 🤝 Assistente
**Acesso:** Suporte operacional
- ✅ Pacientes (view, edit)
- ✅ Check-ins (view, create, edit)
- ❌ Não pode criar pacientes
- ❌ Não pode deletar
- ❌ Não vê métricas comerciais

**Quando usar:** Para assistentes administrativos

### 💼 Vendedor
**Acesso:** Métricas comerciais
- ✅ Dashboard
- ✅ Pacientes (view)
- ✅ Métricas (view, export)
- ✅ Relatórios (view, export)
- ❌ Não pode editar dados

**Quando usar:** Para equipe comercial

### 👨‍🎓 Estagiário
**Acesso:** Apenas visualização
- ✅ Dashboard
- ✅ Pacientes (view)
- ✅ Check-ins (view)
- ❌ Não pode criar/editar/deletar

**Quando usar:** Para estagiários ou observadores

---

## ❓ CONTROLE DE CAMPOS (OPCIONAL)

### O que NÃO está implementado

Atualmente, se um membro tem acesso à página de Pacientes, ele vê **TODOS os campos**:
- Nome, Email, Telefone, CPF, Endereço, etc.

Se você quiser **ocultar campos específicos** (ex: telefone, email), isso precisa ser implementado.

### Como Implementar (Se Necessário)

#### Opção 1: Manual (Simples)
Adicionar verificações em cada componente:

```typescript
// Exemplo em PatientsList.tsx
{hasPermission('patients', 'view_phone') && (
  <td>{patient.telefone}</td>
)}
```

#### Opção 2: Componente Reutilizável
Criar um componente `<FieldGate>`:

```typescript
<FieldGate resource="patients" field="telefone">
  <td>{patient.telefone}</td>
</FieldGate>
```

#### Opção 3: Sistema Automático
Adicionar `hidden_fields` nas permissões:

```json
{
  "patients": {
    "view": true,
    "hidden_fields": ["telefone", "email", "cpf"]
  }
}
```

**Recomendação:** Só implemente se realmente precisar. Na maioria dos casos, controlar o acesso às páginas é suficiente.

---

## 🐛 TROUBLESHOOTING

### Problema: Membro não vê dados do owner

**Causa:** Políticas RLS não foram atualizadas

**Solução:**
1. Execute o SQL: `sql/fix-team-member-rls-policies.sql`
2. Faça logout e login novamente
3. Limpe o cache do navegador (Ctrl+Shift+Delete)

### Problema: Membro vê dados de outro owner

**Causa:** Erro nas políticas RLS

**Solução:**
1. Verifique se o SQL foi executado corretamente
2. Verifique se o `owner_id` está correto na tabela `team_members`
3. Execute a query de verificação:

```sql
SELECT 
  tm.email as membro_email,
  p.email as owner_email,
  tm.owner_id,
  tm.user_id,
  tm.is_active
FROM team_members tm
JOIN profiles p ON p.id = tm.owner_id
WHERE tm.user_id = auth.uid();
```

### Problema: Menu não filtra itens

**Causa:** Permissões não estão sendo carregadas

**Solução:**
1. Abra o console do navegador (F12)
2. Verifique se há erros
3. Verifique se `hasPermission` está retornando valores corretos:

```javascript
// No console do navegador
console.log(window.__AUTH_CONTEXT__);
```

### Problema: Botões não aparecem/desaparecem

**Causa:** Componente não está usando `hasPermission`

**Solução:**
Adicionar verificação no componente:

```typescript
import { useAuthContext } from '@/contexts/AuthContext';

function MyComponent() {
  const { hasPermission } = useAuthContext();
  const canDelete = hasPermission('patients', 'delete');

  return (
    <div>
      {canDelete && <button>Deletar</button>}
    </div>
  );
}
```

---

## ✅ CHECKLIST FINAL

### Após Executar o SQL

- [ ] SQL executado sem erros
- [ ] Membro de teste criado
- [ ] Login como membro funciona
- [ ] Membro vê dados do owner
- [ ] Membro NÃO vê dados de outros owners
- [ ] Menu filtra itens corretamente
- [ ] Botões aparecem/desaparecem baseado em permissões
- [ ] Ações são bloqueadas quando sem permissão

### Sistema Funcionando

- [ ] Owners veem apenas seus dados
- [ ] Membros veem dados do owner
- [ ] Isolamento entre owners funciona
- [ ] Permissões são respeitadas
- [ ] Interface responde às permissões

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- `ANALISE_GESTAO_EQUIPE.md` - Análise completa do sistema
- `RESUMO_GESTAO_EQUIPE.md` - Resumo de funcionalidades
- `IMPLEMENTACAO_GESTAO_EQUIPE.md` - Guia de implementação
- `SISTEMA_PERMISSOES.md` - Como usar permissões no código
- `sql/fix-team-member-rls-policies.sql` - SQL de correção

---

## 🎉 CONCLUSÃO

Após executar o SQL de correção, o sistema estará **100% funcional** para:

✅ Cada nutri vê apenas seus dados
✅ Cada nutri pode adicionar membros
✅ Membros veem os mesmos dados do nutri
✅ Membros só veem páginas permitidas
✅ Ações são controladas por permissões

**Próximo passo:** Execute o SQL e teste! 🚀
