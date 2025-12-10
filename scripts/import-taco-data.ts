import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Carregar variáveis de ambiente (forçar override para pegar valores atualizados)
const result = dotenv.config({ override: true });

// Debug: verificar conteúdo do .env diretamente
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasServiceKey = envContent.includes('VITE_SUPABASE_SERVICE_ROLE_KEY');
  console.log('🔍 Arquivo .env encontrado:', envPath);
  console.log('🔍 Contém VITE_SUPABASE_SERVICE_ROLE_KEY:', hasServiceKey ? '✅ Sim' : '❌ Não');
}

if (result.error) {
  console.warn('⚠️ Aviso ao carregar .env:', result.error.message);
}

// Debug: mostrar variáveis carregadas (sem mostrar valores completos)
const envKeys = Object.keys(process.env).filter(key => 
  key.includes('SUPABASE') || key.includes('SERVICE')
);
console.log('🔍 Variáveis de ambiente encontradas:', envKeys.join(', '));

// Configurações - usar variáveis VITE_ ou variáveis de ambiente padrão
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Debug: verificar se as variáveis foram carregadas
console.log('🔍 SUPABASE_URL:', SUPABASE_URL ? '✅ Configurada' : '❌ Não encontrada');
console.log('🔍 SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✅ Configurada' : '❌ Não encontrada');

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
  id?: number;
  description?: string;
  nome?: string;
  name?: string;
  grupo?: string;
  category?: string;
  calorias?: number | string;
  proteinas?: number | string;
  gorduras?: number | string;
  carboidratos?: number | string;
  energy_kcal?: number | string;
  protein_g?: number | string;
  lipid_g?: number | string;
  carbohydrate_g?: number | string;
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
    
    // Debug: mostrar estrutura dos primeiros itens (apenas uma vez)
    if (data.length > 0 && process.env.DEBUG) {
      console.log('🔍 Estrutura do primeiro alimento:', JSON.stringify(data[0], null, 2).substring(0, 500));
    }
    
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
  // Tentar diferentes formatos de nome (a Tabela TACO usa 'description')
  const nome = tacoFood.description || tacoFood.nome || tacoFood.name || tacoFood.Description || tacoFood.Nome || tacoFood.Name || '';
  const grupo = tacoFood.category || tacoFood.grupo || tacoFood.Category || tacoFood.Grupo || 'Outros';
  
  if (!nome || nome.trim() === '') {
    return null;
  }

  // Tentar diferentes formatos de valores nutricionais
  // A Tabela TACO usa: energy_kcal, protein_g, lipid_g, carbohydrate_g
  const calorias = parseFloat(
    tacoFood.energy_kcal?.toString() ||
    tacoFood.calorias?.toString() || 
    tacoFood.Calorias?.toString() || 
    tacoFood.energia?.toString() ||
    tacoFood.Energia?.toString() ||
    '0'
  ) || 0;
  
  const proteinas = parseFloat(
    tacoFood.protein_g?.toString() ||
    tacoFood.proteinas?.toString() || 
    tacoFood.Proteinas?.toString() || 
    tacoFood.proteina?.toString() ||
    tacoFood.Proteina?.toString() ||
    '0'
  ) || 0;
  
  const gorduras = parseFloat(
    tacoFood.lipid_g?.toString() ||
    tacoFood.gorduras?.toString() || 
    tacoFood.Gorduras?.toString() || 
    tacoFood.lipideos?.toString() ||
    tacoFood.Lipideos?.toString() ||
    '0'
  ) || 0;
  
  const carboidratos = parseFloat(
    tacoFood.carbohydrate_g?.toString() ||
    tacoFood.carboidratos?.toString() || 
    tacoFood.Carboidratos?.toString() || 
    tacoFood.carboidrato?.toString() ||
    tacoFood.Carboidrato?.toString() ||
    '0'
  ) || 0;

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
    throw new Error(
      'Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias.\n' +
      'Configure no arquivo .env ou use as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log(`\n📤 Importando ${foods.length} alimentos para o Supabase...`);

  // Importar em lotes de 100 para evitar timeout
  const batchSize = 100;
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Coletar categorias únicas para debug
  const uniqueCategories = new Set<string>();
  foods.forEach(f => uniqueCategories.add(f.category));
  console.log(`\n📋 Categorias encontradas (${uniqueCategories.size}):`, Array.from(uniqueCategories).sort().join(', '));

  for (let i = 0; i < foods.length; i += batchSize) {
    const batch = foods.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('food_database')
        .upsert(batch, {
          onConflict: 'name',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error(`❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`, error.message);
        // Se for erro de constraint, mostrar categorias problemáticas
        if (error.message.includes('check constraint')) {
          const problematicCategories = new Set(batch.map(f => f.category));
          console.error(`   Categorias problemáticas:`, Array.from(problematicCategories).join(', '));
        }
        errors += batch.length;
      } else {
        imported += batch.length;
        console.log(`✅ Lote ${Math.floor(i / batchSize) + 1}: ${batch.length} alimentos processados`);
      }
    } catch (error: any) {
      console.error(`❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`, error.message);
      errors += batch.length;
    }
  }

  console.log(`\n📊 Resumo da importação:`);
  console.log(`   ✅ Importados/Atualizados: ${imported}`);
  console.log(`   ⏭️  Ignorados (duplicados): ${skipped}`);
  console.log(`   ❌ Erros: ${errors}`);
}

async function main() {
  try {
    console.log('🚀 Iniciando importação da Tabela TACO...\n');

    // Verificar variáveis de ambiente
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('\n❌ Erro: Variáveis de ambiente não configuradas!');
      console.error('\nConfigure no arquivo .env:');
      console.error('  VITE_SUPABASE_URL=sua_url_aqui');
      console.error('  VITE_SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui');
      console.error('\nOu exporte as variáveis antes de executar:');
      console.error('  export VITE_SUPABASE_URL="..."');
      console.error('  export VITE_SUPABASE_SERVICE_ROLE_KEY="..."');
      process.exit(1);
    }

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
    console.log('\n💡 Dica: Os alimentos já estão disponíveis no formulário de planos alimentares!');
  } catch (error: any) {
    console.error('\n❌ Erro na importação:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executar
main();

