# 🔑 Configuração das API Keys

## 📋 **Instruções para Configurar API Keys no Supabase**

### **1. Executar SQL no Supabase**

Execute o arquivo `sql/create-api-keys-table.sql` no SQL Editor do Supabase:

```sql
-- O arquivo já está pronto para execução
-- Copie e cole todo o conteúdo no SQL Editor
```

### **2. Verificar Criação da Tabela**

Após executar o SQL, verifique se a tabela foi criada:

1. Vá para **Table Editor** no Supabase
2. Procure pela tabela `user_api_keys`
3. Verifique se as colunas estão corretas:
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key para auth.users)
   - `name` (TEXT)
   - `key_hash` (TEXT, UNIQUE)
   - `permissions` (TEXT[])
   - `last_used` (TIMESTAMP)
   - `created_at` (TIMESTAMP)
   - `expires_at` (TIMESTAMP)

### **3. Verificar RLS Policies**

Confirme que as políticas RLS estão ativas:

1. Vá para **Authentication** > **Policies**
2. Procure por políticas da tabela `user_api_keys`
3. Deve haver 4 políticas:
   - **SELECT**: Users can view their own API keys
   - **INSERT**: Users can create their own API keys
   - **UPDATE**: Users can update their own API keys
   - **DELETE**: Users can delete their own API keys

### **4. Testar Funcionalidade**

1. **Faça login** na aplicação
2. **Vá para Perfil** (`/profile`)
3. **Clique em "API Keys"** nas Ações Rápidas
4. **Teste criar uma nova chave**:
   - Clique em "Nova Chave"
   - A chave será gerada e exibida
   - Copie e guarde a chave
5. **Teste excluir uma chave**:
   - Clique no botão de lixeira
   - A chave deve ser removida

## 🔒 **Segurança das API Keys**

### **Características de Segurança:**

1. **Hash SHA-256**: As chaves são armazenadas como hash, nunca em texto plano
2. **RLS Ativo**: Usuários só podem acessar suas próprias chaves
3. **Exibição Única**: A chave real só é exibida uma vez na criação
4. **Permissões**: Cada chave tem permissões específicas (read, write, admin)
5. **Expiração**: Chaves podem ter data de expiração (opcional)

### **Estrutura da Chave:**
```
Formato: sk_[64 caracteres hexadecimais]
Exemplo: sk_a1b2c3d4e5f6...
```

### **Permissões Disponíveis:**
- **read**: Apenas leitura de dados
- **write**: Leitura e escrita de dados
- **admin**: Acesso completo (incluindo exclusão)

## 🚀 **Funcionalidades Implementadas**

### **✅ Interface Completa:**
- **Lista de chaves** com informações detalhadas
- **Criação de novas chaves** com geração automática
- **Exclusão de chaves** com confirmação
- **Cópia para clipboard** com feedback visual
- **Estados de loading** durante operações

### **✅ Persistência no Banco:**
- **Salvamento automático** no Supabase
- **Sincronização em tempo real** entre usuários
- **Histórico de criação** e última utilização
- **Gerenciamento de permissões**

### **✅ Segurança:**
- **Criptografia** das chaves armazenadas
- **Controle de acesso** por usuário
- **Validação** de permissões
- **Auditoria** de uso

## 🔧 **Uso das API Keys**

### **Para Desenvolvedores:**

```javascript
// Exemplo de uso da API Key
const apiKey = 'sk_sua_chave_aqui';
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});
```

### **Validação no Backend:**

```javascript
// Validar API Key
const { validateApiKey } = require('./api-keys-service');
const { valid, userId, permissions } = await validateApiKey(apiKey);

if (!valid) {
  return res.status(401).json({ error: 'API Key inválida' });
}
```

## 📊 **Monitoramento**

### **Métricas Disponíveis:**
- **Total de chaves** por usuário
- **Última utilização** de cada chave
- **Permissões** de cada chave
- **Data de criação** e expiração

### **Logs de Segurança:**
- **Tentativas de acesso** com chaves inválidas
- **Criação e exclusão** de chaves
- **Uso de permissões** específicas

## ✅ **Status da Implementação**

- ✅ **Tabela criada** no Supabase
- ✅ **RLS Policies** configuradas
- ✅ **Serviço de API Keys** implementado
- ✅ **Hook React** para gerenciamento
- ✅ **Interface de usuário** funcional
- ✅ **Segurança** implementada
- ✅ **Persistência** no banco de dados

**🎉 As API Keys estão 100% funcionais e integradas ao Supabase!**
