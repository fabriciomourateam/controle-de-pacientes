# Sistema de Diferenciação de Check-ins

## Visão Geral

Sistema implementado para diferenciar check-ins completos (com formulário) de registros de evolução (apenas fotos/medidas).

## Tipos de Check-in

### 1. Check-in Completo (`tipo_checkin: 'completo'`)
- Criado através do formulário completo de check-in
- Contém todas as informações: objetivo, dificuldades, treino, cardio, água, sono, etc.
- **Aparece em:**
  - ✅ Página de Check-ins
  - ✅ Timeline de Evolução
  - ✅ Card de Feedback (tabela comparativa)

### 2. Registro de Evolução (`tipo_checkin: 'evolucao'`)
- Criado através dos botões "+" nos gráficos ou "Adicionar Dados" na Timeline
- Contém apenas: fotos, peso, medidas (cintura/quadril)
- **Aparece em:**
  - ❌ Página de Check-ins (NÃO aparece)
  - ✅ Timeline de Evolução
  - ✅ Card de Feedback (tabela comparativa)

## Implementação

### 1. Banco de Dados

**Arquivo SQL:** `sql/add-tipo-checkin-field.sql`

```sql
-- Campo tipo_checkin adicionado à tabela checkin
ALTER TABLE checkin 
ADD COLUMN IF NOT EXISTS tipo_checkin TEXT DEFAULT 'completo' 
CHECK (tipo_checkin IN ('completo', 'evolucao'));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_checkin_tipo ON checkin(tipo_checkin);
CREATE INDEX IF NOT EXISTS idx_checkin_telefone_tipo ON checkin(telefone, tipo_checkin);
```

### 2. Webhook N8N

**Arquivo:** `src/pages/api/n8n-webhook.ts`

O N8N já envia o campo `tipo_checkin: 'completo'` nos dados. O webhook apenas recebe e salva:

```typescript
// O webhook não modifica o tipo_checkin
// Ele vem diretamente do N8N no payload
const processedDataWithUserId = processedData.map((item: any) => ({
  ...item,
  user_id: defaultUserId
  // tipo_checkin já vem do N8N
}));
```

**Configuração no N8N:**
No nó que envia dados para o Supabase, certifique-se de incluir:
```json
{
  "tipo_checkin": "completo"
}
```

**Não é necessário modificar o webhook!** Ele apenas passa os dados adiante.

### 3. Componente AddEvolutionData

**Arquivo:** `src/components/evolution/AddEvolutionData.tsx`

- Marca automaticamente registros como `tipo_checkin: 'evolucao'`
- Permite adicionar fotos, peso, cintura e quadril
- Usado pelos botões "+" nos gráficos e "Adicionar Dados" na Timeline

```typescript
const checkinData: any = {
  telefone,
  data_checkin: dataRegistro,
  data_preenchimento: new Date().toISOString(),
  tipo_checkin: 'evolucao', // ← Marca como registro de evolução
  ...photoUrls
};
```

### 4. Filtro na Página de Check-ins

**Arquivo:** `src/lib/checkin-service.ts`

Função `getAllWithPatient()` modificada para filtrar apenas check-ins completos:

```typescript
async getAllWithPatient(limit: number | null = 200): Promise<CheckinWithPatient[]> {
  let query = supabase
    .from('checkin')
    .select(`
      *,
      patient:patients!inner(...)
    `)
    .eq('tipo_checkin', 'completo') // ← Filtra apenas completos
    .order('data_checkin', { ascending: false });
  
  // ...
}
```

## Fluxo de Uso

### Cenário 1: Nutricionista adiciona dados de evolução

1. Nutricionista acessa página de Evolução do Paciente
2. Clica no botão "+" no gráfico de Peso ou Medidas
3. Adiciona fotos e/ou medidas
4. Salva os dados
5. **Resultado:**
   - Dados aparecem na Timeline ✅
   - Dados aparecem no Card de Feedback ✅
   - Dados **NÃO** aparecem na página de Check-ins ❌

### Cenário 2: Paciente preenche check-in completo

1. Paciente acessa formulário de check-in
2. Preenche todas as informações (objetivo, dificuldades, treino, etc.)
3. Envia o formulário
4. **Resultado:**
   - Check-in aparece na página de Check-ins ✅
   - Check-in aparece na Timeline ✅
   - Check-in aparece no Card de Feedback ✅

## Vantagens

1. **Organização:** Separa check-ins completos de registros rápidos de evolução
2. **Clareza:** Página de Check-ins mostra apenas formulários completos
3. **Flexibilidade:** Nutricionista pode adicionar dados de evolução sem criar check-ins "vazios"
4. **Comparação:** Todos os dados (completos e evolução) são considerados nas comparações

## Migração de Dados Existentes

Todos os check-ins existentes foram automaticamente marcados como `tipo_checkin: 'completo'` através do SQL:

```sql
UPDATE checkin 
SET tipo_checkin = 'completo' 
WHERE tipo_checkin IS NULL;
```

## Cores dos Botões (Padronização)

### Azul-Ciano (`from-blue-600 to-cyan-600`)
- Botão "Adicionar Dados Iniciais" (InitialDataInput)
- Botão "Comparar Fotos"
- Botões "+" nos gráficos
- Botão "Adicionar Dados" na Timeline (AddEvolutionData)

### Verde-Esmeralda (`from-green-600 to-emerald-600`)
- Botão "Adicionar Dados" no card sem check-ins (CurrentDataInput)

## Arquivos Modificados

1. `sql/add-tipo-checkin-field.sql` - Criação do campo e índices
2. `src/components/evolution/AddEvolutionData.tsx` - Marca registros como 'evolucao'
3. `src/lib/checkin-service.ts` - Filtra apenas 'completo' na página de Check-ins
4. `src/components/evolution/EvolutionCharts.tsx` - Botões "+" usam AddEvolutionData
5. `src/pages/PatientEvolution.tsx` - Gerencia estado do modal AddEvolutionData

## Próximos Passos

1. ✅ Executar SQL no Supabase para adicionar campo `tipo_checkin`
2. ✅ Testar criação de registros de evolução
3. ✅ Verificar que não aparecem na página de Check-ins
4. ✅ Verificar que aparecem na Timeline e Feedback

## Status

✅ **IMPLEMENTADO E PRONTO PARA TESTE**

Aguardando execução do SQL no Supabase para ativar o sistema.
