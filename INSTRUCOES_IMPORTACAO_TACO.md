
É possível integrar a Tabela TACO. A plataforma já tem uma tabela `food_database` no Supabase. Segue um plano para importar os dados da Tabela TACO.

## Plano de integração da Tabela TACO

### 1. Estrutura atual
- Tabela `food_database` no Supabase com campos:
  - `name`, `category`
  - `calories_per_100g`, `protein_per_100g`, `carbs_per_100g`, `fats_per_100g`
  - `common_units` (JSON), `is_active`

### 2. Solução proposta

Criar um script de importação que:
1. Baixa os dados da Tabela TACO do GitHub
2. Converte para o formato da tabela `food_database`
3. Importa no Supabase

Aqui estão os arquivos necessários:

**1. Script SQL para criar/verificar a tabela `food_database`:**

```sql:sql/create-food-database-table.sql
-- Criar tabela food_database se não existir
CREATE TABLE IF NOT EXISTS food_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  calories_per_100g NUMERIC(8, 2) NOT NULL,
  protein_per_100g NUMERIC(8, 2) DEFAULT 0,
  carbs_per_100g NUMERIC(8, 2) DEFAULT 0,
  fats_per_100g NUMERIC(8, 2) DEFAULT 0,
  common_units JSONB DEFAULT '["g", "kg", "unidade", "colher de sopa", "colher de chá", "xícara"]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar duplicatas
  CONSTRAINT unique_food_name UNIQUE (name)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_food_database_name ON food_database(name);
CREATE INDEX IF NOT EXISTS idx_food_database_category ON food_database(category);
CREATE INDEX IF NOT EXISTS idx_food_database_active ON food_database(is_active) WHERE is_active = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_food_database_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_food_database_updated_at
BEFORE UPDATE ON food_database
FOR EACH ROW
EXECUTE FUNCTION update_food_database_updated_at();

-- Comentários
COMMENT ON TABLE food_database IS 'Banco de dados de alimentos baseado na Tabela TACO';
COMMENT ON COLUMN food_database.name IS 'Nome do alimento';
COMMENT ON COLUMN food_database.category IS 'Categoria do alimento (ex: Cereais e derivados)';
COMMENT ON COLUMN food_database.calories_per_100g IS 'Calorias por 100g';
COMMENT ON COLUMN food_database.protein_per_100g IS 'Proteínas por 100g';
COMMENT ON COLUMN food_database.carbs_per_100g IS 'Carboidratos por 100g';
COMMENT ON COLUMN food_database.fats_per_100g IS 'Gorduras por 100g';
```

**2. Script Node.js para importar os dados da Tabela TACO:**

