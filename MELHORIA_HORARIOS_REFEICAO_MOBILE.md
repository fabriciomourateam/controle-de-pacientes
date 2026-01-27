# Melhoria: Intervalo de Horários e Responsividade Mobile

## Problema Identificado

1. **Campo de nome da refeição não visível em mobile** - O campo onde se digita o nome da refeição ficava oculto ou cortado em telas pequenas
2. **Apenas um campo de horário** - Sistema tinha apenas um campo para horário sugerido, sem possibilidade de definir intervalo

## Solução Implementada

### 1. Intervalo de Horários (Horário Inicial e Final)

Agora é possível definir um intervalo de horários para cada refeição:

**Antes:**
```
09:00 REFEIÇÃO 01
```

**Depois:**
```
08:00 - 09:00 REFEIÇÃO 01
```

#### Campos Adicionados

- `start_time` (TEXT) - Horário inicial da refeição
- `end_time` (TEXT) - Horário final da refeição
- `suggested_time` (mantido para compatibilidade)

#### Migração de Dados

O SQL `add-meal-time-range.sql` migra automaticamente os dados existentes:
- Valores de `suggested_time` são copiados para `start_time`
- `end_time` fica vazio para ser preenchido pelo usuário

### 2. Layout Responsivo para Mobile

#### Desktop (≥ 768px)
- Todos os elementos em uma linha
- Drag handle + Horários + Nome + Macros + Botões
- Macros sempre visíveis

#### Mobile (< 768px)
- Layout adaptativo com quebra de linha
- Drag handle + Horários na primeira linha
- Nome da refeição ocupa linha inteira (w-full)
- Macros ocultos em telas muito pequenas (hidden sm:flex)
- Botões de ação sempre visíveis

#### Classes Tailwind Aplicadas

```tsx
// Container principal - permite wrap em mobile
<div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 flex-wrap md:flex-nowrap">

// Campos de horário - tamanhos responsivos
<Input className="h-7 w-14 md:w-16 text-xs ..." />

// Nome da refeição - ocupa linha inteira em mobile
<FormItem className="flex-1 min-w-0 w-full md:w-auto">

// Macros - ocultos em mobile pequeno
<div className="hidden sm:flex items-center gap-2 md:gap-3 ...">
```

### 3. Interface dos Campos de Horário

#### Horário Inicial
- Placeholder: "08:00"
- Largura: 14 (mobile) / 16 (desktop)
- Texto centralizado
- Sem borda (integrado ao card)

#### Separador
- Hífen (-) entre os campos
- Cor cinza suave
- Fonte pequena

#### Horário Final
- Placeholder: "09:00"
- Mesmas características do inicial

## Arquivos Modificados

### 1. SQL - Estrutura do Banco
**Arquivo:** `sql/add-meal-time-range.sql`
- Adiciona campos `start_time` e `end_time`
- Migra dados de `suggested_time` para `start_time`

### 2. Schema do Formulário
**Arquivo:** `src/components/diets/DietPlanForm.tsx`
- Atualizado `dietPlanSchema` com novos campos
- Adicionado `start_time` e `end_time` no schema Zod

### 3. Interface TypeScript
**Arquivo:** `src/lib/diet-meal-favorites-service.ts`
- Atualizada interface `FavoriteMeal`
- Adicionados campos opcionais `start_time` e `end_time`

### 4. Componente de Formulário
**Arquivo:** `src/components/diets/DietPlanForm.tsx`

#### Renderização dos Campos
- Substituído campo único por container com dois campos
- Adicionado separador visual entre horários
- Layout responsivo com classes Tailwind

#### Carregamento de Dados
- Atualizado para carregar `start_time` e `end_time`
- Mantida compatibilidade com `suggested_time`

#### Salvamento de Dados
- Incluído `start_time` e `end_time` ao salvar refeições
- Atualizado em templates e favoritos

## Como Usar

### Para o Usuário

