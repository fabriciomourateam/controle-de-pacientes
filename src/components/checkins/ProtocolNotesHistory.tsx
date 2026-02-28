import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, Check, X, ScrollText } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';
import { useToast } from '@/hooks/use-toast';
import { protocolNotesService, ProtocolNote } from '@/lib/protocol-notes-service';
import { AnimatePresence, motion } from 'framer-motion';

interface ProtocolNotesHistoryProps {
    telefone: string;
}

export function ProtocolNotesHistory({ telefone }: ProtocolNotesHistoryProps) {
    const { profile } = useProfile();
    const { toast } = useToast();

    const [notes, setNotes] = useState<ProtocolNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const loadNotes = useCallback(async () => {
        if (!telefone) return;
        try {
            setLoading(true);
            const data = await protocolNotesService.getNotes(telefone);
            setNotes(data);
            if (data.length > 0) {
                setIsExpanded(true);
            }
        } catch (err) {
            console.error('Error loading protocol notes:', err);
        } finally {
            setLoading(false);
        }
    }, [telefone]);

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    const handleAdd = async () => {
        if (!newNote.trim()) return;

        const authorName = profile?.name || 'Equipe';

        try {
            setSaving(true);
            const note = await protocolNotesService.addNote(telefone, newNote.trim(), authorName);
            setNotes((prev) => [note, ...prev]);
            setNewNote('');
            toast({ title: 'Nota adicionada ✅', description: 'Registro de protocolo salvo com sucesso.' });
        } catch (err) {
            toast({ title: 'Erro', description: 'Não foi possível salvar a nota.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleStartEdit = (note: ProtocolNote) => {
        setEditingId(note.id);
        setEditContent(note.content);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editContent.trim()) return;

        try {
            setSaving(true);
            const updated = await protocolNotesService.updateNote(editingId, editContent.trim());
            setNotes((prev) => prev.map((n) => (n.id === editingId ? updated : n)));
            setEditingId(null);
            setEditContent('');
            toast({ title: 'Nota atualizada ✅' });
        } catch (err) {
            toast({ title: 'Erro', description: 'Não foi possível atualizar a nota.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir esta nota de protocolo?')) return;

        try {
            await protocolNotesService.deleteNote(id);
            setNotes((prev) => prev.filter((n) => n.id !== id));
            toast({ title: 'Nota excluída 🗑️' });
        } catch (err) {
            toast({ title: 'Erro', description: 'Não foi possível excluir a nota.', variant: 'destructive' });
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card className="bg-slate-700/40 border-slate-600/50">
            <CardContent className="p-3 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                        >
                            {isExpanded ? (
                                <X className="w-4 h-4" />
                            ) : (
                                <ScrollText className="w-4 h-4" />
                            )}
                        </Button>
                        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            📋 Histórico do Paciente
                            {notes.length > 0 && (
                                <Badge className="text-[10px] bg-blue-500/20 text-blue-300 border-blue-500/30">
                                    {notes.length}
                                </Badge>
                            )}
                        </h4>
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                        >
                            {/* Add new note */}
                            <div className="flex gap-2">
                                <Textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Registre ajustes feitos na dieta, rotina ou protocolo do paciente..."
                                    rows={2}
                                    className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-500 text-[13px] flex-1 resize-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                            handleAdd();
                                        }
                                    }}
                                />
                                <Button
                                    onClick={handleAdd}
                                    disabled={saving || !newNote.trim()}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white self-end h-9 px-3"
                                    title="Adicionar nota (Ctrl+Enter)"
                                >
                                    {saving ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Plus className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </div>

                            {/* Notes list */}
                            {loading ? (
                                <div className="flex items-center justify-center py-4 text-slate-400 text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Carregando histórico...
                                </div>
                            ) : notes.length === 0 ? (
                                <div className="text-center py-4 text-slate-500 text-sm">
                                    <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                    Nenhuma nota de protocolo registrada ainda.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                    {notes.map((note) => (
                                        <div
                                            key={note.id}
                                            className="bg-slate-700/30 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600/50 transition-colors group"
                                        >
                                            {editingId === note.id ? (
                                                /* Edit mode */
                                                <div className="space-y-2">
                                                    <Textarea
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        rows={3}
                                                        className="bg-slate-700/50 border-slate-600 text-slate-200 text-[13px] resize-none"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSaveEdit();
                                                            if (e.key === 'Escape') handleCancelEdit();
                                                        }}
                                                    />
                                                    <div className="flex gap-1.5 justify-end">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 px-2 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                                            onClick={handleSaveEdit}
                                                            disabled={saving}
                                                        >
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Salvar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 px-2 text-slate-400 hover:text-slate-300"
                                                            onClick={handleCancelEdit}
                                                        >
                                                            <X className="h-3 w-3 mr-1" />
                                                            Cancelar
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* View mode - Timeline layout */
                                                <>
                                                    {/* Header: Data | Autor | Ações */}
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <div className="flex items-center gap-2 text-[11px]">
                                                            <span className="text-slate-400 font-mono">
                                                                {formatDate(note.created_at)}
                                                            </span>
                                                            <span className="text-slate-600">|</span>
                                                            <span className="text-blue-400 font-semibold">
                                                                {note.author_name}
                                                            </span>
                                                            {note.updated_at !== note.created_at && (
                                                                <span className="text-[10px] text-slate-600 italic">(editado)</span>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 w-6 p-0 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                                                                onClick={() => handleStartEdit(note)}
                                                                title="Editar"
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 w-6 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                                                onClick={() => handleDelete(note.id)}
                                                                title="Excluir"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    {/* Conteúdo do ajuste */}
                                                    <p className="text-[13px] text-slate-200 whitespace-pre-wrap break-words pl-0.5 border-l-2 border-blue-500/30 pl-3">
                                                        {note.content}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
