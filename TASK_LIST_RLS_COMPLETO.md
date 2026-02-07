# Task list RLS – uma tabela por vez

Siga **na ordem**: uma tabela, conferir/testar, próxima. Assim nada fica de fora e fica mais fácil achar problema.

---

## Pré-requisito (fazer uma vez antes da Tabela 1)

| Passo | O que fazer | Status |
|-------|-------------|--------|
| **0.1** | No Supabase SQL Editor: `SELECT id, email FROM auth.users ORDER BY email;` — Anotar o `id` (UUID) de cada nutri. | ✅ |
| **0.2** | Popular `user_id` nos dados existentes (ou pular se já estiver tudo preenchido). | ✅ (não necessário) |
| **0.3** | Rodar o script completo **sql/rls-isolamento-por-nutri.sql** no SQL Editor. Ele já cobre as **Tabelas 1 a 17** abaixo. | ✅ |
| **0.4** | **Portal:** Rodar **sql/rls-portal-remover-inseguras-aplicar-seguras.sql** e depois **sql/rls-portal-fix-406-funcao-telefones.sql** (função `get_phones_with_active_portal_tokens` para anon conseguir passar nas políticas). | ✅ |

**Diagnóstico já feito:** Várias políticas atuais do portal tinham `qual: true` (anon lia tudo). O script **rls-portal-remover-inseguras-aplicar-seguras.sql** corrige isso e garante que cada paciente acesse apenas seus dados.

Depois disso, use a lista abaixo para **conferir tabela por tabela** (1 a 17) e, em seguida, fazer **uma tabela por vez** das 18 em diante (cada uma com seu próprio bloco SQL).

---

## Tabela 1 – `patients`

| | |
|---|--|
| **O que é** | Pacientes do consultório. |
| **No banco** | Já coberto pelo script principal: tem `user_id`, RLS e políticas (owner + equipe). |
| **No app** | Criação/edição de pacientes deve enviar `user_id` (supabase-services, forms). Trigger no banco preenche se vier NULL. |
| **Como testar** | Login: listar pacientes; só devem aparecer os que têm `user_id` = seu usuário (ou do owner, se for membro). Criar um paciente novo e conferir que continua aparecendo. |
| **Status** | ⬜ |

---

## Tabela 2 – `checkin`

| | |
|---|--|
| **O que é** | Check-ins dos pacientes. |
| **No banco** | Já coberto pelo script principal: `user_id`, RLS, políticas. |
| **No app** | checkin-service já envia `user_id` no upsert; conferir outros inserts. |
| **Como testar** | Listar checkins; só os do seu usuário (ou do owner). Criar/editar um checkin e recarregar. |
| **Status** | ⬜ |

---

## Tabela 3 – `diet_plans`

| | |
|---|--|
| **O que é** | Planos alimentares (ligados a paciente). |
| **No banco** | Acesso por `user_id`/`created_by` ou por `patient_id` do paciente do nutri. Script principal. |
| **No app** | Ao criar plano, enviar `user_id` ou `created_by` conforme o schema. |
| **Como testar** | Listar planos/dietas; só os dos seus pacientes. Abrir um plano e editar; salvar e recarregar. |
| **Status** | ⬜ |

---

## Tabela 4 – `diet_meals`

| | |
|---|--|
| **O que é** | Refeições dentro de um plano alimentar. |
| **No banco** | Acesso via `diet_plans` (owner/equipe). Script principal. |
| **No app** | Não grava `user_id` direto; o acesso é pelo plano. |
| **Como testar** | Abrir um plano alimentar; adicionar/editar refeição; salvar. Só deve conseguir em planos que você já vê. |
| **Status** | ⬜ |

---

## Tabela 5 – `diet_foods`

| | |
|---|--|
| **O que é** | Alimentos de cada refeição. |
| **No banco** | Acesso via diet_meals → diet_plans. Script principal. |
| **No app** | Idem; acesso indireto pelo plano. |
| **Como testar** | Dentro de um plano/refeição, adicionar/remover alimento; salvar. |
| **Status** | ⬜ |

---

## Tabela 6 – `diet_guidelines`

| | |
|---|--|
| **O que é** | Diretrizes/orientações do plano alimentar. |
| **No banco** | Acesso via diet_plans. Script principal. |
| **No app** | Idem. |
| **Como testar** | Editar diretrizes de um plano que você vê; salvar. |
| **Status** | ⬜ |

---

## Tabela 7 – `retention_exclusions`

