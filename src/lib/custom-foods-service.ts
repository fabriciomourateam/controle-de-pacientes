import { supabase } from "@/integrations/supabase/client";

export interface CustomFood {
  id: string;
  user_id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fiber_per_100g?: number;
  category?: string;
  notes?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomFoodInput {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fiber_per_100g?: number;
  category?: string;
  notes?: string;
  is_favorite?: boolean;
}

export interface UpdateCustomFoodInput extends Partial<CreateCustomFoodInput> {
  id: string;
}

class CustomFoodsService {
  /**
   * Buscar todos os alimentos customizados do usuário
   */
  async getCustomFoods(filters?: {
    search?: string;
    category?: string;
    favoritesOnly?: boolean;
  }): Promise<CustomFood[]> {
    try {
      let query = supabase
        .from("custom_foods")
        .select("*")
        .order("name", { ascending: true });

      // Filtro de busca por nome
      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      // Filtro por categoria
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      // Filtro de favoritos
      if (filters?.favoritesOnly) {
        query = query.eq("is_favorite", true);
      }

      const { data, error } = await query;

      // Se a tabela não existir (erro 404), retornar array vazio
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('404')) {
          console.warn("Tabela custom_foods não existe ainda. Execute o script SQL create-custom-foods-system.sql");
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar alimentos customizados:", error);
      // Retornar array vazio em caso de erro para não quebrar o sistema
      return [];
    }
  }

  /**
   * Buscar um alimento customizado por ID
   */
  async getCustomFoodById(id: string): Promise<CustomFood | null> {
    try {
      const { data, error } = await supabase
        .from("custom_foods")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao buscar alimento customizado:", error);
      throw error;
    }
  }

  /**
   * Criar novo alimento customizado
   */
  async createCustomFood(input: CreateCustomFoodInput): Promise<CustomFood> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("custom_foods")
        .insert({
          user_id: user.id,
          ...input,
          is_favorite: input.is_favorite || false,
        })
        .select()
        .single();

      if (error) {
        // Se a tabela não existir, mostrar mensagem mais clara
        if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('404')) {
          throw new Error("A tabela de alimentos personalizados não foi criada. Execute o script SQL: create-custom-foods-system.sql no Supabase");
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Erro ao criar alimento customizado:", error);
      throw error;
    }
  }

  /**
   * Atualizar alimento customizado
   */
  async updateCustomFood(input: UpdateCustomFoodInput): Promise<CustomFood> {
    try {
      const { id, ...updateData } = input;

      const { data, error } = await supabase
        .from("custom_foods")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao atualizar alimento customizado:", error);
      throw error;
    }
  }

  /**
   * Deletar alimento customizado
   */
  async deleteCustomFood(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("custom_foods")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao deletar alimento customizado:", error);
      throw error;
    }
  }

  /**
   * Alternar favorito
   */
  async toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from("custom_foods")
        .update({ is_favorite: isFavorite })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao alternar favorito:", error);
      throw error;
    }
  }

  /**
   * Buscar categorias únicas
   */
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("custom_foods")
        .select("category")
        .not("category", "is", null)
        .limit(1000);

      // Se a tabela não existir (erro 404), retornar array vazio
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('404')) {
          console.warn("Tabela custom_foods não existe ainda. Execute o script SQL create-custom-foods-system.sql");
          return [];
        }
        throw error;
      }

      // Extrair categorias únicas
      const categories = [...new Set(data?.map((item) => item.category) || [])].filter(Boolean) as string[];
      return categories.sort();
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      return [];
    }
  }

  /**
   * Buscar alimento por nome (para integração com sistema de dietas)
   */
  async searchByName(name: string): Promise<CustomFood | null> {
    try {
      const cleanName = name.trim();
      if (!cleanName) return null;

      // Primeiro, tentar busca exata (case-insensitive)
      try {
        const { data: exactData, error: exactError } = await supabase
          .from("custom_foods")
          .select("*")
          .ilike("name", cleanName)
          .limit(1)
          .maybeSingle();

        if (!exactError && exactData) {
          return exactData;
        }
      } catch (exactErr) {
        // Continuar para busca parcial se busca exata falhar
      }

      // Se não encontrou exato, tentar busca parcial (contém)
      try {
        const { data: partialData, error: partialError } = await supabase
          .from("custom_foods")
          .select("*")
          .ilike("name", `%${cleanName}%`)
          .limit(1)
          .maybeSingle();

        if (!partialError && partialData) {
          return partialData;
        }
      } catch (partialErr) {
        // Continuar para busca por primeira palavra se busca parcial falhar
      }

      // Se ainda não encontrou, tentar busca pela primeira palavra
      const firstWord = cleanName.split(' ')[0];
      if (firstWord && firstWord.length >= 3) {
        try {
          const { data: wordData, error: wordError } = await supabase
            .from("custom_foods")
            .select("*")
            .ilike("name", `${firstWord}%`)
            .limit(1)
            .maybeSingle();

          if (!wordError && wordData) {
            return wordData;
          }
        } catch (wordErr) {
          // Se todas as buscas falharem, retornar null
        }
      }

      return null;
    } catch (error) {
      console.error("Erro ao buscar alimento por nome:", error);
      return null;
    }
  }
}

export const customFoodsService = new CustomFoodsService();
