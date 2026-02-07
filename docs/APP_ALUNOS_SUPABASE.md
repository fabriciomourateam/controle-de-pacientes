# App dos Alunos – Leitura de dados no Supabase

Guia para o aplicativo separado dos alunos (Meu Acompanhamento) ler os dados do **mesmo** Supabase do Controle de Pacientes, identificando o paciente pelo telefone e mostrando só os dados dele.

---

## 1. Configuração do Supabase no app dos alunos

Use as **mesmas** variáveis do projeto principal:

- `VITE_SUPABASE_URL` – URL do projeto (ex.: `https://xxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` – chave **anon** (pública), **não** a service role

O app dos alunos deve usar **sempre a chave anon**. O isolamento (cada paciente vê só os próprios dados) é feito pelas políticas RLS no Supabase.

---

## 2. RLS e “link ativo”

As políticas de portal no Supabase permitem que o role **anon** leia:

- `patients`, `checkin`, `body_composition`, `diet_plans`, `diet_meals`, `diet_foods`, `diet_guidelines`
- `laboratory_exams`, `weight_tracking`, `featured_photo_comparison` (se rodou o script extra)

**Condição:** o telefone do paciente precisa estar em **link ativo** (token ativo em `patient_portal_tokens`). Esse token é criado no **painel do nutricionista** (Controle de Pacientes), quando o nutri gera/envia o link do portal para o aluno.

Sem token ativo para aquele telefone, a busca por paciente não retorna nada (RLS bloqueia).

---

## 3. Identificar o paciente pelo telefone (com ou sem 55)

No app dos alunos, ao receber o telefone (URL, input, etc.):

1. **Normalize e tente várias variantes** – no projeto principal há o utilitário que você pode copiar para o app dos alunos:
   - Arquivo: `src/lib/portal-patient-lookup.ts`
   - Função principal: **`findPatientByPhone(supabase, phoneInput)`**
   - Ela tenta: só números, com/sem 55, com/sem 9 extra, formatado `(11) 99999-9999`, últimos 8 dígitos.

2. **Exemplo de uso no app dos alunos:**

```ts
import { createClient } from '@supabase/supabase-js';
import { findPatientByPhone } from './lib/portal-patient-lookup'; // ou o caminho onde colar o módulo

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Telefone pode vir da URL: /acompanhamento/62999149439 ou /?telefone=5562999149439
const phoneFromUrl = new URLSearchParams(location.search).get('telefone') || params.telefone;

const result = await findPatientByPhone(supabase, phoneFromUrl || '');

if (!result) {
  // Não encontrou: telefone sem link ativo ou formato não bateu
  // Mostrar: "Use o link enviado pelo seu nutricionista" ou "Nenhum acesso ativo"
  return;
}

const { patient, telefone } = result;
// Use `telefone` (exatamente como está no banco) para as próximas buscas
```

3. **Depois de obter o paciente**, use o **`telefone`** retornado (não o digitado) para carregar o resto:

- Checkins: `.from('checkin').select('*').eq('telefone', telefone)`
- Composição corporal: `.from('body_composition').select('*').eq('telefone', telefone)`
- Dieta: planos do paciente por `patient_id` (use `patient.id`); as políticas do portal já filtram por paciente com token ativo.

Assim o app aceita telefone **com 55, sem 55, formatado ou só números** e ainda usa o valor correto do banco nas queries seguintes.

---

## 4. O que você pode copiar para o app dos alunos

- **`src/lib/portal-patient-lookup.ts`** – funções `getPhoneVariants`, `findPatientByPhone` e `normalizePhoneDisplay`.  
  Basta copiar o arquivo para o app dos alunos (ex.: `src/lib/portal-patient-lookup.ts`) e importar de lá.

O restante do app dos alunos continua igual: mesmo Supabase (URL + anon key), mesma tabela `patients` e mesmas tabelas de checkin, dieta, etc., usando o `telefone` (e `patient.id`) retornados por `findPatientByPhone`.

---

## 5. Resumo

| Item | Detalhe |
|------|--------|
| Supabase | Mesmo projeto do Controle de Pacientes |
| Chave | Anon (pública) |
| Identificação | Telefone (com/sem 55, formatado ou não) via `findPatientByPhone` |
| Isolamento | RLS: cada paciente só vê seus dados; exige link ativo no painel do nutri |
| Dados a ler | patients, checkin, body_composition, diet_plans, diet_meals, diet_foods, diet_guidelines, e opcionalmente laboratory_exams, weight_tracking, featured_photo_comparison |

Se quiser, no próximo passo podemos adaptar um exemplo de tela (ex.: uma página “Meu Acompanhamento” no app dos alunos) que usa só `findPatientByPhone` + essas tabelas.
