# Especificação: Sistema de Gestão de Equipe e Permissões

## Visão Geral

Sistema que permite cada nutricionista gerenciar sua própria equipe, cadastrando membros e controlando o acesso deles à plataforma através de perfis de permissão personalizáveis.

## Funcionalidades Principais

### 1. Gestão de Membros da Equipe

#### 1.1 Cadastro de Membros
- Nutricionista pode adicionar membros informando:
  - Nome completo
  - Email
  - Perfil de acesso (role)
- Sistema envia convite por email
- Membro aceita convite e cria senha
- Membro passa a ter acesso conforme permissões do perfil

#### 1.2 Listagem de Membros
- Visualizar todos os membros da equipe
- Filtrar por:
  - Status (Ativo/Inativo)
  - Perfil de acesso
  - Data de cadastro
- Buscar por nome ou email
- Ver último acesso de cada membro

#### 1.3 Edição de Membros
- Alterar nome
- Alterar perfil de acesso
- Ativar/Desativar acesso
- Remover membro da equipe

### 2. Perfis de Acesso (Roles)

#### 2.1 Perfis Padrão do Sistema

**Administrador**
- Acesso total a todas as funcionalidades
- Pode gerenciar equipe
- Pode alterar configurações

**Estagiário**
- ✅ Dashboard
- ✅ Pacientes
- ✅ Check-ins
- ✅ Planos Alimentares
- ❌ Métricas Comerciais
- ❌ Relatórios Financeiros
- ❌ Gestão de Equipe
- ❌ Configurações
- ❌ Faturamento

**Vendedor**
- ❌ Dashboard
- ❌ Pacientes
- ❌ Check-ins
- ❌ Planos Alimentares
- ✅ Métricas Comerciais
- ✅ Relatórios de Vendas
- ❌ Gestão de Equipe
- ❌ Configurações
- ❌ Faturamento

**Assistente**
- ✅ Dashboard
- ✅ Pacientes (visualização)
- ✅ Check-ins
- ❌ Planos Alimentares
- ❌ Métricas
- ❌ Relatórios
- ❌ Gestão de Equipe
- ❌ Configurações
- ❌ Faturamento

**Nutricionista**
- ✅ Dashboard
- ✅ Pacientes
- ✅ Check-ins
- ✅ Planos Alimentares
- ❌ Métricas Comerciais
- ✅ Relatórios Clínicos
- ❌ Gestão de Equipe
- ❌ Configurações
- ❌ Faturamento

#### 2.2 Edição de Permissões
- Ao adicionar ou editar um membro, pode personalizar permissões
- Interface com checkboxes para cada funcionalidade
- Pode partir de um perfil padrão e customizar
- Pode criar perfis totalmente personalizados
- Salvar como novo perfil para reutilizar

**Interface de Edição de Permissões:**
```
┌─────────────────────────────────────────────┐
│ Personalizar Permissões                     │
├─────────────────────────────────────────────┤
│                                             │
│ Perfil Base: [Estagiário ▼]                │
│                                             │
│ 📊 Funcionalidades                          │
│                                             │
│ ☑️ Dashboard                                │
│    Visualizar métricas e gráficos gerais   │
│                                             │
│ ☑️ Pacientes                                │
│    ☑️ Visualizar lista                     │
│    ☑️ Adicionar novos                      │
│    ☑️ Editar dados                         │
│    ☐ Deletar pacientes                     │
│                                             │
│ ☑️ Check-ins                                │
│    ☑️ Visualizar                           │
│    ☑️ Registrar novos                      │
│    ☑️ Editar                               │
│    ☐ Deletar                               │
│                                             │
│ ☑️ Planos Alimentares                       │
│    ☑️ Visualizar                           │
│    ☑️ Criar novos                          │
│    ☑️ Editar                               │
│    ☐ Deletar                               │
│    ☑️ Liberar para pacientes               │
│                                             │
│ ☐ Métricas Comerciais                      │
│    ☐ Visualizar vendas                     │
│    ☐ Visualizar retenção                   │
│    ☐ Exportar relatórios                   │
│                                             │
│ ☐ Relatórios                                │
│    ☐ Gerar relatórios clínicos             │
│    ☐ Gerar relatórios financeiros          │
│    ☐ Exportar relatórios                   │
│                                             │
│ ☐ Gestão de Equipe                          │
│    ☐ Visualizar membros                    │
│    ☐ Adicionar membros                     │
│    ☐ Editar membros                        │
│    ☐ Remover membros                       │
│                                             │
│ ☐ Configurações                             │
│    ☐ Alterar dados da conta                │
│    ☐ Configurar integrações                │
│                                             │
│ ☐ Faturamento                               │
│    ☐ Visualizar plano                      │
│    ☐ Alterar plano                         │
│                                             │
│ ☐ Salvar como novo perfil                  │
│   Nome: [_____________________]             │
│                                             │
│         [Cancelar]  [Salvar Permissões]    │
└─────────────────────────────────────────────┘
```

### 3. Controle de Acesso

#### 3.1 Verificação de Permissões
- Ao acessar cada página, sistema verifica permissões
- Se não tiver permissão, redireciona para página de acesso negado
- Menu lateral mostra apenas opções permitidas

#### 3.2 Permissões Granulares

**Dashboard**
- Visualizar métricas gerais
- Visualizar gráficos de evolução

**Pacientes**
- Visualizar lista de pacientes
- Adicionar novos pacientes
- Editar dados de pacientes
- Deletar pacientes
- Acessar portal do paciente

**Check-ins**
- Visualizar check-ins
- Registrar novos check-ins
- Editar check-ins
- Deletar check-ins

**Planos Alimentares**
- Visualizar planos
- Criar novos planos
- Editar planos
- Deletar planos
- Liberar planos para pacientes

