import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

interface EditActionItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  onSuccess: () => void;
}

export function EditActionItemModal({ open, onOpenChange, item, onSuccess }: EditActionItemModalProps) {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium",
    due_date: "",
    status: "pending",
  });

  // Carregar dados do item quando abrir
  useEffect(() => {
    if (open && item) {
      setFormData({
        title: item.title || "",
        description: item.description || "",
        assigned_to: item.assigned_to || "",
        priority: item.priority || "medium",
        due_date: item.due_date ? item.due_date.split("T")[0] : "",
        status: item.status || "pending",
      });
      loadTeamMembers();
    }
  }, [open, item]);

  const loadTeamMembers = async () => {
    try {
      const { data: members, error } = await (supabase as any)
        .from("team_members")
        .select("user_id, name")
        .eq("owner_id", user?.id);

      if (error) throw error;

      const membersWithNames = (members || []).map((member: any) => ({
        user_id: member.user_id,
        name: member.name || "Sem nome"
      }));

      const allMembers = [
        { user_id: user?.id, name: "Eu" },
        ...membersWithNames
      ];

      setTeamMembers(allMembers);
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        assigned_to: formData.assigned_to,
        priority: formData.priority,
        due_date: formData.due_date || null,
        status: formData.status,
      };

      // Se mudou para completed, adicionar timestamp
      if (formData.status === "completed" && item.status !== "completed") {
        updateData.completed_at = new Date().toISOString();
      }
      // Se mudou de completed para outro, remover timestamp
      if (formData.status !== "completed" && item.status === "completed") {
        updateData.completed_at = null;
      }

      const { error } = await (supabase as any)
        .from("action_items")
        .update(updateData)
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Item atualizado",
        description: "O item de ação foi atualizado com sucesso",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Item de Ação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Responsável *</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Prazo</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
