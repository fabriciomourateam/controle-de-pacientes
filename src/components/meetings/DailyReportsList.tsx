import { useState } from "react";
import { Plus, Calendar, User, Smile, Meh, Frown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreateDailyReportModal } from "./CreateDailyReportModal";
import { EditDailyReportModal } from "./EditDailyReportModal";
import { useDailyReports } from "@/hooks/use-daily-reports";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DailyReportsList() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [editingReport, setEditingReport] = useState<any>(null);
  const [deletingReport, setDeletingReport] = useState<any>(null);
  const { reports, loading, deleteReport, reload } = useDailyReports();
  const { toast } = useToast();

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "great":
        return <Smile className="w-5 h-5 text-green-400" />;
      case "good":
        return <Smile className="w-5 h-5 text-blue-400" />;
      case "neutral":
        return <Meh className="w-5 h-5 text-yellow-400" />;
      case "bad":
        return <Frown className="w-5 h-5 text-orange-400" />;
      case "terrible":
        return <Frown className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getMoodLabel = (mood: string) => {
    const labels: Record<string, string> = {
      great: "Excelente",
      good: "Bom",
      neutral: "Neutro",
      bad: "Ruim",
      terrible: "Péssimo",
    };
    return labels[mood] || mood;
  };

  // Filtrar relatórios por data
  const filteredReports = selectedDate === "all" 
    ? reports 
    : reports.filter(r => r.report_date === selectedDate);

  // Obter datas únicas
  const uniqueDates = Array.from(new Set(reports.map(r => r.report_date))).sort().reverse();

  const handleDelete = async () => {
    if (!deletingReport) return;
    try {
      await deleteReport(deletingReport.id);
      toast({
        title: "Relatório excluído",
        description: "O relatório foi excluído com sucesso.",
      });
      setDeletingReport(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o relatório.",
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
            <span>Carregando relatórios...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Acompanhamento Diário</h2>
          <p className="text-slate-400">Registre as atividades diárias da equipe</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as datas</SelectItem>
              {uniqueDates.map(date => (
                <SelectItem key={date} value={date}>
                  {format(new Date(date), "dd/MM/yyyy", { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
          <CardContent className="p-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <Calendar className="w-12 h-12 text-slate-400" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Nenhum relatório encontrado</h3>
                <p className="text-slate-400 mb-4">
                  {selectedDate === "all" 
                    ? "Comece criando seu primeiro relatório diário"
                    : "Nenhum relatório encontrado para esta data"}
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Relatório
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredReports.map((report) => (
            <Card
              key={report.id}
              className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {format(new Date(report.report_date), "dd/MM/yyyy", { locale: ptBR })}
                      </Badge>
                      {report.mood && (
                        <div className="flex items-center gap-2">
                          {getMoodIcon(report.mood)}
                          <span className="text-sm text-slate-400">{getMoodLabel(report.mood)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <User className="w-4 h-4" />
                      <span className="text-sm">{report.member_name || "Membro da equipe"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-blue-400"
                      onClick={() => setEditingReport(report)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-400"
                      onClick={() => setDeletingReport(report)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-green-400 mb-2">✅ Demandas Concluídas Hoje</h4>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{report.tasks_completed}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">📋 Demandas Planejadas para Amanhã</h4>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{report.tasks_planned}</p>
                </div>

                {report.blockers && (
                  <div>
                    <h4 className="text-sm font-semibold text-orange-400 mb-2">⚠️ Dúvidas e Dificuldades</h4>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{report.blockers}</p>
                  </div>
                )}

                {report.observations && (
                  <div>
                    <h4 className="text-sm font-semibold text-purple-400 mb-2">💡 Observações</h4>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{report.observations}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateDailyReportModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      {/* Modal de Edição */}
      {editingReport && (
        <EditDailyReportModal
          open={!!editingReport}
          onOpenChange={(open) => !open && setEditingReport(null)}
          report={editingReport}
          onSuccess={() => {
            setEditingReport(null);
            reload();
          }}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={!!deletingReport} onOpenChange={(open) => !open && setDeletingReport(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="w-5 h-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o relatório do dia{" "}
              <strong>{deletingReport && format(new Date(deletingReport.report_date), "dd/MM/yyyy", { locale: ptBR })}</strong>?
              <br />
              <span className="text-red-400">Esta ação não pode ser desfeita.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingReport(null)}>
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
