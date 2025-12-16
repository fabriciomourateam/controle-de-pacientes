import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDailyReports } from "@/hooks/use-daily-reports";
import { useToast } from "@/hooks/use-toast";
import { Smile, Meh, Frown } from "lucide-react";

interface EditDailyReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: any;
  onSuccess: () => void;
}

export function EditDailyReportModal({ open, onOpenChange, report, onSuccess }: EditDailyReportModalProps) {
  const { updateReport } = useDailyReports();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    tasks_completed: "",
    tasks_planned: "",
    blockers: "",
    observations: "",
    mood: "good",
  });

  useEffect(() => {
    if (open && report) {
      setFormData({
        tasks_completed: report.tasks_completed || "",
        tasks_planned: report.tasks_planned || "",
        blockers: report.blockers || "",
        observations: report.observations || "",
        mood: report.mood || "good",
      });
    }
  }, [open, report]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateReport(report.id, formData);
      toast({
        title: "Relatório atualizado",
        description: "O relatório foi atualizado com sucesso",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const moodOptions = [
    { value: "great", label: "Excelente", icon: Smile, color: "text-green-400" },
    { value: "good", label: "Bom", icon: Smile, color: "text-blue-400" },
    { value: "neutral", label: "Neutro", icon: Meh, color: "text-yellow-400" },
    { value: "bad", label: "Ruim", icon: Frown, color: "text-orange-400" },
    { value: "terrible", label: "Péssimo", icon: Frown, color: "text-red-400" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Relatório Diário</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Como foi seu dia? *</Label>
            <Select value={formData.mood} onValueChange={(value) => setFormData({ ...formData, mood: value })}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {moodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className={`w-4 h-4 ${option.color}`} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tasks_completed">✅ Demandas Concluídas Hoje *</Label>
            <Textarea
              id="tasks_completed"
              value={formData.tasks_completed}
              onChange={(e) => setFormData({ ...formData, tasks_completed: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              rows={4}
              placeholder="Liste as tarefas que você concluiu hoje..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tasks_planned">📋 Demandas Planejadas para Amanhã *</Label>
            <Textarea
              id="tasks_planned"
              value={formData.tasks_planned}
              onChange={(e) => setFormData({ ...formData, tasks_planned: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              rows={4}
              placeholder="Liste as tarefas planejadas para amanhã..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blockers">⚠️ Dúvidas e Dificuldades</Label>
            <Textarea
              id="blockers"
              value={formData.blockers}
              onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              rows={3}
              placeholder="Alguma dúvida ou dificuldade que precisa de ajuda?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">💡 Observações</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              rows={2}
              placeholder="Alguma observação adicional?"
            />
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
