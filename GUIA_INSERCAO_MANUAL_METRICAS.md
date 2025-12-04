# 📊 Guia Completo - Inserção Manual de Métricas

## 🎯 Objetivo

Este guia explica como configurar o sistema para permitir que múltiplos nutricionistas insiram dados manualmente nas métricas operacionais e comerciais, com isolamento total de dados por usuário.

---

## ✅ O que foi implementado

### 1. **Script SQL de Multi-Tenancy Completo**
- ✅ Adiciona `user_id` em todas as tabelas de métricas
- ✅ Cria triggers automáticos para garantir `user_id` em inserts
- ✅ Habilita RLS (Row Level Security) em todas as tabelas
- ✅ Garante isolamento total de dados por usuário

### 2. **Formulários de Inserção Manual**
- ✅ **Métricas Operacionais**: Formulário completo para inserir/editar dados mensais
- ✅ **Métricas Comerciais**: Formulários para leads, calls e vendas
- ✅ Cálculos automáticos de percentuais
- ✅ Validação de dados

### 3. **Gerenciador de Métricas**
- ✅ Visualização de todas as métricas do usuário
- ✅ Edição e exclusão de métricas
- ✅ Interface integrada na página de métricas

---

## 🚀 Passo a Passo de Implementação

### **ETAPA 1: Executar Script SQL de Multi-Tenancy** ⚠️ IMPORTANTE

**⚠️ ANTES DE TUDO: Faça backup do seu banco de dados!**

1. **Acesse o Supabase Dashboard**
2. **Vá para SQL Editor**
3. **Execute o script**: `sql/complete-multi-tenancy-metrics.sql`

Este script irá:
- ✅ Adicionar coluna `user_id` em todas as tabelas de métricas
- ✅ Criar triggers para garantir `user_id` automaticamente
- ✅ Habilitar RLS (Row Level Security)
- ✅ Criar políticas de segurança

**Tabelas afetadas:**
- `dashboard_dados` (Métricas Operacionais)
- `leads_que_entraram` (Leads diários)
- `Total de Leads` (Leads mensais)
- `Total de Calls Agendadas` (Calls)
- `Total de Vendas` (Vendas)
- `Total de Leads por Funil` (Leads por funil)
- `Total de Agendamentos por Funil` (Agendamentos por funil)

---

### **ETAPA 2: Migrar Seus Dados Existentes** ⚠️ CRÍTICO

**⚠️ IMPORTANTE: Execute este passo para vincular seus dados ao seu usuário!**

1. **Abra o arquivo**: `sql/migrate-existing-data-to-user.sql`
2. **Substitua TODAS as ocorrências de `'SEU_EMAIL_AQUI'` pelo seu email de login no Supabase**
3. **Execute o script no SQL Editor do Supabase**

Este script irá:
- ✅ Vincular todos os seus dados existentes ao seu `user_id`
- ✅ Garantir que você continue vendo todos os seus dados
- ✅ Proteger seus dados de outros usuários

**Exemplo:**
```sql
-- Antes:
user_email TEXT := 'SEU_EMAIL_AQUI';

-- Depois (substitua pelo seu email):
user_email TEXT := 'seuemail@exemplo.com';
```

---

### **ETAPA 3: Verificar Instalação**

Execute estas queries no SQL Editor para verificar:

```sql
-- Verificar se user_id foi adicionado em dashboard_dados
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dashboard_dados' AND column_name = 'user_id';

-- Verificar se RLS está ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('dashboard_dados', 'leads_que_entraram', 'Total de Leads');

-- Verificar seus dados migrados
SELECT COUNT(*) as total_metricas
FROM dashboard_dados
WHERE user_id = auth.uid();
```

---

## 📝 Como Usar os Formulários

### **Métricas Operacionais**

1. **Acesse a página de Métricas**: `/metrics`
2. **Role até o final da página**
3. **Na seção "Gerenciar Métricas Operacionais"**:
   - Clique em **"Adicionar Métrica"** para criar nova métrica
   - Clique no ícone de **editar** para editar uma métrica existente
   - Clique no ícone de **excluir** para remover uma métrica

4. **Preencha o formulário**:
   - **Ano**: Ano da métrica (ex: 2024)
   - **Mês**: Selecione o mês
   - **Pacientes Ativos no Início do Mês**: Número de pacientes ativos
   - **Novos Pacientes (Entraram)**: Quantidade de novos pacientes
   - **Pacientes que Saíram**: Quantidade de pacientes que saíram
   - **Vencimentos**: Quantidade de vencimentos do mês
   - **Não Renovou**: Quantidade que não renovou
   - **Desistências**: Quantidade de desistências
   - **Congelamentos**: Quantidade de congelamentos
   - **Taxa de Renovação (%)**: Será calculado automaticamente se deixado em branco
   - **Taxa de Churn (%)**: Será calculado automaticamente se deixado em branco

5. **Clique em "Salvar"**

### **Métricas Comerciais**

Os formulários de métricas comerciais podem ser adicionados na página de métricas comerciais. Por enquanto, você pode usar diretamente:

