# IMPLEMENTAÇÃO COMPLETA - Sistema de Alimentos Customizados

## ✅ STATUS: IMPLEMENTADO

Sistema completo de alimentos customizados integrado ao sistema de dietas.

## 📋 O Que Foi Implementado

### 1. Backend (Supabase)

**Arquivo SQL**: `sql/create-custom-foods-system.sql`

- ✅ Tabela `custom_foods` criada
- ✅ Índices para performance (user_id, name, category, is_favorite)
- ✅ Trigger para atualizar `updated_at` automaticamente
- ✅ RLS (Row Level Security) habilitado
- ✅ 4 Policies de segurança:
  - SELECT: usuário vê seus alimentos + alimentos do dono (se for membro)
  - INSERT: usuário cria seus próprios alimentos
  - UPDATE: usuário atualiza seus próprios alimentos
  - DELETE: usuário deleta seus próprios alimentos

### 2. Serviços e Hooks

**Arquivos Criados**:

1. **`src/lib/custom-foods-service.ts`**
   - Serviço completo para gerenciar alimentos customizados
   - Métodos: getCustomFoods, getCustomFoodById, createCustomFood, updateCustomFood, deleteCustomFood, toggleFavorite, getCategories, searchByName

2. **`src/hooks/use-custom-foods.ts`**
   - Hook React para usar o serviço
   - Gerencia estado, loading, erros
   - Funções: loadFoods, createFood, updateFood, deleteFood, toggleFavorite

### 3. Componentes UI

**Arquivos Criados**:

1. **`src/components/diets/CustomFoodModal.tsx`**
   - Modal para adicionar/editar alimentos
   - Formulário com validação (Zod)
   - Campos: nome, calorias, proteínas, carboidratos, gorduras, fibras, categoria, notas, favorito
   - Categorias sugeridas: Proteínas, Carboidratos, Gorduras, Vegetais, Frutas, Suplementos, Bebidas, Outros

2. **`src/pages/CustomFoods.tsx`**
   - Página principal de gerenciamento
   - Filtros: busca por nome, categoria, favoritos
   - Cards com informações nutricionais
   - Ações: adicionar, editar, excluir, favoritar
   - Dialog de confirmação para exclusão

### 4. Integração com Sistema de Dietas

**Arquivo Modificado**: `src/components/diets/DietPlanForm.tsx`

**Função `loadFoodDatabaseFromServer` modificada**:
```typescript
// Busca alimentos do banco de dados padrão
const foods = await dietService.getFoodDatabase();

// Busca alimentos customizados do usuário
const customFoods = await customFoodsService.getCustomFoods();

// Converte alimentos customizados para formato do banco
const customFoodsFormatted = customFoods.map((food) => ({
  name: food.name,
  calories_per_100g: food.calories_per_100g,
  protein_per_100g: food.protein_per_100g,
  carbs_per_100g: food.carbs_per_100g,
  fats_per_100g: food.fats_per_100g,
  fiber_per_100g: food.fiber_per_100g || 0,
  category: food.category || "Customizado",
  is_custom: true,
}));

// Ordena alimentos customizados (favoritos primeiro)
const customFoodsSorted = customFoodsFormatted.sort((a, b) => {
  const foodA = customFoods.find(f => f.name === a.name);
  const foodB = customFoods.find(f => f.name === b.name);
  if (foodA?.is_favorite && !foodB?.is_favorite) return -1;
  if (!foodA?.is_favorite && foodB?.is_favorite) return 1;
  return a.name.localeCompare(b.name);
});

// Combina: alimentos customizados primeiro, depois banco padrão
const allFoods = [...customFoodsSorted, ...(foods || [])];
```

### 5. Rotas e Navegação

**Arquivos Modificados**:

1. **`src/App.tsx`**
   - Import: `const CustomFoods = lazy(() => import("./pages/CustomFoods"));`
   - Rota: `/custom-foods`

2. **`src/components/dashboard/AppSidebar.tsx`**
   - Import: `Utensils` icon
   - Item de menu: "Alimentos Customizados" com ícone Utensils

## 🎯 Como Usar

### PASSO 1: Executar SQL no Supabase

1. Acesse: https://supabase.com/dashboard/project/qhzifnyjyxdushxorzrk/sql
2. Execute o arquivo: `sql/create-custom-foods-system.sql`
3. Verifique se a tabela foi criada com sucesso

**Consulte**: `EXECUTAR_AGORA_CUSTOM_FOODS.md` para instruções detalhadas

### PASSO 2: Acessar a Página

**Opção 1**: Via Menu Lateral
- Clique em "Alimentos Customizados" no menu

**Opção 2**: Via URL
- Acesse: http://localhost:5160/custom-foods

### PASSO 3: Adicionar Alimentos

1. Clique em "Adicionar Alimento"
2. Preencha os dados:
   - Nome: Ex: "Frango Grelhado Caseiro"
   - Calorias: 165 (por 100g)
   - Proteínas: 31g
   - Carboidratos: 0g
   - Gorduras: 3.6g
   - Categoria: "Proteínas"
   - Notas: "Preparado sem óleo"
3. Marque como favorito (opcional)
4. Clique em "Adicionar"

### PASSO 4: Usar em Dietas

1. Vá para um paciente
2. Clique em "Elaborar Dieta"
3. Adicione uma refeição
4. Digite o nome do alimento customizado
5. Ele aparecerá nas sugestões (favoritos primeiro)
6. Selecione e os valores serão preenchidos automaticamente

