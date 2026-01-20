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
  AlertCircle
} from 'lucide-react';

interface GuidelineTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GuidelineTemplatesModal({ open, onOpenChange }: GuidelineTemplatesModalProps) {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            Orientações Favoritas (Templates)
          </DialogTitle>
          <DialogDescription>
            Crie orientações que aparecerão automaticamente em todos os novos planos alimentares.
            Você pode desativar orientações específicas em cada plano individual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Botão Criar Novo */}
          {!isCreating && !editingId && (
            <Button
              onClick={handleStartCreate}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Nova Orientação Favorita
            </Button>
          )}

          {/* Formulário de Criação/Edição */}
          {(isCreating || editingId) && (
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-yellow-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-yellow-600" />
                  {isCreating ? 'Nova Orientação Favorita' : 'Editar Orientação'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título da Orientação</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Área de Membros, Hidratação, etc."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Conteúdo</Label>
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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Template
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1"
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
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Nenhuma Orientação Favorita
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Crie orientações que aparecerão automaticamente em todos os novos planos
              </p>
              <Button
                onClick={handleStartCreate}
                variant="outline"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
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
                  className={`bg-white rounded-xl border-2 p-4 transition-all ${
                    template.is_active
                      ? 'border-yellow-200 hover:border-yellow-300'
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
                        <h4 className="font-semibold text-gray-900 truncate">
                          {template.title}
                        </h4>
                        <Badge
                          variant={template.is_active ? 'default' : 'secondary'}
                          className={template.is_active ? 'bg-green-100 text-green-700' : ''}
                        >
                          {template.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div
                        className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: template.content }}
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
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
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>

                      {/* Botão Deletar */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Informação sobre uso */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Como funciona:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Orientações <strong>ativas</strong> são copiadas automaticamente para novos planos</li>
                <li>Você pode desativar orientações específicas em cada plano individual</li>
                <li>Alterações em templates não afetam planos já criados</li>
                <li>Templates inativos não aparecem em novos planos</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
