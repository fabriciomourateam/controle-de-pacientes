import { supabase } from "@/integrations/supabase/client";

export interface UserFoodMeasure {
    id: string;
    user_id: string;
    food_name: string;
    unit_name: string;
    gram_weight: number;
    created_at: string;
    updated_at: string;
}

export interface SaveUserFoodMeasureInput {
    food_name: string;
    unit_name: string;
    gram_weight: number;
}

class UserFoodMeasuresService {
    /**
     * Fetch all custom measures for the current authenticated user.
     */
    async getUserFoodMeasures(): Promise<UserFoodMeasure[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from("user_food_measures" as any)
                .select("*")
                .eq("user_id", user.id);

            if (error) {
                if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('404')) {
                    return []; // Table not created yet
                }
                throw error;
            }

            return (data as unknown) as UserFoodMeasure[] || [];
        } catch (error) {
            console.error("Error fetching user food measures:", error);
            return [];
        }
    }

    /**
     * Save or update a custom measure for a specific food and unit.
     */
    async saveUserFoodMeasure(input: SaveUserFoodMeasureInput): Promise<UserFoodMeasure | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            // Verify if it already exists to update it, or insert new
            // Since we have a UNIQUE constraint on (user_id, food_name, unit_name), we can use upsert
            // But Supabase JS upsert needs the unique conflict columns specified or it infers from PK

            const { data: existing } = await supabase
                .from("user_food_measures" as any)
                .select("id")
                .eq("user_id", user.id)
                .eq("food_name", input.food_name)
                .eq("unit_name", input.unit_name)
                .maybeSingle();

            if (existing) {
                // Update
                const { data, error } = await supabase
                    .from("user_food_measures" as any)
                    .update({
                        gram_weight: input.gram_weight,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", existing.id)
                    .select()
                    .single();

                if (error) throw error;
                return data as UserFoodMeasure;
            } else {
                // Insert
                const { data, error } = await supabase
                    .from("user_food_measures" as any)
                    .insert({
                        user_id: user.id,
                        food_name: input.food_name,
                        unit_name: input.unit_name,
                        gram_weight: input.gram_weight
                    })
                    .select()
                    .single();

                if (error) throw error;
                return (data as unknown) as UserFoodMeasure;
            }
        } catch (error) {
            console.error("Error saving user food measure:", error);
            return null;
        }
    }
    /**
     * Delete a custom measure for a specific food and unit.
     */
    async deleteUserFoodMeasure(food_name: string, unit_name: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { error } = await supabase
                .from("user_food_measures" as any)
                .delete()
                .eq("user_id", user.id)
                .eq("food_name", food_name)
                .eq("unit_name", unit_name);

            if (error) {
                console.error("Error deleting user food measure:", error);
                return false;
            }
            return true;
        } catch (error) {
            console.error("Error deleting user food measure:", error);
            return false;
        }
    }
}

export const userFoodMeasuresService = new UserFoodMeasuresService();
