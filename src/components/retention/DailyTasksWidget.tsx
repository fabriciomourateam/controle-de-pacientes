import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Phone, MessageSquare, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContactHistoryService } from "@/lib/contact-history-service";

interface DailyTask {
  telefone: string; // Chave de ligação
  nome: string;
  diasSemContato: number;
  prioridade: 'urgente' | 'alta' | 'media';
}

interface DailyTasksWidgetProps {
  tasks: DailyTask[];
  onTaskComplete: (telefone: string) => void;
}

export function DailyTasksWidget({ tasks, onTaskComplete }: DailyTasksWidgetProps) {
  const { toast } = useToast();

  const handleMarkAsContacted = async (task: DailyTask) => {
    try {
      // Registrar contato no histórico (salva permanentemente)
      const result = await ContactHistoryService.registerContact(
        task.telefone,
        task.nome,
        'manual',
        'Contato registrado via Tarefas do Dia'
      );

      if (!result.success) {
        throw result.error;
      }

      toast({
        title: "✅ Contato registrado!",
        description: `${task.nome} foi marcado como contatado hoje.`,
      });

      onTaskComplete(task.telefone);
    } catch (error) {
      console.error('Erro ao marcar como contatado:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o contato",
        variant: "destructive"
      });
    }
  };

  const handleWhatsApp = (telefone: string, nome: string) => {
    const message = encodeURIComponent(`Oi ${nome}! Tudo bem? 😊`);
    window.open(`https://wa.me/55${telefone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'alta': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getPriorityLabel = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente': return '🚨 URGENTE';
      case 'alta': return '⚠️ ALTA';
      default: return '⏰ MÉDIA';
    }
  };

  if (tasks.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Tudo em dia! 🎉
              </h3>
              <p className="text-sm text-slate-400">
                Nenhuma tarefa urgente no momento
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-400" />
          Tarefas do Dia
        </CardTitle>
        <CardDescription className="text-slate-400">
          {tasks.length} aluno(s) precisam de contato urgente hoje
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <Card key={task.telefone} className="bg-slate-800/60 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-bold text-sm">
                    {index + 1}
                  </div>
                  
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-purple-500/20 text-purple-400">
                      {task.nome?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{task.nome}</h4>
                      <Badge variant="outline" className={getPriorityColor(task.prioridade)}>
                        {getPriorityLabel(task.prioridade)}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">
                      {task.diasSemContato} dias sem contato
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleWhatsApp(task.telefone, task.nome)}
                      className="bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-500/30"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsContacted(task)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Contatado
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
