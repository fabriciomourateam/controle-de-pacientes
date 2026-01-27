import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePhotoVisibility } from '@/hooks/use-photo-visibility';
import { Eye, EyeOff, Save, RotateCcw, ZoomIn, ZoomOut, Move, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface PhotoData {
  id: string;
  url: string;
  label: string;
  date: string;
  weight: string;
  angle: 'frente' | 'lado' | 'lado_2' | 'costas';
  isInitial?: boolean;
}

interface PhotoComparisonEditorProps {
  open: boolean;
  onClose: () => void;
  patient: Patient;
  checkins: Checkin[];
  onSaved?: () => void;
}

interface PhotoState {
  zoom: number;
  x: number;
  y: number;
  isDragging: boolean;
  dragStart: { x: number; y: number };
}

export function PhotoComparisonEditor({
  open,
  onClose,
  patient,
  checkins,
  onSaved
}: PhotoComparisonEditorProps) {
  const { toast } = useToast();
  const {
    isPhotoVisible,
    getSetting,
    updateSetting
  } = usePhotoVisibility(patient?.telefone);

  // Extrair todas as fotos disponíveis
  const allPhotos: PhotoData[] = [];

  // Fotos iniciais do paciente
  const patientWithData = patient as any;
  if (patientWithData.foto_inicial_frente) {
    allPhotos.push({
      id: 'initial-frente',
      url: patientWithData.foto_inicial_frente,
      label: '⭐ Baseline - Frente',
      date: patientWithData.data_fotos_iniciais 
        ? new Date(patientWithData.data_fotos_iniciais).toLocaleDateString('pt-BR')
        : 'Data Inicial',
      weight: patientWithData.peso_inicial?.toString() || 'N/A',
      angle: 'frente',
      isInitial: true
    });
  }
  if (patientWithData.foto_inicial_lado) {
    allPhotos.push({
      id: 'initial-lado',
      url: patientWithData.foto_inicial_lado,
      label: '⭐ Baseline - Lado',
      date: patientWithData.data_fotos_iniciais 
        ? new Date(patientWithData.data_fotos_iniciais).toLocaleDateString('pt-BR')
        : 'Data Inicial',
      weight: patientWithData.peso_inicial?.toString() || 'N/A',
      angle: 'lado',
      isInitial: true
    });
  }
  if (patientWithData.foto_inicial_lado_2) {
    allPhotos.push({
      id: 'initial-lado-2',
      url: patientWithData.foto_inicial_lado_2,
      label: '⭐ Baseline - Lado 2',
      date: patientWithData.data_fotos_iniciais 
        ? new Date(patientWithData.data_fotos_iniciais).toLocaleDateString('pt-BR')
        : 'Data Inicial',
      weight: patientWithData.peso_inicial?.toString() || 'N/A',
      angle: 'lado_2',
      isInitial: true
    });
  }
  if (patientWithData.foto_inicial_costas) {
    allPhotos.push({
      id: 'initial-costas',
      url: patientWithData.foto_inicial_costas,
      label: '⭐ Baseline - Costas',
      date: patientWithData.data_fotos_iniciais 
        ? new Date(patientWithData.data_fotos_iniciais).toLocaleDateString('pt-BR')
        : 'Data Inicial',
      weight: patientWithData.peso_inicial?.toString() || 'N/A',
      angle: 'costas',
      isInitial: true
    });
  }

  // Fotos dos check-ins (do mais antigo ao mais recente)
  const sortedCheckins = [...checkins].sort((a, b) => 
    new Date(a.data_checkin).getTime() - new Date(b.data_checkin).getTime()
  );

  sortedCheckins.forEach((checkin, index) => {
    if (checkin.foto_1) {
      allPhotos.push({
        id: `checkin-${checkin.id}-foto-1`,
        url: checkin.foto_1,
        label: `#${index + 1} - Frente`,
        date: new Date(checkin.data_checkin).toLocaleDateString('pt-BR'),
        weight: checkin.peso || 'N/A',
        angle: 'frente'
      });
    }
    if (checkin.foto_2) {
      allPhotos.push({
        id: `checkin-${checkin.id}-foto-2`,
        url: checkin.foto_2,
        label: `#${index + 1} - Lado`,
        date: new Date(checkin.data_checkin).toLocaleDateString('pt-BR'),
        weight: checkin.peso || 'N/A',
        angle: 'lado'
      });
    }
    if (checkin.foto_3) {
      allPhotos.push({
        id: `checkin-${checkin.id}-foto-3`,
        url: checkin.foto_3,
        label: `#${index + 1} - Lado 2`,
        date: new Date(checkin.data_checkin).toLocaleDateString('pt-BR'),
        weight: checkin.peso || 'N/A',
        angle: 'lado_2'
      });
    }
    if (checkin.foto_4) {
      allPhotos.push({
        id: `checkin-${checkin.id}-foto-4`,
        url: checkin.foto_4,
        label: `#${index + 1} - Costas`,
        date: new Date(checkin.data_checkin).toLocaleDateString('pt-BR'),
        weight: checkin.peso || 'N/A',
        angle: 'costas'
      });
    }
  });

  // Estados para as duas fotos
  const [beforePhotoId, setBeforePhotoId] = useState<string>(allPhotos[0]?.id || '');
  const [afterPhotoId, setAfterPhotoId] = useState<string>(allPhotos[allPhotos.length - 1]?.id || '');
  
  const [beforeState, setBeforeState] = useState<PhotoState>({
    zoom: 1,
    x: 0,
    y: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 }
  });
  
  const [afterState, setAfterState] = useState<PhotoState>({
    zoom: 1,
    x: 0,
    y: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 }
  });

  const [saving, setSaving] = useState(false);
  const beforeContainerRef = useRef<HTMLDivElement>(null);
  const afterContainerRef = useRef<HTMLDivElement>(null);

  // Carregar configurações salvas quando mudar foto
  useEffect(() => {
    if (beforePhotoId) {
      const setting = getSetting(beforePhotoId);
      if (setting) {
        setBeforeState(prev => ({
          ...prev,
          zoom: setting.zoom_level,
          x: setting.position_x,
          y: setting.position_y
        }));
      } else {
        setBeforeState(prev => ({ ...prev, zoom: 1, x: 0, y: 0 }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beforePhotoId]); // Remover getSetting das dependências

  useEffect(() => {
    if (afterPhotoId) {
      const setting = getSetting(afterPhotoId);
      if (setting) {
        setAfterState(prev => ({
          ...prev,
          zoom: setting.zoom_level,
          x: setting.position_x,
          y: setting.position_y
        }));
      } else {
        setAfterState(prev => ({ ...prev, zoom: 1, x: 0, y: 0 }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afterPhotoId]); // Remover getSetting das dependências

  const beforePhoto = allPhotos.find(p => p.id === beforePhotoId);
  const afterPhoto = allPhotos.find(p => p.id === afterPhotoId);

  // Funções de zoom
  const handleZoomIn = (side: 'before' | 'after') => {
    if (side === 'before') {
      setBeforeState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.2, 3) }));
    } else {
      setAfterState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.2, 3) }));
    }
  };

  const handleZoomOut = (side: 'before' | 'after') => {
    if (side === 'before') {
      setBeforeState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.2, 0.5) }));
    } else {
      setAfterState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.2, 0.5) }));
    }
  };

  // Funções de drag
  const handleMouseDown = (e: React.MouseEvent, side: 'before' | 'after') => {
    e.preventDefault();
    const setState = side === 'before' ? setBeforeState : setAfterState;
    setState(prev => ({
      ...prev,
      isDragging: true,
      dragStart: { x: e.clientX - prev.x, y: e.clientY - prev.y }
    }));
  };

  const handleMouseMove = (e: React.MouseEvent, side: 'before' | 'after') => {
    const state = side === 'before' ? beforeState : afterState;
    if (!state.isDragging) return;

    const setState = side === 'before' ? setBeforeState : setAfterState;
    setState(prev => ({
      ...prev,
      x: e.clientX - prev.dragStart.x,
      y: e.clientY - prev.dragStart.y
    }));
  };

  const handleMouseUp = (side: 'before' | 'after') => {
    const setState = side === 'before' ? setBeforeState : setAfterState;
    setState(prev => ({ ...prev, isDragging: false }));
  };

  // Reset
  const handleReset = (side: 'before' | 'after') => {
    const setState = side === 'before' ? setBeforeState : setAfterState;
    setState(prev => ({ ...prev, zoom: 1, x: 0, y: 0 }));
  };

  // Salvar configurações
  const handleSave = async () => {
    setSaving(true);
    
    const promises = [];
    
    // Salvar foto "antes"
    if (beforePhotoId) {
      promises.push(updateSetting(beforePhotoId, {
        zoom_level: beforeState.zoom,
        position_x: (beforeState.x / 4), // Converter pixels para porcentagem aproximada
        position_y: (beforeState.y / 4)
      }));
    }
    
    // Salvar foto "depois"
    if (afterPhotoId) {
      promises.push(updateSetting(afterPhotoId, {
        zoom_level: afterState.zoom,
        position_x: (afterState.x / 4),
        position_y: (afterState.y / 4)
      }));
    }
    
    await Promise.all(promises);
    
    toast({
      title: 'Configurações salvas!',
      description: 'As fotos foram ajustadas com sucesso'
    });
    
    setSaving(false);
    if (onSaved) onSaved();
  };

  // Toggle visibilidade
  const handleToggleVisibility = async (photoId: string) => {
    const currentVisibility = isPhotoVisible(photoId);
    await updateSetting(photoId, { visible: !currentVisibility });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl">Editor de Comparação - Antes e Depois</DialogTitle>
          <p className="text-sm text-slate-500 mt-2">
            Selecione duas fotos, ajuste zoom e posição arrastando, e salve a configuração
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6">
          {/* Seletores de Fotos */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">📷 Foto ANTES</label>
              <Select value={beforePhotoId} onValueChange={setBeforePhotoId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allPhotos.map(photo => (
                    <SelectItem key={photo.id} value={photo.id}>
                      {photo.label} - {photo.date} ({photo.weight}kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">📷 Foto DEPOIS</label>
              <Select value={afterPhotoId} onValueChange={setAfterPhotoId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allPhotos.map(photo => (
                    <SelectItem key={photo.id} value={photo.id}>
                      {photo.label} - {photo.date} ({photo.weight}kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comparação Lado a Lado */}
          <div className="grid grid-cols-2 gap-4">
            {/* Foto ANTES */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">ANTES</h3>
                  {beforePhoto && (
                    <p className="text-sm text-slate-500">
                      {beforePhoto.date} • {beforePhoto.weight}kg
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isPhotoVisible(beforePhotoId) ? 'default' : 'destructive'}>
                    {isPhotoVisible(beforePhotoId) ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                    {isPhotoVisible(beforePhotoId) ? 'Visível' : 'Oculta'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleVisibility(beforePhotoId)}
                  >
                    {isPhotoVisible(beforePhotoId) ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>
              </div>

              {/* Container da Foto */}
              <div
                ref={beforeContainerRef}
                className="relative w-full h-[500px] bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-200 cursor-move"
                onMouseDown={(e) => handleMouseDown(e, 'before')}
                onMouseMove={(e) => handleMouseMove(e, 'before')}
                onMouseUp={() => handleMouseUp('before')}
                onMouseLeave={() => handleMouseUp('before')}
              >
                {beforePhoto && (
                  <img
                    src={beforePhoto.url}
                    alt="Antes"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                    style={{
                      transform: `scale(${beforeState.zoom}) translate(${beforeState.x / beforeState.zoom}px, ${beforeState.y / beforeState.zoom}px)`,
                      transition: beforeState.isDragging ? 'none' : 'transform 0.1s'
                    }}
                    draggable={false}
                  />
                )}
                <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  Zoom: {beforeState.zoom.toFixed(1)}x
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleZoomOut('before')}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleZoomIn('before')}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleReset('before')}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetar
                </Button>
              </div>
            </div>

            {/* Foto DEPOIS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">DEPOIS</h3>
                  {afterPhoto && (
                    <p className="text-sm text-slate-500">
                      {afterPhoto.date} • {afterPhoto.weight}kg
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isPhotoVisible(afterPhotoId) ? 'default' : 'destructive'}>
                    {isPhotoVisible(afterPhotoId) ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                    {isPhotoVisible(afterPhotoId) ? 'Visível' : 'Oculta'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleVisibility(afterPhotoId)}
                  >
                    {isPhotoVisible(afterPhotoId) ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>
              </div>

              {/* Container da Foto */}
              <div
                ref={afterContainerRef}
                className="relative w-full h-[500px] bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-200 cursor-move"
                onMouseDown={(e) => handleMouseDown(e, 'after')}
                onMouseMove={(e) => handleMouseMove(e, 'after')}
                onMouseUp={() => handleMouseUp('after')}
                onMouseLeave={() => handleMouseUp('after')}
              >
                {afterPhoto && (
                  <img
                    src={afterPhoto.url}
                    alt="Depois"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                    style={{
                      transform: `scale(${afterState.zoom}) translate(${afterState.x / afterState.zoom}px, ${afterState.y / afterState.zoom}px)`,
                      transition: afterState.isDragging ? 'none' : 'transform 0.1s'
                    }}
                    draggable={false}
                  />
                )}
                <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  Zoom: {afterState.zoom.toFixed(1)}x
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleZoomOut('after')}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleZoomIn('after')}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleReset('after')}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetar
                </Button>
              </div>
            </div>
          </div>

          {/* Dica */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <Move className="w-4 h-4 inline mr-2" />
              <strong>Dica:</strong> Clique e arraste as fotos para reposicionar. Use os botões de zoom para ajustar o tamanho.
              As configurações serão salvas e aplicadas quando o paciente visualizar.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t flex justify-between items-center">
          <Button variant="ghost" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
