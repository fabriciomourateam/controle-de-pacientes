import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { usePhotoVisibility } from '@/hooks/use-photo-visibility';
import { Eye, EyeOff, ZoomIn, Move, RotateCcw, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface PhotoData {
  id: string; // ID único para salvar no banco
  url: string;
  label: string;
  date: string;
  weight: string;
  angle: 'frente' | 'lado' | 'lado_2' | 'costas';
  isInitial?: boolean;
}

interface PhotoVisibilityModalProps {
  open: boolean;
  onClose: () => void;
  patient: Patient;
  checkins: Checkin[];
  onSaved?: () => void;
}

export function PhotoVisibilityModal({
  open,
  onClose,
  patient,
  checkins,
  onSaved
}: PhotoVisibilityModalProps) {
  const { toast } = useToast();
  const {
    settings,
    loading,
    isPhotoVisible,
    getSetting,
    updateSetting,
    resetAllSettings
  } = usePhotoVisibility(patient?.telefone);

  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [localZoom, setLocalZoom] = useState<number>(1.0);
  const [localPosX, setLocalPosX] = useState<number>(0);
  const [localPosY, setLocalPosY] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [hideAllPhotos, setHideAllPhotos] = useState(false);

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

  // Selecionar foto e carregar configurações
  const handleSelectPhoto = (photoId: string) => {
    setSelectedPhotoId(photoId);
    const setting = getSetting(photoId);
    if (setting) {
      setLocalZoom(setting.zoom_level);
      setLocalPosX(setting.position_x);
      setLocalPosY(setting.position_y);
    } else {
      setLocalZoom(1.0);
      setLocalPosX(0);
      setLocalPosY(0);
    }
  };

  // Toggle visibilidade
  const handleToggleVisibility = async (photoId: string) => {
    const currentVisibility = isPhotoVisible(photoId);
    await updateSetting(photoId, { visible: !currentVisibility });
  };

  // Ocultar/mostrar todas as fotos de uma vez
  const handleToggleAllPhotos = async (visible: boolean) => {
    setSaving(true);
    setHideAllPhotos(!visible);
    
    // Atualizar todas as fotos
    const promises = allPhotos.map(photo => 
      updateSetting(photo.id, { visible })
    );
    
    await Promise.all(promises);
    
    toast({
      title: visible ? 'Todas as fotos visíveis' : 'Todas as fotos ocultas',
      description: visible 
        ? 'O paciente poderá ver todas as fotos de evolução'
        : 'O paciente não verá nenhuma foto de evolução'
    });
    
    setSaving(false);
  };

  // Salvar ajustes da foto selecionada
  const handleSavePhotoSettings = async () => {
    if (!selectedPhotoId) return;

    setSaving(true);
    const success = await updateSetting(selectedPhotoId, {
      zoom_level: localZoom,
      position_x: localPosX,
      position_y: localPosY
    });

    if (success) {
      toast({
        title: 'Ajustes salvos',
        description: 'As configurações da foto foram atualizadas'
      });
    }
    setSaving(false);
  };

  // Resetar todas as configurações
  const handleResetAll = async () => {
    if (confirm('Tem certeza que deseja resetar todas as configurações? Todas as fotos voltarão a ficar visíveis com zoom e posição padrão.')) {
      await resetAllSettings();
      setSelectedPhotoId(null);
      toast({
        title: 'Configurações resetadas',
        description: 'Todas as fotos voltaram ao padrão'
      });
    }
  };

  // Fechar e notificar
  const handleClose = () => {
    if (onSaved) onSaved();
    onClose();
  };

  const selectedPhoto = allPhotos.find(p => p.id === selectedPhotoId);
  const visibleCount = allPhotos.filter(p => isPhotoVisible(p.id)).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl">Configurar Fotos de Evolução</DialogTitle>
          <DialogDescription>
            Escolha quais fotos o paciente verá no portal e ajuste zoom/posição
          </DialogDescription>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <Badge variant="outline" className="text-sm">
              {visibleCount} de {allPhotos.length} fotos visíveis
            </Badge>
            
            {/* Toggle Global: Ocultar/Mostrar Todas */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
              <label className="text-sm font-medium text-slate-700 cursor-pointer" htmlFor="toggle-all">
                {hideAllPhotos ? '👁️ Mostrar Todas' : '🚫 Ocultar Todas'}
              </label>
              <Switch
                id="toggle-all"
                checked={!hideAllPhotos}
                onCheckedChange={(checked) => handleToggleAllPhotos(checked)}
                disabled={saving}
              />
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetAll}
              className="text-orange-600 hover:text-orange-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetar Tudo
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Lista de Fotos */}
          <div className="w-80 border-r bg-slate-50">
            <ScrollArea className="h-[calc(90vh-180px)]">
              <div className="p-4 space-y-2">
                {allPhotos.map((photo) => {
                  const visible = isPhotoVisible(photo.id);
                  const setting = getSetting(photo.id);
                  const hasCustomSettings = setting && (
                    setting.zoom_level !== 1.0 ||
                    setting.position_x !== 0 ||
                    setting.position_y !== 0
                  );

                  return (
                    <div
                      key={photo.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPhotoId === photo.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                      onClick={() => handleSelectPhoto(photo.id)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{photo.label}</p>
                          <p className="text-xs text-slate-500">
                            {photo.date} • {photo.weight}kg
                          </p>
                        </div>
                        <Switch
                          checked={visible}
                          onCheckedChange={() => handleToggleVisibility(photo.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {hasCustomSettings && (
                        <Badge variant="secondary" className="text-xs">
                          <ZoomIn className="w-3 h-3 mr-1" />
                          Ajustada
                        </Badge>
                      )}
                      {!visible && (
                        <Badge variant="destructive" className="text-xs ml-2">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Oculta
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Preview e Controles */}
          <div className="flex-1 p-6">
            {selectedPhoto ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedPhoto.label}</h3>
                    <p className="text-sm text-slate-500">
                      {selectedPhoto.date} • {selectedPhoto.weight}kg
                    </p>
                  </div>
                  <Badge variant={isPhotoVisible(selectedPhoto.id) ? 'default' : 'destructive'}>
                    {isPhotoVisible(selectedPhoto.id) ? (
                      <><Eye className="w-3 h-3 mr-1" /> Visível</>
                    ) : (
                      <><EyeOff className="w-3 h-3 mr-1" /> Oculta</>
                    )}
                  </Badge>
                </div>

                {/* Preview da Foto */}
                <div className="relative w-full h-96 bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-200">
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: `scale(${localZoom}) translate(${localPosX}%, ${localPosY}%)`
                    }}
                  >
                    <img
                      src={selectedPhoto.url}
                      alt={selectedPhoto.label}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>

                {/* Controles de Zoom */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <ZoomIn className="w-4 h-4" />
                        Zoom: {localZoom.toFixed(1)}x
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocalZoom(1.0)}
                      >
                        Resetar
                      </Button>
                    </div>
                    <Slider
                      value={[localZoom]}
                      onValueChange={([value]) => setLocalZoom(value)}
                      min={0.5}
                      max={3.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Controles de Posição */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Move className="w-4 h-4" />
                        Posição Horizontal: {localPosX.toFixed(0)}%
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocalPosX(0)}
                      >
                        Centralizar
                      </Button>
                    </div>
                    <Slider
                      value={[localPosX]}
                      onValueChange={([value]) => setLocalPosX(value)}
                      min={-100}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Move className="w-4 h-4" />
                        Posição Vertical: {localPosY.toFixed(0)}%
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocalPosY(0)}
                      >
                        Centralizar
                      </Button>
                    </div>
                    <Slider
                      value={[localPosY]}
                      onValueChange={([value]) => setLocalPosY(value)}
                      min={-100}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Botão Salvar Ajustes */}
                <Button
                  onClick={handleSavePhotoSettings}
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Ajustes desta Foto'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Selecione uma foto para editar</p>
                  <p className="text-sm mt-2">
                    Clique em uma foto na lista ao lado para ajustar zoom e posição
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t flex justify-between items-center">
          <p className="text-sm text-slate-500">
            As alterações são salvas automaticamente
          </p>
          <Button onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
