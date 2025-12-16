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
      // Buscar todos os itens de ação (RLS vai filtrar automaticamente)
      const { data, error } = await (supabase as any)
        .from("action_items")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw error;

      if (error) throw error;
      
      // Buscar informações dos responsáveis (nome do team_members)
      const itemsWithNames = await Promise.all(
        (data || []).map(async (item: any) => {
          // Primeiro tentar buscar o nome do team_members
          const { data: teamMember } = await (supabase as any)
            .from("team_members")
            .select("name")
            .eq("user_id", item.assigned_to)
            .single();
          
          // Se não encontrar, verificar se é o próprio usuário
          let assignedName = teamMember?.name;
          if (!assignedName && item.assigned_to === user?.id) {
            assignedName = "Eu";
          }
          
          return {
            ...item,
            assigned_name: assignedName || "Não atribuído"
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

    const { error } = await (supabase as any)
      .from("action_items")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;
    await loadActionItems();
  };

  const deleteActionItem = async (id: string) => {
    const { error } = await (supabase as any)
      .from("action_items")
      .delete()
      .eq("id", id);

    if (error) throw error;
    await loadActionItems();
  };

  return {
    actionItems,
    loading,
    updateActionItem,
    deleteActionItem,
    reload: loadActionItems,
  };
}
