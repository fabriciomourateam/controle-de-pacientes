# Referência: Tabelas e RLS (portal vs nutri)

Com base no schema e nas políticas atuais do Supabase.

---

## Tabelas com acesso **portal (anon)** – app dos alunos

Estas tabelas têm pelo menos uma política **SELECT para anon**; o app dos alunos consegue ler (respeitando a condição da política, em geral telefone com token ativo).

| Tabela | Política(s) anon |
|--------|-------------------|
| patients | portal_patients_select_by_phone |
| checkin | portal_checkin_select_by_phone |
| body_composition | portal_body_composition_select_by_phone |
| diet_plans | portal_diet_plans_select_released |
| diet_meals | portal_diet_meals_select |
| diet_foods | portal_diet_foods_select |
| diet_guidelines | portal_diet_guidelines_select + Allow read for portal |
| diet_daily_consumption | portal_consumption_read + Allow read/insert/update for portal |
| laboratory_exams | portal_laboratory_exams_select_by_phone |
| weight_tracking | portal_weight_tracking_select_by_phone |
| featured_photo_comparison | portal_featured_photo_comparison_select_by_phone |
| achievement_templates | portal_achievement_templates_read + Allow read |
| daily_challenges | Allow read active daily_challenges |
| patient_achievements | portal_achievements_read + Allow read/insert for portal |
| patient_daily_challenges | Allow read/insert/update/delete for portal |
| patient_points | portal_points_read + Allow read/insert/update for portal |
| patient_points_history | Allow read/insert for portal |
| patient_portal_tokens | patient_portal_tokens_all (public) |

---

## Tabela sem SELECT para anon (possível bloqueio)

| Tabela | Situação |
|--------|----------|
| **food_database** | Só tem políticas para **authenticated** e **service_role**. O portal (anon) não consegue SELECT. Se o app dos alunos exibir nomes de alimentos da dieta a partir desta tabela, vai falhar. |

**Solução:** rodar `sql/rls-portal-food-database-anon.sql` para adicionar apenas `portal_food_database_select` (SELECT para anon em linhas com `is_active = true`). Nenhuma outra política é alterada.

---

## Tabelas só para nutri (authenticated)

Tabelas de métricas, configuração e gestão – apenas **authenticated**, com políticas **nutri_*** (e equipe via `get_member_owner_id()`). O app dos alunos não precisa acessá-las.

- Total de Leads, Total de Calls Agendadas, Total de Leads por Funil, Total de Agendamentos por Funil, Total de Vendas, Total de Vendas 2026  
- leads_que_entraram  
- dashboard_dados, alertas_dashboard  
- custom_foods, user_favorite_foods, user_favorite_meals  
- ai_insights_custom, ai_insights_hidden  
- contact_history, checkin_notes, checkin_feedback_analysis  
- retention_exclusions, plans  
- team_members, team_meetings, etc.  

---

*Atualizado conforme schema e políticas informadas. Use este doc como referência; em caso de nova tabela no portal, conferir se existe política SELECT para anon.*
