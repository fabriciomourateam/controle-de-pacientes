import { useState } from "react";
import { Plus, Calendar, Users, FileText, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateMeetingModal } from "./CreateMeetingModal";
import { useMeetings } from "@/hooks/use-meetings";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function MeetingsList() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const { meetings, loading, deleteMeeting } = useMeetings();

  const getMeetingTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      daily: "Diária",
      weekly: "Semanal",
      biweekly: "Quinzenal",
      monthly: "Mensal",
    };
    return types[type] || type;
  };

  const getMeetingTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      daily: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      weekly: "bg-green-500/20 text-green-400 border-green-500/30",
      biweekly: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      monthly: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return colors[type] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  const handleEdit = (meeting: any) => {
    setSelectedMeeting(meeting);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta reunião?")) {
      await deleteMeeting(id);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <div className="animate-spin w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full" />
            <span>Carregando reuniões...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Reuniões</h2>
          <p className="text-slate-400">Registre e acompanhe as reuniões da equipe</p>
        </div>
        <Button onClick={() => {
          setSelectedMeeting(null);
          setIsCreateModalOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Reunião
        </Button>
      </div>

      {meetings.length === 0 ? (
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
          <CardContent className="p-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <Calendar className="w-12 h-12 text-slate-400" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Nenhuma reunião registrada</h3>
                <p className="text-slate-400 mb-4">Comece criando sua primeira reunião</p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Reunião
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting) => (
            <Card
              key={meeting.id}
              className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getMeetingTypeBadge(meeting.meeting_type)}>
                        {getMeetingTypeLabel(meeting.meeting_type)}
                      </Badge>
                      <span className="text-sm text-slate-400">
                        {format(new Date(meeting.meeting_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <CardTitle className="text-xl text-white">{meeting.title}</CardTitle>
                    {meeting.description && (
                      <p className="text-slate-400 text-sm">{meeting.description}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(meeting)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(meeting.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {meeting.topics && meeting.topics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Tópicos Discutidos</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {meeting.topics.map((topic: string, index: number) => (
                        <li key={index} className="text-sm text-slate-400">{topic}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {meeting.decisions && meeting.decisions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Decisões Tomadas</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {meeting.decisions.map((decision: string, index: number) => (
                        <li key={index} className="text-sm text-slate-400">{decision}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {meeting.notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Observações</h4>
                    <p className="text-sm text-slate-400 whitespace-pre-wrap">{meeting.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateMeetingModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        meeting={selectedMeeting}
      />
    </div>
  );
}
