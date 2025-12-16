import { useState } from "react";
import { Plus, CheckCircle, Clock, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useActionItems } from "@/hooks/use-action-items";
import { CreateActionItemModal } from "./CreateActionItemModal";
import { EditActionItemModal } from "./EditActionItemModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export function ActionItemsList() {
  const { actionItems, loading, updateActionItem, deleteActionItem, reload } = useActionItems();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const { toast } = useToast();

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      urgent: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente",
    };
    return labels[priority] || priority;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const toggleComplete = async (item: any) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    await updateActionItem(item.id, { status: newStatus });
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteActionItem(deletingItem.id);
      toast({
        title: "Item excluído",
        description: "O item de ação foi excluído com sucesso.",
      });
      setDeletingItem(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <div className="animate-spin w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full" />
            <span>Carregando itens de ação...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingItems = actionItems.filter(i => i.status !== "completed");
  const completedItems = actionItems.filter(i => i.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Itens de Ação</h2>
          <p className="text-slate-400">Acompanhe as tarefas e responsabilidades da equipe</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Item
        </Button>
      </div>

      {pendingItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Pendentes ({pendingItems.length})</h3>
          {pendingItems.map((item) => (
            <Card key={item.id} className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={item.status === "completed"}
                    onCheckedChange={() => toggleComplete(item)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-white">{item.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getPriorityBadge(item.priority)}>
                          {getPriorityLabel(item.priority)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-blue-400"
                          onClick={() => setEditingItem(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-red-400"
                          onClick={() => setDeletingItem(item)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-sm text-slate-400">{item.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      {item.due_date && (
                        <span>Prazo: {format(new Date(item.due_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      )}
                      <span>Responsável: {item.assigned_name || "Não atribuído"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {completedItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Concluídos ({completedItems.length})</h3>
          {completedItems.map((item) => (
            <Card key={item.id} className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50 opacity-60">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={true}
                    onCheckedChange={() => toggleComplete(item)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-white line-through">{item.title}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-400"
                        onClick={() => setDeletingItem(item)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Concluído em {format(new Date(item.completed_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {actionItems.length === 0 && (
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
          <CardContent className="p-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle className="w-12 h-12 text-slate-400" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Nenhum item de ação</h3>
                <p className="text-slate-400">Os itens de ação serão criados automaticamente nas reuniões</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateActionItemModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={reload}
      />

      {/* Modal de Edição */}
      {editingItem && (
        <EditActionItemModal
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          item={editingItem}
          onSuccess={() => {
            setEditingItem(null);
            reload();
          }}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="w-5 h-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o item <strong>"{deletingItem?.title}"</strong>?
              <br />
              <span className="text-red-400">Esta ação não pode ser desfeita.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingItem(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
