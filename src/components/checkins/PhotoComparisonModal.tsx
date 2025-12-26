import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMediaType } from '@/lib/media-utils';
import { convertGoogleDriveUrl, isGoogleDriveUrl } from '@/lib/google-drive-utils';
import { GoogleDriveImage } from '../ui/google-drive-image';
import { supabase } from '@/integrations/supabase/client';

interface PhotoComparisonModalProps {
  checkinId: string;
  telefone: string;
  checkinDate: string | Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previousCheckinId?: string | null;
}

type PhotoAngle = 'frente' | 'lado' | 'lado_2' | 'costas';

interface PhotoSet {
  frente?: string;
  lado?: string;
  lado_2?: string;
  costas?: string;
}

export function PhotoComparisonModal({
  checkinId,
  telefone,
  checkinDate,
  open,
  onOpenChange,
  previousCheckinId
}: PhotoComparisonModalProps) {
  const [initialPhotos, setInitialPhotos] = useState<PhotoSet>({});
  const [previousPhotos, setPreviousPhotos] = useState<PhotoSet>({});
  const [currentPhotos, setCurrentPhotos] = useState<PhotoSet>({});
  const [selectedAngleInitial, setSelectedAngleInitial] = useState<PhotoAngle>('frente');
  const [selectedAnglePrevious, setSelectedAnglePrevious] = useState<PhotoAngle>('frente');
  const [selectedAngleCurrent, setSelectedAngleCurrent] = useState<PhotoAngle>('frente');
  const [loading, setLoading] = useState(false);
  const [initialDate, setInitialDate] = useState<string>('');
  const [previousDate, setPreviousDate] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  const loadPhotos = async () => {
    setLoading(true);
    try {
      // 1. Buscar fotos iniciais
      const { data: patient } = await supabase
        .from('patients')
        .select('foto_inicial_frente, foto_inicial_lado, foto_inicial_lado_2, foto_inicial_costas, data_fotos_iniciais')
        .eq('telefone', telefone)
        .single();

      if (patient) {
        setInitialPhotos({
          frente: patient.foto_inicial_frente || undefined,
          lado: patient.foto_inicial_lado || undefined,
          lado_2: patient.foto_inicial_lado_2 || undefined,
          costas: patient.foto_inicial_costas || undefined
        });
        setInitialDate(patient.data_fotos_iniciais 
          ? new Date(patient.data_fotos_iniciais).toLocaleDateString('pt-BR')
          : 'Dados Iniciais');
      }

      // 2. Buscar check-in anterior
      let previousCheckinData = null;
      if (previousCheckinId) {
        const { data } = await supabase
          .from('checkin')
          .select('foto_1, foto_2, foto_3, foto_4, data_checkin')
          .eq('id', previousCheckinId)
          .single();
        previousCheckinData = data;
      } else {
        const checkinDateStr = typeof checkinDate === 'string' ? checkinDate : checkinDate.toISOString().split('T')[0];
        const { data } = await supabase
          .from('checkin')
          .select('foto_1, foto_2, foto_3, foto_4, data_checkin')
          .eq('telefone', telefone)
          .lt('data_checkin', checkinDateStr)
          .order('data_checkin', { ascending: false })
          .limit(1)
          .maybeSingle();
        previousCheckinData = data;
      }

      if (previousCheckinData) {
        setPreviousPhotos({
          frente: previousCheckinData.foto_1 || undefined,
          lado: previousCheckinData.foto_2 || undefined,
          lado_2: previousCheckinData.foto_3 || undefined,
          costas: previousCheckinData.foto_4 || undefined
        });
        setPreviousDate(new Date(previousCheckinData.data_checkin).toLocaleDateString('pt-BR'));
      }

      // 3. Buscar check-in atual
      const { data: currentCheckin } = await supabase
        .from('checkin')
        .select('foto_1, foto_2, foto_3, foto_4, data_checkin')
        .eq('id', checkinId)
        .single();

      if (currentCheckin) {
        setCurrentPhotos({
          frente: currentCheckin.foto_1 || undefined,
          lado: currentCheckin.foto_2 || undefined,
          lado_2: currentCheckin.foto_3 || undefined,
          costas: currentCheckin.foto_4 || undefined
        });
        setCurrentDate(new Date(currentCheckin.data_checkin || checkinDate).toLocaleDateString('pt-BR'));
      }

      // Selecionar primeiro ângulo disponível usando os dados já carregados
      const angles: PhotoAngle[] = ['frente', 'lado', 'lado_2', 'costas'];
      const tempInitial = {
        frente: patient?.foto_inicial_frente || undefined,
        lado: patient?.foto_inicial_lado || undefined,
        lado_2: patient?.foto_inicial_lado_2 || undefined,
        costas: patient?.foto_inicial_costas || undefined
      };
      const tempPrevious = previousCheckinData ? {
        frente: previousCheckinData.foto_1 || undefined,
        lado: previousCheckinData.foto_2 || undefined,
        lado_2: previousCheckinData.foto_3 || undefined,
        costas: previousCheckinData.foto_4 || undefined
      } : {};
      const tempCurrent = currentCheckin ? {
        frente: currentCheckin.foto_1 || undefined,
        lado: currentCheckin.foto_2 || undefined,
        lado_2: currentCheckin.foto_3 || undefined,
        costas: currentCheckin.foto_4 || undefined
      } : {};

      // Selecionar primeiro ângulo disponível para cada coluna
      const availableAngleInitial = angles.find(angle => tempInitial[angle]);
      const availableAnglePrevious = angles.find(angle => tempPrevious[angle]);
      const availableAngleCurrent = angles.find(angle => tempCurrent[angle]);
      
      if (availableAngleInitial) {
        setSelectedAngleInitial(availableAngleInitial);
      }
      if (availableAnglePrevious) {
        setSelectedAnglePrevious(availableAnglePrevious);
      }
      if (availableAngleCurrent) {
        setSelectedAngleCurrent(availableAngleCurrent);
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadPhotos();
    } else {
      // Reset estados ao fechar
      setInitialPhotos({});
      setPreviousPhotos({});
      setCurrentPhotos({});
      setSelectedAngleInitial('frente');
      setSelectedAnglePrevious('frente');
      setSelectedAngleCurrent('frente');
      setInitialDate('');
      setPreviousDate('');
      setCurrentDate('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, checkinId, telefone, checkinDate, previousCheckinId]);

  const getPhotoUrl = (url: string | undefined, isVideo?: boolean) => {
    if (!url) return null;
    if (isGoogleDriveUrl(url)) {
      return convertGoogleDriveUrl(url, isVideo || false);
    }
    return url;
  };

  const getAngleLabel = (angle: PhotoAngle) => {
    switch (angle) {
      case 'frente': return '📷 Foto 1';
      case 'lado': return '📷 Foto 2';
      case 'lado_2': return '📷 Foto 3';
      case 'costas': return '📷 Foto 4';
    }
  };

  const angles: PhotoAngle[] = ['frente', 'lado', 'lado_2', 'costas'];
  
  // Obter ângulos disponíveis para cada coluna
  const getAvailableAngles = (photoSet: PhotoSet) => {
    return angles.filter(angle => photoSet[angle]);
  };

  const availableAnglesInitial = getAvailableAngles(initialPhotos);
  const availableAnglesPrevious = getAvailableAngles(previousPhotos);
  const availableAnglesCurrent = getAvailableAngles(currentPhotos);

  const navigateAngle = (photoSet: PhotoSet, currentAngle: PhotoAngle, direction: 'prev' | 'next', setAngle: (angle: PhotoAngle) => void) => {
    const available = getAvailableAngles(photoSet);
    if (available.length === 0) return;
    
    const currentIndex = available.indexOf(currentAngle);
    let newIndex: number;
    
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? available.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === available.length - 1 ? 0 : currentIndex + 1;
    }
    
    setAngle(available[newIndex]);
  };

  const renderPhoto = (photoUrl: string | undefined, date: string, source: string) => {
    if (!photoUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-800/50 rounded border border-slate-700 min-h-[300px]">
          <span className="text-xs text-slate-500">Sem foto</span>
        </div>
      );
    }

    const isVideo = getMediaType(photoUrl) === 'video';
    const url = getPhotoUrl(photoUrl, isVideo);

    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded border border-slate-700 overflow-hidden min-h-[300px]">
        {isVideo ? (
          <video
            src={url || photoUrl}
            controls
            className="w-full h-full object-contain"
          />
        ) : (
          <GoogleDriveImage
            src={photoUrl}
            alt={`${source} - ${date}`}
            className="w-full h-full object-contain"
          />
        )}
      </div>
    );
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[90vh] p-0 bg-slate-900 border-slate-700 flex flex-col">
        <DialogHeader className="p-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-slate-200 flex items-center gap-2">
              Comparação de Fotos
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-white h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center flex-1 p-8">
            <div className="text-slate-400">Carregando fotos...</div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Grid de comparação */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 overflow-auto min-h-0">
              {/* Coluna 1: Inicial */}
              <div className="flex flex-col">
                <div className="mb-2 text-center">
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/30 text-xs font-medium">
                    ⭐ Dados Iniciais
                  </div>
                  {initialDate && (
                    <div className="text-xs text-slate-400 mt-1">{initialDate}</div>
                  )}
                </div>
                {/* Seletor de ângulo para Inicial */}
                {availableAnglesInitial.length > 0 && (
                  <div className="mb-2 flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateAngle(initialPhotos, selectedAngleInitial, 'prev', setSelectedAngleInitial)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                      disabled={availableAnglesInitial.length <= 1}
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <div className="flex gap-1">
                      {availableAnglesInitial.map((angle) => (
                        <Button
                          key={angle}
                          variant={selectedAngleInitial === angle ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedAngleInitial(angle)}
                          className={`text-[10px] h-6 px-1.5 ${
                            selectedAngleInitial === angle
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                          }`}
                        >
                          {getAngleLabel(angle)}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateAngle(initialPhotos, selectedAngleInitial, 'next', setSelectedAngleInitial)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                      disabled={availableAnglesInitial.length <= 1}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <div className="flex-1 min-h-[300px]">
                  {renderPhoto(initialPhotos[selectedAngleInitial], initialDate, 'Inicial')}
                </div>
              </div>

              {/* Coluna 2: Check-in Anterior */}
              <div className="flex flex-col">
                <div className="mb-2 text-center">
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium">
                    📅 Check-in Anterior
                  </div>
                  {previousDate && (
                    <div className="text-xs text-slate-400 mt-1">{previousDate}</div>
                  )}
                </div>
                {/* Seletor de ângulo para Anterior */}
                {previousDate && availableAnglesPrevious.length > 0 && (
                  <div className="mb-2 flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateAngle(previousPhotos, selectedAnglePrevious, 'prev', setSelectedAnglePrevious)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                      disabled={availableAnglesPrevious.length <= 1}
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <div className="flex gap-1">
                      {availableAnglesPrevious.map((angle) => (
                        <Button
                          key={angle}
                          variant={selectedAnglePrevious === angle ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedAnglePrevious(angle)}
                          className={`text-[10px] h-6 px-1.5 ${
                            selectedAnglePrevious === angle
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                          }`}
                        >
                          {getAngleLabel(angle)}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateAngle(previousPhotos, selectedAnglePrevious, 'next', setSelectedAnglePrevious)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                      disabled={availableAnglesPrevious.length <= 1}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <div className="flex-1 min-h-[300px]">
                  {previousDate ? (
                    renderPhoto(previousPhotos[selectedAnglePrevious], previousDate, 'Anterior')
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800/50 rounded border border-slate-700 min-h-[300px]">
                      <span className="text-xs text-slate-500">Sem check-in anterior</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna 3: Check-in Atual */}
              <div className="flex flex-col">
                <div className="mb-2 text-center">
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-medium">
                    📸 Check-in Atual
                  </div>
                  {currentDate && (
                    <div className="text-xs text-slate-400 mt-1">{currentDate}</div>
                  )}
                </div>
                {/* Seletor de ângulo para Atual */}
                {availableAnglesCurrent.length > 0 && (
                  <div className="mb-2 flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateAngle(currentPhotos, selectedAngleCurrent, 'prev', setSelectedAngleCurrent)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                      disabled={availableAnglesCurrent.length <= 1}
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <div className="flex gap-1">
                      {availableAnglesCurrent.map((angle) => (
                        <Button
                          key={angle}
                          variant={selectedAngleCurrent === angle ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedAngleCurrent(angle)}
                          className={`text-[10px] h-6 px-1.5 ${
                            selectedAngleCurrent === angle
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                          }`}
                        >
                          {getAngleLabel(angle)}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateAngle(currentPhotos, selectedAngleCurrent, 'next', setSelectedAngleCurrent)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                      disabled={availableAnglesCurrent.length <= 1}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <div className="flex-1 min-h-[300px]">
                  {renderPhoto(currentPhotos[selectedAngleCurrent], currentDate, 'Atual')}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

