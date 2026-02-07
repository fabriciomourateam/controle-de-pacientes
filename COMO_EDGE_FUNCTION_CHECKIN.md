# Passo a passo: Edge Function para receber check-in (Typebot/n8n)

Este guia explica como criar, publicar e usar a Edge Function **receive-checkin** no Supabase. Ela recebe os dados do check-in (Typebot → Google Sheets → n8n ou direto do Typebot), normaliza o telefone, busca o paciente (por telefone ou por nome) e **só então** insere o check-in. **Ela não cria paciente novo**: se não achar ninguém, devolve `patient_matched: false` e o check-in não é criado.

---

## O que a função faz

1. **Recebe** um POST com JSON (telefone obrigatório + nome e outros campos opcionais do check-in).
2. **Normaliza** o telefone (só números, remove 55 e 9 extra).
3. **Busca** o paciente nesta ordem: `telefone` exato → `telefone_filtro` → últimos 8 dígitos do telefone → **por nome** (campo `nome` contendo o texto enviado, ex.: "Maria" acha "Maria Silva").
4. **Se não achar:** responde com `success: true` e `patient_matched: false` e **não insere** check-in (não cria paciente novo).
5. **Se achar:** insere o check-in na tabela `checkin` com o `telefone` do paciente encontrado e responde com `checkin_id`.

Assim você evita cadastros duplicados e consegue achar o paciente mesmo quando o telefone vem errado, usando o nome.

---

## Fazer direto no n8n é mais fácil?

Dá para fazer a mesma lógica **só no n8n**, sem Edge Function:

- **No n8n:** você monta um fluxo: 1) Supabase “Get row(s)” por telefone (ou “Get many” com filtro); 2) se não retornar nada, outro “Get many” em `patients` filtrando por nome (ex.: nome contém X); 3) se achou um paciente, “Create row” em `checkin`; se não achou, envia alerta ou salva em planilha “pendentes”.
- **Vantagem:** tudo visual, sem deploy de função, fácil de mudar (trocar ordem telefone/nome, adicionar campos).
- **Desvantagem:** normalizar telefone (55, 9 extra) você teria que fazer em nós “Code” ou “Set” no n8n; busca por “nome contém” no Supabase no n8n é um filtro tipo `nome ilike %valor%` (depende de como o nó Supabase expõe filtros).

**Quando a Edge Function compensa:** quando você quer um único endpoint (Typebot ou n8n só fazem um POST), lógica de telefone + nome num lugar só, e menos nós no fluxo. **Quando fazer no n8n compensa:** quando você prefere tudo no fluxo, sem código, e não se importa em ter 3–4 nós (busca por telefone → busca por nome → criar check-in ou ramo “não achou”).

---

## Pré-requisitos

- Conta no [Supabase](https://supabase.com) e projeto já criado.
- **Supabase CLI** instalado no seu PC.
- Node.js (ou outro ambiente) para rodar os comandos no terminal.

---

## Passo 1: Instalar a Supabase CLI

Se ainda não tiver a CLI:

**Windows (PowerShell):**

```powershell
# Com npm (recomendado)
npm install -g supabase

# Ou com Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Mac/Linux:**

```bash
brew install supabase/tap/supabase
# ou
npm install -g supabase
```

Confirme a instalação:

```bash
supabase --version
```

---

## Passo 2: Fazer login no Supabase

No terminal, na pasta do seu projeto (por exemplo `controle-de-pacientes`):

```bash
cd "c:\Users\fhbom\STAR CONTROLE DE PACIENTES\controle-de-pacientes"
supabase login
```

Isso abre o navegador para você autorizar a CLI. Depois do login, volte ao terminal.

---

## Passo 3: Vincular o projeto ao Supabase

Se o projeto ainda não estiver linkado:

```bash
supabase link --project-ref qhzifnyjyxdushxorzrk
```

O `project-ref` está em **Supabase Dashboard** → **Project Settings** → **General** → **Reference ID**. No seu caso já está no `supabase/config.toml` como `project_id = "qhzifnyjyxdushxorzrk"`.

Se pedir senha do banco, use a que está em **Project Settings** → **Database** → **Database password**.

---

## Passo 4: Estrutura da função (já criada)

A função já está em:

```
supabase/
  functions/
    receive-checkin/
      index.ts    ← código da função
      deno.json   ← dependências (Supabase client)
```

Não é obrigatório alterar nada aqui para seguir o passo a passo; você só precisa publicar.

---

## Passo 5: Publicar a Edge Function

No mesmo diretório do projeto:

```bash
supabase functions deploy receive-checkin
```

Se quiser publicar todas as funções de uma vez:

```bash
supabase functions deploy
```

A CLI usa o projeto linkado e as variáveis do projeto (por exemplo `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem no Supabase para Edge Functions).

---

## Passo 6: URL da função

Após o deploy, a URL fica no formato:

