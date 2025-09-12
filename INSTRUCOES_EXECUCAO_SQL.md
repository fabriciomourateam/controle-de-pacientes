# Instruções para Executar a Modificação da Tabela Checkin

## Passo 1: Executar o SQL no Supabase

Execute o seguinte SQL no editor SQL do Supabase (Dashboard > SQL Editor):

```sql
-- Modificar tabela checkin para aceitar TEXT em todos os campos
-- Isso permite que o N8N/Typebot envie qualquer formato de dados

-- Alterar campos numéricos para TEXT
ALTER TABLE checkin 
ALTER COLUMN peso TYPE TEXT,
ALTER COLUMN medida TYPE TEXT,
ALTER COLUMN pontos_treinos TYPE TEXT,
ALTER COLUMN pontos_cardios TYPE TEXT,
ALTER COLUMN pontos_descanso_entre_series TYPE TEXT,
ALTER COLUMN pontos_refeicao_livre TYPE TEXT,
ALTER COLUMN pontos_beliscos TYPE TEXT,
ALTER COLUMN pontos_agua TYPE TEXT,
ALTER COLUMN pontos_sono TYPE TEXT,
ALTER COLUMN pontos_qualidade_sono TYPE TEXT,
ALTER COLUMN pontos_stress TYPE TEXT,
ALTER COLUMN pontos_libido TYPE TEXT,
ALTER COLUMN total_pontuacao TYPE TEXT,
ALTER COLUMN percentual_aproveitamento TYPE TEXT;
```

## Passo 2: Verificar se a Modificação Funcionou

Após executar o SQL, teste enviando dados do Typebot/Sheets para o webhook:

**Endpoint:** `POST /api/n8n-webhook`

**Exemplo de dados que o Typebot pode enviar:**
```json
{
  "telefone": "11999999999",
  "mes_ano": "2024-01",
  "peso": "70.5",
  "pontos_treinos": "8",
  "treino": "Fiz 3 treinos esta semana",
  "cardio": "30 minutos por dia"
}
```

## O que Mudou

### Antes:
- Campos numéricos (peso, pontos, etc.) eram do tipo INTEGER/NUMERIC
- Aceitava apenas números válidos
- Strings como "null" causavam erro
- **ERRO**: Foreign key constraint - telefone deve existir na tabela patients

### Depois:
- Todos os campos são do tipo TEXT
- Aceita qualquer formato de dados
- Strings "null", números, texto - tudo funciona
- **NOVO**: Criação automática de paciente se não existir
- Mantém compatibilidade com o código existente

## Funcionalidades Adicionadas

### ✅ Criação Automática de Paciente
Se o telefone não existir na tabela `patients`, o sistema:
1. Cria automaticamente um paciente básico
2. Usa dados do checkin se disponíveis (nome, email, etc.)
3. Define valores padrão para campos obrigatórios
4. Adiciona observação indicando criação automática

### ✅ Logs Detalhados
O sistema agora mostra:
```
Paciente com telefone 11999999999 não encontrado. Criando paciente básico...
Paciente criado com ID: abc123-def456-ghi789
```

## Benefícios

✅ **Aceita qualquer formato do Typebot/Sheets**
✅ **Não quebra o código existente do site**
✅ **Resolve o erro "invalid input syntax for type integer"**
✅ **Resolve o erro de foreign key constraint**
✅ **Criação automática de pacientes**
✅ **Flexibilidade total para dados vindos do N8N**

## Verificação

Após executar o SQL, você pode testar enviando dados do Typebot para o webhook. Os logs mostrarão:

```
=== DADOS DE CHECKIN RECEBIDOS DO TYPEBOT/SHEETS ===
Raw body: { ... }
Body stringified: { ... }
==================================================

Paciente com telefone 11999999999 não encontrado. Criando paciente básico...
Paciente criado com ID: abc123-def456-ghi789
```

E os dados serão inseridos na tabela `checkin` sem erros de tipo ou foreign key!
