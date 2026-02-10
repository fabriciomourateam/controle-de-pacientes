import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, Loader2, Plus, Copy, Trash2, Power, PowerOff, 
  Palette, Image, Eye, RefreshCw, Upload, ChevronDown, FileText, LayoutTemplate
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { checkinFlowService, CheckinFlowConfig, CheckinFlowTheme, DEFAULT_THEME } from '@/lib/checkin-flow-service';
import { DEFAULT_CHECKIN_FLOW, FlowStep } from '@/lib/checkin-flow-default';
import { StepList } from './StepList';
import { StepEditor } from './StepEditor';
import { ChatCheckinEngine } from '@/components/checkin-public/ChatCheckinEngine';

export function FlowEditor() {
  const { toast } = useToast();
  const [flows, setFlows] = useState<CheckinFlowConfig[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedFlow, setEditedFlow] = useState<FlowStep[]>([]);
  const [editedTheme, setEditedTheme] = useState<CheckinFlowTheme>(DEFAULT_THEME);
  const [editedName, setEditedName] = useState('');
  const [editedHeaderImage, setEditedHeaderImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'steps' | 'theme'>('steps');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => { loadFlows(); }, []);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const data = await checkinFlowService.getMyFlows();
      setFlows(data);
      if (data.length > 0 && !selectedFlowId) {
        selectFlow(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar fluxos:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectFlow = (flow: CheckinFlowConfig) => {
    setSelectedFlowId(flow.id);
    setEditedFlow([...flow.flow]);
    setEditedTheme({ ...DEFAULT_THEME, ...flow.theme });
    setEditedName(flow.name);
    setEditedHeaderImage(flow.header_image_url);
    setSelectedStepId(flow.flow[0]?.id || null);
    setHasChanges(false);
  };

  const handleCreateFromModel = async () => {
    try {
      const newFlow = await checkinFlowService.createFlow('Check-in (modelo)', { fromTemplate: true });
      setFlows(prev => [newFlow, ...prev]);
      selectFlow(newFlow);
      toast({ title: 'Fluxo criado a partir do modelo!', description: 'Inclui todas as etapas e mensagens condicionais.' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleCreateEmpty = async () => {
    try {
      const newFlow = await checkinFlowService.createFlow('Novo Check-in', { fromTemplate: false });
      setFlows(prev => [newFlow, ...prev]);
      selectFlow(newFlow);
      toast({ title: 'Fluxo em branco criado!', description: 'Adicione as etapas manualmente.' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleDuplicateFlow = async (flowId: string) => {
    try {
      const newFlow = await checkinFlowService.duplicateFlow(flowId);
      setFlows(prev => [newFlow, ...prev]);
      selectFlow(newFlow);
      toast({ title: 'Fluxo duplicado!' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    if (!confirm('Tem certeza que deseja excluir este fluxo?')) return;
    try {
      await checkinFlowService.deleteFlow(flowId);
      setFlows(prev => prev.filter(f => f.id !== flowId));
      if (selectedFlowId === flowId) {
        setSelectedFlowId(null);
        setEditedFlow([]);
      }
      toast({ title: 'Fluxo excluído!' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (flowId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await checkinFlowService.deactivateFlow(flowId);
      } else {
        await checkinFlowService.activateFlow(flowId);
      }
      await loadFlows();
      toast({ title: isActive ? 'Fluxo desativado' : 'Fluxo ativado!' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!selectedFlowId) return;
    setSaving(true);
    try {
      await checkinFlowService.updateFlow(selectedFlowId, {
        name: editedName,
        flow: editedFlow,
        theme: editedTheme,
        header_image_url: editedHeaderImage,
      });
      setHasChanges(false);
      await loadFlows();
      toast({ title: 'Salvo com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadHeaderImage = async (file: File) => {
    try {
      const url = await checkinFlowService.uploadHeaderImage(file);
      setEditedHeaderImage(url);
      setHasChanges(true);
    } catch (error: any) {
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
    }
  };

  // Modificações nos steps
  const handleStepChange = (updated: FlowStep) => {
    setEditedFlow(prev => prev.map(s => s.id === updated.id ? updated : s));
    setHasChanges(true);
  };

  const handleAddStep = () => {
    const newStep: FlowStep = {
      id: `step_${Date.now()}`,
      type: 'text',
      question: 'Nova pergunta',
      messages: [],
    };
    setEditedFlow(prev => [...prev, newStep]);
    setSelectedStepId(newStep.id);
    setHasChanges(true);
  };

  const handleDeleteStep = (stepId: string) => {
    setEditedFlow(prev => prev.filter(s => s.id !== stepId));
    if (selectedStepId === stepId) setSelectedStepId(null);
    setHasChanges(true);
  };

  const handleReorder = (newSteps: FlowStep[]) => {
    setEditedFlow(newSteps);
    setHasChanges(true);
  };

  const handleThemeChange = (key: keyof CheckinFlowTheme, value: string) => {
    setEditedTheme(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const selectedStep = editedFlow.find(s => s.id === selectedStepId);
  const selectedFlowConfig = flows.find(f => f.id === selectedFlowId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de Fluxos */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm">Seus Fluxos de Check-in</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Novo Fluxo <ChevronDown className="w-3.5 h-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-64">
                <DropdownMenuItem onClick={handleCreateFromModel} className="text-slate-200 focus:bg-slate-700 focus:text-white cursor-pointer">
                  <LayoutTemplate className="w-4 h-4 mr-2 text-blue-400" />
                  <div className="flex flex-col items-start">
                    <span>A partir do modelo</span>
                    <span className="text-xs text-slate-500">Check-in completo com mensagens condicionais</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCreateEmpty} className="text-slate-200 focus:bg-slate-700 focus:text-white cursor-pointer">
                  <FileText className="w-4 h-4 mr-2 text-slate-400" />
                  <div className="flex flex-col items-start">
                    <span>Em branco</span>
                    <span className="text-xs text-slate-500">Começar do zero e montar as etapas</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {flows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-3">Nenhum fluxo criado ainda.</p>
              <p className="text-slate-500 text-sm">Clique em <strong className="text-slate-400">Novo Fluxo</strong> e escolha:</p>
              <ul className="text-slate-500 text-sm mt-2 space-y-1 text-left max-w-sm mx-auto">
                <li>• <strong className="text-slate-400">A partir do modelo</strong> — check-in completo com mensagens condicionais (peso, treinos, sono, etc.)</li>
                <li>• <strong className="text-slate-400">Em branco</strong> — começar do zero e montar as etapas você mesmo</li>
              </ul>
              <p className="text-slate-600 text-xs mt-3">Enquanto não tiver um fluxo ativo, será usado o fluxo padrão do sistema.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {flows.map(flow => (
                <div
                  key={flow.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedFlowId === flow.id
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50'
                  }`}
                  onClick={() => { const f = flows.find(x => x.id === flow.id); if (f) selectFlow(f); }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm truncate">{flow.name}</span>
                      {flow.is_active && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">Ativo</Badge>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs">{flow.flow.length} steps</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleToggleActive(flow.id, flow.is_active); }} className="h-7 w-7 p-0" title={flow.is_active ? 'Desativar' : 'Ativar'}>
                      {flow.is_active ? <Power className="w-3.5 h-3.5 text-emerald-400" /> : <PowerOff className="w-3.5 h-3.5 text-slate-500" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDuplicateFlow(flow.id); }} className="h-7 w-7 p-0" title="Duplicar">
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteFlow(flow.id); }} className="h-7 w-7 p-0" title="Excluir">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor do Fluxo Selecionado */}
      {selectedFlowId && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Input
                  value={editedName}
                  onChange={e => { setEditedName(e.target.value); setHasChanges(true); }}
                  className="bg-slate-800/50 border-slate-700/50 text-white font-semibold text-sm h-9 max-w-xs"
                />
                {hasChanges && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">Alterações não salvas</Badge>}
              </div>
              <div className="flex gap-2">
                {/* Tabs */}
                <div className="flex bg-slate-900/50 rounded-lg p-0.5 gap-0.5">
                  <button onClick={() => setActiveTab('steps')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'steps' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'}`}>
                    Steps
                  </button>
                  <button onClick={() => setActiveTab('theme')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'theme' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'}`}>
                    <Palette className="w-3.5 h-3.5 inline mr-1" />
                    Tema
                  </button>
                </div>
                <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                  Salvar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === 'steps' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lista de Steps */}
                <div>
                  <StepList
                    steps={editedFlow}
                    selectedStepId={selectedStepId}
                    onSelectStep={setSelectedStepId}
                    onReorder={handleReorder}
                    onDelete={handleDeleteStep}
                    onAdd={handleAddStep}
                  />
                </div>

                {/* Editor do Step Selecionado */}
                <div>
                  {selectedStep ? (
                    <div>
                      <h3 className="text-white font-semibold text-sm mb-3">Editar Step</h3>
                      <StepEditor
                        step={selectedStep}
                        onChange={handleStepChange}
                        isLastStep={editedFlow.length > 0 && editedFlow[editedFlow.length - 1]?.id === selectedStep?.id}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
                      Selecione um step para editar
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Tab de Tema */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Controles de cores */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-sm">Cores do Chat</h3>
                  
                  {/* Imagem do Header */}
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-xs">Imagem do Cabeçalho</Label>
                    <div className="flex items-center gap-3">
                      {editedHeaderImage ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-600">
                          <img src={editedHeaderImage} alt="Header" className="w-full h-full object-cover" />
                          <button onClick={() => { setEditedHeaderImage(null); setHasChanges(true); }} className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5">
                            <Trash2 className="w-2.5 h-2.5 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center border border-dashed border-slate-600">
                          <span className="text-lg">💪</span>
                        </div>
                      )}
                      <Button size="sm" variant="outline" className="h-8 text-xs border-slate-600 text-slate-300" onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: any) => { if (e.target.files?.[0]) handleUploadHeaderImage(e.target.files[0]); };
                        input.click();
                      }}>
                        <Upload className="w-3 h-3 mr-1" /> Enviar Imagem
                      </Button>
                    </div>
                  </div>

                  {/* Cores */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'bg_gradient_from', label: 'Fundo (início)' },
                      { key: 'bg_gradient_via', label: 'Fundo (meio)' },
                      { key: 'bg_gradient_to', label: 'Fundo (fim)' },
                      { key: 'bot_bubble_bg', label: 'Bolha Bot (fundo)' },
                      { key: 'bot_bubble_text', label: 'Bolha Bot (texto)' },
                      { key: 'user_bubble_bg', label: 'Bolha Paciente (fundo)' },
                      { key: 'user_bubble_text', label: 'Bolha Paciente (texto)' },
                      { key: 'button_bg', label: 'Botão enviar' },
                      { key: 'option_bg', label: 'Opções (fundo)' },
                      { key: 'option_text', label: 'Opções (texto)' },
                      { key: 'header_bg', label: 'Cabeçalho (fundo)' },
                      { key: 'header_text', label: 'Cabeçalho (texto)' },
                      { key: 'accent_color', label: 'Cor destaque' },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-slate-500 text-[10px]">{label}</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editedTheme[key as keyof CheckinFlowTheme]?.replace(/rgba?\([^)]+\)/, '#334155') || '#334155'}
                            onChange={e => handleThemeChange(key as keyof CheckinFlowTheme, e.target.value)}
                            className="w-8 h-8 rounded-lg border border-slate-600 cursor-pointer bg-transparent"
                          />
                          <Input
                            value={editedTheme[key as keyof CheckinFlowTheme] || ''}
                            onChange={e => handleThemeChange(key as keyof CheckinFlowTheme, e.target.value)}
                            className="flex-1 bg-slate-800/50 border-slate-700/50 text-white text-[10px] h-8 font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button size="sm" variant="ghost" onClick={() => { setEditedTheme(DEFAULT_THEME); setHasChanges(true); }} className="text-xs text-slate-400">
                    <RefreshCw className="w-3 h-3 mr-1" /> Resetar para padrão
                  </Button>
                </div>

                {/* Preview em tempo real */}
                <div>
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-400" /> Preview
                  </h3>
                  <div
                    className="rounded-2xl overflow-hidden border border-slate-700/50 h-[500px] flex flex-col"
                    style={{ background: `linear-gradient(135deg, ${editedTheme.bg_gradient_from}, ${editedTheme.bg_gradient_via}, ${editedTheme.bg_gradient_to})` }}
                  >
                    {/* Header */}
                    <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10">
                      {editedHeaderImage ? (
                        <img src={editedHeaderImage} alt="Header" className="w-10 h-10 rounded-full object-cover border border-white/20" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center border border-white/20" style={{ background: editedTheme.accent_color + '30' }}>
                          <span className="text-lg">💪</span>
                        </div>
                      )}
                      <div>
                        <h2 className="font-semibold text-sm" style={{ color: editedTheme.header_text }}>Check-In de Avaliação</h2>
                        <p className="text-xs opacity-50" style={{ color: editedTheme.header_text }}>Paciente Exemplo</p>
                      </div>
                    </div>

                    {/* Preview real do fluxo (negrito e imagem aparecem aqui) */}
                    <div className="flex-1 min-h-0 flex flex-col">
                      <ChatCheckinEngine
                        flow={editedFlow}
                        patientName="Paciente Exemplo"
                        onComplete={async () => {}}
                        loading={false}
                        theme={editedTheme}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
