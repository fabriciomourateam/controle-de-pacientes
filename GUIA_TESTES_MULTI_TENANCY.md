# 🧪 Guia de Testes - Multi-Tenancy e Inserção Manual de Métricas

## 📋 Checklist de Testes

Use este guia para verificar se tudo está funcionando corretamente após executar os scripts SQL.

---

## ✅ TESTE 1: Verificar Scripts SQL Executados

### 1.1. Verificar se `user_id` foi adicionado nas tabelas

Execute no Supabase SQL Editor:

```sql
-- Verificar dashboard_dados
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dashboard_dados' AND column_name = 'user_id';

-- Verificar leads_que_entraram
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads_que_entraram' AND column_name = 'user_id';

-- Verificar outras tabelas de métricas comerciais (se existirem)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Total de Leads' AND column_name = 'user_id';
```

**✅ Resultado esperado**: Deve retornar `user_id` com tipo `uuid` para cada tabela.

---

### 1.2. Verificar se RLS está ativo

```sql
-- Verificar RLS em dashboard_dados
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'dashboard_dados';

-- Verificar RLS em leads_que_entraram
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'leads_que_entraram';
```

**✅ Resultado esperado**: `rowsecurity` deve ser `true` (t).

---

### 1.3. Verificar se as políticas RLS foram criadas

```sql
-- Verificar políticas de dashboard_dados
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'dashboard_dados';

-- Verificar políticas de leads_que_entraram
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'leads_que_entraram';
```

**✅ Resultado esperado**: Deve retornar 4 políticas por tabela (SELECT, INSERT, UPDATE, DELETE).

---

### 1.4. Verificar se os triggers foram criados

```sql
-- Verificar trigger de dashboard_dados
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgname = 'set_user_id_dashboard_dados';

-- Verificar trigger de leads_que_entraram
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgname = 'set_user_id_leads_que_entraram';
```

**✅ Resultado esperado**: Deve retornar os triggers criados.

---

## ✅ TESTE 2: Verificar Migração dos Seus Dados

### 2.1. Verificar seus dados migrados

**⚠️ IMPORTANTE**: Execute estas queries enquanto estiver logado com sua conta no Supabase.

```sql
-- Verificar quantas métricas você tem
SELECT COUNT(*) as total_metricas
FROM dashboard_dados
WHERE user_id = auth.uid();

-- Verificar seus dados de dashboard
SELECT 
    id,
    mes,
    ano,
    ativos_total_inicio_mes,
    entraram,
    sairam,
    user_id
FROM dashboard_dados
WHERE user_id = auth.uid()
ORDER BY ano DESC, mes_numero DESC
LIMIT 10;

-- Verificar se há dados sem user_id (deve retornar 0)
SELECT COUNT(*) as dados_sem_user
FROM dashboard_dados
WHERE user_id IS NULL;
```

**✅ Resultado esperado**: 
- Deve retornar suas métricas existentes
- `dados_sem_user` deve ser `0`

---

### 2.2. Verificar seus leads migrados (se existirem)

```sql
-- Verificar seus leads
SELECT COUNT(*) as total_leads
FROM leads_que_entraram
WHERE user_id = auth.uid();

-- Verificar leads sem user_id (deve retornar 0)
SELECT COUNT(*) as leads_sem_user
FROM leads_que_entraram
WHERE user_id IS NULL;
```

**✅ Resultado esperado**: 
- Deve retornar seus leads existentes
- `leads_sem_user` deve ser `0`

---

## ✅ TESTE 3: Testar Inserção Manual de Métricas

### 3.1. Testar no Frontend

1. **Acesse a aplicação**: `http://localhost:5173/metrics` (ou sua URL)
2. **Faça login com sua conta**
3. **Role até o final da página**
4. **Procure pela seção "Gerenciar Métricas Operacionais"**

### 3.2. Testar Adicionar Nova Métrica

1. **Clique em "Adicionar Métrica"**
2. **Preencha o formulário**:
   - Ano: `2024` (ou ano atual)
   - Mês: Selecione qualquer mês
   - Pacientes Ativos no Início do Mês: `100`
   - Novos Pacientes (Entraram): `10`
   - Pacientes que Saíram: `5`
   - Vencimentos: `20`
   - Não Renovou: `3`
   - Deixe os percentuais em branco (serão calculados automaticamente)
