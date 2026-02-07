# RLS: Isolamento de dados por nutricionista

Cada nutricionista deve ver **apenas seus próprios** pacientes, checkins, dietas, retenção etc. Membros de equipe veem os dados do **owner** que os convidou. O **app de alunos (portal)** continua acessando apenas o que for permitido (por telefone/token). Este guia explica como aplicar o RLS no Supabase.

## O que o script faz

O arquivo `sql/rls-isolamento-por-nutri.sql`:

1. **Adiciona a coluna `user_id`** nas tabelas que ainda não tiverem (por exemplo `patients`, `checkin`, `patient_feedback_records`).
2. **Cria a função `get_member_owner_id()`** para que membros de equipe vejam os dados do owner que os convidou.
3. **Ativa RLS** e cria políticas **estritas** (sem “ver linhas com user_id vazio”) em:
   - `patients`
   - `checkin`
   - `diet_plans`, `diet_meals`, `diet_foods`, `diet_guidelines`
   - `retention_exclusions`
   - `plans`
   - `user_preferences`
   - `diet_ai_generations`
   - `patient_feedback_records` (se existir)
   - `body_composition`, `weight_tracking`, `contact_history`, `dashboard_dados`, `alertas_dashboard`, `laboratory_exams`
4. **Não remove políticas do portal** – Políticas com "portal" ou "Allow read ... for portal" no nome são mantidas para o app de alunos.
5. **user_preferences** – A coluna user_id é TEXT; o script usa auth.uid()::text nas políticas.
6. **Triggers** para preencher `user_id` automaticamente em novos `patients` e `checkin`.

## Passo a passo (obrigatório)

### 1. Descobrir o `user_id` de cada nutricionista

No **SQL Editor** do Supabase, rode:

```sql
SELECT id, email FROM auth.users ORDER BY email;
```

Anote o `id` (UUID) de cada nutri. Esse é o `user_id` que será usado nas próximas etapas.

### 2. Atribuir `user_id` nos dados existentes

**Antes** de rodar o script de RLS, todos os registros que pertencem a um nutri precisam ter `user_id` preenchido. Caso contrário, depois do RLS eles **não** aparecerão para ninguém (porque não haverá mais política “quem pode ver user_id NULL”).

Substitua `'UUID-DO-NUTRI-AQUI'` pelo `id` retornado no passo 1 e execute **uma vez por nutricionista** (para os dados dele):

```sql
-- Exemplo: seus dados (nutri principal)
UPDATE public.patients
SET user_id = 'UUID-DO-NUTRI-AQUI'
WHERE user_id IS NULL;
-- Ajuste o WHERE se quiser atribuir só parte dos pacientes (ex.: por email, nome, etc.)

UPDATE public.checkin
SET user_id = 'UUID-DO-NUTRI-AQUI'
WHERE user_id IS NULL;

-- Se a tabela existir e tiver user_id:
UPDATE public.patient_feedback_records
SET user_id = 'UUID-DO-NUTRI-AQUI'
WHERE user_id IS NULL;
```

- Se **só você** usa o sistema, use o seu próprio `id` em todos os `UPDATE` acima.
- Se há **vários nutris**, repita os `UPDATE` para cada um, mudando o UUID e o `WHERE` conforme os dados de cada um (por exemplo por lista de IDs de pacientes ou outra regra que você definir).

### 3. Rodar o script de RLS

1. Abra o **SQL Editor** do Supabase.
2. Cole todo o conteúdo de `sql/rls-isolamento-por-nutri.sql`.
3. Execute o script.

Se aparecer “RLS de isolamento por nutricionista aplicado.”, o RLS foi aplicado.

### 4. Conferir no app

- Faça login com cada conta de nutri e confira:
  - Lista de pacientes
  - Checkins
  - Planos alimentares
  - Retenção
- Cada um deve ver **só** os dados que receberam `user_id` dele no passo 2.

## Equipe (team_members)

Se você usa a tabela `team_members` (owner_id + user_id):

- O **owner** continua vendo só os dados com `user_id = auth.uid()` (ou `created_by`, conforme a tabela).
- O **membro** passa a ver os dados do owner porque a função `get_member_owner_id()` retorna o `owner_id` e as políticas permitem `user_id = get_member_owner_id()`.

Não é necessário alterar nada no app para isso; basta o RLS e a tabela `team_members` preenchida corretamente.

## Problemas comuns

- **“Não vejo mais nenhum paciente”**  
  Provavelmente ainda há linhas com `user_id` NULL. Volte ao passo 2 e atribua `user_id` a todos os registros que cada nutri deve enxergar.

- **“Outro nutri ainda vê meus dados”**  
  Confira se o script de RLS foi executado por completo e se não existe outra política antiga liberando acesso (por exemplo “Enable read for all”). O script remove várias políticas antigas; se você tiver outras com nomes diferentes, pode precisar dropar manualmente.

- **Checkins / dietas não aparecem**  
  Para `checkin`, a política usa `checkin.user_id`. Garanta que `UPDATE public.checkin SET user_id = ...` foi feito para os checkins desse nutri. Para dietas, o acesso é via `diet_plans` (user_id/created_by ou patient_id do paciente do nutri); confira se os pacientes já têm `user_id` certo.

Depois de seguir esses passos, cada nutri passa a acessar apenas os próprios dados (e os do owner, no caso de membros de equipe).
