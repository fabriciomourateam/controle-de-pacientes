import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, ChevronLeft, ChevronRight, ZoomIn, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getMediaType } from "@/lib/media-utils";
import { convertGoogleDriveUrl } from "@/lib/google-drive-utils";
import type { Database } from "@/integrations/supabase/types";

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface PhotoComparisonProps {
  checkins: Checkin[];
  patient?: Patient | null;
}

interface PhotoData {
  url: string;
  date: string;
  weight: string;
  checkinId: string;
  photoNumber: number;
  isInitial?: boolean;
  isVideo?: boolean;
}

export function PhotoComparison({ checkins, patient }: PhotoComparisonProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Adicionar fotos iniciais do paciente (se existirem)
  const initialPhotos: PhotoData[] = [];
  if (patient) {
    const patientWithInitialData = patient as any;
    if (patientWithInitialData.foto_inicial_frente) {
      initialPhotos.push({
        url: patientWithInitialData.foto_inicial_frente,
        date: patientWithInitialData.data_fotos_iniciais ? new Date(patientWithInitialData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Data Inicial',
        weight: patientWithInitialData.peso_inicial?.toString() || 'N/A',
        checkinId: 'initial-frente',
        photoNumber: 0,
        isInitial: true
      });
    }
    if (patientWithInitialData.foto_inicial_lado) {
      initialPhotos.push({
        url: patientWithInitialData.foto_inicial_lado,
        date: patientWithInitialData.data_fotos_iniciais ? new Date(patientWithInitialData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Data Inicial',
        weight: patientWithInitialData.peso_inicial?.toString() || 'N/A',
        checkinId: 'initial-lado',
        photoNumber: 0,
        isInitial: true
      });
    }
    if (patientWithInitialData.foto_inicial_lado_2) {
      initialPhotos.push({
        url: patientWithInitialData.foto_inicial_lado_2,
        date: patientWithInitialData.data_fotos_iniciais ? new Date(patientWithInitialData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Data Inicial',
        weight: patientWithInitialData.peso_inicial?.toString() || 'N/A',
        checkinId: 'initial-lado-2',
        photoNumber: 0,
        isInitial: true
      });
    }
    if (patientWithInitialData.foto_inicial_costas) {
      initialPhotos.push({
        url: patientWithInitialData.foto_inicial_costas,
        date: patientWithInitialData.data_fotos_iniciais ? new Date(patientWithInitialData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Data Inicial',
        weight: patientWithInitialData.peso_inicial?.toString() || 'N/A',
        checkinId: 'initial-costas',
        photoNumber: 0,
        isInitial: true
      });
    }
  }

  // Extrair todas as fotos/vídeos dos check-ins (inverter ordem para ter do mais antigo ao mais recente)
  const checkinPhotos: PhotoData[] = [...checkins].reverse().flatMap(checkin => {
    const photos: PhotoData[] = [];
    if (checkin.foto_1) {
      const isVideo = getMediaType(checkin.foto_1) === 'video';
      const url = checkin.foto_1.includes('drive.google.com') 
        ? convertGoogleDriveUrl(checkin.foto_1, isVideo) 
        : checkin.foto_1;
      photos.push({
        url: url || checkin.foto_1,
        date: new Date(checkin.data_checkin).toLocaleDateString('pt-BR'),
        weight: checkin.peso || 'N/A',
        checkinId: checkin.id,
        photoNumber: 1,
        isVideo
      });
    }
    if (checkin.foto_2) {
      const isVideo = getMediaType(checkin.foto_2) === 'video';
      const url = checkin.foto_2.includes('drive.google.com') 
        ? convertGoogleDriveUrl(checkin.foto_2, isVideo) 
        : checkin.foto_2;
      photos.push({
        url: url || checkin.foto_2,
        date: new Date(checkin.data_checkin).toLocaleDateString('pt-BR'),
        weight: checkin.peso || 'N/A',
        checkinId: checkin.id,
        photoNumber: 2,
        isVideo
      });
    }
    if (checkin.foto_3) {
      const isVideo = getMediaType(checkin.foto_3) === 'video';
      const url = checkin.foto_3.includes('drive.google.com') 
        ? convertGoogleDriveUrl(checkin.foto_3, isVideo) 
        : checkin.foto_3;
      photos.push({
        url: url || checkin.foto_3,
        date: new Date(checkin.data_checkin).toLocaleDateString('pt-BR'),
        weight: checkin.peso || 'N/A',
        checkinId: checkin.id,
        photoNumber: 3,
        isVideo
      });
    }
    if (checkin.foto_4) {
      const isVideo = getMediaType(checkin.foto_4) === 'video';
      const url = checkin.foto_4.includes('drive.google.com') 
        ? convertGoogleDriveUrl(checkin.foto_4, isVideo) 
        : checkin.foto_4;
      photos.push({
        url: url || checkin.foto_4,
        date: new Date(checkin.data_checkin).toLocaleDateString('pt-BR'),
        weight: checkin.peso || 'N/A',
        checkinId: checkin.id,
        photoNumber: 4,
        isVideo
      });
    }
    return photos;
  });

  // Combinar fotos iniciais com fotos de check-ins e ordenar por data
  const allPhotos = [...initialPhotos, ...checkinPhotos];

  const handleZoomPhoto = (photo: PhotoData) => {
    setSelectedPhoto(photo);
    setIsZoomOpen(true);
  };

  if (allPhotos.length === 0) {
    return (
      <Card className="bg-slate-800/40 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Camera className="w-5 h-5 text-blue-400" />
            Evolução Fotográfica
          </CardTitle>
          <CardDescription className="text-slate-400">
            Comparação visual da evolução
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Camera className="w-16 h-16 text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Nenhuma foto disponível</p>
            <p className="text-slate-500 text-sm mt-2">
              As fotos dos check-ins aparecerão aqui para comparação
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fotos de comparação: primeira (mais antiga) e última (mais recente)
  // Fotos iniciais sempre vêm primeiro, depois os checkins em ordem decrescente
  // Então: primeira = inicial ou primeiro checkin, última = último checkin
  const firstPhoto = allPhotos[0]; // Foto mais antiga (inicial ou primeiro checkin)
  const lastPhoto = allPhotos[allPhotos.length - 1]; // Foto mais recente (último checkin)

  return (
    <>
      <Card className="bg-slate-800/40 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Camera className="w-5 h-5 text-blue-400" />
            Evolução Fotográfica
          </CardTitle>
          <CardDescription className="text-slate-400">
            Comparação visual da evolução - {allPhotos.length} {allPhotos.length === 1 ? 'foto' : 'fotos'} disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comparação Antes/Depois */}
          {allPhotos.length >= 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-emerald-400" />
                Comparação: Antes e Depois
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Foto/Vídeo Inicial */}
                <div className="space-y-3">
                  <div className="relative group">
                    {firstPhoto.isVideo ? (
                      <video 
                        src={firstPhoto.url} 
                        controls
                        className="w-full h-80 object-cover rounded-lg border-2 border-slate-600 hover:border-blue-500 transition-all"
                      />
                    ) : (
                      <img 
                        src={firstPhoto.url} 
                        alt="Foto Inicial"
                        className="w-full h-80 object-cover rounded-lg border-2 border-slate-600 hover:border-blue-500 transition-all cursor-pointer"
                        onClick={() => handleZoomPhoto(firstPhoto)}
                      />
                    )}
                    {!firstPhoto.isVideo && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleZoomPhoto(firstPhoto)}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    )}
                    <Badge className={`absolute top-2 left-2 ${firstPhoto.isInitial ? 'bg-purple-600/90' : 'bg-blue-600/90'} text-white`}>
                      {firstPhoto.isInitial ? 'BASELINE' : 'INICIAL'}
                    </Badge>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4" />
                        {firstPhoto.date}
                      </div>
                      <div className="text-white font-semibold">
                        {firstPhoto.weight} kg
                      </div>
                    </div>
                  </div>
                </div>

                {/* Foto/Vídeo Final */}
                <div className="space-y-3">
                  <div className="relative group">
                    {lastPhoto.isVideo ? (
                      <video 
                        src={lastPhoto.url} 
                        controls
                        className="w-full h-80 object-cover rounded-lg border-2 border-slate-600 hover:border-emerald-500 transition-all"
                      />
                    ) : (
                      <img 
                        src={lastPhoto.url} 
                        alt="Foto Atual"
                        className="w-full h-80 object-cover rounded-lg border-2 border-slate-600 hover:border-emerald-500 transition-all cursor-pointer"
                        onClick={() => handleZoomPhoto(lastPhoto)}
                      />
                    )}
                    {!lastPhoto.isVideo && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleZoomPhoto(lastPhoto)}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    )}
                    <Badge className="absolute top-2 left-2 bg-emerald-600/90 text-white">
                      ATUAL
                    </Badge>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4" />
                        {lastPhoto.date}
                      </div>
                      <div className="text-white font-semibold">
                        {lastPhoto.weight} kg
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Galeria de Todas as Fotos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-400" />
              Galeria Completa ({allPhotos.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allPhotos.map((photo, index) => (
                <div key={`${photo.checkinId}-${photo.photoNumber}`} className="space-y-2">
                  <div className="relative group">
                    {photo.isVideo ? (
                      <video 
                        src={photo.url} 
                        controls
                        className="w-full h-48 object-cover rounded-lg border border-slate-600 hover:border-purple-500 transition-all"
                      />
                    ) : (
                      <img 
                        src={photo.url} 
                        alt={`Foto ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg border border-slate-600 hover:border-purple-500 transition-all cursor-pointer hover:scale-105"
                        onClick={() => handleZoomPhoto(photo)}
                      />
                    )}
                    {!photo.isVideo && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleZoomPhoto(photo)}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    )}
                    <Badge className={`absolute top-2 left-2 ${photo.isInitial ? 'bg-purple-600/90' : 'bg-slate-800/90'} text-white text-xs`}>
                      {photo.isInitial ? '⭐' : `#${index + 1}`}
                    </Badge>
                  </div>
                  <div className="text-xs text-center">
                    <p className="text-slate-400">{photo.date}</p>
                    <p className="text-white font-semibold">{photo.weight} kg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Zoom */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-4xl bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between">
              <span>Foto - {selectedPhoto?.date}</span>
              <Badge variant="outline" className="text-white">
                {selectedPhoto?.weight} kg
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="relative">
              {selectedPhoto.isVideo ? (
                <video 
                  src={selectedPhoto.url} 
                  controls
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              ) : (
                <img 
                  src={selectedPhoto.url} 
                  alt="Foto ampliada"
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

