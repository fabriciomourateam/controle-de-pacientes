# COMO FUNCIONA: Edição de Alimentos e Cálculo de Macros

## Comportamento Atual (Correto)

### Quando você MUDA O NOME do alimento:
- ✅ Os macros **permanecem os mesmos**
- ✅ Os valores estão **vinculados à quantidade**, não ao nome
- ✅ Você pode editar o nome livremente sem perder os valores

**Exemplo:**
```
1. Alimento: "Arroz integral" | 100g | 360 kcal
2. Você muda para: "Arroz" | 100g | 360 kcal (macros mantidos)
3. Você muda quantidade: "Arroz" | 200g | 720 kcal (recalcula proporcionalmente)
```

### Quando você MUDA A QUANTIDADE:
- ✅ Os macros **recalculam automaticamente**
- ✅ Recalcula proporcionalmente aos valores originais
- ✅ Funciona em tempo real (onChange)

**Exemplo:**
```
1. Alimento: "Frango" | 100g | 165 kcal, 31g proteína
2. Você muda para: "Frango" | 150g | 248 kcal, 46.5g proteína (recalcula)
3. Você muda para: "Frango" | 200g | 330 kcal, 62g proteína (recalcula)
```

---

## Como os Macros São Calculados

### Caso 1: Alimento está no Banco de Dados
Se o nome do alimento **existe no banco** (busca case-insensitive):
- Usa os valores do banco (por 100g)
- Multiplica pela quantidade atual
- Exemplo: "Arroz integral" no banco = 360 kcal/100g
  - 100g = 360 kcal
  - 150g = 540 kcal
  - 200g = 720 kcal

### Caso 2: Alimento NÃO está no Banco
Se o nome do alimento **não existe no banco** (ex: alimento do n8n ou customizado):
- Armazena os macros originais na primeira vez
- Recalcula proporcionalmente baseado nos macros originais
- Exemplo: "Frango grelhado caseiro" (não está no banco)
  - Valores originais: 100g = 165 kcal, 31g proteína
  - Sistema armazena: 1.65 kcal/g, 0.31g proteína/g
  - 150g = 248 kcal, 46.5g proteína (recalcula)
  - 200g = 330 kcal, 62g proteína (recalcula)

---

## Fluxo de Trabalho Recomendado

### Para editar apenas o NOME (sem mudar macros):
1. Clique no campo "Nome do alimento"
2. Digite o novo nome
3. Pressione Enter ou clique fora
4. ✅ Macros permanecem os mesmos

### Para editar NOME e BUSCAR no banco:
1. Clique no campo "Nome do alimento"
2. Digite o nome exato do alimento que está no banco
3. Clique no campo "Quantidade"
4. Mude a quantidade (ex: de 100 para 101)
5. Volte para 100
6. ✅ Sistema busca no banco e atualiza os macros

### Para editar QUANTIDADE (recalcula macros):
1. Clique no campo "Quantidade"
2. Digite a nova quantidade
3. ✅ Macros recalculam automaticamente em tempo real

---

## Casos de Uso

### Caso 1: Ajustar nome sem perder valores
**Situação**: Alimento veio do n8n com nome "Arroz integral cozido 100g"
**Objetivo**: Simplificar para "Arroz integral"

**Passos:**
1. Clique no nome
2. Mude para "Arroz integral"
3. ✅ Macros permanecem os mesmos (165 kcal, 31g proteína)

---

### Caso 2: Mudar quantidade e recalcular
**Situação**: Alimento tem 100g mas você quer 150g
**Objetivo**: Recalcular macros para 150g

**Passos:**
1. Clique na quantidade
2. Mude de 100 para 150
3. ✅ Macros recalculam automaticamente (248 kcal, 46.5g proteína)

---

### Caso 3: Buscar alimento no banco
**Situação**: Você digitou "Frango" mas quer os valores do banco
**Objetivo**: Buscar "Frango grelhado" no banco

