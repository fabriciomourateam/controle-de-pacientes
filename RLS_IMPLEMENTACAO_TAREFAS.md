# Lista de Tarefas: RLS e Isolamento por Nutricionista

Implementação **item a item** e **tabela por tabela**, com explicação de cada ajuste. Use esta lista para ir marcando o que já foi feito.

---

## Fase 0: Preparação (faça primeiro)

- [ ] **0.1** Fazer backup do projeto Supabase (Dashboard → Project Settings → Backups) ou export das tabelas críticas.
- [ ] **0.2** Anotar seu `user_id`: no SQL Editor, rodar `SELECT id, email FROM auth.users;` e guardar o `id` (UUID) da sua conta.
- [ ] **0.3** Decidir: todos os dados atuais são seus? Se sim, vamos atribuir seu `user_id` a todas as linhas existentes nas tabelas que tiverem essa coluna.

**Por quê:** Assim, depois de ligar o RLS, você continua vendo todos os seus dados e ninguém mais vê.

---

## Fase 1: Núcleo – Pacientes e Checkins

Estas tabelas são o coração do sistema: quem é de quem (pacientes) e os checkins (ligados ao paciente / ao nutri).

### 1.1 Tabela `patients`

- [ ] **1.1.1** Garantir coluna `user_id` (UUID, referência `auth.users`). Se não existir, rodar no SQL Editor:
  ```sql
  ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
  ```
- [ ] **1.1.2** Atribuir seus dados a você (troque `SEU_USER_ID` pelo UUID do passo 0.2):
  ```sql
  UPDATE public.patients SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **1.1.3** RLS: habilitar e políticas (já estão no script `rls-isolamento-por-nutri.sql` – será aplicado na Fase Final).

**O que isso faz:** Cada nutricionista só vê e edita pacientes cujo `user_id` é o dele (ou do owner, no caso de membro de equipe). O app de alunos (portal) continua acessando por telefone/token pelas políticas que não removemos.

---

### 1.2 Tabela `checkin`

- [ ] **1.2.1** Garantir coluna `user_id`. Se não existir:
  ```sql
  ALTER TABLE public.checkin
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  CREATE INDEX IF NOT EXISTS idx_checkin_user_id ON public.checkin(user_id);
  ```
- [ ] **1.2.2** Atribuir seus checkins a você:
  ```sql
  UPDATE public.checkin SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **1.2.3** RLS: será aplicado na Fase Final (script já inclui checkin).

**O que isso faz:** Checkins ficam isolados por dono (ou owner da equipe). O portal continua lendo os checkins permitidos pelas políticas atuais.

---

## Fase 2: Dietas (planos, refeições, alimentos, orientações)

Tudo que depende de `diet_plans` ou de paciente: acesso via “dono do plano” ou “dono do paciente”.

### 2.1 Tabela `diet_plans`

- [ ] **2.1.1** Já tem `user_id` e `created_by`. Atribuir planos existentes a você (por paciente seu):
  ```sql
  UPDATE public.diet_plans dp
  SET user_id = 'SEU_USER_ID', created_by = 'SEU_USER_ID'
  WHERE (user_id IS NULL OR created_by IS NULL)
  AND patient_id IN (SELECT id FROM public.patients WHERE user_id = 'SEU_USER_ID');
  -- Se todos os pacientes forem seus, pode ser:
  -- UPDATE public.diet_plans SET user_id = 'SEU_USER_ID', created_by = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **2.1.2** RLS: no script (acesso por user_id/created_by ou por patient do owner).

**O que isso faz:** Cada nutri vê só os planos dos seus pacientes (ou do owner). Portal continua vendo planos liberados.

---

### 2.2 Tabelas `diet_meals`, `diet_foods`, `diet_guidelines`

- [ ] **2.2.1** Não têm `user_id` direto; o acesso é via `diet_plans`. Nada para popular.
- [ ] **2.2.2** RLS: já no script (USING/CHECK via `diet_plan_id` → diet_plans.user_id/created_by).

**O que isso faz:** Quem pode ver/editar o plano pode ver/editar refeições, alimentos e orientações desse plano.

---

### 2.3 Tabelas `diet_questions`, `diet_ai_generations`, `diet_daily_consumption`

- [ ] **2.3.1** `diet_ai_generations` tem `user_id`. Atribuir a você:
  ```sql
  UPDATE public.diet_ai_generations SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **2.3.2** `diet_questions` e `diet_daily_consumption`: acesso indireto (por plano ou paciente). RLS no script cobre diet_plans; se houver políticas por paciente, mantemos. Nada extra para popular aqui.