```typescript:scripts/import-taco-data.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configurações
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Mapeamento de categorias TACO para categorias do sistema
const categoryMapping: Record<string, string> = {
  'Cereais e derivados': 'Cereais e derivados',
  'Verduras, hortaliças e derivados': 'Verduras e hortaliças',
  'Frutas e derivados': 'Frutas',
  'Gorduras e óleos': 'Gorduras e óleos',
  'Pescados e frutos do mar': 'Pescados e frutos do mar',
  'Carnes e derivados': 'Carnes e derivados',
  'Leite e derivados': 'Leite e derivados',
  'Bebidas (alcoólicas e não alcoólicas)': 'Bebidas',
  'Ovos e derivados': 'Ovos e derivados',
  'Produtos açucarados': 'Produtos açucarados',
  'Miscelâneas': 'Miscelâneas',
  'Outros alimentos industrializados': 'Industrializados',
  'Alimentos preparados': 'Alimentos preparados',
  'Leguminosas e derivados': 'Leguminosas',
  'Nozes e sementes': 'Nozes e sementes',
};

interface TacoFood {
  nome?: string;
  grupo?: string;
  calorias?: number;
  proteinas?: number;
  gorduras?: number;
  carboidratos?: number;
  [key: string]: any;
}

interface FoodDatabase {
  name: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  common_units?: any;
  is_active: boolean;
}

async function downloadTacoData(): Promise<TacoFood[]> {
  console.log('📥 Baixando dados da Tabela TACO...');
  
  const url = 'https://raw.githubusercontent.com/marcelosanto/tabela_taco/main/tabela_alimentos.json';
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao baixar: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // A estrutura pode variar, vamos verificar
    if (data.alimentos && Array.isArray(data.alimentos)) {
      return data.alimentos;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      throw new Error('Formato de dados não reconhecido');
    }
  } catch (error) {
    console.error('❌ Erro ao baixar dados:', error);
    throw error;
  }
}

function convertTacoToFoodDatabase(tacoFood: TacoFood): FoodDatabase | null {
  const nome = tacoFood.nome || tacoFood.name;
  const grupo = tacoFood.grupo || tacoFood.category || 'Outros';
  
  if (!nome) {
    return null;
  }

  // Converter valores nutricionais
  const calorias = parseFloat(tacoFood.calorias?.toString() || '0') || 0;
  const proteinas = parseFloat(tacoFood.proteinas?.toString() || '0') || 0;
  const gorduras = parseFloat(tacoFood.gorduras?.toString() || '0') || 0;
  const carboidratos = parseFloat(tacoFood.carboidratos?.toString() || '0') || 0;

  // Mapear categoria
  const category = categoryMapping[grupo] || grupo;

  return {
    name: nome.trim(),
    category: category,
    calories_per_100g: Math.round(calorias * 100) / 100,
    protein_per_100g: Math.round(proteinas * 100) / 100,
    carbs_per_100g: Math.round(carboidratos * 100) / 100,
    fats_per_100g: Math.round(gorduras * 100) / 100,
    common_units: ['g', 'kg', 'unidade', 'colher de sopa', 'colher de chá', 'xícara'],
    is_active: true,
  };
}

async function importToSupabase(foods: FoodDatabase[]) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log(`\n📤 Importando ${foods.length} alimentos para o Supabase...`);

  // Importar em lotes de 100 para evitar timeout
  const batchSize = 100;
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < foods.length; i += batchSize) {
    const batch = foods.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('food_database')
      .upsert(batch, {
        onConflict: 'name',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error(`❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`, error.message);
      errors += batch.length;
    } else {
      imported += batch.length;
      console.log(`✅ Lote ${Math.floor(i / batchSize) + 1}: ${batch.length} alimentos processados`);
    }
  }

  console.log(`\n📊 Resumo da importação:`);
  console.log(`   ✅ Importados: ${imported}`);
  console.log(`   ⏭️  Ignorados (duplicados): ${skipped}`);
  console.log(`   ❌ Erros: ${errors}`);
}

async function main() {
  try {
    console.log('🚀 Iniciando importação da Tabela TACO...\n');

    // 1. Baixar dados
    const tacoData = await downloadTacoData();
    console.log(`✅ ${tacoData.length} alimentos encontrados na Tabela TACO\n`);

    // 2. Converter para formato do banco
    const foods: FoodDatabase[] = [];
    for (const tacoFood of tacoData) {
      const food = convertTacoToFoodDatabase(tacoFood);
      if (food) {
        foods.push(food);
      }
    }

    console.log(`✅ ${foods.length} alimentos convertidos com sucesso\n`);

    // 3. Importar para Supabase
    await importToSupabase(foods);

    console.log('\n🎉 Importação concluída com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro na importação:', error);
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  main();
}

export { downloadTacoData, convertTacoToFoodDatabase, importToSupabase };
```

**3. Script npm para facilitar a execução:**

Adicione ao `package.json`:

```json
{
  "scripts": {
    "import-taco": "tsx scripts/import-taco-data.ts"
  }
}
```

**4. Instruções de uso:**

```markdown:INSTRUCOES_IMPORTACAO_TACO.md
# 📊 Importação da Tabela TACO

## Pré-requisitos

1. Instalar dependências:
npm install @supabase/supabase-js tsx
2. Configurar variáveis de ambiente:
   - `VITE_SUPABASE_URL`: URL do seu projeto Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase (encontre em Settings > API)

## Passos para Importação

### 1. Criar a tabela no Supabase

Execute o SQL em `sql/create-food-database-table.sql` no Supabase SQL Editor.

### 2. Executar o script de importação
ash
npm run import-tacoO script irá:
- ✅ Baixar os dados da Tabela TACO do GitHub
- ✅ Converter para o formato do banco de dados
- ✅ Importar todos os alimentos no Supabase

### 3. Verificar a importação

Acesse o Supabase Dashboard e verifique a tabela `food_database`. Você deve ver centenas de alimentos importados!

## Estrutura dos Dados

Os alimentos da Tabela TACO serão convertidos para:
- **Nome**: Nome do alimento
- **Categoria**: Grupo/categoria do alimento
- **Calorias por 100g**: Valor calórico
- **Proteínas por 100g**: Proteínas
- **Carboidratos por 100g**: Carboidratos
- **Gorduras por 100g**: Gorduras

## Uso no Sistema

Após a importação, os alimentos estarão disponíveis automaticamente no formulário de planos alimentares:
1. Vá em "Planos Alimentares" de um paciente
2. Clique em "Criar Novo Plano Alimentar"
3. Ao adicionar um alimento, use o dropdown "Ou selecione do banco de alimentos"
4. Os valores nutricionais serão preenchidos automaticamente!

## Atualização dos Dados

Para atualizar os dados, simplesmente execute o script novamente:
npm run import-tacoO script usa `upsert`, então alimentos existentes serão atualizados e novos serão adicionados.
```

### Próximos passos

1. Criar a tabela no Supabase (se ainda não existir)
2. Instalar as dependências necessárias
3. Executar o script de importação
4. Testar no formulário de planos alimentares

Quer que eu crie esses arquivos no projeto ou prefere fazer manualmente? Posso também ajustar o script conforme a estrutura exata do JSON da Tabela TACO.















