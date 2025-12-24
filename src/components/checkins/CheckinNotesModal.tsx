import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Clock,
  User
} from 'lucide-react';
import { useCheckinManagement, CheckinNote } from '@/hooks/use-checkin-management';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CheckinNotesModalProps {
  checkinId: string | null;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CheckinNotesModal({
  checkinId,
  patientName,
  isOpen,
  onClose
}: CheckinNotesModalProps) {
  const [notes, setNotes] = useState<CheckinNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    loadCheckinNotes,
    addCheckinNote,
    updateCheckinNote,
    deleteCheckinNote
  } = useCheckinManagement();

  // Carregar anotações quando o modal abrir
  useEffect(() => {
    if (isOpen && checkinId) {
      loadNotes();
    }
  }, [isOpen, checkinId]);

  const loadNotes = async () => {
    if (!checkinId) return;
    
    setLoading(true);
    try {
      const notesData = await loadCheckinNotes(checkinId);
      setNotes(notesData);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!checkinId || !newNote.trim()) return;

    const success = await addCheckinNote(checkinId, newNote);
    if (success) {
      setNewNote('');
      loadNotes();
    }
  };

  const handleEditNote = (note: CheckinNote) => {
    setEditingNote(note.id);
    setEditingText(note.note);
  };

  const handleSaveEdit = async () => {
    if (!editingNote || !editingText.trim()) return;

    const success = await updateCheckinNote(editingNote, editingText);
    if (success) {
      setEditingNote(null);
      setEditingText('');
      loadNotes();
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditingText('');
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return;

    const success = await deleteCheckinNote(noteId);
    if (success) {
      loadNotes();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            Anotações do Check-in
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Anotações para <span className="font-medium text-slate-300">{patientName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nova Anotação */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Nova Anotação
            </label>
            <div className="space-y-2">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Digite sua anotação aqui..."
                rows={3}
                className="bg-slate-800/50 border-slate-600 text-slate-200 placeholder:text-slate-400"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || loading}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Anotação
                </Button>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Lista de Anotações */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-300">
                Anotações Existentes
              </h4>
              <Badge variant="outline" className="text-slate-400 border-slate-600">
                {notes.length} anotaç{notes.length !== 1 ? 'ões' : 'ão'}
              </Badge>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-slate-400">Carregando anotações...</div>
                </div>
              ) : notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="w-12 h-12 text-slate-600 mb-2" />
                  <p className="text-slate-400">Nenhuma anotação encontrada</p>
                  <p className="text-sm text-slate-500">
                    Adicione a primeira anotação acima
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4"
                    >
                      {/* Header da Anotação */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <User className="w-3 h-3" />
                          <span className="font-medium">{note.user_name}</span>
                          <Clock className="w-3 h-3 ml-2" />
                          <span>{formatDate(note.created_at)}</span>
                          {note.updated_at !== note.created_at && (
                            <Badge variant="outline" className="text-xs text-slate-500 border-slate-600">
                              editado
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditNote(note)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Conteúdo da Anotação */}
                      {editingNote === note.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={3}
                            className="bg-slate-700/50 border-slate-600 text-slate-200"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="text-slate-400 hover:text-white"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={!editingText.trim()}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Salvar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-200 text-sm whitespace-pre-wrap">
                          {note.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}