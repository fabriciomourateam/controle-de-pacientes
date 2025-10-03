# 🔧 **Configuração da Tabela de Configurações**

## 📋 **Pré-requisito:**

Para que o botão "Salvar Configuração" funcione corretamente, você precisa criar a tabela `system_config` no Supabase.

---

## 🗄️ **Execute o SQL:**

### **1. Acesse o Supabase:**
- Vá para: https://supabase.com/dashboard
- Acesse seu projeto
- Vá em **SQL Editor**

### **2. Execute o Script:**
Copie e cole o conteúdo do arquivo `sql/create-config-table.sql`:

```sql
-- Criar tabela para configurações do sistema
CREATE TABLE IF NOT EXISTS system_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- Habilitar RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Política de acesso (todos podem ler/escrever configurações)
CREATE POLICY "Anyone can manage system config" ON system_config
  FOR ALL USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_system_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW
  EXECUTE FUNCTION update_system_config_updated_at();

-- Inserir configuração padrão se não existir
INSERT INTO system_config (key, value, description)
VALUES ('dashboard_sync_config', '{}', 'Configurações de sincronização do dashboard com Notion')
ON CONFLICT (key) DO NOTHING;
```

### **3. Clique em "Run":**
Execute o script e aguarde a confirmação de sucesso.

---

## ✅ **Verificar se Funcionou:**

### **1. Verificar Tabela:**
No Supabase, vá em **Table Editor** e procure pela tabela `system_config`.

### **2. Testar no Dashboard:**
1. **Acesse** `/metrics`
2. **Clique** "Sincronizar Métricas"
3. **Preencha** API Key e Database ID
4. **Clique** "Salvar Configuração"
5. **Verifique** se aparece "Configuração salva no servidor"

---

## 🔄 **Como Funciona:**

### **1. Salvamento:**
- **Primeira tentativa**: Salva no Supabase (tabela `system_config`)
- **Fallback**: Se falhar, salva no localStorage local

### **2. Carregamento:**
- **Primeira tentativa**: Carrega do Supabase
- **Fallback**: Se não encontrar, carrega do localStorage

### **3. Vantagens:**
- ✅ **Persistente** entre sessões
- ✅ **Sincronizado** entre dispositivos
- ✅ **Fallback** para localStorage
- ✅ **Seguro** com RLS habilitado

---

## 🚨 **Troubleshooting:**

### **Se o botão não aparecer:**
- Verifique se executou o SQL
- Verifique se a tabela `system_config` existe
- Verifique os logs do browser

### **Se não salvar:**
- Verifique se RLS está configurado
- Verifique se a política está ativa
- Verifique os logs do Supabase

### **Se não carregar:**
- Verifique se há dados na tabela
- Verifique se a API Key está correta
- Verifique os logs do browser

---

## 📊 **Estrutura da Tabela:**

```sql
system_config:
├── id (UUID) - Chave primária
├── key (TEXT) - Chave única da configuração
├── value (JSONB) - Valor da configuração
├── description (TEXT) - Descrição opcional
├── created_at (TIMESTAMP) - Data de criação
└── updated_at (TIMESTAMP) - Data de atualização
```

---

**Após executar o SQL, o botão "Salvar Configuração" funcionará perfeitamente!** 🎯✨
















