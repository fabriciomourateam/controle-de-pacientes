import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export function useActionItems() {
  const { user } = useAuthContext();
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActionItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("action_items")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw error;
      
      // Buscar informações dos responsáveis separadamente
      const itemsWithNames = await Promise.all(
        (data || []).map(async (item) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, email")
            .eq("id", item.assigned_to)
            .single();
          
          return {
            ...item,
            assigned_name: profile?.email || "Não atribuído"
          };
        })
      );
      
      setActionItems(itemsWithNames);
    } catch (error) {
      console.error("Erro ao carregar itens de ação:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActionItems();
  }, [user]);

  const updateActionItem = async (id: string, data: any) => {
    const updateData = { ...data };
    
    // Se estiver marcando como concluído, adicionar timestamp
    if (data.status === "completed" && !data.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }
    
    // Se estiver desmarcando, remover timestamp
    if (data.status !== "completed") {
      updateData.completed_at = null;
    }

    const { error } = await supabase
      .from("action_items")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;
    await loadActionItems();
  };

  return {
    actionItems,
    loading,
    updateActionItem,
    reload: loadActionItems,
  };
}