**O que isso faz:** Gerações de IA ficam por dono; perguntas e consumo seguem o plano/paciente.

---

### 2.4 Tabelas de templates: `diet_plan_templates`, `diet_template_meals`, `diet_template_foods`, `diet_templates`

- [ ] **2.4.1** `diet_plan_templates` e `diet_templates` têm `user_id`. Atribuir a você:
  ```sql
  UPDATE public.diet_plan_templates SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  UPDATE public.diet_templates SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **2.4.2** RLS: incluir no script (ou já existe) políticas por user_id para templates; meals/foods via template_id.

**O que isso faz:** Templates de dieta são por nutri; equipe pode ver os do owner se você definir política nesse sentido.

---

## Fase 3: Métricas comerciais e operacionais / Gestão

Tabelas de dashboard, leads, vendas, alertas, sync – tudo por dono.

### 3.1 Tabela `dashboard_dados`

- [ ] **3.1.1** Tem `user_id`. Atribuir a você:
  ```sql
  UPDATE public.dashboard_dados SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **3.1.2** RLS: já no script (owner + equipe).

**O que isso faz:** Métricas de dashboard (entradas, saídas, renovação, churn) ficam por nutri.

---

### 3.2 Tabela `alertas_dashboard`

- [ ] **3.2.1** Tem `user_id`. Atribuir:
  ```sql
  UPDATE public.alertas_dashboard SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **3.2.2** RLS: já no script.

**O que isso faz:** Alertas do dashboard são por dono.

---

### 3.3 Tabela `leads_que_entraram`

- [ ] **3.3.1** Tem `user_id`. Atribuir:
  ```sql
  UPDATE public.leads_que_entraram SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **3.3.2** RLS: adicionar políticas (owner + equipe) no script, se ainda não estiver.

**O que isso faz:** Leads por funil ficam isolados por nutri.

---

### 3.4 Tabelas “Total de...” (métricas comerciais com nome com espaço)

Nomes exatos: `Total de Agendamentos por Funil`, `Total de Calls Agendadas`, `Total de Leads`, `Total de Leads por Funil`, `Total de Vendas`, `Total de Vendas 2026`. Todas têm `user_id`.

- [ ] **3.4.1** Atribuir seus dados (use o nome exato da tabela entre aspas):
  ```sql
  UPDATE public."Total de Agendamentos por Funil" SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  UPDATE public."Total de Calls Agendadas" SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  UPDATE public."Total de Leads" SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  UPDATE public."Total de Leads por Funil" SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  UPDATE public."Total de Vendas" SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  UPDATE public."Total de Vendas 2026" SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **3.4.2** RLS: criar políticas por user_id (owner + get_member_owner_id()) para cada uma; script separado ou bloco no mesmo script usando nomes entre aspas.

**O que isso faz:** Métricas comerciais (agendamentos, calls, leads, vendas) ficam por nutri.

---

### 3.5 Tabela `sync_logs`

- [ ] **3.5.1** Tem `user_id`. Atribuir:
  ```sql
  UPDATE public.sync_logs SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **3.5.2** RLS: adicionar políticas owner + equipe (SELECT/INSERT para o próprio user_id).

**O que isso faz:** Logs de sincronização por dono.

---

## Fase 4: Corpo, peso e exames

### 4.1 Tabela `body_composition`

- [ ] **4.1.1** Tem `user_id`. Atribuir:
  ```sql
  UPDATE public.body_composition SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **4.1.2** RLS: já no script. Manter políticas de portal (leitura por paciente/telefone) se existirem.

**O que isso faz:** Avaliações de composição corporal por dono; portal continua vendo as do paciente.

---

### 4.2 Tabela `weight_tracking`

- [ ] **4.2.1** Tem `user_id`. Atribuir:
  ```sql
  UPDATE public.weight_tracking SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **4.2.2** RLS: já no script.