| | |
|---|--|
| **O que é** | Exclusões de retenção (pacientes excluídos do cálculo). |
| **No banco** | Tem `user_id`; RLS owner + equipe. Script principal. |
| **No app** | Ao criar/editar exclusão, enviar `user_id`. |
| **Como testar** | Tela de retenção: adicionar/remover exclusão; só deve ver as suas. |
| **Status** | ⬜ |

---

## Tabela 8 – `plans`

| | |
|---|--|
| **O que é** | Planos de assinatura (pacotes). `user_id` NULL = plano público. |
| **No banco** | RLS: owner, equipe ou `user_id IS NULL`. Script principal. |
| **No app** | Ao criar plano próprio, enviar `user_id`. |
| **Como testar** | Listar planos; ver planos públicos e os seus. Criar plano e conferir. |
| **Status** | ⬜ |

---

## Tabela 9 – `user_preferences`

| | |
|---|--|
| **O que é** | Preferências do usuário (filtros, templates, etc.). Coluna `user_id` é **TEXT**. |
| **No banco** | Políticas com `user_id = (auth.uid())::text`. Script principal. |
| **No app** | user-preferences-service já usa user_id; conferir. |
| **Como testar** | Alterar preferência (ex.: filtro no dashboard); salvar e recarregar; deve manter. |
| **Status** | ⬜ |

---

## Tabela 10 – `diet_ai_generations`

| | |
|---|--|
| **O que é** | Gerações de dieta por IA. |
| **No banco** | `user_id`; RLS owner + equipe. Script principal. |
| **No app** | Ao gerar dieta por IA, enviar `user_id`. |
| **Como testar** | Gerar uma dieta por IA; deve aparecer só para você. |
| **Status** | ⬜ |

---

## Tabela 11 – `patient_feedback_records`

| | |
|---|--|
| **O que é** | Registros de feedback de paciente (se existir a tabela). |
| **No banco** | `user_id` ou acesso por patient; script principal. |
| **No app** | Se houver tela que grava, enviar `user_id`. |
| **Como testar** | Se usar essa tabela: criar/ver registro e conferir isolamento. |
| **Status** | ⬜ |

---

## Tabela 12 – `body_composition`

| | |
|---|--|
| **O que é** | Composição corporal / bioimpedância. |
| **No banco** | `user_id`; RLS owner + equipe. Script principal. |
| **No app** | Ao inserir/atualizar, enviar `user_id`. |
| **Como testar** | Adicionar/editar avaliação de composição em um paciente seu; só deve ver as suas. |
| **Status** | ⬜ |

---

## Tabela 13 – `weight_tracking`

| | |
|---|--|
| **O que é** | Acompanhamento de peso. |
| **No banco** | `user_id`; RLS. Script principal. |
| **No app** | Enviar `user_id` ao gravar. |
| **Como testar** | Registrar peso em paciente; listar e conferir isolamento. |
| **Status** | ⬜ |

---

## Tabela 14 – `contact_history`

| | |
|---|--|
| **O que é** | Histórico de contato com pacientes. |
| **No banco** | `user_id`; RLS. Script principal. |
| **No app** | Enviar `user_id` ao gravar. |
| **Como testar** | Registrar contato; só deve ver os seus. |
| **Status** | ⬜ |

---

## Tabela 15 – `dashboard_dados`

| | |
|---|--|
| **O que é** | Dados brutos do dashboard (métricas mensais). |
| **No banco** | `user_id`; RLS. Script principal. |
| **No app** | MetricsForm / MetricsManager / supabase-services: enviar `user_id` ao salvar. |
| **Como testar** | Dashboard: conferir cards e dados; editar métricas e salvar; só devem aparecer as suas. |
| **Status** | ⬜ |

---

## Tabela 16 – `alertas_dashboard`

| | |
|---|--|
| **O que é** | Alertas do dashboard. |
| **No banco** | `user_id`; RLS. Script principal. |
| **No app** | Se houver tela que cria/edita alertas, enviar `user_id`. |
| **Como testar** | Configurar alerta; só deve ver os seus. |
| **Status** | ⬜ |

---

## Tabela 17 – `laboratory_exams`

| | |
|---|--|
| **O que é** | Exames laboratoriais. |
| **No banco** | `user_id`; RLS. Script principal. |
| **No app** | Enviar `user_id` ao gravar. |
| **Como testar** | Cadastrar/ver exame; só os seus pacientes. |
| **Status** | ⬜ |

---

## Tabela 18 – `Total de Leads`

