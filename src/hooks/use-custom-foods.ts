import { useState, useEffect, useCallback } from "react";
import { customFoodsService, CustomFood, CreateCustomFoodInput, UpdateCustomFoodInput } from "@/lib/custom-foods-service";
import { useToast } from "@/hooks/use-toast";

interface UseCustomFoodsFilters {
  search?: string;
  category?: string;
  favoritesOnly?: boolean;
}

export function useCustomFoods(filters?: UseCustomFoodsFilters) {
  const { toast } = useToast();
  const [foods, setFoods] = useState<CustomFood[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Carregar alimentos
  const loadFoods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customFoodsService.getCustomFoods(filters);
      setFoods(data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: "Erro ao carregar alimentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Carregar categorias
  const loadCategories = useCallback(async () => {
    try {
      const data = await customFoodsService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  }, []);

  // Criar alimento
  const createFood = useCallback(async (input: CreateCustomFoodInput) => {
    try {
      const newFood = await customFoodsService.createCustomFood(input);
      setFoods((prev) => [...prev, newFood].sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: "Alimento criado",
        description: `${newFood.name} foi adicionado com sucesso.`,
      });
      return newFood;
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Erro ao criar alimento",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Atualizar alimento
  const updateFood = useCallback(async (input: UpdateCustomFoodInput) => {
    try {
      const updatedFood = await customFoodsService.updateCustomFood(input);
      setFoods((prev) =>
        prev.map((food) => (food.id === updatedFood.id ? updatedFood : food))
      );
      toast({
        title: "Alimento atualizado",
        description: `${updatedFood.name} foi atualizado com sucesso.`,
      });
      return updatedFood;
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Erro ao atualizar alimento",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Deletar alimento
  const deleteFood = useCallback(async (id: string) => {
    try {
      await customFoodsService.deleteCustomFood(id);
      setFoods((prev) => prev.filter((food) => food.id !== id));
      toast({
        title: "Alimento excluído",
        description: "O alimento foi removido com sucesso.",
      });
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Erro ao excluir alimento",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Alternar favorito
  const toggleFavorite = useCallback(async (id: string, isFavorite: boolean) => {
    try {
      await customFoodsService.toggleFavorite(id, isFavorite);
      setFoods((prev) =>
        prev.map((food) => (food.id === id ? { ...food, is_favorite: isFavorite } : food))
      );
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Erro ao atualizar favorito",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Carregar dados iniciais
  useEffect(() => {
    loadFoods();
    loadCategories();
  }, [loadFoods, loadCategories]);

  return {
    foods,
    categories,
    loading,
    error,
    loadFoods,
    createFood,
    updateFood,
    deleteFood,
    toggleFavorite,
  };
}