**O que isso faz:** Pesagens por nutri; portal conforme políticas atuais.

---

### 4.3 Tabela `laboratory_exams`

- [ ] **4.3.1** Tem `user_id`. Atribuir:
  ```sql
  UPDATE public.laboratory_exams SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **4.3.2** RLS: já no script.

**O que isso faz:** Pedidos/resultados de exames por dono.

---

## Fase 5: Contato e histórico

### 5.1 Tabela `contact_history`

- [ ] **5.1.1** Tem `user_id`. Atribuir:
  ```sql
  UPDATE public.contact_history SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **5.1.2** RLS: já no script.

**O que isso faz:** Histórico de contatos por nutri.

---

## Fase 6: Retenção

### 6.1 Tabela `retention_exclusions`

- [ ] **6.1.1** Tem `user_id` (obrigatório). Se houver linhas antigas sem user_id (improvável), atribuir:
  ```sql
  UPDATE public.retention_exclusions SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **6.1.2** RLS: já no script.

**O que isso faz:** Exclusões da tela de retenção por dono.

---

## Fase 7: Equipe e gestão (reuniões, ações, relatórios)

Estas tabelas já costumam ser “do owner” (owner_id / created_by). Só garantir RLS e, se tiver `user_id`, popular.

### 7.1 Tabelas `team_members`, `team_meetings`, `action_items`, `daily_reports`

- [ ] **7.1.1** Verificar políticas atuais: owner vê seus membros/reuniões/ações/relatórios; membro vê do owner. Não remover isso.
- [ ] **7.1.2** Se alguma tiver coluna `user_id` e linhas NULL, atribuir ao owner correspondente (ex.: `action_items.owner_id`, `daily_reports.owner_id`). Não criar `user_id` novo se o modelo já for owner_id.

**O que isso faz:** Gestão de equipe continua por owner; RLS só precisa estar alinhado a isso.

---

## Fase 8: Preferências, planos comerciais e alimentos por usuário

### 8.1 Tabela `user_preferences`

- [ ] **8.1.1** Coluna `user_id` é TEXT. Sua linha deve ter user_id = seu UUID em texto. Verificar:
  ```sql
  SELECT id, user_id FROM public.user_preferences;
  ```
  Se a sua linha tiver outro valor ou não existir, inserir/atualizar com `(auth.uid())::text` ou seu UUID em texto.
- [ ] **8.1.2** RLS: já no script (usando auth.uid()::text).

**O que isso faz:** Cada nutri só acessa suas próprias preferências (filtros, templates de renovação, etc.).

---

### 8.2 Tabela `plans` (planos de assinatura/comerciais)

- [ ] **8.2.1** Tem `user_id` (pode ser NULL para planos “globais”). Atribuir apenas onde fizer sentido (planos que você criou):
  ```sql
  UPDATE public.plans SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL AND name IN ('...'); -- opcional
  ```
- [ ] **8.2.2** RLS: já no script (SELECT com user_id ou NULL; INSERT/UPDATE/DELETE só próprio).

**O que isso faz:** Planos globais continuam visíveis; planos por dono ficam restritos.

---

### 8.3 Tabelas `custom_foods`, `user_food_database`, `food_groups`, `user_favorite_foods`, `user_favorite_meals`

- [ ] **8.3.1** Todas têm `user_id`. Atribuir a você onde estiver NULL:
  ```sql
  UPDATE public.custom_foods SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  UPDATE public.user_food_database SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  UPDATE public.food_groups SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  UPDATE public.user_favorite_foods SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  UPDATE public.user_favorite_meals SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **8.3.2** RLS: custom_foods já tem políticas por user_id; as outras precisam de políticas (owner + equipe se quiser). Incluir no script.

**O que isso faz:** Alimentos customizados, banco por usuário, grupos e favoritos por nutri.

---

## Fase 9: Feedback, notas e portal

### 9.1 Tabelas `checkin_notes`, `checkin_feedback_analysis`

- [ ] **9.1.1** `checkin_notes` tem `user_id` (quem escreveu). Não precisa “atribuir” ao owner; já é por autor. Garantir RLS: usuário vê notas de checkins que ele pode ver (via checkin.user_id).
- [ ] **9.1.2** `checkin_feedback_analysis` tem `user_id`. Atribuir:
  ```sql
  UPDATE public.checkin_feedback_analysis SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  ```
