# Correção: Edição Manual do Nome do Alimento

## Problema Identificado

Quando o usuário editava manualmente o nome de um alimento que já tinha valores nutricionais configurados, o sistema buscava automaticamente no banco de dados e sobrescrevia todos os valores (calorias, proteínas, carboidratos, gorduras).

### Comportamento Anterior (Incorreto)

1. Usuário adiciona "Frango grelhado" - 100g, 165 kcal
2. Usuário ajusta quantidade para 150g - sistema recalcula proporcionalmente: 247.5 kcal ✅
3. Usuário edita nome para "Frango grelhado temperado"
4. Sistema busca no banco de dados ao perder o foco (`onBlur`)
5. **Problema**: Sistema sobrescreve todos os valores com dados do banco (ou zera se não encontrar)

### Comportamento Esperado (Correto)

1. Usuário adiciona "Frango grelhado" - 100g, 165 kcal
2. Usuário ajusta quantidade para 150g - sistema recalcula proporcionalmente: 247.5 kcal ✅
3. Usuário edita nome para "Frango grelhado temperado"
4. **Correção**: Sistema mantém os valores nutricionais existentes ✅
5. Usuário pode clicar no botão "Buscar" se quiser buscar no banco

## Causa Raiz

No arquivo `DietPlanForm.tsx`, o campo `food_name` tinha um `onBlur` que sempre chamava `handleFoodSelect`:

```typescript
onBlur={() => {
  // Quando o usuário termina de editar, recalcular macros se necessário
  if (field.value) {
    handleFoodSelect(mealIndex, foodIndex, field.value);
  }
}}
```

A função `handleFoodSelect` busca o alimento no banco de dados e sobrescreve TODOS os valores:

```typescript
const handleFoodSelect = async (mealIndex: number, foodIndex: number, foodName: string) => {
  const selectedFood = foodDatabase.find((f) => f.name === foodName);
  if (selectedFood) {
    // ... sobrescreve calories, protein, carbs, fats
  }
};
```

## Solução Implementada

### 1. Removido `onBlur` do campo `food_name`

O campo `food_name` agora é completamente editável sem busca automática:

```typescript
<Input
  type="text"
  value={field.value || ""}
  onChange={(e) => {
    field.onChange(e.target.value);
  }}
  placeholder="Nome do alimento"
  // SEM onBlur - não busca automaticamente
/>
```

### 2. Adicionado Botão "Buscar no Banco"

Botão manual ao lado do campo `food_name` para busca quando necessário:

```typescript
<Button
  type="button"
  variant="ghost"
  size="sm"
  onClick={async () => {
    if (!field.value) {
      toast({
        title: "Nome vazio",
        description: "Digite o nome do alimento antes de buscar.",
        variant: "destructive",
      });
      return;
    }
    
    // Carregar banco se necessário
    if (!foodDatabaseLoaded) {
      await loadFoodDatabase();
    }
    
    // Buscar alimento no banco
    await handleFoodSelect(mealIndex, foodIndex, field.value);
    
    // Feedback visual
    const selectedFood = foodDatabase.find((f) => f.name === field.value);
    if (selectedFood) {
      toast({
        title: "Alimento encontrado",
        description: `Valores nutricionais de "${field.value}" foram preenchidos.`,
      });
    } else {
      toast({
        title: "Alimento não encontrado",
        description: `"${field.value}" não está no banco de dados.`,
        variant: "destructive",
      });
    }
  }}
  className="h-7 w-7 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
  title="Buscar alimento no banco de dados"
  disabled={!field.value}
>
  <Package className="w-3.5 h-3.5" />
</Button>
```

### 3. Corrigidas Permissões RLS

Criado SQL `fix-food-database-rls.sql` para corrigir erros de permissão:

**Erros corrigidos:**
- ❌ `food_database INSERT: 403 Forbidden` → ✅ Permitir INSERT para usuários autenticados
- ❌ `food_usage_stats: 406 Not Acceptable` → ✅ RLS por user_id
- ❌ `user_favorite_foods: 406 Not Acceptable` → ✅ RLS por user_id

## Cenários de Uso

### Cenário 1: Adicionar Novo Alimento do Banco
1. Usuário clica em "Adicionar Alimento"
2. Seleciona "Frango grelhado" do modal de seleção
3. Sistema preenche automaticamente: 165 kcal, 31g proteína, etc. ✅

### Cenário 2: Editar Nome com Valores Existentes (CORRIGIDO)
1. Alimento já tem valores: "Frango grelhado" - 150g, 247.5 kcal
2. Usuário edita nome para "Frango grelhado temperado"
3. Sistema **mantém** os valores: 247.5 kcal ✅
4. Não busca no banco automaticamente

### Cenário 3: Buscar Manualmente no Banco (NOVO)
1. Usuário digita "Arroz integral" no campo
2. Clica no botão "Buscar" (ícone de pacote)
3. Sistema busca no banco e preenche valores ✅
4. Toast confirma se encontrou ou não

### Cenário 4: Ajustar Quantidade (Funciona como antes)
1. Alimento: "Frango grelhado" - 100g, 165 kcal
2. Usuário muda quantidade para 200g
3. Sistema recalcula proporcionalmente: 330 kcal ✅
4. Função `recalculateFoodMacros` continua funcionando normalmente

