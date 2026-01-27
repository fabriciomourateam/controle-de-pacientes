import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, RotateCcw, Save, X, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhotoData {
  url: string;
  date: string;
  weight: string;
}

interface PhotoState {
  zoom: number;
  x: number;
  y: number;
  isDragging: boolean;
  dragStart: { x: number; y: number };
  // Touch state
  isTouching: boolean;
  touchStart: { x: number; y: number };
  initialPinchDistance: number | null;
  initialPinchZoom: number;
}

interface EditFeaturedComparisonModalProps {
  open: boolean;
  onClose: () => void;
  beforePhoto: PhotoData;
  afterPhoto: PhotoData;
  initialTitle?: string;
  initialDescription?: string;
  initialBeforeZoom?: number;
  initialBeforeX?: number;
  initialBeforeY?: number;
  initialAfterZoom?: number;
  initialAfterX?: number;
  initialAfterY?: number;
  onSave: (data: {
    title: string;
    description?: string;
    beforeZoom: number;
    beforeX: number;
    beforeY: number;
    afterZoom: number;
    afterX: number;
    afterY: number;
  }) => Promise<void>;
}

export function EditFeaturedComparisonModal({
  open,
  onClose,
  beforePhoto,
  afterPhoto,
  initialTitle = 'Minha Transformação',
  initialDescription = '',
  initialBeforeZoom = 1,
  initialBeforeX = 0,
  initialBeforeY = 0,
  initialAfterZoom = 1,
  initialAfterX = 0,
  initialAfterY = 0,
  onSave
}: EditFeaturedComparisonModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);

  const [beforeState, setBeforeState] = useState<PhotoState>({
    zoom: initialBeforeZoom,
    x: initialBeforeX,
    y: initialBeforeY,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    isTouching: false,
    touchStart: { x: 0, y: 0 },
    initialPinchDistance: null,
    initialPinchZoom: 1
  });

  const [afterState, setAfterState] = useState<PhotoState>({
    zoom: initialAfterZoom,
    x: initialAfterX,
    y: initialAfterY,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    isTouching: false,
    touchStart: { x: 0, y: 0 },
    initialPinchDistance: null,
    initialPinchZoom: 1
  });

  const beforeContainerRef = useRef<HTMLDivElement>(null);
  const afterContainerRef = useRef<HTMLDivElement>(null);
  const beforePreviewRef = useRef<HTMLDivElement>(null);
  const afterPreviewRef = useRef<HTMLDivElement>(null);

  // Adicionar listener de wheel com { passive: false } para permitir preventDefault
  useEffect(() => {
    const beforeContainer = beforeContainerRef.current;
    const afterContainer = afterContainerRef.current;
    const beforePreview = beforePreviewRef.current;
    const afterPreview = afterPreviewRef.current;

    const handleWheelBefore = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setBeforeState(prev => ({ 
        ...prev, 
        zoom: Math.max(0.5, Math.min(3, prev.zoom + delta))
      }));
    };

    const handleWheelAfter = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setAfterState(prev => ({ 
        ...prev, 
        zoom: Math.max(0.5, Math.min(3, prev.zoom + delta))
      }));
    };

    // Adicionar listeners nos containers de edição
    if (beforeContainer) {
      beforeContainer.addEventListener('wheel', handleWheelBefore, { passive: false });
    }
    if (afterContainer) {
      afterContainer.addEventListener('wheel', handleWheelAfter, { passive: false });
    }

    // Adicionar listeners no preview também
    if (beforePreview) {
      beforePreview.addEventListener('wheel', handleWheelBefore, { passive: false });
    }
    if (afterPreview) {
      afterPreview.addEventListener('wheel', handleWheelAfter, { passive: false });
    }

    return () => {
      if (beforeContainer) {
        beforeContainer.removeEventListener('wheel', handleWheelBefore);
      }
      if (afterContainer) {
        afterContainer.removeEventListener('wheel', handleWheelAfter);
      }
      if (beforePreview) {
        beforePreview.removeEventListener('wheel', handleWheelBefore);
      }
      if (afterPreview) {
        afterPreview.removeEventListener('wheel', handleWheelAfter);
      }
    };
  }, []);

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

  // Touch handlers para mobile
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent, side: 'before' | 'after') => {
    const setState = side === 'before' ? setBeforeState : setAfterState;
    const state = side === 'before' ? beforeState : afterState;

    if (e.touches.length === 1) {
      // Single touch - drag
      const touch = e.touches[0];
      setState(prev => ({
        ...prev,
        isTouching: true,
        touchStart: { x: touch.clientX - prev.x, y: touch.clientY - prev.y }
      }));
    } else if (e.touches.length === 2) {
      // Two touches - pinch zoom
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      setState(prev => ({
        ...prev,
        isTouching: true,
        initialPinchDistance: distance,
        initialPinchZoom: state.zoom
      }));
    }
  };

  const handleTouchMove = (e: React.TouchEvent, side: 'before' | 'after') => {
    const state = side === 'before' ? beforeState : afterState;
    if (!state.isTouching) return;

    const setState = side === 'before' ? setBeforeState : setAfterState;

    if (e.touches.length === 1 && state.initialPinchDistance === null) {
      // Single touch drag
      const touch = e.touches[0];
      setState(prev => ({
        ...prev,
        x: touch.clientX - prev.touchStart.x,
        y: touch.clientY - prev.touchStart.y
      }));
    } else if (e.touches.length === 2 && state.initialPinchDistance !== null) {
      // Pinch zoom
      e.preventDefault(); // Prevent default pinch zoom behavior
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / state.initialPinchDistance;
      const newZoom = Math.max(0.5, Math.min(3, state.initialPinchZoom * scale));
      
      setState(prev => ({
        ...prev,
        zoom: newZoom
      }));
    }
  };

  const handleTouchEnd = (side: 'before' | 'after') => {
    const setState = side === 'before' ? setBeforeState : setAfterState;
    setState(prev => ({
      ...prev,
      isTouching: false,
      initialPinchDistance: null
    }));
  };

  // Reset
  const handleReset = (side: 'before' | 'after') => {
    const setState = side === 'before' ? setBeforeState : setAfterState;
    setState(prev => ({ ...prev, zoom: 1, x: 0, y: 0 }));
  };

  // Salvar
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        title,
        description: description || undefined,
        beforeZoom: beforeState.zoom,
        beforeX: beforeState.x,
        beforeY: beforeState.y,
        afterZoom: afterState.zoom,
        afterX: afterState.x,
        afterY: afterState.y,
      });
      
      toast({
        title: 'Comparação salva!',
        description: 'As configurações foram aplicadas com sucesso'
      });
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a comparação',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-6xl h-[95vh] flex flex-col p-0 bg-slate-900 border-slate-700">
        <DialogHeader className="p-4 md:p-6 pb-3 md:pb-4 border-b border-slate-700 flex-shrink-0">
          <DialogTitle className="text-xl md:text-2xl text-white">Editar Comparação Antes/Depois</DialogTitle>
          <p className="text-xs md:text-sm text-slate-400 mt-2">
            Ajuste o zoom e posição das fotos, e personalize o título
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          {/* Configurações de Texto */}
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="title" className="text-white">Título da Transformação</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Minha Jornada de 3 Meses"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Conte um pouco sobre sua jornada..."
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
              />
            </div>
          </div>

          {/* Comparação Lado a Lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Foto ANTES */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-white">ANTES</h3>
                  <p className="text-sm text-slate-400">
                    {beforePhoto.date} • {beforePhoto.weight} kg
                  </p>
                </div>
              </div>

              {/* Container da Foto */}
              <div
                ref={beforeContainerRef}
                className="relative w-full h-[300px] md:h-[400px] bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 cursor-move touch-none"
                onMouseDown={(e) => handleMouseDown(e, 'before')}
                onMouseMove={(e) => handleMouseMove(e, 'before')}
                onMouseUp={() => handleMouseUp('before')}
                onMouseLeave={() => handleMouseUp('before')}
                onTouchStart={(e) => handleTouchStart(e, 'before')}
                onTouchMove={(e) => handleTouchMove(e, 'before')}
                onTouchEnd={() => handleTouchEnd('before')}
              >
                <img
                  src={beforePhoto.url}
                  alt="Antes"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                  style={{
                    transform: `scale(${beforeState.zoom}) translate(${beforeState.x / beforeState.zoom}px, ${beforeState.y / beforeState.zoom}px)`,
                    transition: (beforeState.isDragging || beforeState.isTouching) ? 'none' : 'transform 0.1s'
                  }}
                  draggable={false}
                />
                <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  Zoom: {beforeState.zoom.toFixed(1)}x
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleZoomOut('before')} className="bg-slate-800 border-slate-700 text-white">
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleZoomIn('before')} className="bg-slate-800 border-slate-700 text-white">
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleReset('before')} className="text-slate-400 hover:text-white">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetar
                </Button>
              </div>
            </div>

            {/* Foto DEPOIS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-white">DEPOIS</h3>
                  <p className="text-sm text-slate-400">
                    {afterPhoto.date} • {afterPhoto.weight} kg
                  </p>
                </div>
              </div>

              {/* Container da Foto */}
              <div
                ref={afterContainerRef}
                className="relative w-full h-[300px] md:h-[400px] bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 cursor-move touch-none"
                onMouseDown={(e) => handleMouseDown(e, 'after')}
                onMouseMove={(e) => handleMouseMove(e, 'after')}
                onMouseUp={() => handleMouseUp('after')}
                onMouseLeave={() => handleMouseUp('after')}
                onTouchStart={(e) => handleTouchStart(e, 'after')}
                onTouchMove={(e) => handleTouchMove(e, 'after')}
                onTouchEnd={() => handleTouchEnd('after')}
              >
                <img
                  src={afterPhoto.url}
                  alt="Depois"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                  style={{
                    transform: `scale(${afterState.zoom}) translate(${afterState.x / afterState.zoom}px, ${afterState.y / afterState.zoom}px)`,
                    transition: (afterState.isDragging || afterState.isTouching) ? 'none' : 'transform 0.1s'
                  }}
                  draggable={false}
                />
                <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  Zoom: {afterState.zoom.toFixed(1)}x
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleZoomOut('after')} className="bg-slate-800 border-slate-700 text-white">
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleZoomIn('after')} className="bg-slate-800 border-slate-700 text-white">
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleReset('after')} className="text-slate-400 hover:text-white">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetar
                </Button>
              </div>
            </div>
          </div>

          {/* Preview Exata - Como ficará na página pública */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              Preview: Como ficará na página pública
            </h3>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Preview ANTES - EXATAMENTE como na página pública */}
                  <div 
                    ref={beforePreviewRef}
                    className="relative group cursor-zoom-in"
                  >
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-900/90 to-transparent p-2 z-10">
                      <Badge className="bg-red-500/80 text-white border-0 text-xs">ANTES</Badge>
                      <p className="text-white text-xs font-medium mt-1">{beforePhoto.date}</p>
                      <p className="text-slate-300 text-[10px]">{beforePhoto.weight} kg</p>
                    </div>
                    {/* Preview com aspect-ratio 3:4 e object-contain - foto completa sem corte */}
                    <div className="aspect-[3/4] relative overflow-hidden bg-slate-900 rounded flex items-center justify-center">
                      <img
                        src={beforePhoto.url}
                        alt="Preview Antes"
                        className="max-w-full max-h-full object-contain"
                        style={{
                          transform: `scale(${beforeState.zoom}) translate(${beforeState.x / beforeState.zoom}px, ${beforeState.y / beforeState.zoom}px)`,
                          transformOrigin: 'center center'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs z-10 hidden md:block">
                      Use scroll para zoom
                    </div>
                  </div>

                  {/* Preview DEPOIS - EXATAMENTE como na página pública */}
                  <div 
                    ref={afterPreviewRef}
                    className="relative group cursor-zoom-in"
                  >
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-900/90 to-transparent p-2 z-10">
                      <Badge className="bg-emerald-500/80 text-white border-0 text-xs">DEPOIS</Badge>
                      <p className="text-white text-xs font-medium mt-1">{afterPhoto.date}</p>
                      <p className="text-slate-300 text-[10px]">{afterPhoto.weight} kg</p>
                    </div>
                    {/* Preview com aspect-ratio 3:4 e object-contain - foto completa sem corte */}
                    <div className="aspect-[3/4] relative overflow-hidden bg-slate-900 rounded flex items-center justify-center">
                      <img
                        src={afterPhoto.url}
                        alt="Preview Depois"
                        className="max-w-full max-h-full object-contain"
                        style={{
                          transform: `scale(${afterState.zoom}) translate(${afterState.x / afterState.zoom}px, ${afterState.y / afterState.zoom}px)`,
                          transformOrigin: 'center center'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs z-10 hidden md:block">
                      Use scroll para zoom
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dica */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              💡 <strong>Dica:</strong> 
              <span className="hidden md:inline"> Clique e arraste as fotos para reposicionar. Use o scroll do mouse (em qualquer foto) ou os botões +/- para ajustar o zoom.</span>
              <span className="md:hidden"> Arraste com o dedo para reposicionar. Use dois dedos (pinçar) para dar zoom ou use os botões +/-.</span>
              {' '}O preview mostra EXATAMENTE como ficará na página pública. A foto será salva na posição que você deixar!
            </p>
          </div>
        </div>

        {/* Footer - Fixo na parte inferior */}
        <div className="p-4 md:p-6 pt-3 md:pt-4 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 flex-shrink-0 bg-slate-900">
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white w-full sm:w-auto">
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Comparação'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