- [ ] **9.1.3** RLS: políticas que permitam acesso quando o checkin/patient for do owner ou do membro. Incluir no script se ainda não estiver.

**O que isso faz:** Notas e análises de feedback por contexto do checkin (dono do checkin).

---

### 9.2 Tabelas `patient_achievements`, `patient_points`, `patient_points_history`, `patient_daily_challenges`

- [ ] **9.2.1** Não têm `user_id`; são por paciente. Acesso indireto: quem vê o paciente vê essas linhas. RLS via paciente (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid() OR user_id = get_member_owner_id())).
- [ ] **9.2.2** Incluir/bloquear no script conforme políticas atuais de portal (anon lendo por paciente).

**O que isso faz:** Conquistas e pontos continuam por paciente; nutri vê só dos seus pacientes.

---

### 9.3 Tabelas `patient_portal_tokens`, `renewal_custom_content`, `featured_photo_comparison`, `photo_visibility_settings`

- [ ] **9.3.1** `patient_portal_tokens` e `renewal_custom_content` têm `user_id`. Atribuir:
  ```sql
  UPDATE public.patient_portal_tokens SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
  UPDATE public.renewal_custom_content SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL; -- já é NOT NULL, conferir
  ```
- [ ] **9.3.2** `featured_photo_comparison` e `photo_visibility_settings`: por paciente (telefone). RLS pode ser “via patient” ou “owner do patient”. Verificar políticas atuais e manter portal.

**O que isso faz:** Tokens e conteúdo de renovação por dono; fotos destaque/visibilidade por paciente/dono.

---

## Fase 10: Outras tabelas (feedback templates, food_usage, etc.)

- [ ] **10.1** `feedback_prompt_templates`: tem `user_id`. Atribuir e RLS por user_id.
- [ ] **10.2** `food_usage_stats`: tem `user_id`. Atribuir e RLS por user_id.
- [ ] **10.3** `user_api_keys`, `user_webhook_configs`: por user_id; RLS restrito ao próprio usuário.
- [ ] **10.4** `user_profiles`, `profiles`: geralmente uma linha por auth.users.id; RLS “só a própria linha”.
- [ ] **10.5** `user_subscriptions`, `payments`: por user_id; não expor a outros usuários.
- [ ] **10.6** Tabelas globais (ex.: `food_database`, `achievement_templates`, `daily_challenges`, `exam_types`, `subscription_plans`, `system_config`): sem user_id; manter políticas de leitura adequadas (ex.: todos autenticados ou só service_role).

---

## Fase 11: Aplicar o script RLS e testar

- [ ] **11.1** Revisar o script `sql/rls-isolamento-por-nutri.sql` e incluir qualquer política que faltou (tabelas “Total de...”, leads_que_entraram, sync_logs, food_groups, etc.).
- [ ] **11.2** Rodar o script completo no SQL Editor do Supabase.
- [ ] **11.3** Testar com sua conta: listar pacientes, checkins, dietas, dashboard, métricas comerciais, gestão – tudo deve aparecer.
- [ ] **11.4** Criar um segundo usuário (ex.: “nutri teste”), atribuir a ele 1 paciente e 1 checkin (user_id = id do nutri teste), logar com ele e conferir que vê só isso.
- [ ] **11.5** Testar app de alunos (portal): login por token/telefone e telas que usam anon – devem continuar funcionando.
- [ ] **11.6** Se usar equipe: logar como membro e conferir que vê apenas dados do owner.

---

## Resumo de ordem sugerida

1. Fase 0 (backup + seu user_id).  
2. Fases 1 e 2 (patients, checkin, dietas).  
3. Fase 3 (métricas e gestão comercial/operacional).  
4. Fases 4–6 (body, peso, exames, contato, retenção).  
5. Fases 7–10 (equipe, preferências, planos, alimentos, feedback, portal).  
6. Fase 11 (script RLS final + testes).

Assim você faz **item por item e tabela por tabela**, com cada ajuste explicado. Quando terminar uma tarefa, marque o `- [ ]` como `- [x]` neste arquivo.
