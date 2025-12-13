# 📊 Script de Importação da Tabela TACO

Este script importa os dados da Tabela Brasileira de Composição de Alimentos (TACO) para o banco de dados do Supabase.

## 🚀 Como Usar

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (ou use as variáveis já configuradas):

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

**Onde encontrar a Service Role Key:**
1. Acesse o Supabase Dashboard
2. Vá em **Settings** > **API**
3. Copie a chave **service_role** (não a anon key!)

### 2. Executar o Script

```bash
npm run import-taco
```

O script irá:
- ✅ Baixar automaticamente os dados da Tabela TACO do GitHub
- ✅ Converter para o formato do banco de dados
- ✅ Importar todos os alimentos no Supabase

### 3. Verificar a Importação

Acesse o Supabase Dashboard e verifique a tabela `food_database`. Você deve ver centenas de alimentos importados!

## 📋 Pré-requisitos

- Tabela `food_database` criada no Supabase (execute o SQL em `sql/create-food-database-table.sql`)
- Variáveis de ambiente configuradas
- Conexão com a internet (para baixar os dados do GitHub)

## 🔄 Atualizar Dados

Para atualizar os dados, simplesmente execute o script novamente:

```bash
npm run import-taco
```

O script usa `upsert`, então alimentos existentes serão atualizados e novos serão adicionados.

## ❌ Resolução de Problemas

### Erro: "Variáveis de ambiente não configuradas"

**Solução:** Verifique se o arquivo `.env` existe e contém as variáveis necessárias.

### Erro: "Erro ao baixar dados"

**Solução:** Verifique sua conexão com a internet e se o repositório GitHub está acessível.

### Erro: "relation 'food_database' does not exist"

**Solução:** Execute o SQL em `sql/create-food-database-table.sql` no Supabase SQL Editor.















