# 🔐 Sistema de Permissões e Controle de Acesso

## ✅ Como Funciona

### 1. **Tipos de Usuários**

#### 👑 Owner (Proprietário)
- **Quem é**: O usuário que criou a conta
- **Acesso**: TOTAL - pode fazer tudo
- **Identificação**: Não tem registro na tabela `team_members`
- **Menu**: Vê todos os itens, incluindo "Gestão de Equipe"

#### 👥 Membro da Equipe
- **Quem é**: Usuário adicionado pelo owner
- **Acesso**: Baseado no perfil atribuído
- **Identificação**: Tem registro na tabela `team_members`
- **Menu**: Vê apenas itens que tem permissão

---

## 🎯 Controle de Acesso por Recurso

### Mapeamento de Rotas e Permissões

| Rota | Recurso | Ação | Descrição |
|------|---------|------|-----------|
| `/` | - | - | Dashboard (todos veem) |
| `/patients` | `patients` | `view` | Lista de pacientes |
| `/retention` | `patients` | `view` | Dashboard de retenção |
| `/checkins` | `checkins` | `view` | Check-ins |
| `/plans` | `diets` | `view` | Planos alimentares |
| `/metrics` | `metrics` | `view_sales` | Métricas operacionais |
| `/commercial-metrics` | `metrics` | `view_sales` | Métricas comerciais |
| `/reports` | `reports` | `clinical` | Relatórios |
| `/team` | - | - | Gestão de equipe (só owner) |

---

## 🔧 Como Usar no Código

### 1. **Verificar Permissão em Componentes**

```tsx
import { useAuthContext } from '@/contexts/AuthContext';

function MyComponent() {
  const { hasPermission, isOwner } = useAuthContext();
  
  // Verificar se pode deletar pacientes
  const canDelete = hasPermission('patients', 'delete');
  
  return (
    <div>
      {canDelete && <button>Deletar</button>}
      {isOwner && <button>Configurações Avançadas</button>}
    </div>
  );
}
```

### 2. **Ocultar Elementos com PermissionGate**

```tsx
import { PermissionGate } from '@/components/auth/PermissionGate';

function PatientsList() {
  return (
    <div>
      <h1>Pacientes</h1>
      
      {/* Botão só aparece se tiver permissão */}
      <PermissionGate resource="patients" action="create">
        <button>Adicionar Paciente</button>
      </PermissionGate>
      
      {/* Botão só aparece se tiver permissão */}
      <PermissionGate resource="patients" action="delete">
        <button>Deletar</button>
      </PermissionGate>
    </div>
  );
}
```

### 3. **Verificar no Backend (RLS)**

As políticas RLS (Row Level Security) no Supabase garantem que:
- Cada owner vê apenas seus próprios dados
- Membros da equipe veem apenas dados do owner que os adicionou
- Ninguém vê dados de outros owners

---

## 📊 Fluxo de Autenticação

```
1. Usuário faz login
   ↓
2. AuthContext carrega perfil
   ↓
3. Verifica se é membro de equipe
   ↓
4. Se SIM: carrega permissões do perfil
   Se NÃO: é owner (acesso total)
   ↓
5. Menu lateral filtra itens baseado em permissões
   ↓
6. Componentes verificam permissões antes de mostrar ações
```

---

## 🎨 Exemplos de Perfis

### Nutricionista
```json
{
  "dashboard": true,
  "patients": {
    "view": true,
    "create": true,
    "edit": true,
    "delete": false
  },
  "checkins": {
    "view": true,
    "create": true,
    "edit": true,
    "delete": false
  },
  "diets": {
    "view": true,
    "create": true,
    "edit": true,
    "delete": false,
    "release": true
  }
}
```

### Estagiário (Apenas Visualização)
```json
{
  "dashboard": true,
  "patients": {
    "view": true,
    "create": false,
    "edit": false,
    "delete": false
  },
  "checkins": {
    "view": true,
    "create": false,
    "edit": false,
    "delete": false
  }
}
```

### Vendedor (Métricas)
```json
{
  "dashboard": true,
  "metrics": {
    "view_sales": true,
    "view_retention": true,
    "export": true
  },
  "reports": {
    "financial": true,
    "export": true
  }
}
```

---

## 🔒 Segurança

### Camadas de Proteção

1. **Frontend (UI)**
   - Menu lateral filtra itens
   - Botões ocultos sem permissão
   - PermissionGate controla visibilidade

2. **Backend (Supabase RLS)**
   - Políticas garantem acesso apenas aos próprios dados
   - Membros não podem ver dados de outros owners
   - Queries automáticas filtram por owner_id

3. **Validação**
   - Toda ação verifica permissão antes de executar
   - Logs de auditoria registram todas as ações

---

## 📝 Adicionar Novo Recurso Protegido

### Passo 1: Adicionar no PERMISSIONS_STRUCTURE.json
```json
{
  "novo_recurso": {
    "label": "Novo Recurso",
    "type": "object",
    "children": {
      "view": { "label": "Visualizar", "description": "Ver lista" },
      "create": { "label": "Criar", "description": "Criar novos" }
    }
  }
}
```

### Passo 2: Adicionar no AppSidebar.tsx
```typescript
const routePermissions: Record<string, { resource: string; action?: string }> = {
  // ... existentes
  "/novo-recurso": { resource: "novo_recurso", action: "view" },
};
```

### Passo 3: Usar no Componente
```tsx
<PermissionGate resource="novo_recurso" action="create">
  <button>Criar Novo</button>
</PermissionGate>
```

---

## ✅ Resumo

- ✅ **Owner**: Acesso total, sem restrições
- ✅ **Membros**: Acesso baseado em permissões do perfil
- ✅ **Menu dinâmico**: Mostra apenas o que pode acessar
- ✅ **Segurança**: Frontend + Backend (RLS)
- ✅ **Flexível**: Fácil adicionar novos recursos
- ✅ **Auditável**: Logs de todas as ações

**Sistema 100% funcional e seguro!** 🎉
