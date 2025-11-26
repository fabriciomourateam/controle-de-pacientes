# 🏢 Guia de Implementação de Multi-Tenancy

## 📋 Visão Geral

Este guia explica como transformar seu sistema de controle de pacientes em uma aplicação multi-tenant, onde cada usuário pode fazer seu próprio cadastro e acessar apenas seus próprios dados, sem ver informações de outros usuários.

## ✅ Viabilidade

**SIM, é totalmente possível e recomendado!**

- ✅ Seu projeto já usa Supabase Auth (perfeito para multi-tenancy)
- ✅ Estrutura de código bem organizada
- ✅ Dificuldade: **Média** (requer mudanças em várias partes, mas nada complexo)
- ✅ Risco: **Baixo** (podemos fazer de forma incremental e testada)

## 🎯 O que será implementado

1. **Isolamento de Dados**: Cada usuário só vê seus próprios pacientes, checkins, métricas, etc.
2. **Cadastro de Novos Usuários**: Qualquer pessoa pode criar uma conta e ter seu próprio espaço
3. **Segurança**: Políticas RLS (Row Level Security) garantem que dados não sejam acessados por outros usuários
4. **Migração Segura**: Seus dados existentes serão vinculados ao seu usuário

## 📝 Passo a Passo

### **ETAPA 1: Preparação** ⚠️ IMPORTANTE

1. **Faça backup do banco de dados**
   - No Supabase Dashboard, vá em Settings > Database
   - Faça um backup completo antes de começar

2. **Anote seu email de login**
   - Você precisará dele para migrar seus dados existentes

### **ETAPA 2: Executar Scripts SQL**

#### 2.1. Adicionar Suporte Multi-Tenancy

Execute no Supabase SQL Editor:

```sql
-- Arquivo: sql/add-multi-tenancy-support.sql
```

Este script:
- ✅ Adiciona coluna `user_id` em todas as tabelas principais
- ✅ Cria índices para performance
- ✅ Habilita RLS (Row Level Security)
- ✅ Cria políticas de segurança
- ✅ Cria triggers para garantir que `user_id` seja sempre definido

#### 2.2. Migrar Dados Existentes

**⚠️ IMPORTANTE**: Antes de executar, edite o arquivo e substitua `'SEU_EMAIL_AQUI'` pelo seu email de login.

Execute no Supabase SQL Editor:

```sql
-- Arquivo: sql/migrate-existing-data-to-user.sql
```

Este script:
- ✅ Vincula todos os seus pacientes ao seu usuário
- ✅ Vincula todos os checkins ao seu usuário
- ✅ Vincula todas as métricas ao seu usuário
- ✅ Garante que você continue vendo todos os seus dados

### **ETAPA 3: Atualizar Código TypeScript**

Após executar os scripts SQL, precisamos atualizar o código para garantir que:

1. Novos registros sempre incluam `user_id`
2. Queries filtrem automaticamente por usuário (RLS já faz isso, mas é bom garantir no código também)

## 🔒 Segurança

### Como Funciona o Isolamento

1. **Row Level Security (RLS)**: Políticas no banco garantem que cada usuário só vê seus dados
2. **Triggers**: Garantem que `user_id` seja sempre definido automaticamente
3. **Políticas de Acesso**: Cada tabela tem políticas específicas para SELECT, INSERT, UPDATE, DELETE

### Exemplo de Política RLS

```sql
CREATE POLICY "Users can only see their own patients" ON patients
    FOR SELECT USING (auth.uid() = user_id);
```

Isso significa: "Usuários só podem ver pacientes onde `user_id` = seu próprio ID"

## 🧪 Testando

### Teste 1: Verificar seus dados

1. Faça login com sua conta
2. Verifique se todos os seus pacientes aparecem
3. Verifique se todos os checkins aparecem
4. Verifique se as métricas estão corretas

### Teste 2: Criar conta de teste

1. Crie uma nova conta (email diferente)
2. Faça login com a nova conta
3. **Verifique que NÃO aparecem seus dados**
4. Crie um paciente de teste na nova conta
5. Faça login novamente com sua conta
6. **Verifique que o paciente de teste NÃO aparece**

## 📊 Tabelas Afetadas

As seguintes tabelas receberão suporte multi-tenant:

- ✅ `patients` - Pacientes
- ✅ `checkin` - Checkins dos pacientes
- ✅ `patient_feedback_records` - Feedback dos pacientes
- ✅ `dashboard_dados` - Dados do dashboard (se existir)
- ✅ `leads_que_entraram` - Leads (se existir)

**Tabelas que NÃO precisam de user_id** (são compartilhadas ou já têm):
- `plans` - Planos (podem ser compartilhados entre usuários)
- `user_preferences` - Já tem `user_id`
- `page_passwords` - Senhas do sistema (compartilhadas)

## 🚀 Próximos Passos Após Implementação

1. **Atualizar Interface de Cadastro**
   - Adicionar link "Criar conta" na página de login
   - Melhorar mensagens de boas-vindas para novos usuários

2. **Dashboard de Onboarding**
   - Criar tela de boas-vindas para novos usuários
   - Guia rápido de como usar o sistema

3. **Configurações de Usuário**
   - Permitir que usuários editem perfil
   - Configurações de notificações

## ⚠️ Pontos de Atenção

1. **Migração de Dados**: Certifique-se de executar o script de migração corretamente
2. **Testes**: Teste bem antes de liberar para outros usuários
3. **Backup**: Sempre tenha backup antes de mudanças no banco
4. **RLS**: As políticas RLS são muito seguras, mas teste bem

## 🆘 Resolução de Problemas

### Problema: Não consigo ver meus dados após migração

**Solução**: 
1. Verifique se executou o script de migração corretamente
2. Verifique se o email no script está correto
3. Execute a query de verificação:
   ```sql
   SELECT COUNT(*) FROM patients WHERE user_id = (SELECT id FROM auth.users WHERE email = 'SEU_EMAIL');
   ```

### Problema: Novos registros não aparecem

**Solução**:
1. Verifique se o trigger está funcionando:
   ```sql
   SELECT * FROM patients ORDER BY created_at DESC LIMIT 5;
   ```
2. Verifique se `user_id` está sendo preenchido automaticamente

### Problema: Erro de permissão ao inserir dados

**Solução**:
1. Verifique se está logado corretamente
2. Verifique se as políticas RLS estão ativas:
   ```sql
   SELECT tablename, policyname FROM pg_policies WHERE tablename = 'patients';
   ```

## 📞 Suporte

Se tiver dúvidas ou problemas durante a implementação, verifique:

1. Logs do Supabase (Dashboard > Logs)
2. Console do navegador (F12)
3. Verifique se todos os scripts foram executados corretamente

## ✅ Checklist Final

Antes de considerar a implementação completa:

- [ ] Backup do banco de dados feito
- [ ] Script `add-multi-tenancy-support.sql` executado
- [ ] Script `migrate-existing-data-to-user.sql` executado (com email correto)
- [ ] Dados existentes aparecem corretamente após login
- [ ] Conta de teste criada e testada
- [ ] Novos registros são criados corretamente
- [ ] Isolamento de dados funcionando (usuário A não vê dados do usuário B)

---

**🎉 Parabéns!** Seu sistema agora suporta múltiplos usuários de forma segura e isolada!

