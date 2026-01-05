import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, X, Camera } from 'lucide-react';
import { getMediaType } from '@/lib/media-utils';
import { convertGoogleDriveUrl, isGoogleDriveUrl } from '@/lib/google-drive-utils';
import { GoogleDriveImage } from '../ui/google-drive-image';
import { supabase } from '@/integrations/supabase/client';

interface PhotoData {
  url: string;
  label: string;
  date?: string;
  source: 'current' | 'previous' | 'initial';
  isVideo?: boolean;
}

interface CheckinPhotosViewerProps {
  checkinId: string;
  telefone: string;
  checkinDate: string | Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoSource?: 'current' | 'previous' | 'initial' | 'all'; // Filtro de origem das fotos
  previousCheckinId?: string | null; // ID do checkin anterior (opcional, para melhor performance)
  onAddInitialPhotos?: () => void; // Callback para adicionar fotos iniciais quando não houver
}

export function CheckinPhotosViewer({
  checkinId,
  telefone,
  checkinDate,
  open,
  onOpenChange,
  photoSource = 'all',
  previousCheckinId,
  onAddInitialPhotos
}: CheckinPhotosViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [previousCheckin, setPreviousCheckin] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);

  const loadPhotos = React.useCallback(async () => {
    setLoading(true);
    try {
      const allPhotos: PhotoData[] = [];

      // 1. Buscar fotos do checkin atual
      const { data: currentCheckin } = await supabase
        .from('checkin')
        .select('foto_1, foto_2, foto_3, foto_4, data_checkin')
        .eq('id', checkinId)
        .single();

      if (currentCheckin && (photoSource === 'all' || photoSource === 'current')) {
        const currentDate = new Date(currentCheckin.data_checkin || checkinDate).toLocaleDateString('pt-BR');
        [currentCheckin.foto_1, currentCheckin.foto_2, currentCheckin.foto_3, currentCheckin.foto_4]
          .filter(Boolean)
          .forEach((url, index) => {
            if (url) {
              const isVideo = getMediaType(url) === 'video';
              allPhotos.push({
                url,
                label: `Check-in ${currentDate} - Foto ${index + 1}`,
                date: currentDate,
                source: 'current',
                isVideo
              });
            }
          });
      }

      // 2. Buscar checkin anterior
      if (photoSource === 'all' || photoSource === 'previous') {
        let previousCheckinData = null;
        
        // Se temos o ID do checkin anterior, usar diretamente (mais eficiente)
        if (previousCheckinId) {
          const { data } = await supabase
            .from('checkin')
            .select('id, foto_1, foto_2, foto_3, foto_4, data_checkin')
            .eq('id', previousCheckinId)
            .single();
          
          if (data) {
            previousCheckinData = data;
          }
        } else {
          // Fallback: buscar por data
          const checkinDateStr = typeof checkinDate === 'string' ? checkinDate : checkinDate.toISOString().split('T')[0];
          const { data: previousCheckins } = await supabase
            .from('checkin')
            .select('id, foto_1, foto_2, foto_3, foto_4, data_checkin')
            .eq('telefone', telefone)
            .lt('data_checkin', checkinDateStr)
            .order('data_checkin', { ascending: false })
            .limit(1);

          if (previousCheckins && previousCheckins.length > 0) {
            previousCheckinData = previousCheckins[0];
          }
        }

        if (previousCheckinData) {
          setPreviousCheckin(previousCheckinData);
          const prevDate = new Date(previousCheckinData.data_checkin).toLocaleDateString('pt-BR');
          [previousCheckinData.foto_1, previousCheckinData.foto_2, previousCheckinData.foto_3, previousCheckinData.foto_4]
            .filter(Boolean)
            .forEach((url, index) => {
              if (url) {
                const isVideo = getMediaType(url) === 'video';
                allPhotos.push({
                  url,
                  label: `Check-in Anterior (${prevDate}) - Foto ${index + 1}`,
                  date: prevDate,
                  source: 'previous',
                  isVideo
                });
              }
            });
        }
      }

      // 3. Buscar fotos iniciais do paciente
      const { data: patient } = await supabase
        .from('patients')
        .select('foto_inicial_frente, foto_inicial_lado, foto_inicial_lado_2, foto_inicial_costas, data_fotos_iniciais')
        .eq('telefone', telefone)
        .single();

      if (patient && (photoSource === 'all' || photoSource === 'initial')) {
        setPatientData(patient);
        const initialDate = patient.data_fotos_iniciais 
          ? new Date(patient.data_fotos_iniciais).toLocaleDateString('pt-BR')
          : 'Dados Iniciais';
        
        const initialPhotos = [
          { url: patient.foto_inicial_frente, label: 'Frente' },
          { url: patient.foto_inicial_lado, label: 'Lado D' },
          { url: patient.foto_inicial_lado_2, label: 'Lado E' },
          { url: patient.foto_inicial_costas, label: 'Costas' }
        ];

        initialPhotos.forEach((photo) => {
          if (photo.url) {
            const isVideo = getMediaType(photo.url) === 'video';
            allPhotos.push({
              url: photo.url,
              label: `Dados Iniciais (${initialDate}) - ${photo.label}`,
              date: initialDate,
              source: 'initial',
              isVideo
            });
          }
        });
      }

      setPhotos(allPhotos);
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    } finally {
      setLoading(false);
    }
  }, [checkinId, telefone, checkinDate, photoSource, previousCheckinId]);

  // Carregar fotos quando o dialog abrir
  React.useEffect(() => {
    if (open) {
      loadPhotos();
    } else {
      // Reset quando fechar
      setCurrentIndex(0);
      setPhotos([]);
    }
  }, [open, loadPhotos]);

  const currentPhoto = photos[currentIndex];
  const hasPhotos = photos.length > 0;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Navegação com teclado
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') onOpenChange(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, photos.length]);

  // Navegação com swipe (arrastar)
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) goToNext();
    if (isRightSwipe) goToPrevious();
  };

  const getPhotoUrl = (url: string) => {
    if (isGoogleDriveUrl(url)) {
      return convertGoogleDriveUrl(url, currentPhoto?.isVideo || false);
    }
    return url;
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'current':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'previous':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'initial':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'current':
        return 'Check-in Atual';
      case 'previous':
        return 'Check-in Anterior';
      case 'initial':
        return 'Dados Iniciais';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[90vw] max-h-[85vh] p-0 bg-slate-900 border-slate-700 flex flex-col" style={{ display: 'flex', flexDirection: 'column' }}>
        <DialogHeader className="p-3 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-slate-200 flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4" />
              Visualização de Fotos
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
          <div className="flex items-center justify-center flex-1 min-h-0 p-4">
            <div className="text-slate-400">Carregando fotos...</div>
          </div>
        ) : !hasPhotos ? (
          <div className="flex items-center justify-center flex-1 min-h-0 p-4">
            <div className="text-center text-slate-400">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="mb-4">
                {photoSource === 'initial' 
                  ? 'Nenhuma foto inicial disponível' 
                  : 'Nenhuma foto disponível para este check-in'}
              </p>
              {photoSource === 'initial' && onAddInitialPhotos && (
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onAddInitialPhotos();
                  }}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  <Camera className="w-4 h-4" />
                  Adicionar Fotos Iniciais
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="relative flex-1 flex flex-col min-h-0" style={{ overflow: 'hidden' }}>
            {/* Foto atual */}
            <div
              className="flex-1 flex items-start justify-center bg-slate-950 p-2"
              style={{ overflow: 'auto', minHeight: 0 }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {currentPhoto && (
                <div className="relative flex items-center justify-center" style={{ minHeight: '100%' }}>
                  {currentPhoto.isVideo ? (
                    <video
                      src={getPhotoUrl(currentPhoto.url)}
                      controls
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded"
                      style={{ maxHeight: 'calc(85vh - 200px)' }}
                    />
                  ) : (
                    <GoogleDriveImage
                      src={currentPhoto.url}
                      alt={currentPhoto.label}
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded shadow-2xl"
                      style={{ maxHeight: 'calc(85vh - 200px)' }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Controles de navegação */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-800/80 hover:bg-slate-700 text-white z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-800/80 hover:bg-slate-700 text-white z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Informações da foto */}
            <div className="p-2 border-t border-slate-700 bg-slate-800/50 flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getSourceBadgeColor(currentPhoto?.source || '')}`}>
                    {getSourceLabel(currentPhoto?.source || '')}
                  </span>
                  {currentPhoto?.date && (
                    <span className="text-[10px] text-slate-400">{currentPhoto.date}</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">
                  {currentIndex + 1} / {photos.length}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate">{currentPhoto?.label}</p>
            </div>

            {/* Miniaturas (se houver muitas fotos) */}
            {photos.length > 1 && photos.length <= 12 && (
              <div className="p-2 border-t border-slate-700 bg-slate-800/30 overflow-x-auto flex-shrink-0">
                <div className="flex gap-2">
                  {photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                        index === currentIndex
                          ? 'border-blue-500 ring-2 ring-blue-500/50'
                          : 'border-slate-600 hover:border-slate-500 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {photo.isVideo ? (
                        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                          <Camera className="w-3 h-3 text-slate-400" />
                        </div>
                      ) : (
                        <GoogleDriveImage
                          src={photo.url}
                          alt={photo.label}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

