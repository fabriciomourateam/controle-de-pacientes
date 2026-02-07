# Backup RLS – Sistema completo que deu certo

Esta pasta contém **toda a configuração de Row Level Security (RLS)** executada no passo a passo e que está funcionando (painel do nutri, equipe, portal do paciente, métricas).

Use para **restaurar** o RLS em outro projeto Supabase ou após um restore do banco. Execute os scripts **na ordem numérica** no SQL Editor do Supabase.

---

## Pré-requisitos (antes do script 01)

1. **UUIDs:** No Supabase, rode `SELECT id, email FROM auth.users ORDER BY email;` e anote o `id` (UUID) de cada nutricionista.
2. **user_id nos dados:** Popule `user_id` nos dados existentes (patients, checkin, etc.) com o UUID do dono. Se tudo já for de um único dono, pode usar algo como:
   - `UPDATE patients SET user_id = 'SEU-UUID' WHERE user_id IS NULL;`
   - (e o mesmo para checkin, patient_feedback_records, etc.)
3. Nos scripts **04**, **05** e **06** há uma variável `owner_uuid` no início do primeiro bloco. Troque pelo UUID do dono dos dados se for outro nutri.

---

## Ordem de execução

| # | Arquivo | O que faz |
|---|---------|-----------|
| **01** | `01-rls-isolamento-por-nutri.sql` | Adiciona `user_id` onde falta; cria `get_member_owner_id()`; RLS nas tabelas 1–17 (patients, checkin, diet_plans, diet_meals, diet_foods, diet_guidelines, retention_exclusions, plans, user_preferences, diet_ai_generations, patient_feedback_records, body_composition, weight_tracking, contact_history, dashboard_dados, alertas_dashboard, laboratory_exams); triggers em patients e checkin. **Não** remove políticas com "portal" no nome. |
| **02** | `02-rls-portal-remover-inseguras-aplicar-seguras.sql` | Remove políticas inseguras do portal (anon lendo tudo); cria políticas seguras: anon só lê onde o telefone tem token ativo em `patient_portal_tokens`. Cria `get_phone_from_portal_token(text)`. |
| **03** | `03-rls-portal-fix-406-funcao-telefones.sql` | Corrige 406 no portal: cria `get_phones_with_active_portal_tokens()` (SECURITY DEFINER) e atualiza as políticas do portal para usar essa função em vez de subquery direta em `patient_portal_tokens`. |
| **04** | `04-rls-metricas-todas-por-nutri.sql` | Adiciona/preenche `user_id` nas tabelas de métricas (Total de Leads, Total de Calls Agendadas, Total de Leads por Funil, Total de Agendamentos por Funil, Total de Vendas, Total de Vendas 2026, leads_que_entraram; dashboard_metricas só se for tabela – no projeto é view). Habilita RLS e políticas por nutri. |
| **05** | `05-rls-outras-tabelas-por-nutri.sql` | Adiciona/preenche `user_id` e RLS nas tabelas 26–33: custom_foods, food_database, user_favorite_meals, user_favorite_foods, checkin_feedback_analysis, ai_insights_custom, ai_insights_hidden, photo_visibility_settings, featured_photo_comparison. |
| **06** | `06-rls-team-members-config.sql` | Recria as políticas da tabela `team_members` (owner gerencia equipe; membro vê próprio vínculo e colegas do mesmo owner). Só necessário se as políticas de team_members forem alteradas ou perdidas. |

---

## Resumo do que fica protegido

- **Painel (authenticated):** cada nutri vê só seus dados; membros de equipe veem os dados do owner que os convidou (`get_member_owner_id()`).
- **Portal do paciente (anon):** cada paciente acessa só seus dados (telefone com token ativo em `patient_portal_tokens`), via políticas que usam `get_phones_with_active_portal_tokens()`.
- **Métricas e outras tabelas:** isoladas por `user_id` (owner + equipe).

---

## UUID de exemplo nos scripts

Nos scripts 04 e 05, o `owner_uuid` usado como exemplo é:  
`a9798432-60bd-4ac8-a035-d139a47ad59b` (fabriciomouratreinador@gmail.com).  
Troque no início do primeiro `DO $$` de cada script se os dados forem de outro dono.

---

*Backup gerado em jan/2026. Manter esta pasta junto ao projeto para referência e restauração.*