### Cenário 5: Cadastrar Novo Alimento (CORRIGIDO)
1. Usuário digita nome de alimento não cadastrado
2. Clica em "Buscar" → Sistema informa que não encontrou
3. Usuário pode preencher valores manualmente
4. Sistema permite salvar (após correção RLS) ✅

## Arquivos Modificados

### 1. `src/components/diets/DietPlanForm.tsx`

**Linha**: ~3103-3160 (aproximadamente)

**Mudanças:**
- ❌ Removido `onBlur` do campo `food_name`
- ✅ Adicionado botão "Buscar no Banco" com ícone `Package`
- ✅ Feedback visual com toast ao buscar
- ✅ Validação de campo vazio antes de buscar

### 2. `sql/fix-food-database-rls.sql` (NOVO)

**Conteúdo:**
- Corrige permissões RLS de `food_database` (permite INSERT)
- Corrige permissões RLS de `food_usage_stats` (erro 406)
- Corrige permissões RLS de `user_favorite_foods` (erro 406)
- Verificações de segurança e logs informativos

## Benefícios

### Para o Usuário
- ✅ Pode editar livremente o nome do alimento sem perder valores
- ✅ Pode personalizar nomes (ex: "Frango grelhado com alho")
- ✅ Valores ajustados manualmente são preservados
- ✅ Controle explícito sobre quando buscar no banco
- ✅ Feedback visual claro ao buscar
- ✅ Pode cadastrar novos alimentos (após correção RLS)

### Para o Sistema
- ✅ Mantém funcionalidade de busca quando necessário
- ✅ Preserva cálculos proporcionais ao ajustar quantidade
- ✅ Não quebra fluxo existente de adicionar alimentos
- ✅ Lógica mais intuitiva e previsível
- ✅ Menos chamadas desnecessárias ao banco
- ✅ Permissões RLS corrigidas

## Testes Recomendados

### Teste 1: Editar Nome com Valores
1. Adicionar "Frango grelhado" do banco (165 kcal)
2. Ajustar quantidade para 150g (247.5 kcal)
3. Editar nome para "Frango temperado"
4. ✅ Verificar que mantém 247.5 kcal

### Teste 2: Buscar Manualmente
1. Digitar "Arroz integral" em campo vazio
2. Clicar no botão "Buscar" (ícone de pacote)
3. ✅ Verificar que preenche valores do banco
4. ✅ Verificar toast de confirmação

### Teste 3: Alimento Não Encontrado
1. Digitar "Alimento Inexistente"
2. Clicar em "Buscar"
3. ✅ Verificar toast informando que não encontrou
4. ✅ Verificar que não quebra

### Teste 4: Ajustar Quantidade
1. Alimento com 100g, 200 kcal
2. Mudar para 50g
3. ✅ Verificar que recalcula para 100 kcal

### Teste 5: Cadastrar Novo Alimento (Após SQL)
1. Executar `fix-food-database-rls.sql` no Supabase
2. Tentar cadastrar novo alimento
3. ✅ Verificar que não há erro 403
4. ✅ Verificar que não há erro 406 em stats/favorites

### Teste 6: Botão Desabilitado
1. Campo food_name vazio
2. ✅ Verificar que botão "Buscar" está desabilitado
3. Digitar nome
4. ✅ Verificar que botão fica habilitado

## Próximos Passos

### 1. Executar SQL de Correção RLS
```bash
# No Supabase SQL Editor:
# Executar: controle-de-pacientes/sql/fix-food-database-rls.sql
```

### 2. Testar Fluxo Completo
- Editar nome de alimento existente
- Buscar alimento manualmente
- Cadastrar novo alimento
- Verificar que não há erros no console

### 3. Validar Permissões
- Verificar que INSERT funciona em `food_database`
- Verificar que não há erro 406 em `food_usage_stats`
- Verificar que não há erro 406 em `user_favorite_foods`

## Compatibilidade

- ✅ Não quebra funcionalidade existente
- ✅ Mantém busca quando necessário (via botão)
- ✅ Preserva cálculo proporcional de quantidade
- ✅ Compatível com todos os fluxos de adição de alimentos
- ✅ Melhora UX com controle explícito

## Observações Técnicas

### Por que Botão Manual é Melhor?

1. **Controle do Usuário**: Usuário decide quando buscar
2. **Preserva Valores**: Não sobrescreve acidentalmente
3. **Feedback Claro**: Toast informa resultado da busca
4. **Menos Chamadas**: Só busca quando necessário
5. **Mais Intuitivo**: Ação explícita vs. automática

### Por que Não Usar Debounce no onBlur?

- Usuário pode querer apenas editar o nome
- Debounce ainda causaria busca indesejada
- Botão manual dá controle total

### Ícone Escolhido

- `Package`: Representa "buscar no banco/estoque"
- Cor azul: Indica ação de busca/informação
- Tamanho pequeno: Não ocupa muito espaço
- Tooltip: Explica função claramente

## Conclusão

A correção resolve o problema de forma elegante e intuitiva:

- **Preserva valores existentes** quando o usuário edita o nome
- **Permite busca manual** quando necessário via botão
- **Corrige permissões RLS** para cadastro de alimentos
- **Não quebra funcionalidade** existente
- **Melhora experiência** do usuário com controle explícito
- **Feedback visual** claro em todas as ações

O sistema agora é mais intuitivo, seguro e respeita as intenções do usuário ao editar nomes de alimentos.