| | |
|---|--|
| **O que é** | Total de leads por mês (métricas comerciais). |
| **No banco** | Adicionar `user_id` se não existir; habilitar RLS; políticas SELECT/INSERT/UPDATE/DELETE com `user_id = auth.uid() OR user_id = get_member_owner_id()`. **Usar o script:** **sql/rls-por-tabela-metricas-comerciais.sql** — bloco **Tabela 18**. |
| **No app** | CommercialMetricsManager (e qualquer insert nessa tabela): enviar `user_id` do usuário logado. |
| **Como testar** | Página de métricas comerciais: leads; só os seus. Inserir um lead e recarregar. |
| **Status** | ⬜ |

---

## Tabela 19 – `Total de Calls Agendadas`

| | |
|---|--|
| **O que é** | Total de calls agendadas por mês. |
| **No banco** | Mesmo padrão: `user_id`, RLS, políticas. **Script:** **sql/rls-por-tabela-metricas-comerciais.sql** — bloco **Tabela 19**. |
| **No app** | Enviar `user_id` ao inserir/atualizar. |
| **Como testar** | Métricas comerciais: calls; só as suas. |
| **Status** | ⬜ |

---

## Tabela 20 – `Total de Leads por Funil`

| | |
|---|--|
| **O que é** | Leads agregados por funil. |
| **No banco** | `user_id`, RLS, políticas. **Script:** **sql/rls-por-tabela-metricas-comerciais.sql** — bloco **Tabela 20**. |
| **No app** | Enviar `user_id` ao gravar. |
| **Como testar** | Métricas comerciais: funil de leads; só os seus. |
| **Status** | ⬜ |

---

## Tabela 21 – `Total de Agendamentos por Funil`

| | |
|---|--|
| **O que é** | Agendamentos por funil. |
| **No banco** | Idem. **Script:** **sql/rls-por-tabela-metricas-comerciais.sql** — bloco **Tabela 21**. |
| **No app** | Enviar `user_id`. |
| **Como testar** | Métricas comerciais: funil de agendamentos; só os seus. |
| **Status** | ⬜ |

---

## Tabela 22 – `Total de Vendas`

| | |
|---|--|
| **O que é** | Vendas (MES, DATA, COMPROU, etc.). |
| **No banco** | `user_id`, RLS, políticas. **Script:** **sql/rls-por-tabela-metricas-comerciais.sql** — bloco **Tabela 22**. |
| **No app** | CommercialMetricsManager: enviar `user_id` ao inserir/atualizar vendas. |
| **Como testar** | Métricas comerciais: vendas; só as suas. |
| **Status** | ⬜ |

---

## Tabela 23 – `Total de Vendas 2026`

| | |
|---|--|
| **O que é** | Vendas do ano 2026 (estrutura igual). |
| **No banco** | Idem; pode usar **sql/fix-total-vendas-2026-rls.sql** mas alinhar para usar `get_member_owner_id()` em vez de `is_team_member` (como no script principal). Ou **sql/rls-por-tabela-metricas-comerciais.sql** — bloco **Tabela 23**. |
| **No app** | Enviar `user_id` ao gravar. |
| **Como testar** | Métricas comerciais, ano 2026: só as suas vendas. |
| **Status** | ⬜ |

---

## Tabela 24 – `dashboard_metricas`

| | |
|---|--|
| **O que é** | Métricas operacionais (ativos, renovação, churn, etc.). |
| **No banco** | Garantir coluna `user_id`; RLS com políticas owner + `get_member_owner_id()`. **Script:** **sql/rls-por-tabela-metricas-operacionais.sql** (ou bloco único para esta tabela). |
| **No app** | dashboard-metrics-service já filtra por `user_id`; todo insert/update deve enviar `user_id`. |
| **Como testar** | Dashboard de métricas operacionais: só os seus números. |
| **Status** | ⬜ |

---

## Tabela 25 – `leads_que_entraram`

| | |
|---|--|
| **O que é** | Leads que entraram (dados diários/comercial). |
| **No banco** | Adicionar `user_id` se não existir; RLS; políticas owner + equipe. **Script:** **sql/rls-por-tabela-outras.sql** — bloco **leads_que_entraram**. |
| **No app** | Qualquer insert deve enviar `user_id`; após RLS, as buscas já retornam só do usuário. |
| **Como testar** | Onde essa tabela for usada: só seus leads. |
| **Status** | ⬜ |

---

## Tabela 26 – `custom_foods`

| | |
|---|--|
| **O que é** | Alimentos customizados por usuário. |
| **No banco** | `user_id`; RLS owner + equipe. **Script:** **sql/rls-por-tabela-outras.sql** — bloco **custom_foods**. |
| **No app** | custom-foods-service: enviar `user_id` em inserts/updates. |
| **Como testar** | Criar alimento customizado; só deve aparecer para você (e equipe). |
| **Status** | ⬜ |

---

