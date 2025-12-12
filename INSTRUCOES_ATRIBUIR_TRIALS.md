# 🔧 Instruções para Atribuir Trials via Admin

## ⚠️ Problema Resolvido

O erro "new row violates row-level security policy" acontecia porque as políticas RLS impediam que o admin criasse assinaturas para outros usuários.

## ✅ Solução

Foi criada uma função SQL no Supabase que usa `SECURITY DEFINER` para contornar as políticas RLS, permitindo que o admin atribua trials.

---

## 📋 Passo a Passo

### 1. Executar SQLs no Supabase

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor:**
   - No menu lateral, clique em **SQL Editor**
   - Clique em **New Query**

3. **Execute os Scripts (na ordem):**
   
   **a) Função para Admin:**
   - Abra o arquivo `sql/create-admin-assign-trial-function.sql`
   - Copie TODO o conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em **Run**
   
   **b) Função para Usuários Criarem Seu Próprio Trial:**
   - Abra o arquivo `sql/create-user-self-trial-function.sql`
   - Copie TODO o conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em **Run**
   
   **c) Políticas RLS (se ainda não executou):**
   - Execute o SQL das políticas RLS que permite usuários criarem sua própria assinatura
   - Isso já deve ter sido executado anteriormente

4. **Verificar Sucesso:**
   - Você deve ver a mensagem: "Success. No rows returned" para cada script
   - Isso significa que as funções foram criadas com sucesso

---

### 2. Testar no Admin Dashboard

1. **Recarregue a página de Admin:**
   - Vá para `/admin` no seu site
   - Recarregue a página (F5)

2. **Clique em "Atribuir Trials":**
   - O botão está ao lado do botão "Atualizar"
   - Aguarde o processamento

3. **Verifique o Resultado:**
   - Um toast aparecerá mostrando quantos trials foram atribuídos
   - Verifique o console do navegador (F12) para ver os detalhes
   - O card "Em Trial" deve atualizar mostrando o número correto

---

## 🔍 Verificar se Funcionou

### No Console do Navegador:
```
=== INICIANDO ATRIBUIÇÃO DE TRIALS ===
Planos encontrados: [...]
Plano gratuito encontrado: { id: '...', name: 'free' }
Total de usuários encontrados: 4
Usuários sem assinatura (exceto admin): 3
✅ Trial atribuído com sucesso para teste@medico.com
✅ Trial atribuído com sucesso para nitiomendes@gmail.com
✅ Trial atribuído com sucesso para fabriciohermes@gmail.com
=== RESULTADO: 3 atribuídos, 0 erros ===
```

### No Dashboard:
- O card "Em Trial" deve mostrar **3** (ou o número correto de usuários)
- A tabela de usuários deve mostrar o status "Trial" para os usuários

---

## 🛠️ Troubleshooting

### Erro: "function admin_assign_trial does not exist"
- **Solução:** Execute o SQL novamente no Supabase
- Verifique se não há erros de sintaxe

### Erro: "Apenas o admin pode atribuir trials"
- **Solução:** Certifique-se de estar logado como `fabriciomouratreinador@gmail.com`
- Faça logout e login novamente

### Erro: "Plano gratuito não encontrado"
- **Solução:** Verifique se existe um plano com `name = 'free'` na tabela `subscription_plans`
- Execute: `SELECT * FROM subscription_plans WHERE name = 'free';`

### Trials não aparecem após atribuir
- **Solução:** Clique no botão "Atualizar" no dashboard
- Verifique se as assinaturas foram criadas: `SELECT * FROM user_subscriptions WHERE status = 'trial';`

---

## 📝 Notas Importantes

1. **A função só funciona para o admin:** Apenas o usuário `fabriciomouratreinador@gmail.com` pode usar esta função.

2. **Não cria trial duplicado:** Se o usuário já tiver uma assinatura, a função retornará erro.

3. **Trial de 30 dias:** Todos os trials criados têm duração de 30 dias a partir da data de criação.

4. **Admin não recebe trial:** O admin automaticamente não recebe trial (já tem acesso total).

---

## ✅ Pronto!

Após executar o SQL e testar, os trials devem ser atribuídos corretamente e o card "Em Trial" deve mostrar o número correto de usuários em trial.

