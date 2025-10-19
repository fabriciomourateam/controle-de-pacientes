# 🔧 Instruções de Configuração - Sistema de Senhas

## 📋 Passo a Passo para Configurar no Supabase

### 1️⃣ **Acessar o Supabase**

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto `controle-de-pacientes`

### 2️⃣ **Popular a Tabela de Senhas**

A tabela `page_passwords` já existe! Você só precisa popular com as senhas:

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole o conteúdo do arquivo `popular-page-passwords.sql`
4. Clique em **Run** (ou pressione `Ctrl + Enter`)

### 3️⃣ **Verificar a Criação**

1. No menu lateral, clique em **Table Editor**
2. Procure pela tabela `page_passwords`
3. Verifique se existem 9 registros (um para cada seção)

Você deve ver algo assim:

| id | page_name | password_hash | is_active | description | created_at | updated_at |
|----|-----------|---------------|-----------|-------------|------------|------------|
| ... | Dashboard | Dashboard | true | Acesso à página... | ... | ... |
| ... | Pacientes | Pacientes | true | Acesso à gestão... | ... | ... |
| ... | Checkins | Checkins | true | Acesso aos check-ins | ... | ... |
| ... | Planos | Planos | true | Acesso aos planos | ... | ... |
| ... | Métricas Operacionais | Operacional | true | Acesso às métricas... | ... | ... |
| ... | Métricas Comerciais | Comercial | true | Acesso às métricas... | ... | ... |
| ... | Workspace | Workspace | true | Acesso ao workspace | ... | ... |
| ... | Bioimpedância | Bioimpedância | true | Acesso à bioimpedância | ... | ... |
| ... | Relatórios | Relatórios | true | Acesso aos relatórios | ... | ... |

### 4️⃣ **Testar o Sistema**

1. Recarregue sua aplicação
2. Tente acessar qualquer seção
3. Digite a senha correspondente
4. ✅ Acesso concedido!

---

## 🔐 Como Alterar Senhas

### Via SQL Editor (Recomendado)

```sql
-- Exemplo: Alterar senha do Dashboard
UPDATE page_passwords 
SET password_hash = 'MinhaNovasenhaSuperSegura123!', 
    updated_at = NOW()
WHERE page_name = 'Dashboard';

-- Verificar alteração
SELECT page_name, password_hash, is_active, description, updated_at 
FROM page_passwords 
WHERE page_name = 'Dashboard';
```

### Via Table Editor (Interface Visual)

1. Vá em **Table Editor** > `page_passwords`
2. Clique no registro que deseja editar
3. Altere o campo `password_hash`
4. Clique em **Save**

---

## 🛡️ Segurança

### Políticas de Segurança (RLS)

A tabela `page_passwords` tem **Row Level Security (RLS)** ativado com as seguintes políticas:

- ✅ **Leitura pública**: Qualquer um pode ler as senhas (necessário para autenticação)
- ❌ **Escrita pública**: NÃO é possível inserir/atualizar/deletar sem autenticação de admin

### Boas Práticas

1. **Use senhas fortes**: Combine letras, números e símbolos
2. **Não compartilhe**: Mantenha as senhas em local seguro
3. **Atualize regularmente**: Troque as senhas periodicamente
4. **Monitore acessos**: Verifique logs de acesso no Supabase

---

## ⚙️ Funcionalidades Avançadas

### Desativar Acesso a uma Seção

```sql
-- Desativar temporariamente uma seção
UPDATE page_passwords 
SET is_active = false 
WHERE page_name = 'Relatórios';
```

Quando `is_active = false`, o sistema usa o fallback local.

### Reativar Seção

```sql
UPDATE page_passwords 
SET is_active = true 
WHERE page_name = 'Relatórios';
```

### Adicionar Nova Seção

```sql
INSERT INTO page_passwords (page_name, password_hash, is_active, description)
VALUES ('Nova Seção', 'SenhaDaNovaSecao', true, 'Descrição da nova seção');
```

### Ver Histórico de Alterações

```sql
SELECT 
  page_name, 
  password_hash, 
  is_active,
  description,
  created_at AS criado_em,
  updated_at AS atualizado_em
FROM page_passwords
ORDER BY updated_at DESC;
```

---

## 🔄 Sistema de Fallback

Se houver qualquer problema ao buscar senhas do Supabase, o sistema automaticamente usa as senhas padrão hardcoded no código:

- Dashboard → `Dashboard`
- Pacientes → `Pacientes`
- Checkins → `Checkins`
- Planos → `Planos`
- Métricas Operacionais → `Operacional`
- Métricas Comerciais → `Comercial`
- Workspace → `Workspace`
- Bioimpedância → `Bioimpedância`
- Relatórios → `Relatórios`

Isso garante que o sistema continue funcionando mesmo se:
- O Supabase estiver offline
- Houver erro de rede
- A tabela ainda não foi criada

---

## 🆘 Troubleshooting

### Erro: "Table not found"

**Solução**: A tabela `page_passwords` já deve existir. Execute o script `popular-page-passwords.sql` no SQL Editor do Supabase.

### Erro: "Permission denied"

**Solução**: Verifique se as políticas RLS estão corretamente configuradas.

### Senha não funciona

**Soluções**:
1. Verifique se a senha está correta no Table Editor
2. Verifique se `ativo = true`
3. Limpe o cache do navegador (`Ctrl + Shift + Delete`)
4. Verifique o console do navegador para erros

### Sistema usa fallback mesmo com tabela criada

**Solução**: Abra o console do navegador (F12) e verifique se há erros ao buscar do Supabase.

---

## 📞 Suporte

Se precisar de ajuda, verifique:
- Console do navegador (F12)
- Logs do Supabase
- Documentação completa em `SENHAS_SISTEMA.md`

---

**Desenvolvido por:** FM Team  
**Data:** Outubro 2025  
**Versão:** 2.0.0 (Com integração Supabase)