**Passos:**
1. Clique no nome
2. Digite "Frango grelhado" (nome exato do banco)
3. Clique na quantidade
4. Mude para 101 e volte para 100
5. ✅ Sistema busca no banco e atualiza os macros

---

## Armazenamento de Macros Originais

O sistema armazena os macros originais em memória (não no banco) para poder recalcular proporcionalmente:

```typescript
// Exemplo de armazenamento
originalQuantitiesRef.current.set("0_0", 100); // mealIndex_foodIndex
originalMacrosRef.current.set("0_0", {
  calories: 165,
  protein: 31,
  carbs: 0,
  fats: 3.6
});

// Quando você muda a quantidade para 150g:
const macrosPerUnit = {
  calories: 165 / 100 = 1.65 kcal/g,
  protein: 31 / 100 = 0.31g/g,
  carbs: 0 / 100 = 0g/g,
  fats: 3.6 / 100 = 0.036g/g
};

// Novos macros para 150g:
calories = 1.65 * 150 = 248 kcal
protein = 0.31 * 150 = 46.5g
carbs = 0 * 150 = 0g
fats = 0.036 * 150 = 5.4g
```

---

## Perguntas Frequentes

### P: Por que os macros não mudam quando eu mudo o nome?
**R**: Porque os macros estão vinculados à **quantidade**, não ao nome. Isso permite que você edite o nome livremente sem perder os valores nutricionais.

### P: Como faço para buscar um alimento no banco?
**R**: Digite o nome exato do alimento e mude a quantidade (ex: de 100 para 101 e volte para 100). O sistema vai buscar no banco e atualizar os macros.

### P: Os macros recalculam em tempo real?
**R**: Sim! Quando você muda a quantidade, os macros recalculam imediatamente (onChange).

### P: O que acontece se eu mudar o nome para um alimento que não está no banco?
**R**: Os macros permanecem os mesmos. O sistema armazena os macros originais e recalcula proporcionalmente quando você mudar a quantidade.

### P: Posso ter dois alimentos com o mesmo nome mas quantidades diferentes?
**R**: Sim! Cada alimento é independente. Você pode ter "Arroz 100g" e "Arroz 150g" na mesma refeição.

---

## Código Relevante

### Campo de Nome (linha ~3103)
```typescript
<Input
  type="text"
  value={field.value || ""}
  onChange={(e) => {
    field.onChange(e.target.value);
    // NÃO chama recalculateFoodMacros aqui
    // Permite edição livre do nome
  }}
  placeholder="Nome do alimento"
  title="Edite o nome livremente. Os valores nutricionais são vinculados à quantidade."
/>
```

### Campo de Quantidade (linha ~3140)
```typescript
<Input
  type="number"
  onChange={(e) => {
    const value = parseFloat(e.target.value) || 0;
    field.onChange(value);
    // ✅ Chama recalculateFoodMacros aqui
    recalculateFoodMacros(mealIndex, foodIndex);
  }}
  onBlur={(e) => {
    // Garantir atualização final ao sair do campo
    const value = parseFloat(e.target.value) || 0;
    field.onChange(value);
    recalculateFoodMacros(mealIndex, foodIndex);
  }}
/>
```

### Função recalculateFoodMacros (linha ~784)
```typescript
const recalculateFoodMacros = (mealIndex: number, foodIndex: number) => {
  // 1. Busca no banco de dados
  const selectedFood = foodDatabase.find((f) => 
    f.name.toLowerCase() === foodName.toLowerCase()
  );

  if (selectedFood) {
    // Alimento encontrado no banco
    // Recalcula baseado nos valores do banco
  } else {
    // Alimento não está no banco
    // Recalcula proporcionalmente baseado nos macros originais
  }
};
```

---

## Resumo

✅ **Nome do alimento**: Editável livremente, não afeta macros
✅ **Quantidade**: Recalcula macros automaticamente em tempo real
✅ **Macros**: Vinculados à quantidade, não ao nome
✅ **Banco de dados**: Busca automática se o nome existir no banco
✅ **Alimentos customizados**: Recalcula proporcionalmente aos valores originais
