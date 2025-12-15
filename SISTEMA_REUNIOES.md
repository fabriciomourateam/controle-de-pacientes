# Sistema de Reuniões e Acompanhamento Diário

## Visão Geral

Sistema completo para gestão de reuniões e acompanhamento diário da equipe, permitindo registro de reuniões periódicas, relatórios diários de atividades e controle de itens de ação.

## Funcionalidades

### 1. Reuniões

Registro e acompanhamento de reuniões da equipe com diferentes periodicidades:

- **Tipos de Reunião:**
  - Diária (Daily Standup)
  - Semanal
  - Quinzenal
  - Mensal

- **Informações Registradas:**
  - Título e descrição
  - Data e horário
  - Tópicos discutidos
  - Decisões tomadas
  - Observações gerais
  - Participantes

### 2. Acompanhamento Diário

Sistema de relatórios diários para cada membro da equipe:

- **Campos do Relatório:**
  - ✅ **Demandas Concluídas Hoje**: Tarefas que foram completadas
  - 📋 **Demandas Planejadas para Amanhã**: Tarefas que serão feitas
  - ⚠️ **Dúvidas e Dificuldades**: Bloqueios e problemas enfrentados
  - 💡 **Observações**: Ideias, sugestões e comentários gerais
  - 😊 **Humor do Dia**: Como foi o dia (Excelente, Bom, Neutro, Ruim, Péssimo)

- **Recursos:**
  - Um relatório por dia por membro
  - Filtro por data
  - Visualização de todos os relatórios da equipe
  - Histórico completo

### 3. Itens de Ação

Controle de tarefas e responsabilidades:

- **Informações:**
  - Título e descrição
  - Responsável
  - Prioridade (Baixa, Média, Alta, Urgente)
  - Status (Pendente, Em Progresso, Concluído, Cancelado)
  - Prazo
  - Reunião de origem (opcional)

- **Recursos:**
  - Marcar como concluído com um clique
  - Separação entre pendentes e concluídos
  - Indicadores visuais de prioridade

## Estrutura do Banco de Dados

### Tabelas Criadas

1. **team_meetings**
   - Armazena informações das reuniões
   - Campos: tipo, título, descrição, data, tópicos, decisões, notas

2. **daily_reports**
   - Armazena relatórios diários dos membros
   - Campos: data, tarefas concluídas, tarefas planejadas, bloqueios, observações, humor
   - Constraint: Um relatório por dia por membro

3. **action_items**
   - Armazena itens de ação e tarefas
   - Campos: título, descrição, responsável, status, prioridade, prazo

### Segurança (RLS)

- Owners podem ver e gerenciar tudo de sua equipe
- Membros da equipe podem:
  - Ver reuniões e relatórios da equipe
  - Criar seus próprios relatórios diários
  - Ver e atualizar itens de ação atribuídos a eles

## Como Usar

### Para Owners/Administradores

1. **Acessar**: Menu lateral > Administração > Reuniões

2. **Criar Item de Ação:**
   - Aba "Itens de Ação"
   - Clique em "Novo Item"
   - Preencha:
     - Título (obrigatório)
     - Descrição
     - Responsável (obrigatório)
     - Prioridade (Baixa, Média, Alta, Urgente)
     - Prazo
   - Salve

3. **Criar Reunião:**
   - Clique em "Nova Reunião"
   - Selecione o tipo (Diária, Semanal, etc.)
   - Preencha título, descrição, data e horário
   - Adicione tópicos discutidos
   - Adicione decisões tomadas
   - Adicione observações

3. **Visualizar Relatórios Diários:**
   - Aba "Acompanhamento Diário"
   - Filtre por data se necessário
   - Veja todos os relatórios da equipe

4. **Acompanhar Itens de Ação:**
   - Aba "Itens de Ação"
   - Veja tarefas pendentes e concluídas
   - Marque como concluído quando necessário

### Para Membros da Equipe

1. **Criar Relatório Diário:**
   - Acesse Reuniões > Acompanhamento Diário
   - Clique em "Novo Relatório"
   - Preencha os campos:
     - Demandas concluídas hoje
     - Demandas planejadas para amanhã
     - Dúvidas e dificuldades (se houver)
     - Observações (se houver)
     - Como foi seu dia
   - Salve

2. **Visualizar Reuniões:**
   - Veja todas as reuniões registradas
   - Consulte decisões e tópicos discutidos

3. **Gerenciar Tarefas:**
   - Veja itens de ação atribuídos a você
   - Marque como concluído quando finalizar

## Benefícios

### Para a Gestão

- ✅ Visibilidade completa das atividades da equipe
- ✅ Histórico de reuniões e decisões
- ✅ Identificação rápida de bloqueios e dificuldades
- ✅ Acompanhamento de produtividade
- ✅ Base para reuniões de feedback

### Para a Equipe

- ✅ Clareza sobre responsabilidades
- ✅ Registro de conquistas diárias
- ✅ Canal para comunicar dificuldades
- ✅ Organização de tarefas
- ✅ Transparência nas decisões

## Melhorias Futuras Sugeridas

1. **Notificações:**
   - Lembrete para preencher relatório diário
   - Alerta de itens de ação próximos do prazo

2. **Análises:**
   - Dashboard com métricas de produtividade
   - Gráficos de humor da equipe ao longo do tempo
   - Taxa de conclusão de tarefas

3. **Integrações:**
   - Exportar reuniões para calendário
   - Integração com ferramentas de comunicação

4. **Recursos Adicionais:**
   - Anexar arquivos às reuniões
   - Comentários em itens de ação
   - Tags e categorias para organização

## Arquivos Criados

### SQL
- `sql/team-meetings-system.sql` - Estrutura do banco de dados

### Páginas
- `src/pages/TeamMeetings.tsx` - Página principal

### Componentes
- `src/components/meetings/MeetingsList.tsx` - Lista de reuniões
- `src/components/meetings/CreateMeetingModal.tsx` - Modal de criação/edição
- `src/components/meetings/DailyReportsList.tsx` - Lista de relatórios diários
- `src/components/meetings/CreateDailyReportModal.tsx` - Modal de relatório
- `src/components/meetings/ActionItemsList.tsx` - Lista de itens de ação
- `src/components/meetings/CreateActionItemModal.tsx` - Modal de criação de item

### Hooks
- `src/hooks/use-meetings.ts` - Gerenciamento de reuniões
- `src/hooks/use-daily-reports.ts` - Gerenciamento de relatórios
- `src/hooks/use-action-items.ts` - Gerenciamento de itens de ação

## Instalação

1. Execute o SQL no Supabase:
```sql
-- Copie e execute o conteúdo de sql/team-meetings-system.sql
```

2. A rota já foi adicionada ao App.tsx

3. O item de menu já foi adicionado à sidebar

4. Acesse: `/meetings`

## Suporte

Para dúvidas ou sugestões sobre o sistema de reuniões, consulte a documentação ou entre em contato com o administrador do sistema.
