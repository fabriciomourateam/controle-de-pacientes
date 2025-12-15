import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { useMeetings } from "@/hooks/use-meetings";
import { useToast } from "@/hooks/use-toast";

interface CreateMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: any;
}

export function CreateMeetingModal({ open, onOpenChange, meeting }: CreateMeetingModalProps) {
  const { createMeeting, updateMeeting } = useMeetings();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    meeting_type: "daily",
    title: "",
    description: "",
    meeting_date: "",
    meeting_time: "",
    notes: "",
  });

  const [topics, setTopics] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState("");
  const [decisions, setDecisions] = useState<string[]>([]);
  const [currentDecision, setCurrentDecision] = useState("");

  useEffect(() => {
    if (meeting) {
      const date = new Date(meeting.meeting_date);
      setFormData({
        meeting_type: meeting.meeting_type,
        title: meeting.title,
        description: meeting.description || "",
        meeting_date: date.toISOString().split('T')[0],
        meeting_time: date.toTimeString().slice(0, 5),
        notes: meeting.notes || "",
      });
      setTopics(meeting.topics || []);
      setDecisions(meeting.decisions || []);
    } else {
      // Reset form
      setFormData({
        meeting_type: "daily",
        title: "",
        description: "",
        meeting_date: new Date().toISOString().split('T')[0],
        meeting_time: "09:00",
        notes: "",
      });
      setTopics([]);
      setDecisions([]);
    }
  }, [meeting, open]);

  const addTopic = () => {
    if (currentTopic.trim()) {
      setTopics([...topics, currentTopic.trim()]);
      setCurrentTopic("");
    }
  };

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const addDecision = () => {
    if (currentDecision.trim()) {
      setDecisions([...decisions, currentDecision.trim()]);
      setCurrentDecision("");
    }
  };

  const removeDecision = (index: number) => {
    setDecisions(decisions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const meetingDateTime = new Date(`${formData.meeting_date}T${formData.meeting_time}`);

      const data = {
        meeting_type: formData.meeting_type,
        title: formData.title,
        description: formData.description,
        meeting_date: meetingDateTime.toISOString(),
        topics,
        decisions,
        notes: formData.notes,
      };

      if (meeting) {
        await updateMeeting(meeting.id, data);
        toast({
          title: "Reunião atualizada",
          description: "A reunião foi atualizada com sucesso",
        });
      } else {
        await createMeeting(data);
        toast({
          title: "Reunião criada",
          description: "A reunião foi criada com sucesso",
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a reunião",
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
          <DialogTitle className="text-white">
            {meeting ? "Editar Reunião" : "Nova Reunião"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting_type">Tipo de Reunião</Label>
              <Select
                value={formData.meeting_type}
                onValueChange={(value) => setFormData({ ...formData, meeting_type: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diária</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="biweekly">Quinzenal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting_date">Data *</Label>
              <Input
                id="meeting_date"
                type="date"
                value={formData.meeting_date}
                onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting_time">Horário *</Label>
              <Input
                id="meeting_time"
                type="time"
                value={formData.meeting_time}
                onChange={(e) => setFormData({ ...formData, meeting_time: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tópicos Discutidos</Label>
            <div className="flex gap-2">
              <Input
                value={currentTopic}
                onChange={(e) => setCurrentTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                placeholder="Adicionar tópico..."
              />
              <Button type="button" onClick={addTopic} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {topics.length > 0 && (
              <div className="space-y-2 mt-2">
                {topics.map((topic, index) => (
                  <div key={index} className="flex items-center gap-2 bg-slate-800 p-2 rounded">
                    <span className="flex-1 text-sm text-slate-300">{topic}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTopic(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Decisões Tomadas</Label>
            <div className="flex gap-2">
              <Input
                value={currentDecision}
                onChange={(e) => setCurrentDecision(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDecision())}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                placeholder="Adicionar decisão..."
              />
              <Button type="button" onClick={addDecision} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {decisions.length > 0 && (
              <div className="space-y-2 mt-2">
                {decisions.map((decision, index) => (
                  <div key={index} className="flex items-center gap-2 bg-slate-800 p-2 rounded">
                    <span className="flex-1 text-sm text-slate-300">{decision}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDecision(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              rows={4}
              placeholder="Anotações gerais da reunião..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : meeting ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