3. **Clique em "Salvar"**
4. **Verifique**:
   - ✅ Deve aparecer mensagem de sucesso
   - ✅ A métrica deve aparecer na tabela
   - ✅ Os percentuais devem estar calculados

### 3.3. Testar Editar Métrica

1. **Na tabela, clique no ícone de editar** (lápis) em uma métrica
2. **Altere algum valor** (ex: aumentar "Novos Pacientes" para `15`)
3. **Clique em "Atualizar"**
4. **Verifique**:
   - ✅ Deve aparecer mensagem de sucesso
   - ✅ O valor deve estar atualizado na tabela

### 3.4. Testar Excluir Métrica

1. **Na tabela, clique no ícone de excluir** (lixeira) em uma métrica
2. **Confirme a exclusão**
3. **Verifique**:
   - ✅ Deve aparecer mensagem de sucesso
   - ✅ A métrica deve desaparecer da tabela

---

## ✅ TESTE 4: Testar Isolamento de Dados

### 4.1. Verificar que você só vê seus dados

Execute no Supabase SQL Editor (logado com sua conta):

```sql
-- Verificar que você só vê seus dados
SELECT 
    COUNT(*) as total_metricas,
    COUNT(DISTINCT user_id) as usuarios_diferentes
FROM dashboard_dados
WHERE user_id = auth.uid();
```

**✅ Resultado esperado**: 
- `total_metricas` deve ser o número de suas métricas
- `usuarios_diferentes` deve ser `1` (apenas você)

---

### 4.2. Testar com Conta de Teste

**⚠️ IMPORTANTE**: Crie uma conta de teste com email diferente do seu.

1. **Crie uma nova conta** na aplicação (email diferente)
2. **Faça login com a conta de teste**
3. **Acesse `/metrics`**
4. **Verifique**:
   - ✅ **NÃO deve aparecer suas métricas**
   - ✅ A tabela deve estar vazia ou mostrar apenas métricas da conta de teste

5. **Com a conta de teste, adicione uma métrica de teste**:
   - Ano: `2024`
   - Mês: `Janeiro`
   - Pacientes Ativos: `50`
   - Novos Pacientes: `5`
   - Pacientes que Saíram: `2`

6. **Faça login novamente com sua conta**
7. **Verifique**:
   - ✅ A métrica de teste **NÃO deve aparecer**
   - ✅ Suas métricas devem estar todas lá

---

### 4.3. Testar Isolamento no Banco de Dados

Execute no Supabase SQL Editor (logado com sua conta):

```sql
-- Tentar ver dados de outros usuários (deve retornar apenas seus dados)
SELECT 
    id,
    mes,
    ano,
    user_id,
    (SELECT email FROM auth.users WHERE id = dashboard_dados.user_id) as email_proprietario
FROM dashboard_dados
ORDER BY created_at DESC
LIMIT 10;
```

**✅ Resultado esperado**: 
- Deve retornar apenas suas métricas
- `email_proprietario` deve ser seu email
- Não deve aparecer métricas de outros usuários

---

## ✅ TESTE 5: Testar Triggers Automáticos

### 5.1. Testar inserção sem user_id (deve ser preenchido automaticamente)

Execute no Supabase SQL Editor (logado com sua conta):

```sql
-- Inserir métrica sem user_id (o trigger deve preencher automaticamente)
INSERT INTO dashboard_dados (
    mes, ano, mes_numero, data_referencia,
    ativos_total_inicio_mes, entraram, sairam
) VALUES (
    'Teste', '2024', '13', '2024-12-01',
    '100', '10', '5'
);

-- Verificar se user_id foi preenchido automaticamente
SELECT 
    id,
    mes,
    ano,
    user_id,
    (SELECT email FROM auth.users WHERE id = dashboard_dados.user_id) as email_proprietario
FROM dashboard_dados
WHERE mes = 'Teste';

-- Limpar teste
DELETE FROM dashboard_dados WHERE mes = 'Teste';
```

**✅ Resultado esperado**: 
- `user_id` deve estar preenchido com seu ID
- `email_proprietario` deve ser seu email

---

## ✅ TESTE 6: Testar RLS (Row Level Security)