```
https://qhzifnyjyxdushxorzrk.supabase.co/functions/v1/receive-checkin
```

Substitua pelo seu **Reference ID** se for diferente. Essa é a URL que o n8n ou o Typebot vão chamar em um **HTTP Request** (POST).

---

## Passo 7: Como chamar a função (n8n / Typebot)

### Body do POST (exemplo mínimo)

```json
{
  "telefone": "11999998888",
  "nome": "Maria Silva",
  "peso": "72.5",
  "mes_ano": "02-2025"
}
```

### Campos aceitos (todos opcionais exceto `telefone`)

- **telefone** (obrigatório) – aceita também `Telefone` ou `phone`
- **nome** / **Nome** – usado se for preciso criar paciente novo
- **peso**, **medida**, **objetivo**, **dificuldades**, **treino**, **cardio**, **agua**, **sono**, etc. (mesmos nomes da tabela `checkin`)
- **data_checkin** – data do check-in (padrão: hoje, formato ISO ou `YYYY-MM-DD`)
- **mes_ano** – mês/ano (padrão: mês atual, ex.: `02-2025`)

Se o Typebot/Sheets enviar outros nomes de campos, você pode mapear no n8n para esses nomes antes de enviar para a função.

### Exemplo no n8n

1. Adicione um nó **HTTP Request**.
2. **Method:** POST  
3. **URL:** `https://qhzifnyjyxdushxorzrk.supabase.co/functions/v1/receive-checkin`  
4. **Headers:**  
   - `Content-Type`: `application/json`  
   - (Opcional) `Authorization`: `Bearer SEU_ANON_KEY` – só necessário se você ativar “Enforce JWT” na função; para começar pode deixar sem.
5. **Body (JSON):**  
   - Pode usar `{{ $json }}` se o item anterior já tiver os campos, ou montar um objeto com as variáveis do n8n, por exemplo:
   ```json
   {
     "telefone": "={{ $json.telefone }}",
     "nome": "={{ $json.nome }}",
     "peso": "={{ $json.peso }}",
     "mes_ano": "={{ $now.format('MM-YYYY') }}"
   }
   ```

Assim você **substitui** o fluxo “Get a row (paciente por telefone) + Create a row (checkin)” por uma única chamada a essa URL. O Typebot/Sheets pode continuar enviando os dados para o n8n; o n8n só passa a enviar esse JSON para a Edge Function.

---

## Passo 8: Resposta da função

**Sucesso (paciente encontrado e check-in criado):**

```json
{
  "success": true,
  "patient_matched": true,
  "checkin_id": "uuid-do-checkin",
  "message": "Check-in criado e vinculado ao paciente."
}
```

**Sucesso mas paciente não encontrado (check-in não foi criado):**

```json
{
  "success": true,
  "patient_matched": false,
  "checkin_id": null,
  "message": "Paciente não encontrado (telefone e nome). Verifique o cadastro. Check-in não foi criado."
}
```

**Erro (ex.: telefone faltando):**

```json
{
  "success": false,
  "error": "Campo 'telefone' é obrigatório"
}
```

No n8n você pode usar `patient_matched === false` para enviar um aviso (e-mail, Slack, etc.) e revisar o cadastro depois.

---

## Passo 9: Segurança (JWT opcional)

Por padrão a função está aberta para quem souber a URL. Para exigir autenticação:

1. **Supabase Dashboard** → **Edge Functions** → **receive-checkin** → **Settings** (ou configuração da função).
2. Ative algo como **Enforce JWT** (nome pode variar na interface).
3. No n8n, no **HTTP Request**, adicione no header:
   - `Authorization`: `Bearer SEU_ANON_KEY`  
   (a **anon key** está em **Project Settings** → **API** no Supabase).

Assim só chamadas com esse token são aceitas.

---

## Resumo rápido

| Etapa | Comando / Ação |
|--------|-----------------|
| 1 | Instalar Supabase CLI: `npm install -g supabase` |
| 2 | Login | `supabase login` |
| 3 | Linkar projeto | `supabase link --project-ref qhzifnyjyxdushxorzrk` |
| 4 | (Estrutura) | Já existe em `supabase/functions/receive-checkin/` |
| 5 | Deploy | `supabase functions deploy receive-checkin` |
| 6 | URL | `https://qhzifnyjyxdushxorzrk.supabase.co/functions/v1/receive-checkin` |
| 7 | n8n/Typebot | POST com JSON `{ "telefone", "nome?", "peso?", ... }` |
| 8 | Resposta | `success`, `patient_matched`, `checkin_id` |
| 9 | (Opcional) | Ativar JWT e enviar `Authorization: Bearer ANON_KEY` |

Se em algum passo aparecer erro de “project not linked”, “database password” ou “function deploy failed”, envie a mensagem de erro que dá para ajustar o próximo passo.
