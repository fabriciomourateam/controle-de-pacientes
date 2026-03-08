# 🔧 Configurar Chave Anthropic no Vercel

## ❌ Problema
```
Error: Chave da API Anthropic não configurada no ambiente Vercel.
```

## ✅ Solução

A bioimpedância IA precisa da chave da API Anthropic configurada nas variáveis de ambiente do Vercel.

### PASSO 1: Acessar Configurações do Vercel

1. Acesse: https://vercel.com/fabriciomourateam/controle-de-pacientes
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Environment Variables** (Variáveis de Ambiente)

### PASSO 2: Adicionar Variável de Ambiente

1. Clique em **Add New**
2. Preencha os campos:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Cole a chave da API Anthropic (mesma do `.env.local`)
   - **Environment**: Selecione **Production**, **Preview** e **Development**
3. Clique em **Save**

### PASSO 3: Redeployar o Projeto

Após adicionar a variável, você precisa fazer um novo deploy:

**Opção 1: Redeploy Automático**
1. Vá em **Deployments**
2. Clique nos 3 pontinhos do último deploy
3. Clique em **Redeploy**

**Opção 2: Novo Push**
```bash
git commit --allow-empty -m "trigger redeploy"
git push
```

### PASSO 4: Verificar

Após o deploy, teste a bioimpedância IA em produção. Deve funcionar normalmente.

---

## 📋 Onde Encontrar a Chave da API?

A chave está no arquivo `.env.local` do projeto:
```
VITE_ANTHROPIC_API_KEY=sk-ant-api03-[SUA_CHAVE_AQUI]
```

Use o mesmo valor para `ANTHROPIC_API_KEY` no Vercel.

---

## 🔍 Verificar se Está Configurado

Você pode verificar se a variável está configurada:
1. Acesse: https://vercel.com/fabriciomourateam/controle-de-pacientes/settings/environment-variables
2. Procure por `ANTHROPIC_API_KEY`
3. Deve aparecer com o valor oculto (••••••••)

---

## ⚠️ IMPORTANTE

- A chave da API é sensível - nunca compartilhe publicamente
- Use a mesma chave que funciona localmente (do `.env.local`)
- A IA do checkin funciona porque usa chamadas diretas do frontend
- A bioimpedância IA precisa do proxy serverless (por isso precisa da variável no Vercel)

---

## 🎯 Resultado Esperado

Após configurar:
- ✅ Bioimpedância IA funcionará em produção
- ✅ Mesma experiência do ambiente local
- ✅ Análises corporais com Claude Sonnet 4.5