## Tabela 27 – `food_database`

| | |
|---|--|
| **O que é** | Base de alimentos (pode ser global ou por usuário). |
| **No banco** | Se global: SELECT para todos; se por user: `user_id` + RLS. Ver **sql/fix-food-database-rls.sql**. |
| **No app** | Consistente com a decisão (só leitura global ou por user). |
| **Como testar** | Buscar alimentos na dieta; comportamento conforme o modelo escolhido. |
| **Status** | ⬜ |

---

## Tabela 28 – `user_favorite_meals`

| | |
|---|--|
| **O que é** | Refeições favoritas do usuário. |
| **No banco** | `user_id`; RLS owner (e equipe se quiser). **Script:** **sql/rls-por-tabela-outras.sql**. |
| **No app** | diet-meal-favorites-service: enviar `user_id`. |
| **Como testar** | Salvar refeição como favorita; só deve aparecer para você. |
| **Status** | ⬜ |

---

## Tabela 29 – `user_favorite_foods`

| | |
|---|--|
| **O que é** | Alimentos favoritos. |
| **No banco** | Idem. **Script:** **sql/rls-por-tabela-outras.sql**. |
| **No app** | Enviar `user_id` onde gravar. |
| **Como testar** | Favoritar alimento; isolamento por usuário. |
| **Status** | ⬜ |

---

## Tabela 30 – `checkin_feedback_analysis`

| | |
|---|--|
| **O que é** | Análises de feedback de checkin. |
| **No banco** | Se tiver `user_id`: RLS por owner + equipe; senão, acesso via paciente. **Script:** **sql/rls-por-tabela-outras.sql** se aplicável. |
| **No app** | use-checkin-feedback e componentes que gravam: enviar `user_id` se a coluna existir. |
| **Como testar** | Ver/gerar análise de feedback; só dos seus checkins. |
| **Status** | ⬜ |

---

## Tabela 31 – `ai_insights_custom` / `ai_insights_hidden`

| | |
|---|--|
| **O que é** | Insights de IA customizados e ocultos. |
| **No banco** | `user_id`; RLS. **Script:** **sql/rls-por-tabela-outras.sql**. |
| **No app** | use-custom-insights: enviar `user_id`. |
| **Como testar** | Criar/ocultar insight; só os seus. |
| **Status** | ⬜ |

---

## Tabela 32 – `photo_visibility_settings`

| | |
|---|--|
| **O que é** | Configurações de visibilidade de fotos. |
| **No banco** | RLS por owner ou via patient. **Script:** **sql/rls-por-tabela-outras.sql** se existir tabela. |
| **No app** | use-photo-visibility: enviar `user_id` se aplicável. |
| **Como testar** | Alterar visibilidade de foto; isolamento. |
| **Status** | ⬜ |

---

## Tabela 33 – `featured_photo_comparison`

| | |
|---|--|
| **O que é** | Comparações de fotos em destaque. |
| **No banco** | `user_id` ou por paciente; RLS. **Script:** **sql/rls-por-tabela-outras.sql**. |
| **No app** | use-featured-comparison: enviar `user_id`. |
| **Como testar** | Definir comparação em destaque; só as suas. |
| **Status** | ⬜ |

---

## Tabela 34 – `team_members`

| | |
|---|--|
| **O que é** | Vínculo membro de equipe ↔ owner (não é “dado por nutri”, é gestão de equipe). |
| **No banco** | Não isolar por “dono dos dados”; política: owner gerencia, membro vê só o próprio vínculo. Já usado por get_member_owner_id(). Conferir se RLS existe e está adequado. |
| **No app** | Nenhum ajuste de user_id para isolamento de dados; só uso normal. |
| **Como testar** | Owner convida membro; membro vê dados do owner; membro não vê outros nutris. |
| **Status** | ⬜ |

---

## Ordem sugerida

1. Fazer **Pré-requisito 0.1 a 0.3**.
2. **Tabelas 1 a 17:** conferir uma a uma (já estão no script; só validar no app e teste).
3. **Tabelas 18 a 23:** rodar **um bloco por vez** do **sql/rls-por-tabela-metricas-comerciais.sql**, depois conferir no app e marcar status.
4. **Tabela 24:** script de métricas operacionais.
5. **Tabelas 25 a 33:** rodar **um bloco por vez** do **sql/rls-por-tabela-outras.sql** (criar esse arquivo com um bloco por tabela).
6. **Tabela 34:** conferir team_members.
7. Por fim: **testes gerais** (owner, membro, outro nutri, portal, métricas).

Quando terminar uma tabela, marque o **Status** ⬜ como feito no documento e na task list do IDE.
