import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { convertGoogleDriveUrl, isGoogleDriveUrl } from '@/lib/google-drive-utils';
import { GoogleDriveImage } from '../ui/google-drive-image';
import type { Database } from '@/integrations/supabase/types';

type Patient = Database['public']['Tables']['patients']['Row'];
type Checkin = Database['public']['Tables']['checkin']['Row'];

interface CheckinPhotoComparisonProps {
  patient: Patient | null;
  checkins: Checkin[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PhotoAngle = 'frente' | 'lado' | 'lado_2' | 'costas';

interface PhotoSet {
  frente?: string;
  lado?: string;
  lado_2?: string;
  costas?: string;
}

export function CheckinPhotoComparison({
  patient,
  checkins,
  open,
  onOpenChange
}: CheckinPhotoComparisonProps) {
  const [initialPhotos, setInitialPhotos] = useState<PhotoSet>({});
  const [currentPhotos, setCurrentPhotos] = useState<PhotoSet>({});
  const [selectedAngleInitial, setSelectedAngleInitial] = useState<PhotoAngle>('frente');
  const [selectedAngleCurrent, setSelectedAngleCurrent] = useState<PhotoAngle>('frente');
  const [loading, setLoading] = useState(false);
  const [initialDate, setInitialDate] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    if (open && patient) {
      setLoading(true);
      try {
        // Fotos iniciais do paciente
        const initialPhotosData: PhotoSet = {
          frente: (patient as any).foto_inicial_frente || undefined,
          lado: (patient as any).foto_inicial_lado || undefined,
          lado_2: (patient as any).foto_inicial_lado_2 || undefined,
          costas: (patient as any).foto_inicial_costas || undefined
        };
        setInitialPhotos(initialPhotosData);
        setInitialDate((patient as any).data_fotos_iniciais 
          ? new Date((patient as any).data_fotos_iniciais).toLocaleDateString('pt-BR')
          : 'Dados Iniciais');

        // Fotos atuais do último check-in (mais recente)
        const sortedCheckins = [...checkins].sort((a, b) => 
          new Date(b.data_checkin).getTime() - new Date(a.data_checkin).getTime()
        );
        const lastCheckin = sortedCheckins[0];
        
        const currentPhotosData: PhotoSet = {
          frente: lastCheckin?.foto_1 || undefined,
          lado: lastCheckin?.foto_2 || undefined,
          lado_2: lastCheckin?.foto_3 || undefined,
          costas: lastCheckin?.foto_4 || undefined
        };
        setCurrentPhotos(currentPhotosData);
        setCurrentDate(lastCheckin?.data_checkin 
          ? new Date(lastCheckin.data_checkin).toLocaleDateString('pt-BR')
          : 'Último Check-in');

        // Selecionar primeiro ângulo disponível
        const angles: PhotoAngle[] = ['frente', 'lado', 'lado_2', 'costas'];
        const availableAngleInitial = angles.find(angle => initialPhotosData[angle]);
        const availableAngleCurrent = angles.find(angle => currentPhotosData[angle]);
        
        if (availableAngleInitial) {
          setSelectedAngleInitial(availableAngleInitial);
        }
        if (availableAngleCurrent) {
          setSelectedAngleCurrent(availableAngleCurrent);
        }
      } catch (error) {
        console.error('Erro ao carregar fotos:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Reset estados ao fechar
      setInitialPhotos({});
      setCurrentPhotos({});
      setSelectedAngleInitial('frente');
      setSelectedAngleCurrent('frente');
      setInitialDate('');
      setCurrentDate('');
    }
  }, [open, patient, checkins]);

  const getPhotoUrl = (url: string | undefined) => {
    if (!url) return null;
    if (isGoogleDriveUrl(url)) {
      return convertGoogleDriveUrl(url);
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
  
  const getAvailableAngles = (photoSet: PhotoSet) => {
    return angles.filter(angle => photoSet[angle]);
  };

  const availableAnglesInitial = getAvailableAngles(initialPhotos);
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
        <div className="w-full h-[400px] flex items-center justify-center bg-slate-800/50 rounded border border-slate-700">
          <span className="text-xs text-slate-500">Sem foto</span>
        </div>
      );
    }

    const url = getPhotoUrl(photoUrl);

    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-slate-900 rounded border border-slate-700 overflow-hidden">
        {isGoogleDriveUrl(photoUrl) ? (
          <GoogleDriveImage
            src={photoUrl}
            alt={`${source} - ${date}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src={url || photoUrl}
            alt={`${source} - ${date}`}
            className="w-full h-full object-contain"
          />
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[45vw] w-full max-h-[95vh] p-0 bg-slate-900 border-slate-700 flex flex-col">
        <DialogHeader className="p-3 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-slate-200 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Comparação de Fotos - Inicial vs Atual
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
            <div className="flex-1 grid gap-3 p-3 overflow-auto min-h-0 grid-cols-1 md:grid-cols-2">
              {/* Coluna 1: Inicial */}
              <div className="flex flex-col">
                <div className="mb-2 text-center">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/30 text-xs font-medium">
                      ⭐ Dados Iniciais
                    </div>
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
                <div className="w-full">
                  {renderPhoto(initialPhotos[selectedAngleInitial], initialDate, 'Inicial')}
                </div>
              </div>

              {/* Coluna 2: Atual */}
              <div className="flex flex-col">
                <div className="mb-2 text-center">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-medium">
                      📸 Último Check-in
                    </div>
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
                <div className="w-full">
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