```typescript
import { CommercialMetricsForm } from '@/components/commercial-metrics/CommercialMetricsForm';

// Para Leads
<CommercialMetricsForm type="lead" onSuccess={handleRefresh} />

// Para Calls
<CommercialMetricsForm type="call" onSuccess={handleRefresh} />

// Para Vendas
<CommercialMetricsForm type="venda" onSuccess={handleRefresh} />
```

---

## 🔒 Segurança e Isolamento

### **Como Funciona o Isolamento**

1. **Row Level Security (RLS)**: Políticas no banco garantem que cada usuário só vê seus dados
2. **Triggers Automáticos**: Garantem que `user_id` seja sempre definido automaticamente
3. **Políticas de Acesso**: Cada tabela tem políticas específicas para SELECT, INSERT, UPDATE, DELETE

### **Exemplo de Política RLS**

```sql
CREATE POLICY "Users can only see their own dashboard data" ON dashboard_dados
    FOR SELECT USING (auth.uid() = user_id);
```

Isso significa: **"Usuários só podem ver dados onde `user_id` = seu próprio ID"**

### **Proteção dos Seus Dados**

- ✅ Seus dados existentes foram vinculados ao seu `user_id`
- ✅ RLS garante que outros usuários não vejam seus dados
- ✅ Você continua vendo todos os seus dados normalmente
- ✅ Novos usuários só veem seus próprios dados

---

## 🧪 Testando

### **Teste 1: Verificar seus dados**

1. Faça login com sua conta
2. Acesse `/metrics`
3. Verifique se todas as suas métricas aparecem
4. Tente adicionar uma nova métrica
5. Verifique se ela aparece na lista

### **Teste 2: Criar conta de teste**

1. Crie uma nova conta (email diferente)
2. Faça login com a nova conta
3. **Verifique que NÃO aparecem seus dados**
4. Crie uma métrica de teste na nova conta
5. Faça login novamente com sua conta
6. **Verifique que a métrica de teste NÃO aparece**

### **Teste 3: Isolamento**

1. Com sua conta, adicione uma métrica
2. Com conta de teste, tente acessar a mesma métrica
3. **Deve retornar erro ou não encontrar**

---

## 📊 Estrutura dos Dados

### **Tabela `dashboard_dados`**

```typescript
{
  id: number;
  user_id: UUID; // ✅ Adicionado automaticamente
  mes: string;
  ano: string;
  mes_numero: string;
  data_referencia: string;
  ativos_total_inicio_mes: string;
  entraram: string;
  sairam: string;
  vencimentos: string;
  nao_renovou: string;
  desistencia: string;
  congelamento: string;
  percentual_renovacao: string;
  percentual_churn: string;
}
```

### **Tabela `leads_que_entraram`**

```typescript
{
  id: number;
  user_id: UUID; // ✅ Adicionado automaticamente
  DATA: string;
  GOOGLE: number;
  GOOGLE_FORMS: number;
  INSTAGRAM: number;
  FACEBOOK: number;
  SELLER: number;
  INDICACAO: number;
  OUTROS: number;
  TOTAL: number;
}
```

---

## ⚠️ Pontos de Atenção

1. **Migração de Dados**: Certifique-se de executar o script de migração corretamente com seu email
2. **Backup**: Sempre faça backup antes de executar scripts SQL
3. **Testes**: Teste com conta de teste antes de liberar para outros usuários
4. **RLS**: Não desabilite RLS sem entender as consequências

---

## 🆘 Troubleshooting

### **Problema: Não consigo ver minhas métricas**

**Solução:**
1. Verifique se executou o script de migração
2. Verifique se seu email está correto no script
3. Execute: `SELECT user_id FROM dashboard_dados WHERE id = SEU_ID;`

### **Problema: Outros usuários veem meus dados**

**Solução:**
1. Verifique se RLS está ativo: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'dashboard_dados';`
2. Verifique se as políticas foram criadas: `SELECT * FROM pg_policies WHERE tablename = 'dashboard_dados';`

### **Problema: Erro ao inserir métrica**

**Solução:**
1. Verifique se está autenticado
2. Verifique se o trigger está criado: `SELECT * FROM pg_trigger WHERE tgname = 'set_user_id_dashboard_dados';`
3. Verifique os logs do console do navegador

---

## 📋 Checklist Final

- [ ] Backup do banco de dados feito
- [ ] Script `complete-multi-tenancy-metrics.sql` executado
- [ ] Script `migrate-existing-data-to-user.sql` executado com seu email
- [ ] Verificação de RLS feita
- [ ] Teste com sua conta feito
- [ ] Teste com conta de teste feito
- [ ] Formulários funcionando corretamente
- [ ] Isolamento de dados confirmado

---

## 🎉 Pronto!

Agora seu sistema está configurado para:
- ✅ Múltiplos usuários inserirem métricas manualmente
- ✅ Isolamento total de dados por usuário
- ✅ Proteção dos seus dados existentes
- ✅ Interface amigável para gerenciamento

**Seus dados estão protegidos e outros nutricionistas podem usar o sistema sem interferir nos seus dados!**

