# Backup da configuração RLS que deu certo

Referência da configuração de Row Level Security aplicada e validada no projeto (jan/2026).

---

## 1. Tabela `team_members`

**Políticas ativas (conferidas no Supabase):**

| Política | Comando | Regra |
|----------|---------|--------|
| `team_members_select_no_recursion` | SELECT | `(owner_id = auth.uid()) OR (user_id = auth.uid()) OR (owner_id = get_member_owner_id())` |
| `team_members_insert` | INSERT | WITH CHECK: apenas owner pode inserir (ex.: `owner_id = auth.uid()`) |
| `team_members_update` | UPDATE | `owner_id = auth.uid()` |
| `team_members_delete` | DELETE | `owner_id = auth.uid()` |

**Script para recriar:** `sql/backup-rls-team-members-config.sql`

---

## 2. Ordem dos scripts RLS do projeto

1. **Pré-requisito:** popular `user_id` nos dados existentes (ver `INSTRUCOES_RLS_NUTRI.md`).
2. **Principal:** `sql/rls-isolamento-por-nutri.sql` (tabelas 1–17, função `get_member_owner_id()`).
3. **Portal:** `sql/rls-portal-remover-inseguras-aplicar-seguras.sql` + `sql/rls-portal-fix-406-funcao-telefones.sql`.
4. **Métricas:** `sql/rls-metricas-todas-por-nutri.sql` (tabelas 18–23, 25; tabela 24 é view).
5. **Outras tabelas:** `sql/rls-outras-tabelas-por-nutri.sql` (tabelas 26–33).
6. **team_members:** já estava configurado; conferência com `sql/conferir-team-members-rls.sql`. Para recriar: `sql/backup-rls-team-members-config.sql`.

---

## 3. UUID do owner (exemplo usado nos scripts)

- `a9798432-60bd-4ac8-a035-d139a47ad59b` (fabriciomouratreinador@gmail.com)  
Trocar nos scripts se os dados forem de outro dono.

---

*Documento gerado como referência da configuração RLS que funcionou. Atualizar este arquivo se aplicar novos scripts ou mudar políticas.*