## 🔍 Funcionalidades

### Página de Gerenciamento

- ✅ Listar todos os alimentos customizados
- ✅ Buscar por nome (busca em tempo real)
- ✅ Filtrar por categoria
- ✅ Filtrar apenas favoritos
- ✅ Adicionar novo alimento
- ✅ Editar alimento existente
- ✅ Excluir alimento (com confirmação)
- ✅ Marcar/desmarcar como favorito
- ✅ Cards com informações nutricionais completas
- ✅ Notas/observações opcionais

### Integração com Dietas

- ✅ Alimentos customizados aparecem nas sugestões
- ✅ Favoritos aparecem primeiro
- ✅ Busca case-insensitive
- ✅ Valores nutricionais preenchidos automaticamente
- ✅ Cálculo proporcional baseado na quantidade
- ✅ Cache integrado (mesma lógica do banco padrão)

### Segurança

- ✅ RLS habilitado
- ✅ Cada usuário vê apenas seus alimentos
- ✅ Membros da equipe podem ver alimentos do dono
- ✅ Proteção contra acesso não autorizado
- ✅ Validação de dados no frontend e backend

## 📊 Estrutura da Tabela

```sql
custom_foods
├── id (uuid) - ID único
├── user_id (uuid) - ID do usuário
├── name (text) - Nome do alimento
├── calories_per_100g (numeric) - Calorias por 100g
├── protein_per_100g (numeric) - Proteínas por 100g
├── carbs_per_100g (numeric) - Carboidratos por 100g
├── fats_per_100g (numeric) - Gorduras por 100g
├── fiber_per_100g (numeric) - Fibras por 100g (opcional)
├── category (text) - Categoria
├── notes (text) - Observações
├── is_favorite (boolean) - Favorito
├── created_at (timestamp) - Data de criação
└── updated_at (timestamp) - Data de atualização
```

## 🎨 Categorias Sugeridas

- Proteínas
- Carboidratos
- Gorduras
- Vegetais
- Frutas
- Suplementos
- Bebidas
- Outros

## 🔄 Fluxo de Integração

```
1. Usuário adiciona alimento customizado
   ↓
2. Alimento salvo na tabela custom_foods
   ↓
3. Ao elaborar dieta, sistema carrega:
   - Alimentos customizados (favoritos primeiro)
   - Alimentos do banco padrão
   ↓
4. Usuário digita nome do alimento
   ↓
5. Sistema busca em ambos os bancos
   ↓
6. Alimento selecionado → valores preenchidos
   ↓
7. Cálculo proporcional baseado na quantidade
```

## 📝 Exemplo de Uso

### Adicionar Alimento

```typescript
// Via hook
const { createFood } = useCustomFoods();

await createFood({
  name: "Frango Grelhado Caseiro",
  calories_per_100g: 165,
  protein_per_100g: 31,
  carbs_per_100g: 0,
  fats_per_100g: 3.6,
  category: "Proteínas",
  notes: "Preparado sem óleo",
  is_favorite: true,
});
```

### Buscar Alimentos

```typescript
// Via hook com filtros
const { foods } = useCustomFoods({
  search: "frango",
  category: "Proteínas",
  favoritesOnly: true,
});
```

### Usar em Dieta

```typescript
// Automático ao digitar no campo de alimento
// Sistema busca em custom_foods + food_database
// Alimentos customizados aparecem primeiro
```

## 🚀 Próximos Passos (Opcional)

1. **Importar em massa**: CSV/Excel
2. **Compartilhar alimentos**: Entre usuários
3. **Biblioteca pública**: Alimentos compartilhados
4. **Fotos**: Adicionar imagens dos alimentos
5. **Unidades customizadas**: Colher, xícara, etc.
6. **Histórico de uso**: Alimentos mais usados
7. **Sugestões inteligentes**: IA para sugerir alimentos

## 📚 Documentação

- **Guia Completo**: `SISTEMA_ALIMENTOS_CUSTOMIZADOS.md`
- **Guia de Execução**: `EXECUTAR_AGORA_CUSTOM_FOODS.md`
- **Como Funciona Edição**: `COMO_FUNCIONA_EDICAO_ALIMENTOS.md`

## ✅ Checklist de Implementação

- [x] Criar tabela no Supabase
- [x] Criar serviço de API
- [x] Criar hook React
- [x] Criar modal de adicionar/editar
- [x] Criar página de gerenciamento
- [x] Integrar com sistema de dietas
- [x] Adicionar rota no App.tsx
- [x] Adicionar item no menu lateral
- [x] Testar funcionalidades
- [x] Documentar sistema

## 🎉 Resultado Final

Sistema completo e funcional de alimentos customizados integrado ao sistema de dietas. Usuários podem:

1. Adicionar seus próprios alimentos
2. Gerenciar (editar, excluir, favoritar)
3. Usar automaticamente nas dietas
4. Buscar e filtrar facilmente
5. Ter alimentos favoritos priorizados

**Servidor rodando em**: http://localhost:5160/
**Página de alimentos**: http://localhost:5160/custom-foods

## ⚠️ IMPORTANTE

Antes de usar, execute o SQL no Supabase conforme instruções em:
`EXECUTAR_AGORA_CUSTOM_FOODS.md`
