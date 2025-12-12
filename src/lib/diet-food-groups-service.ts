import { supabase } from '@/integrations/supabase/client';

export interface FoodGroup {
  id: string;
  name: string;
  description: string | null;
  is_favorite: boolean;
  usage_count: number;
  items: FoodGroupItem[];
}

export interface FoodGroupItem {
  id?: string;
  food_name: string;
  quantity: number;
  unit: string;
  item_order: number;
}

export const foodGroupsService = {
  /**
   * Busca todos os grupos do usuário
   */
  async getAll(): Promise<FoodGroup[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('food_groups')
      .select(`
        *,
        items:food_group_items (*)
      `)
      .eq('user_id', user.id)
      .order('is_favorite', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      is_favorite: group.is_favorite,
      usage_count: group.usage_count,
      items: (group.items || []).sort((a: any, b: any) => a.item_order - b.item_order),
    }));
  },

  /**
   * Busca grupo por ID
   */
  async getById(groupId: string): Promise<FoodGroup | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('food_groups')
      .select(`
        *,
        items:food_group_items (*)
      `)
      .eq('id', groupId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      is_favorite: data.is_favorite,
      usage_count: data.usage_count,
      items: (data.items || []).sort((a: any, b: any) => a.item_order - b.item_order),
    };
  },

  /**
   * Cria novo grupo
   */
  async create(
    name: string,
    description: string | null,
    items: FoodGroupItem[]
  ): Promise<FoodGroup> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Criar grupo
    const { data: group, error: groupError } = await supabase
      .from('food_groups')
      .insert({
        user_id: user.id,
        name,
        description,
        is_favorite: false,
        usage_count: 0,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Adicionar itens
    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        group_id: group.id,
        food_name: item.food_name,
        quantity: item.quantity,
        unit: item.unit,
        item_order: item.item_order,
      }));

      const { error: itemsError } = await supabase
        .from('food_group_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return await this.getById(group.id) as FoodGroup;
  },

  /**
   * Atualiza grupo
   */
  async update(
    groupId: string,
    updates: {
      name?: string;
      description?: string | null;
      is_favorite?: boolean;
    },
    items?: FoodGroupItem[]
  ): Promise<FoodGroup> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Atualizar grupo
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('food_groups')
        .update(updates)
        .eq('id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;
    }

    // Atualizar itens se fornecidos
    if (items !== undefined) {
      // Deletar itens antigos
      await supabase
        .from('food_group_items')
        .delete()
        .eq('group_id', groupId);

      // Inserir novos itens
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          group_id: groupId,
          food_name: item.food_name,
          quantity: item.quantity,
          unit: item.unit,
          item_order: item.item_order,
        }));

        const { error: itemsError } = await supabase
          .from('food_group_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }
    }

    return await this.getById(groupId) as FoodGroup;
  },

  /**
   * Deleta grupo
   */
  async delete(groupId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('food_groups')
      .delete()
      .eq('id', groupId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  /**
   * Adiciona grupo a uma refeição
   */
  async addGroupToMeal(
    groupId: string,
    mealId: string
  ): Promise<void> {
    const group = await this.getById(groupId);
    if (!group) throw new Error('Grupo não encontrado');

    // Incrementar contador de uso
    await supabase
      .from('food_groups')
      .update({ usage_count: (group.usage_count || 0) + 1 })
      .eq('id', groupId);

    // Buscar alimentos do banco TACO para calcular macros
    const foodNames = group.items.map(item => item.food_name);
    const { data: foods } = await supabase
      .from('food_database')
      .select('*')
      .in('name', foodNames)
      .eq('is_active', true);

    const foodsMap = new Map(foods?.map(f => [f.name, f]) || []);

    // Buscar ordem atual dos alimentos na refeição
    const { data: existingFoods } = await supabase
      .from('diet_foods')
      .select('food_order')
      .eq('meal_id', mealId)
      .order('food_order', { ascending: false })
      .limit(1);

    const nextOrder = existingFoods && existingFoods.length > 0
      ? (existingFoods[0].food_order || 0) + 1
      : 0;

    // Inserir alimentos na refeição
    const foodsToInsert = group.items.map((item, index) => {
      const food = foodsMap.get(item.food_name);
      const quantityInGrams = this.convertToGrams(item.quantity, item.unit);
      const multiplier = quantityInGrams / 100;

      return {
        meal_id: mealId,
        food_name: item.food_name,
        quantity: item.quantity,
        unit: item.unit,
        calories: food ? Math.round(food.calories_per_100g * multiplier) : null,
        protein: food ? Math.round(food.protein_per_100g * multiplier * 10) / 10 : null,
        carbs: food ? Math.round(food.carbs_per_100g * multiplier * 10) / 10 : null,
        fats: food ? Math.round(food.fats_per_100g * multiplier * 10) / 10 : null,
        notes: null,
        food_order: nextOrder + index,
      };
    });

    const { error } = await supabase
      .from('diet_foods')
      .insert(foodsToInsert);

    if (error) throw error;
  },

  /**
   * Converte quantidade para gramas
   */
  convertToGrams(quantity: number, unit: string): number {
    const unitLower = unit.toLowerCase().trim();
    
    if (unitLower === 'g' || unitLower === 'grama' || unitLower === 'gramas') {
      return quantity;
    }
    if (unitLower === 'kg' || unitLower === 'kilograma' || unitLower === 'kilogramas') {
      return quantity * 1000;
    }
    if (unitLower === 'unidade' || unitLower === 'unidades' || unitLower === 'un' || unitLower === 'und') {
      return quantity * 100;
    }
    if (unitLower.includes('colher')) {
      if (unitLower.includes('sopa')) {
        return quantity * 15;
      } else if (unitLower.includes('chá')) {
        return quantity * 5;
      }
    }
    if (unitLower.includes('xícara') || unitLower.includes('xicara')) {
      return quantity * 240;
    }
    if (unitLower === 'ml' || unitLower === 'mililitro' || unitLower === 'mililitros') {
      return quantity;
    }

    return quantity;
  },
};










