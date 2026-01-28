# Instruções para Criar a Tabela de Alimentos Personalizados

## Problema
Se você está vendo erros 404 ao tentar criar alimentos personalizados, significa que a tabela `custom_foods` não foi criada no banco de dados Supabase.

## Solução

### Passo 1: Acessar o Supabase
1. Acesse o painel do Supabase: https://supabase.com
2. Entre no seu projeto
3. Vá para **SQL Editor** (no menu lateral)

### Passo 2: Executar o Script SQL
1. Abra o arquivo `sql/create-custom-foods-system.sql` neste projeto
2. Copie todo o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 3: Verificar
Após executar o script, você deve ver mensagens de sucesso. A tabela `custom_foods` será criada com:
- Estrutura completa para armazenar alimentos personalizados
- Políticas de segurança (RLS) configuradas
- Índices para melhor performance
- Triggers para atualização automática

### O que o script cria:
- ✅ Tabela `custom_foods` com todos os campos necessários
- ✅ Políticas de segurança para que cada usuário veja apenas seus alimentos
- ✅ Suporte para membros de equipe verem alimentos do dono
- ✅ Índices para melhorar a performance das buscas

## Após criar a tabela
Depois de executar o script, recarregue a página e tente criar um alimento personalizado novamente. O sistema funcionará normalmente.
