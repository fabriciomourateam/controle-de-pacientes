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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  category?: 'general' | 'supplement' | 'supplement_suplementacao' | 'supplement_protocolo' | 'supplement_manipulados';
  onSelectTemplates?: (templates: any[]) => void;
}

export function GuidelineTemplatesModal({
  open,
  onOpenChange,
  mode = 'manage',
  category = 'general',
  onSelectTemplates
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    guideline_type: category, // Initialize with passed category
    priority: 0
  });

  // Filter templates based on category
  const isSupplementCategory = (cat: string) => cat.startsWith('supplement');

  const filteredTemplates = templates.filter(t => {
    if (category === 'general') {
      return !t.guideline_type || t.guideline_type === 'general';
    }
    if (isSupplementCategory(category)) {
      // Show all supplement types if category is any supplement type
      return t.guideline_type && t.guideline_type.startsWith('supplement');
    }
    return t.guideline_type === category;
  });

  // Reset selection and form when modal opens/closes or category changes
  if (!open && selectedIds.length > 0) {
    setSelectedIds([]);
  }

  // Ensure formData uses correct category when creating
  if (isCreating && formData.guideline_type !== category) {
    setFormData(prev => ({ ...prev, guideline_type: category }));
  }

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleConfirmSelection = () => {
    const selectedTemplates = templates.filter(t => selectedIds.includes(t.id));
    onSelectTemplates?.(selectedTemplates);
    setSelectedIds([]);
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      guideline_type: category,
      priority: filteredTemplates.length
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
      guideline_type: category,
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
          <DialogTitle className="text-[#222222] flex items-center justify-between text-xl">
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              {mode === 'select'
                ? (category === 'supplement' ? 'Selecionar Suplementos' : 'Selecionar Orientações')
                : (category === 'supplement' ? 'Suplementos Favoritos' : 'Orientações Favoritas')}
            </div>
            {mode === 'select' && selectedIds.length > 0 && (
              <Button
                onClick={handleConfirmSelection}
                className="bg-[#00C98A] hover:bg-[#00A875] text-white border-0"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Adicionar Selecionados ({selectedIds.length})
              </Button>
            )}
          </DialogTitle>
          <DialogDescription className="text-[#777777]">
            {mode === 'select'
              ? `Selecione ${category === 'supplement' ? 'um suplemento' : 'uma orientação'} favorita para adicionar ao plano.`
              : `Crie ${category === 'supplement' ? 'suplementos' : 'orientações'} que aparecerão automaticamente em todos os novos planos.`
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
              {category === 'supplement' ? 'Criar Novo Suplemento' : 'Criar Nova Orientação'}
            </Button>
          )}

          {/* Formulário de Criação/Edição - Ocultar no modo select */}
          {(isCreating || editingId) && mode !== 'select' && (
            <div className="bg-white rounded-xl p-6 border border-green-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#222222] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#00C98A]" />
                  {isCreating
                    ? (category === 'supplement' ? 'Novo Suplemento' : 'Nova Orientação')
                    : (category === 'supplement' ? 'Editar Suplemento' : 'Editar Orientação')
                  }
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

                {/* Tipo de Suplemento (apenas visualizado quando category for supplement) */}
                {(category === 'supplement' || category.startsWith('supplement')) && (
                  <div>
                    <Label htmlFor="type" className="text-[#222222]">Tipo</Label>
                    <Select
                      value={formData.guideline_type}
                      onValueChange={(value) => setFormData({ ...formData, guideline_type: value as any })}
                    >
                      <SelectTrigger className="mt-1 border-green-500/30 bg-white text-[#222222]">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-green-500/30">
                        <SelectItem value="supplement_suplementacao">Suplementação</SelectItem>
                        <SelectItem value="supplement_protocolo">Protocolo</SelectItem>
                        <SelectItem value="supplement_manipulados">Manipulados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="title" className="text-[#222222]">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={category.startsWith('supplement') ? "Ex: Creatina, Whey Protein, etc." : "Ex: Área de Membros, Hidratação, etc."}
                    className="mt-1 border-green-500/30 bg-white text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                <div>
                  <Label htmlFor="content" className="text-[#222222]">Conteúdo</Label>
                  <div className="mt-1">
                    <RichTextEditor
                      value={formData.content}
                      onChange={(value) => setFormData({ ...formData, content: value })}
                      placeholder={category === 'supplement' ? "Digite os detalhes do suplemento..." : "Digite o conteúdo da orientação..."}
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
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[#222222] mb-2">
                Nenhum(a) {category === 'supplement' ? 'Suplemento' : 'Orientação'} Favorito(a)
              </h3>
              <p className="text-sm text-[#777777] mb-4">
                Crie {category === 'supplement' ? 'suplementos' : 'orientações'} que aparecerão automaticamente em todos os novos planos
              </p>
              <Button
                onClick={handleStartCreate}
                className="bg-[#00C98A] hover:bg-[#00A875] text-white border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro(a)
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-white rounded-xl border p-4 transition-all ${template.is_active
                    ? 'border-green-500/30 hover:border-green-500/50'
                    : 'border-gray-200 opacity-60'
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Star
                          className={`w-5 h-5 flex-shrink-0 ${template.is_active
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                            }`}
                        />
                        <h4 className="font-semibold text-[#222222] truncate">
                          {template.title.replace(/<[^>]*>?/gm, "")}
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
                        // Modo Select: Mostrar Checkbox
                        <Checkbox
                          checked={selectedIds.includes(template.id)}
                          onCheckedChange={() => toggleSelection(template.id)}
                          className="border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:text-white w-5 h-5"
                        />
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
                  <li>Itens <strong className="text-[#222222]">ativos</strong> são copiados automaticamente para novos planos</li>
                  <li>Você pode desativar itens específicos em cada plano individual</li>
                  <li>Alterações em templates não afetam planos já criados</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog >
  );
}