1. **Definir Intervalo de Horário:**
   - Clique no primeiro campo e digite o horário inicial (ex: 08:00)
   - Clique no segundo campo e digite o horário final (ex: 09:00)
   - O sistema exibirá: `08:00 - 09:00 REFEIÇÃO 01`

2. **Editar Nome da Refeição:**
   - Em mobile: campo ocupa linha inteira, fácil de clicar
   - Em desktop: campo ao lado dos horários
   - Digite o nome desejado (ex: "Café da Manhã")

3. **Visualizar em Mobile:**
   - Horários e nome ficam sempre visíveis
   - Macros aparecem ao expandir a refeição
   - Interface otimizada para toque

### Para Desenvolvedores

#### Executar SQL de Migração

```sql
-- No Supabase SQL Editor
\i sql/add-meal-time-range.sql
```

Ou executar manualmente:

```sql
ALTER TABLE diet_meals ADD COLUMN start_time TEXT;
ALTER TABLE diet_meals ADD COLUMN end_time TEXT;

UPDATE diet_meals
SET start_time = suggested_time::TEXT
WHERE suggested_time IS NOT NULL AND start_time IS NULL;
```

#### Acessar Campos no Código

```typescript
// Obter valores
const startTime = form.watch(`meals.${index}.start_time`);
const endTime = form.watch(`meals.${index}.end_time`);

// Definir valores
form.setValue(`meals.${index}.start_time`, "08:00");
form.setValue(`meals.${index}.end_time`, "09:00");
```

## Compatibilidade

### Retrocompatibilidade
- ✅ Planos antigos continuam funcionando
- ✅ Campo `suggested_time` mantido
- ✅ Dados migrados automaticamente

### Novos Planos
- ✅ Podem usar intervalo de horários
- ✅ Podem deixar campos vazios
- ✅ Podem usar apenas horário inicial

## Testes Recomendados

### Mobile
- [ ] Abrir formulário em tela < 640px
- [ ] Verificar se nome da refeição está visível
- [ ] Testar edição dos campos de horário
- [ ] Testar edição do nome da refeição
- [ ] Verificar se botões de ação estão acessíveis

### Desktop
- [ ] Verificar layout em linha
- [ ] Testar edição de todos os campos
- [ ] Verificar se macros estão visíveis
- [ ] Testar drag and drop

### Funcionalidade
- [ ] Criar nova refeição com intervalo
- [ ] Salvar e recarregar plano
- [ ] Adicionar refeição aos favoritos
- [ ] Carregar refeição dos favoritos
- [ ] Usar template com horários

## Benefícios

### Para Nutricionistas
- ✅ Maior flexibilidade para definir horários
- ✅ Interface mobile funcional e usável
- ✅ Campos sempre visíveis e acessíveis
- ✅ Melhor experiência em dispositivos móveis

### Para Pacientes
- ✅ Entendimento claro do intervalo de horário
- ✅ Exemplo: "Café da manhã entre 08:00 e 09:00"
- ✅ Mais flexibilidade na rotina

### Técnicos
- ✅ Código responsivo e manutenível
- ✅ Compatibilidade com dados existentes
- ✅ Estrutura preparada para futuras melhorias

## Próximas Melhorias Possíveis

1. **Validação de Horários**
   - Verificar se horário final > horário inicial
   - Alertar sobre sobreposição de refeições

2. **Formatação Automática**
   - Auto-completar formato HH:MM
   - Validar formato de entrada

3. **Sugestões Inteligentes**
   - Sugerir horário final baseado no inicial
   - Sugerir intervalos típicos por tipo de refeição

4. **Visualização no Portal do Paciente**
   - Exibir intervalo de horários
   - Destacar refeição atual baseada no horário

## Conclusão

A implementação resolve os dois problemas principais:
1. ✅ Campo de nome visível e editável em mobile
2. ✅ Possibilidade de definir intervalo de horários

O sistema agora oferece uma experiência mobile completa e funcional, mantendo total compatibilidade com dados existentes.
