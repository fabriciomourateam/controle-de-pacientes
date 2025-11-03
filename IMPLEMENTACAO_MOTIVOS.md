# Implementação: Cancelamentos e Congelamentos com Motivos

## 📋 O que foi feito

Criei uma nova seção na página de Retenção que exibe:
- **Cancelamentos Recentes** (últimos 90 dias) com motivo
- **Congelamentos Recentes** (últimos 90 dias) com motivo

## 🎯 Componente Criado

**`src/components/retention/RecentCancellationsAndFreezes.tsx`**

Este componente:
- Busca pacientes com status CANCELADO ou CONGELADO
- Exibe cards organizados por tipo (cancelamento em vermelho, congelamento em cyan)
- Mostra: nome, plano, data e motivo
- Ordenação por data (mais recente primeiro)

## 🗄️ Campos Necessários no Banco

Para funcionar completamente, você precisa adicionar 2 campos na tabela `patients`:

### Executar no Supabase SQL Editor:

```sql
-- Adicionar campos de motivo
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS motivo_congelamento TEXT;
```

**Ou execute o arquivo:** `sql/add_motivo_fields.sql`

## 📝 Como Preencher os Motivos

Você tem algumas opções:

### Opção 1: Adicionar campo no formulário de edição de paciente

No componente onde você edita o status do paciente, adicione:

```tsx
{status === 'CANCELADO' && (
  <div>
    <Label>Motivo do Cancelamento</Label>
    <Textarea 
      value={motivoCancelamento}
      onChange={(e) => setMotivoCancelamento(e.target.value)}
      placeholder="Ex: Mudou de cidade, questões financeiras, insatisfação com resultados..."
    />
  </div>
)}

{status === 'CONGELADO' && (
  <div>
    <Label>Motivo do Congelamento</Label>
    <Textarea 
      value={motivoCongelamento}
      onChange={(e) => setMotivoCongelamento(e.target.value)}
      placeholder="Ex: Viagem, problemas de saúde, questões pessoais..."
    />
  </div>
)}
```

### Opção 2: Criar modal específico para cancelamento/congelamento

Criar um modal dedicado que aparece quando você muda o status para CANCELADO ou CONGELADO, solicitando:
- Data do cancelamento/congelamento
- Motivo (campo obrigatório)

### Opção 3: Preencher manualmente via Supabase

Enquanto não implementa o formulário, você pode preencher manualmente:

```sql
UPDATE patients 
SET motivo_cancelamento = 'Mudou de cidade'
WHERE id = 'id-do-paciente';
```

## 🎨 Visual

### Cancelamentos
- Card vermelho com ícone XCircle
- Avatar com inicial do nome
- Badge com o plano
- Data formatada em português
- Motivo em destaque

### Congelamentos
- Card cyan com ícone Snowflake
- Avatar com inicial do nome
- Badge com o plano
- Data formatada em português
- Motivo em destaque

## 📊 Benefícios

1. **Análise de Padrões**: Identificar os motivos mais comuns de cancelamento/congelamento
2. **Ações Preventivas**: Criar estratégias baseadas nos motivos recorrentes
3. **Histórico**: Manter registro do que aconteceu com cada aluno
4. **Insights**: Entender se há problemas sistêmicos (ex: muitos cancelamentos por "preço alto")

## 🚀 Próximos Passos Sugeridos

1. **Executar o SQL** para adicionar os campos no banco
2. **Adicionar campo no formulário** de edição de paciente
3. **Tornar obrigatório** o preenchimento do motivo ao cancelar/congelar
4. **Criar análise de motivos**: gráfico mostrando os motivos mais comuns
5. **Adicionar filtros**: filtrar por período, motivo específico, etc.

## 💡 Dica

Você pode criar uma lista de motivos pré-definidos (dropdown) para facilitar:
- Questões financeiras
- Mudança de cidade
- Insatisfação com resultados
- Problemas de saúde
- Falta de tempo
- Outro (campo livre)

Isso facilita a análise posterior dos dados!
