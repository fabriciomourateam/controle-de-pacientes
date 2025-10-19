# 🔐 Sistema de Senhas - Controle de Pacientes

## ☁️ **NOVO: Senhas Armazenadas no Supabase!**

As senhas agora são armazenadas na nuvem no Supabase, permitindo gerenciamento centralizado e atualização sem precisar modificar o código!

## Senhas de Acesso por Seção

Todas as seções do sistema agora estão protegidas por senha. Abaixo estão as credenciais de acesso padrão:

| Seção | Senha | Ícone |
|-------|-------|-------|
| Dashboard | `Dashboard` | 🏠 |
| Pacientes | `Pacientes` | 👥 |
| Checkins | `Checkins` | 📋 |
| Planos | `Planos` | 📋 |
| Métricas Operacionais | `Operacional` | 📊 |
| Métricas Comerciais | `Comercial` | 📊 |
| Workspace | `Workspace` | 🏢 |
| Bioimpedância | `Bioimpedância` | ⚖️ |
| Relatórios | `Relatórios` | 📈 |

## Como Funciona

1. **Primeiro Acesso**: Ao acessar qualquer seção pela primeira vez, um modal de senha será exibido
2. **Autenticação**: Digite a senha correspondente à seção
3. **Persistência**: Após autenticado, você permanecerá com acesso até limpar o localStorage
4. **Segurança**: As senhas são armazenadas localmente para cada seção

## Recursos do Sistema

### Modal de Senha
- ✅ Interface moderna e responsiva
- ✅ Botão de mostrar/ocultar senha
- ✅ Validação em tempo real
- ✅ Mensagens de erro claras
- ✅ Tema dark compatível com o sistema

### Gerenciamento de Sessão
- ✅ Autenticação persistente por seção
- ✅ Logout automático ao limpar localStorage
- ✅ Proteção contra acesso não autorizado
- ✅ Redirecionamento automático

### Componentes Criados

1. **PasswordModal** (`src/components/auth/PasswordModal.tsx`)
   - Modal reutilizável com validação de senha
   - Design moderno com animações
   - Suporte a diferentes seções

2. **AuthGuard** (`src/components/auth/AuthGuard.tsx`)
   - HOC para proteção de rotas
   - Verificação de autenticação
   - Loading states

3. **useAuth** (`src/hooks/use-auth.ts`)
   - Hook personalizado para gerenciar autenticação
   - Estado global de autenticação por seção
   - Métodos de login/logout

## Páginas Protegidas

Todas as seguintes páginas estão protegidas:

- ✅ `src/pages/Dashboard.tsx`
- ✅ `src/pages/Patients.tsx`
- ✅ `src/pages/Checkins.tsx`
- ✅ `src/pages/Plans.tsx`
- ✅ `src/pages/MetricsDashboard.tsx` (Métricas Operacionais)
- ✅ `src/pages/CommercialMetrics.tsx`
- ✅ `src/pages/Workspace.tsx`
- ✅ `src/pages/Bioimpedancia.tsx`
- ✅ `src/pages/Reports.tsx`

## ☁️ Gerenciamento de Senhas no Supabase

### Como Criar a Tabela no Supabase

1. Acesse o **SQL Editor** do Supabase
2. Execute o script `criar-tabela-senhas.sql` que está na raiz do projeto
3. As senhas padrão serão automaticamente inseridas

### Como Alterar Senhas

Existem duas formas de alterar as senhas:

#### 1. **Pelo SQL Editor do Supabase (Recomendado):**

```sql
-- Atualizar senha de uma seção específica
UPDATE senhas_secoes 
SET senha = 'NovaSenha123', updated_at = NOW()
WHERE secao = 'Dashboard';

-- Ver todas as senhas
SELECT secao, senha, ativo FROM senhas_secoes;

-- Desativar acesso a uma seção
UPDATE senhas_secoes 
SET ativo = false 
WHERE secao = 'Planos';
```

#### 2. **Fallback (se o Supabase estiver indisponível):**

As senhas têm um fallback hardcoded no arquivo `src/components/auth/PasswordModal.tsx` que será usado automaticamente se houver erro ao buscar do Supabase.

### Vantagens do Sistema com Supabase

- ✅ **Centralizado**: Todas as senhas em um só lugar
- ✅ **Sem deploy**: Altere senhas sem precisar atualizar o código
- ✅ **Auditável**: Rastreie quando as senhas foram alteradas
- ✅ **Flexível**: Ative/desative seções sem modificar o código
- ✅ **Seguro**: Usa Row Level Security (RLS) do Supabase
- ✅ **Resiliente**: Tem fallback para senhas locais em caso de erro

## Limpeza de Sessão

Para fazer logout de todas as seções:

```javascript
// No console do navegador
Object.keys(localStorage)
  .filter(key => key.startsWith('auth_'))
  .forEach(key => localStorage.removeItem(key));
```

## Notas Importantes

- ⚠️ As senhas são armazenadas em **localStorage** (não é criptografado)
- ⚠️ Para produção, considere implementar autenticação via backend
- ✅ O sistema é completamente modular e reutilizável
- ✅ Cada seção pode ter sua própria senha única

---

**Desenvolvido por:** FM Team
**Data:** Outubro 2025
**Versão:** 1.0.0