### 6.1. Tentar acessar dados de outro usuário (deve falhar)

Execute no Supabase SQL Editor (logado com sua conta):

```sql
-- Tentar ver todos os dados (deve retornar apenas os seus)
SELECT COUNT(*) as total_todos
FROM dashboard_dados;

-- Verificar seu user_id
SELECT auth.uid() as meu_user_id;

-- Verificar quantos registros você tem
SELECT COUNT(*) as meus_registros
FROM dashboard_dados
WHERE user_id = auth.uid();
```

**✅ Resultado esperado**: 
- `total_todos` deve ser igual a `meus_registros`
- Não deve retornar dados de outros usuários

---

### 6.2. Tentar atualizar dados de outro usuário (deve falhar)

Execute no Supabase SQL Editor (logado com sua conta):

```sql
-- Tentar atualizar um registro que não é seu (se existir outro usuário)
-- Isso deve falhar ou não afetar nenhum registro
UPDATE dashboard_dados
SET mes = 'Tentativa de Hack'
WHERE user_id != auth.uid();

-- Verificar se nenhum registro foi alterado
SELECT COUNT(*) as registros_alterados
FROM dashboard_dados
WHERE mes = 'Tentativa de Hack';
```

**✅ Resultado esperado**: 
- `registros_alterados` deve ser `0`
- RLS deve impedir a atualização

---

## ✅ TESTE 7: Testar Interface Completa

### 7.1. Fluxo Completo de Uso

1. **Login com sua conta**
2. **Acesse `/metrics`**
3. **Verifique se seus dados aparecem**:
   - ✅ KPIs devem estar calculados
   - ✅ Gráficos devem estar preenchidos
   - ✅ Tabela de dados detalhados deve mostrar seus dados

4. **Adicione uma nova métrica**
5. **Atualize a página**
6. **Verifique**:
   - ✅ A nova métrica aparece nos gráficos
   - ✅ Os KPIs foram recalculados
   - ✅ A métrica aparece na tabela

7. **Edite uma métrica existente**
8. **Atualize a página**
9. **Verifique**:
   - ✅ As alterações aparecem nos gráficos
   - ✅ Os KPIs foram recalculados

---

## 🚨 Problemas Comuns e Soluções

### Problema: Não consigo ver minhas métricas

**Solução**:
1. Verifique se executou o script de migração
2. Verifique se seu email está correto no script
3. Execute: `SELECT user_id FROM dashboard_dados WHERE id = SEU_ID;`

### Problema: Vejo métricas de outros usuários

**Solução**:
1. Verifique se RLS está ativo: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'dashboard_dados';`
2. Verifique se as políticas foram criadas: `SELECT * FROM pg_policies WHERE tablename = 'dashboard_dados';`

### Problema: Erro ao inserir métrica

**Solução**:
1. Verifique se está autenticado
2. Verifique se o trigger está criado: `SELECT * FROM pg_trigger WHERE tgname = 'set_user_id_dashboard_dados';`
3. Verifique os logs do console do navegador

### Problema: Formulário não aparece

**Solução**:
1. Verifique se está na página `/metrics`
2. Role até o final da página
3. Procure pela seção "Gerenciar Métricas Operacionais"
4. Verifique se não há erros no console do navegador

---

## 📊 Resumo dos Testes

| Teste | Status | Observações |
|-------|--------|-------------|
| Scripts SQL executados | ⬜ | Verificar user_id, RLS, triggers |
| Dados migrados | ⬜ | Verificar se seus dados têm user_id |
| Inserção manual | ⬜ | Testar adicionar nova métrica |
| Edição manual | ⬜ | Testar editar métrica existente |
| Exclusão manual | ⬜ | Testar excluir métrica |
| Isolamento de dados | ⬜ | Testar com conta de teste |
| Triggers automáticos | ⬜ | Verificar se user_id é preenchido |
| RLS funcionando | ⬜ | Verificar que não vê dados de outros |

---

## ✅ Tudo Funcionando?

Se todos os testes passaram:
- ✅ Seus dados estão protegidos
- ✅ Outros usuários não veem seus dados
- ✅ Você pode inserir métricas manualmente
- ✅ Sistema está pronto para múltiplos usuários

**Parabéns! O sistema está configurado corretamente! 🎉**

