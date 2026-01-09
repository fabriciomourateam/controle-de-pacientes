import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GoogleDriveImage } from '@/components/ui/google-drive-image';
import { isGoogleDriveUrl, convertGoogleDriveUrl } from '@/lib/google-drive-utils';
import { Camera, ArrowRight, Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Patient {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  created_at: string;
  foto_inicial_frente?: string;
  foto_inicial_lado?: string;
  foto_inicial_lado_2?: string;
  foto_inicial_costas?: string;
  data_fotos_iniciais?: string;
  peso_inicial?: number;
}

interface CheckinData {
  id: string;
  peso: string;
  medida: string;
  data_checkin: string;
  foto_1?: string;
  foto_2?: string;
  foto_3?: string;
  foto_4?: string;
  created_at: string;
}

interface PhotoData {
  url: string;
  date: string;
  weight: string;
  label: string;
  isInitial?: boolean;
}

interface RenewalPhotoComparisonProps {
  firstCheckin: CheckinData | null;
  lastCheckin: CheckinData | null;
  patient?: Patient | null;
  checkins?: CheckinData[];
}

export function RenewalPhotoComparison({ firstCheckin, lastCheckin, patient, checkins = [] }: RenewalPhotoComparisonProps) {
  const [currentInitialPhotoIndex, setCurrentInitialPhotoIndex] = useState(0);
  const [currentCurrentPhotoIndex, setCurrentCurrentPhotoIndex] = useState(0);

  // Função para obter fotos iniciais (baseline) do paciente
  const getInitialPhotos = (): PhotoData[] => {
    if (!patient) return [];
    
    const photos: PhotoData[] = [];
    const patientData = patient as any;
    
    if (patientData.foto_inicial_frente) {
      photos.push({
        url: patientData.foto_inicial_frente,
        date: patientData.data_fotos_iniciais ? new Date(patientData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Baseline',
        weight: patientData.peso_inicial?.toString() || 'N/A',
        label: 'Frente',
        isInitial: true
      });
    }
    if (patientData.foto_inicial_lado) {
      photos.push({
        url: patientData.foto_inicial_lado,
        date: patientData.data_fotos_iniciais ? new Date(patientData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Baseline',
        weight: patientData.peso_inicial?.toString() || 'N/A',
        label: 'Lado',
        isInitial: true
      });
    }
    if (patientData.foto_inicial_lado_2) {
      photos.push({
        url: patientData.foto_inicial_lado_2,
        date: patientData.data_fotos_iniciais ? new Date(patientData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Baseline',
        weight: patientData.peso_inicial?.toString() || 'N/A',
        label: 'Lado 2',
        isInitial: true
      });
    }
    if (patientData.foto_inicial_costas) {
      photos.push({
        url: patientData.foto_inicial_costas,
        date: patientData.data_fotos_iniciais ? new Date(patientData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Baseline',
        weight: patientData.peso_inicial?.toString() || 'N/A',
        label: 'Costas',
        isInitial: true
      });
    }
    
    return photos;
  };

  // Função para obter fotos atuais (do último check-in ou mais recente)
  const getCurrentPhotos = (): PhotoData[] => {
    // Primeiro tentar do lastCheckin, depois do firstCheckin se não houver lastCheckin
    const checkinToUse = lastCheckin || firstCheckin;
    if (!checkinToUse) return [];
    
    const photos: PhotoData[] = [];
    
    if (checkinToUse.foto_1) {
      photos.push({
        url: checkinToUse.foto_1,
        date: new Date(checkinToUse.data_checkin || checkinToUse.created_at).toLocaleDateString('pt-BR'),
        weight: checkinToUse.peso || 'N/A',
        label: 'Frente'
      });
    }
    if (checkinToUse.foto_2) {
      photos.push({
        url: checkinToUse.foto_2,
        date: new Date(checkinToUse.data_checkin || checkinToUse.created_at).toLocaleDateString('pt-BR'),
        weight: checkinToUse.peso || 'N/A',
        label: 'Lado'
      });
    }
    if (checkinToUse.foto_3) {
      photos.push({
        url: checkinToUse.foto_3,
        date: new Date(checkinToUse.data_checkin || checkinToUse.created_at).toLocaleDateString('pt-BR'),
        weight: checkinToUse.peso || 'N/A',
        label: 'Lado 2'
      });
    }
    if (checkinToUse.foto_4) {
      photos.push({
        url: checkinToUse.foto_4,
        date: new Date(checkinToUse.data_checkin || checkinToUse.created_at).toLocaleDateString('pt-BR'),
        weight: checkinToUse.peso || 'N/A',
        label: 'Costas'
      });
    }
    
    return photos;
  };

  const initialPhotos = getInitialPhotos();
  const currentPhotos = getCurrentPhotos();

  // Se não há fotos em nenhum dos lados, não renderizar o componente
  if (initialPhotos.length === 0 && currentPhotos.length === 0) {
    return null;
  }

  // Navegação para fotos iniciais
  const nextInitialPhoto = () => {
    setCurrentInitialPhotoIndex((prev) => (prev + 1) % initialPhotos.length);
  };

  const prevInitialPhoto = () => {
    setCurrentInitialPhotoIndex((prev) => (prev - 1 + initialPhotos.length) % initialPhotos.length);
  };

  // Navegação para fotos atuais
  const nextCurrentPhoto = () => {
    setCurrentCurrentPhotoIndex((prev) => (prev + 1) % currentPhotos.length);
  };

  const prevCurrentPhoto = () => {
    setCurrentCurrentPhotoIndex((prev) => (prev - 1 + currentPhotos.length) % currentPhotos.length);
  };

  // Componente de carrossel individual
  const PhotoCarousel = ({ 
    photos, 
    currentIndex, 
    onNext, 
    onPrev, 
    onSetIndex, 
    title, 
    subtitle, 
    iconColor, 
    badgeColor 
  }: {
    photos: PhotoData[];
    currentIndex: number;
    onNext: () => void;
    onPrev: () => void;
    onSetIndex: (index: number) => void;
    title: string;
    subtitle: string;
    iconColor: string;
    badgeColor: string;
  }) => {
    if (photos.length === 0) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 ${iconColor} rounded-lg`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="text-slate-400 text-sm">{subtitle}</p>
            </div>
          </div>
          
          <div className="aspect-[3/4] rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Fotos não disponíveis</p>
            </div>
          </div>
        </div>
      );
    }

    const currentPhoto = photos[currentIndex];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 ${iconColor} rounded-lg`}>
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-slate-400 text-sm">{subtitle}</p>
          </div>
        </div>

        {/* Navegação do carrossel */}
        {photos.length > 1 && (
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">
                {currentIndex + 1} de {photos.length}
              </span>
              <div className="flex gap-1">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => onSetIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex 
                        ? 'bg-purple-400' 
                        : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Próxima
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Foto atual */}
        <div className="relative group">
          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-slate-800 border border-slate-600">
            {isGoogleDriveUrl(currentPhoto.url) ? (
              <GoogleDriveImage
                src={currentPhoto.url}
                alt={`${title} - ${currentPhoto.label}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <img
                src={currentPhoto.url}
                alt={`${title} - ${currentPhoto.label}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <Badge className={`${badgeColor} text-white text-xs backdrop-blur-sm`}>
              {currentPhoto.label}
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-700/80 border-slate-600/50 backdrop-blur-sm shadow-2xl h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl border border-purple-500/30">
              <Camera className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-2xl text-white font-bold">
                Transformação Visual
              </CardTitle>
              <p className="text-slate-400 text-sm mt-1">
                Comparação Antes vs Depois
              </p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-purple-600/90 via-purple-500/80 to-indigo-600/90 text-white border-purple-400/60 px-4 py-2 shadow-lg backdrop-blur-sm font-semibold">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-white" />
              <span className="font-bold text-sm text-white">Evolução Fotográfica</span>
            </div>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Comparação lado a lado com carrosséis individuais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          {/* Fotos Iniciais (Esquerda) */}
          <PhotoCarousel
            photos={initialPhotos}
            currentIndex={currentInitialPhotoIndex}
            onNext={nextInitialPhoto}
            onPrev={prevInitialPhoto}
            onSetIndex={setCurrentInitialPhotoIndex}
            title="Início da Jornada"
            subtitle={initialPhotos[0]?.date || 'Baseline'}
            iconColor="bg-blue-500/20 text-blue-400"
            badgeColor="bg-blue-500/80"
          />

          {/* Seta de Transformação */}
          <div className="hidden lg:flex items-center justify-center absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-full border border-yellow-500/30 backdrop-blur-sm">
                <ArrowRight className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="text-center bg-slate-900/80 rounded-lg px-3 py-1 backdrop-blur-sm">
                <p className="text-yellow-400 font-semibold text-xs">TRANSFORMAÇÃO</p>
              </div>
            </div>
          </div>

          {/* Fotos Atuais (Direita) */}
          <PhotoCarousel
            photos={currentPhotos}
            currentIndex={currentCurrentPhotoIndex}
            onNext={nextCurrentPhoto}
            onPrev={prevCurrentPhoto}
            onSetIndex={setCurrentCurrentPhotoIndex}
            title="Resultado Atual"
            subtitle={currentPhotos[0]?.date || 'Atual'}
            iconColor="bg-green-500/20 text-green-400"
            badgeColor="bg-green-500/80"
          />
        </div>


      </CardContent>
    </Card>
  );
}