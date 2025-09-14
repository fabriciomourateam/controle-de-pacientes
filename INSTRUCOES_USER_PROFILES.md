# Instruções para Configurar User Profiles no Supabase

## 📋 **Passo a Passo**

### 1. **Acessar o Supabase Dashboard**
- Vá para [supabase.com](https://supabase.com)
- Faça login na sua conta
- Selecione seu projeto

### 2. **Executar o SQL**
- No menu lateral, clique em **"SQL Editor"**
- Clique em **"New query"**
- Copie todo o conteúdo do arquivo `sql/create-user-profiles-table.sql`
- Cole no editor SQL
- Clique em **"Run"** para executar

### 3. **Verificar se foi criado corretamente**
- Vá para **"Table Editor"** no menu lateral
- Verifique se a tabela `user_profiles` foi criada
- Confirme se as colunas estão corretas

### 4. **Corrigir Storage (IMPORTANTE)**
- Execute o arquivo `sql/fix-storage-policies.sql` no SQL Editor
- Isso corrige as políticas de storage para upload de avatar
- Vá para **"Storage"** no menu lateral
- Verifique se o bucket `profile-images` foi criado
- Confirme se está configurado como público

## 🔧 **O que o SQL cria:**

### **Tabela `user_profiles`:**
- **id**: UUID vinculado ao auth.users
- **name**: Nome completo
- **email**: E-mail
- **phone**: Telefone
- **specialty**: Especialidade
- **crm**: Número do CRM
- **clinic**: Clínica/Consultório
- **address**: Endereço
- **bio**: Biografia
- **avatar_url**: URL da foto
- **created_at**: Data de criação
- **updated_at**: Data de atualização

### **Segurança (RLS):**
- ✅ Usuários só veem seu próprio perfil
- ✅ Usuários só podem editar seu próprio perfil
- ✅ Políticas de segurança configuradas

### **Storage:**
- ✅ Bucket `profile-images` para fotos
- ✅ Políticas de upload/visualização
- ✅ Estrutura de pastas por usuário

### **Funcionalidades Automáticas:**
- ✅ Trigger para atualizar `updated_at`
- ✅ Índices para performance
- ✅ Comentários de documentação

## ✅ **Após executar o SQL:**

1. **A página de perfil funcionará** com dados reais
2. **Upload de avatar** funcionará
3. **Alteração de senha** funcionará
4. **Dados serão salvos** no Supabase
5. **Segurança** estará configurada

## 🚨 **Importante:**

- Execute o SQL **apenas uma vez**
- Não execute novamente se a tabela já existir
- Verifique se não há erros no console do Supabase
- Teste a funcionalidade após executar

## 🔍 **Troubleshooting:**

Se houver erro:
1. Verifique se está no projeto correto
2. Confirme se tem permissões de admin
3. Verifique se o RLS está habilitado
4. Consulte os logs do Supabase

---

**Pronto!** Após executar este SQL, sua página de perfil estará totalmente funcional com o Supabase! 🎉
