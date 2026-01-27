# SISTEMA DE ALIMENTOS CUSTOMIZADOS

## Visão Geral

Sistema que permite adicionar alimentos personalizados ao banco de dados que ficam disponíveis para todas as dietas que você elaborar.

## Funcionalidades

### ✅ Adicionar Alimentos
- Nome do alimento
- Valores nutricionais por 100g (calorias, proteínas, carboidratos, gorduras)
- Categoria (Proteínas, Carboidratos, Gorduras, Vegetais, etc.)
- Notas/observações
- Marcar como favorito

### ✅ Editar Alimentos
- Atualizar qualquer informação do alimento
- Corrigir valores nutricionais

### ✅ Excluir Alimentos
- Remover alimentos que não usa mais

### ✅ Buscar Alimentos
- Busca por nome
- Filtrar por categoria
- Ver apenas favoritos

## Como Usar

### PASSO 1: Executar SQL no Supabase

1. Acesse o Supabase SQL Editor
2. Execute o arquivo: `sql/create-custom-foods-system.sql`
3. Verifique se a tabela foi criada com sucesso

### PASSO 2: Acessar a Página de Alimentos

**Opção 1: Via Menu Lateral**
- Clique em "Dietas" no menu
- Clique em "Gerenciar Alimentos"

**Opção 2: Via URL Direta**
- Acesse: `/alimentos-customizados`

### PASSO 3: Adicionar Alimentos

1. Clique no botão "Adicionar Alimento"
2. Preencha os campos:
   - **Nome**: Ex: "Frango Grelhado Caseiro"
   - **Calorias**: Ex: 165 (por 100g)
   - **Proteínas**: Ex: 31 (por 100g)
   - **Carboidratos**: Ex: 0 (por 100g)
   - **Gorduras**: Ex: 3.6 (por 100g)
   - **Categoria**: Ex: "Proteínas"
   - **Notas**: Ex: "Preparado sem óleo"
3. Clique em "Salvar"

### PASSO 4: Usar em Dietas

Quando elaborar uma dieta:
1. Digite o nome do alimento no campo
2. O sistema vai buscar automaticamente no banco (incluindo seus alimentos customizados)
3. Os valores nutricionais serão preenchidos automaticamente

## Estrutura da Tabela

```sql
custom_foods
├── id (uuid) - ID único do alimento
├── user_id (uuid) - ID do usuário que criou
├── name (text) - Nome do alimento
├── calories_per_100g (numeric) - Calorias por 100g
├── protein_per_100g (numeric) - Proteínas por 100g
├── carbs_per_100g (numeric) - Carboidratos por 100g
├── fats_per_100g (numeric) - Gorduras por 100g
├── fiber_per_100g (numeric) - Fibras por 100g (opcional)
├── category (text) - Categoria do alimento
├── notes (text) - Observações
├── is_favorite (boolean) - Marcado como favorito
├── created_at (timestamp) - Data de criação
└── updated_at (timestamp) - Data de atualização
```

## Categorias Sugeridas

- **Proteínas**: Carnes, peixes, ovos, laticínios
- **Carboidratos**: Arroz, batata, pães, massas
- **Gorduras**: Óleos, azeites, castanhas
- **Vegetais**: Verduras, legumes
- **Frutas**: Todas as frutas
- **Suplementos**: Whey, creatina, etc.
- **Bebidas**: Sucos, chás, etc.
- **Outros**: Alimentos que não se encaixam nas categorias acima

## Segurança (RLS)

### Policies Implementadas:

1. **SELECT**: Você pode ver seus próprios alimentos + alimentos do dono (se for membro da equipe)
2. **INSERT**: Você pode criar seus próprios alimentos
3. **UPDATE**: Você pode atualizar apenas seus próprios alimentos
4. **DELETE**: Você pode deletar apenas seus próprios alimentos

### Multi-Tenancy:
- Cada usuário tem seu próprio banco de alimentos
- Membros da equipe podem ver os alimentos do dono
- Alimentos não são compartilhados entre usuários diferentes

## Integração com Dietas

### Como o Sistema Busca Alimentos:

1. **Banco de dados padrão** (food_database)
2. **Alimentos customizados** (custom_foods) ← NOVO!
3. **Alimentos do n8n** (se configurado)

### Prioridade de Busca:

```
1. Alimentos customizados (seus alimentos personalizados)
2. Banco de dados padrão (TACO, USDA, etc.)
3. Alimentos do n8n (importados automaticamente)
```

## Exemplos de Uso

### Exemplo 1: Adicionar Receita Caseira

```
Nome: Bolo de Banana Fit
Calorias: 180 kcal/100g
Proteínas: 8g/100g
Carboidratos: 25g/100g
Gorduras: 5g/100g
Categoria: Outros
Notas: Receita com aveia, banana e whey
```

### Exemplo 2: Adicionar Alimento Específico

```
Nome: Frango Orgânico Grelhado
Calorias: 165 kcal/100g
Proteínas: 31g/100g
Carboidratos: 0g/100g
Gorduras: 3.6g/100g
Categoria: Proteínas
Notas: Frango orgânico da fazenda X
```

### Exemplo 3: Adicionar Suplemento

```
Nome: Whey Protein Isolado (Marca X)
Calorias: 380 kcal/100g
Proteínas: 90g/100g
Carboidratos: 5g/100g
Gorduras: 1g/100g
Categoria: Suplementos
Notas: Sabor chocolate
```

## Vantagens

✅ **Personalização**: Adicione alimentos específicos que você usa
✅ **Consistência**: Mesmos valores em todas as dietas
✅ **Rapidez**: Não precisa digitar valores toda vez
✅ **Organização**: Categorize seus alimentos
✅ **Favoritos**: Marque os mais usados
✅ **Segurança**: Seus alimentos são privados

## Próximos Passos

Após executar o SQL, você precisará:

1. ✅ Criar a página de gerenciamento de alimentos
2. ✅ Criar o componente de lista de alimentos
3. ✅ Criar o modal de adicionar/editar alimento
4. ✅ Integrar com o sistema de dietas existente
5. ✅ Adicionar busca e filtros

## Arquivos Criados

- `sql/create-custom-foods-system.sql` - SQL para criar a tabela e policies
- `SISTEMA_ALIMENTOS_CUSTOMIZADOS.md` - Esta documentação

## Arquivos a Criar

- `src/pages/CustomFoods.tsx` - Página de gerenciamento
- `src/components/diets/CustomFoodModal.tsx` - Modal de adicionar/editar
- `src/hooks/use-custom-foods.ts` - Hook para gerenciar alimentos
- `src/lib/custom-foods-service.ts` - Serviço de API

## Suporte

Se tiver dúvidas ou problemas:
1. Verifique se o SQL foi executado corretamente
2. Verifique as policies de RLS
3. Verifique se está autenticado
4. Verifique o console do navegador para erros
