import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Smile, Meh, Frown } from "lucide-react";
import { useDailyReports } from "@/hooks/use-daily-reports";
import { useToast } from "@/hooks/use-toast";

interface CreateDailyReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDailyReportModal({ open, onOpenChange }: CreateDailyReportModalProps) {
  const { createReport } = useDailyReports();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    tasks_completed: "",
    tasks_planned: "",
    blockers: "",
    observations: "",
    mood: "good",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createReport(formData);
      toast({
        title: "Relatório criado",
        description: "Seu relatório diário foi registrado com sucesso",
      });
      
      // Reset form
      setFormData({
        report_date: new Date().toISOString().split('T')[0],
        tasks_completed: "",
        tasks_planned: "",
        blockers: "",
        observations: "",
        mood: "good",
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Novo Relatório Diário</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report_date">Data *</Label>
              <Input
                id="report_date"
                type="date"
                value={formData.report_date}
                onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood">Como foi seu dia?</Label>
              <Select
                value={formData.mood}
                onValueChange={(value) => setFormData({ ...formData, mood: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="great">
                    <div className="flex items-center gap-2">
                      <Smile className="w-4 h-4 text-green-400" />
                      Excelente
                    </div>
                  </SelectItem>
                  <SelectItem value="good">
                    <div className="flex items-center gap-2">
                      <Smile className="w-4 h-4 text-blue-400" />
                      Bom
                    </div>
                  </SelectItem>
                  <SelectItem value="neutral">
                    <div className="flex items-center gap-2">
                      <Meh className="w-4 h-4 text-yellow-400" />
                      Neutro
                    </div>
                  </SelectItem>
                  <SelectItem value="bad">
                    <div className="flex items-center gap-2">
                      <Frown className="w-4 h-4 text-orange-400" />
                      Ruim
                    </div>
                  </SelectItem>
                  <SelectItem value="terrible">
                    <div className="flex items-center gap-2">
                      <Frown className="w-4 h-4 text-red-400" />
                      Péssimo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tasks_completed">✅ Demandas Concluídas Hoje *</Label>
            <Textarea
              id="tasks_completed"
              value={formData.tasks_completed}
              onChange={(e) => setFormData({ ...formData, tasks_completed: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              rows={4}
              placeholder="Liste as tarefas que você completou hoje..."
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
              placeholder="Liste as tarefas que você planeja fazer amanhã..."
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
              placeholder="Descreva qualquer bloqueio, dúvida ou dificuldade que você enfrentou..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">💡 Observações</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              rows={3}
              placeholder="Observações gerais, ideias, sugestões..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Criar Relatório"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