**Métricas Comerciais**
- Visualizar métricas de vendas
- Visualizar métricas de retenção
- Exportar relatórios

**Relatórios**
- Gerar relatórios clínicos
- Gerar relatórios financeiros
- Exportar relatórios

**Gestão de Equipe**
- Visualizar membros
- Adicionar membros
- Editar membros
- Remover membros
- Gerenciar perfis de acesso

**Configurações**
- Alterar dados da conta
- Configurar integrações
- Gerenciar webhooks

**Faturamento**
- Visualizar plano atual
- Alterar plano
- Ver histórico de pagamentos

### 4. Auditoria e Logs

#### 4.1 Log de Acessos
- Registrar cada acesso de membros da equipe
- Informações registradas:
  - Data/hora
  - Membro
  - Ação realizada
  - Recurso acessado
  - IP
  - User Agent

#### 4.2 Relatório de Atividades
- Visualizar atividades da equipe
- Filtrar por:
  - Membro
  - Período
  - Tipo de ação
- Exportar relatório

### 5. Interface do Usuário

#### 5.1 Página de Gestão de Equipe
```
┌─────────────────────────────────────────────────────┐
│ 👥 Gestão de Equipe                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [+ Adicionar Membro]  [Perfis de Acesso]           │
│                                                     │
│ 🔍 Buscar...  [Filtros ▼]                          │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ João Silva                                   │   │
│ │ joao@email.com                              │   │
│ │ 🏷️ Estagiário                               │   │
│ │ ✅ Ativo • Último acesso: há 2 horas        │   │
│ │ [Editar] [Desativar] [⋮]                    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Maria Santos                                 │   │
│ │ maria@email.com                             │   │
│ │ 🏷️ Vendedor                                 │   │
│ │ ✅ Ativo • Último acesso: há 1 dia          │   │
│ │ [Editar] [Desativar] [⋮]                    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 5.2 Modal de Adicionar Membro
```
┌─────────────────────────────────────┐
│ Adicionar Membro da Equipe          │
├─────────────────────────────────────┤
│                                     │
│ Nome Completo *                     │
│ [_____________________________]     │
│                                     │
│ Email *                             │
│ [_____________________________]     │
│                                     │
│ Perfil de Acesso *                  │
│ [Selecione um perfil ▼]            │
│                                     │
│ [🎨 Personalizar Permissões]        │
│                                     │
│ ℹ️ Um convite será enviado por     │
│    email para este membro.          │
│                                     │
│         [Cancelar]  [Enviar Convite]│
└─────────────────────────────────────┘
```

**Ao clicar em "Personalizar Permissões":**
- Abre modal com checkboxes de todas as permissões
- Pode marcar/desmarcar individualmente
- Pode salvar como novo perfil personalizado

#### 5.3 Modal de Perfis de Acesso
```
┌─────────────────────────────────────────────┐
│ Perfis de Acesso                            │
├─────────────────────────────────────────────┤
│                                             │
│ [+ Criar Perfil Personalizado]             │
│                                             │
│ 📋 Perfis Padrão                            │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ 👨‍💼 Estagiário                       │   │
│ │ Acesso a dashboard, pacientes,      │   │
│ │ check-ins e planos alimentares      │   │
│ │                                     │   │
│ │ ✅ Dashboard                        │   │
│ │ ✅ Pacientes                        │   │
│ │ ✅ Check-ins                        │   │
│ │ ✅ Planos Alimentares               │   │
│ │ ❌ Métricas                         │   │
│ │ ❌ Relatórios                       │   │
│ │ ❌ Equipe                           │   │
│ │                                     │   │
│ │ [Usar este Perfil]                 │   │
│ └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

## Fluxo de Implementação

### Fase 1: Estrutura Base (2-3 horas)
1. ✅ Criar tabelas no banco de dados
2. ✅ Criar serviço de gestão de equipe
3. ✅ Criar hook para verificação de permissões
4. ✅ Criar componente de proteção de rotas

### Fase 2: Interface de Gestão (3-4 horas)
1. Criar página de gestão de equipe
2. Criar modal de adicionar membro
3. Criar modal de editar membro
4. Criar modal de perfis de acesso
5. Criar lista de membros com filtros

### Fase 3: Controle de Acesso (2-3 horas)
1. Implementar verificação de permissões em cada página
2. Atualizar menu lateral para mostrar apenas opções permitidas
3. Criar página de acesso negado
4. Implementar redirecionamento automático

### Fase 4: Convites e Onboarding (2-3 horas)
1. Criar sistema de envio de convites por email
2. Criar página de aceite de convite
3. Criar fluxo de criação de senha
4. Implementar primeiro acesso

### Fase 5: Auditoria e Logs (1-2 horas)
1. Implementar registro de logs
2. Criar página de visualização de logs
3. Criar relatório de atividades

## Tecnologias Utilizadas

- **Backend**: Supabase (PostgreSQL + RLS)
- **Frontend**: React + TypeScript
- **UI**: shadcn/ui
- **Autenticação**: Supabase Auth
- **Email**: Supabase Email Templates

## Segurança

- Row Level Security (RLS) no Supabase
- Verificação de permissões no backend e frontend
- Logs de auditoria para rastreabilidade
- Tokens JWT para autenticação
- Criptografia de dados sensíveis

## Considerações

- Cada nutricionista gerencia apenas sua própria equipe
- Membros não podem ver ou gerenciar outros membros
- Owner (nutricionista) sempre tem acesso total
- Perfis padrão não podem ser deletados
- Logs são mantidos por 90 dias

## Próximos Passos

Deseja que eu implemente este sistema? Posso começar pela Fase 1 (estrutura base) e ir avançando conforme sua aprovação.
