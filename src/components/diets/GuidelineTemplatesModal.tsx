import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { RichTextEditor } from './RichTextEditor';
import { useGuidelineTemplates } from '@/hooks/use-guideline-templates';
import { 
  Star, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  BookOpen,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface GuidelineTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'manage' | 'select';
  onSelectTemplate?: (template: any) => void;
}

export function GuidelineTemplatesModal({ 
  open, 
  onOpenChange,
  mode = 'manage',
  onSelectTemplate
}: GuidelineTemplatesModalProps) {
  const {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateActive
  } = useGuidelineTemplates();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    guideline_type: 'general',
    priority: 0
  });

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      guideline_type: 'general',
      priority: templates.length
    });
  };

  const handleStartEdit = (template: any) => {
    setEditingId(template.id);
    setIsCreating(false);
    setFormData({
      title: template.title,
      content: template.content,
      guideline_type: template.guideline_type,
      priority: template.priority
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      guideline_type: 'general',
      priority: 0
    });
  };

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createTemplate(formData);
      } else if (editingId) {
        await updateTemplate(editingId, formData);
      }
      handleCancel();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.')) {
      await deleteTemplate(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-green-500/30 bg-white text-[#222222]">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="text-[#222222] flex items-center gap-2 text-xl">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            {mode === 'select' ? 'Selecionar Orientação Favorita' : 'Orientações Favoritas (Templates)'}
          </DialogTitle>
          <DialogDescription className="text-[#777777]">
            {mode === 'select' 
              ? 'Selecione uma orientação favorita para adicionar ao plano alimentar.'
              : 'Crie orientações que aparecerão automaticamente em todos os novos planos alimentares. Você pode desativar orientações específicas em cada plano individual.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-6 mt-4">
          {/* Botão Criar Novo - Ocultar no modo select */}
          {!isCreating && !editingId && mode !== 'select' && (
            <Button
              onClick={handleStartCreate}
              className="w-full bg-[#00C98A] hover:bg-[#00A875] text-white border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Nova Orientação Favorita
            </Button>
          )}

          {/* Formulário de Criação/Edição - Ocultar no modo select */}
          {(isCreating || editingId) && mode !== 'select' && (
            <div className="bg-white rounded-xl p-6 border border-green-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#222222] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#00C98A]" />
                  {isCreating ? 'Nova Orientação Favorita' : 'Editar Orientação'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-[#777777] hover:text-[#222222] hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-[#222222]">Título da Orientação</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Área de Membros, Hidratação, etc."
                    className="mt-1 border-green-500/30 bg-white text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                <div>
                  <Label htmlFor="content" className="text-[#222222]">Conteúdo</Label>
                  <div className="mt-1">
                    <RichTextEditor
                      value={formData.content}
                      onChange={(value) => setFormData({ ...formData, content: value })}
                      placeholder="Digite o conteúdo da orientação..."
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleSave}
                    disabled={!formData.title.trim() || !formData.content.trim()}
                    className="flex-1 bg-[#00C98A] hover:bg-[#00A875] text-white border-0"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Template
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 bg-[#222222] hover:bg-[#333333] text-white border-0"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Templates */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[#222222] mb-2">
                Nenhuma Orientação Favorita
              </h3>
              <p className="text-sm text-[#777777] mb-4">
                Crie orientações que aparecerão automaticamente em todos os novos planos
              </p>
              <Button
                onClick={handleStartCreate}
                className="bg-[#00C98A] hover:bg-[#00A875] text-white border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Orientação
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-white rounded-xl border p-4 transition-all ${
                    template.is_active
                      ? 'border-green-500/30 hover:border-green-500/50'
                      : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Star
                          className={`w-5 h-5 flex-shrink-0 ${
                            template.is_active
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                        <h4 className="font-semibold text-[#222222] truncate">
                          {template.title}
                        </h4>
                        <Badge
                          variant={template.is_active ? 'default' : 'secondary'}
                          className={template.is_active ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'}
                        >
                          {template.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div
                        className="text-sm text-[#777777] line-clamp-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: template.content }}
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {mode === 'select' ? (
                        // Modo Select: Mostrar apenas botão Selecionar
                        <Button
                          onClick={() => onSelectTemplate?.(template)}
                          className="bg-[#00C98A] hover:bg-[#00A875] text-white border-0"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Selecionar
                        </Button>
                      ) : (
                        // Modo Manage: Mostrar Switch, Editar e Deletar
                        <>
                          {/* Switch Ativo/Inativo */}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={template.is_active}
                              onCheckedChange={(checked) =>
                                toggleTemplateActive(template.id, checked)
                              }
                            />
                          </div>

                          {/* Botão Editar */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(template)}
                            className="text-[#00C98A] hover:text-[#00A875] hover:bg-green-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>

                          {/* Botão Deletar */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Informação sobre uso - Ocultar no modo select */}
          {mode !== 'select' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-[#00C98A] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#222222]">
                <p className="font-semibold mb-1 text-[#222222]">Como funciona:</p>
                <ul className="list-disc list-inside space-y-1 text-[#777777]">
                  <li>Orientações <strong className="text-[#222222]">ativas</strong> são copiadas automaticamente para novos planos</li>
                  <li>Você pode desativar orientações específicas em cada plano individual</li>
                  <li>Alterações em templates não afetam planos já criados</li>
                  <li>Templates inativos não aparecem em novos planos</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
