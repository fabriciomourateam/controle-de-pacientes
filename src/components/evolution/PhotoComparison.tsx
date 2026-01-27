import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Camera, ChevronRight, ChevronDown, ChevronUp, ZoomIn, Calendar, ExternalLink, Trash2, Download, Edit2, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getMediaType } from "@/lib/media-utils";
import { convertGoogleDriveUrl, isGoogleDriveUrl } from "@/lib/google-drive-utils";
import { GoogleDriveImage } from "@/components/ui/google-drive-image";
import type { Database } from "@/integrations/supabase/types";
import { AddCheckinPhotos } from "./AddCheckinPhotos";
import { CheckinPhotoComparison } from "./CheckinPhotoComparison";
import { PhotoVisibilityModal } from "./PhotoVisibilityModal";
import { EditFeaturedComparisonModal } from "./EditFeaturedComparisonModal";
import { usePhotoVisibility } from "@/hooks/use-photo-visibility";
import { useFeaturedComparison, CreateFeaturedComparisonData } from "@/hooks/use-featured-comparison";

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface PhotoComparisonProps {
  checkins: Checkin[];
  patient?: Patient | null;
  onPhotoDeleted?: () => void; // Callback para recarregar dados após deletar
  isEditable?: boolean; // Se true, mostra botão de configuração (para nutricionista)
  hideInPublic?: boolean; // Se true, oculta o card na página pública (quando há comparação destacada)
}

interface PhotoData {
  url: string;
  date: string;
  weight: string;
  checkinId: string;
  photoNumber: number;
  isInitial?: boolean;
  isVideo?: boolean;
  angle?: 'frente' | 'lado' | 'lado_2' | 'costas';
}

export function PhotoComparison({ checkins, patient, onPhotoDeleted, isEditable = false, hideInPublic = false }: PhotoComparisonProps) {
  console.log('🚀 PhotoComparison RENDERIZADO!', { checkinsLength: checkins.length, hasPatient: !!patient });
  
  // Se hideInPublic for true, não renderizar nada
  if (hideInPublic) {
    return null;
  }
  
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [alternativeUrls, setAlternativeUrls] = useState<Map<string, string>>(new Map());
  const [selectedBeforeIndex, setSelectedBeforeIndex] = useState<number>(0);
  const [selectedAfterIndex, setSelectedAfterIndex] = useState<number | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<PhotoData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  
  // Modo de seleção para criar comparação Antes/Depois
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedBeforePhoto, setSelectedBeforePhoto] = useState<PhotoData | null>(null);
  const [selectedAfterPhoto, setSelectedAfterPhoto] = useState<PhotoData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Hook de visibilidade de fotos
  const { isPhotoVisible, getSetting } = usePhotoVisibility(patient?.telefone);
  
  // Usar sessionStorage para preservar estado de minimização entre renderizações
  // Chave única baseada no telefone do paciente
  const storageKey = `photo-comparison-minimized-${patient?.telefone || 'default'}`;
  
  // Função helper para ler do sessionStorage
  const getStoredMinimized = () => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      // stored === 'false' significa que NÃO está minimizado (card está aberto)
      // stored === 'true' significa que está minimizado (card está fechado)
      // null = primeira vez, usar padrão EXPANDIDO (false)
      return stored !== null ? stored === 'true' : false; // false = expandido (padrão)
    } catch {
      return false; // Padrão: expandido
    }
  };
  
  // Inicializar estado do sessionStorage (função lazy para garantir que seja lido apenas na primeira renderização)
  const [isMinimized, setIsMinimized] = useState(() => getStoredMinimized());
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [isUpdatingAngle, setIsUpdatingAngle] = useState(false);
  const { toast } = useToast();
  const { saveComparison, loading: savingComparison } = useFeaturedComparison(patient?.telefone || '');

  // Sincronizar estado do sessionStorage quando o telefone mudar (mudança de paciente)
  const prevTelefoneRef = useRef(patient?.telefone);
  const prevCheckinsLengthRef = useRef(checkins.length);
  
  useEffect(() => {
    // Se o telefone mudou, ler o estado do novo paciente
    if (prevTelefoneRef.current !== patient?.telefone) {
      prevTelefoneRef.current = patient?.telefone;
      const stored = getStoredMinimized();
      setIsMinimized(stored);
      prevCheckinsLengthRef.current = checkins.length;
    } else if (prevCheckinsLengthRef.current !== checkins.length) {
      // Se o telefone não mudou, mas os checkins mudaram (após atualização de dados)
      // Garantir que o estado está sincronizado com o sessionStorage
      prevCheckinsLengthRef.current = checkins.length;
      const stored = getStoredMinimized();
      // Só atualizar se for diferente para evitar loops
      if (isMinimized !== stored) {
        setIsMinimized(stored);
      }
    }
  }, [patient?.telefone, checkins.length]); // Sincronizar quando telefone ou checkins mudarem

  // Salvar estado no sessionStorage quando mudar
  useEffect(() => {
    try {
      // Salvar 'true' se minimizado, 'false' se expandido
      sessionStorage.setItem(storageKey, String(isMinimized));
    } catch (error) {
      console.warn('Erro ao salvar estado no sessionStorage:', error);
    }
  }, [isMinimized, storageKey]);

  // Função para baixar foto do Google Drive (versão melhorada para download direto)
  const handleDownloadPhoto = async (url: string, label: string) => {
    try {
      // Extrair ID do Google Drive
      const fileId = url.match(/[?&]id=([^&]+)/)?.[1] || 
                     url.match(/\/file\/d\/([^\/]+)/)?.[1] ||
                     url.match(/\/d\/([^\/]+)/)?.[1];
      
      if (fileId && url.includes('drive.google.com')) {
        // Para Google Drive, usar fetch para baixar como blob
        try {
          const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
          
          toast({
            title: 'Iniciando download...',
            description: `Baixando ${label}...`
          });

          // Tentar fetch direto primeiro
          const response = await fetch(downloadUrl, {
            method: 'GET',
            mode: 'cors'
          });

          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${label.replace(/\s+/g, '-').toLowerCase()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Limpar blob URL
            window.URL.revokeObjectURL(blobUrl);
            
            toast({
              title: 'Download concluído!',
              description: `${label} foi baixado com sucesso.`
            });
          } else {
            throw new Error('Fetch falhou');
          }
        } catch (fetchError) {
          console.log('Fetch falhou, tentando método alternativo...', fetchError);
          
          // Fallback: tentar converter URL para formato direto
          const directUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
          
          try {
            const response = await fetch(directUrl);
            if (response.ok) {
              const blob = await response.blob();
              const blobUrl = window.URL.createObjectURL(blob);
              
              const link = document.createElement('a');
              link.href = blobUrl;
              link.download = `${label.replace(/\s+/g, '-').toLowerCase()}.jpg`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              window.URL.revokeObjectURL(blobUrl);
              
              toast({
                title: 'Download concluído!',
                description: `${label} foi baixado com sucesso.`
              });
            } else {
              throw new Error('Thumbnail fetch falhou');
            }
          } catch (thumbnailError) {
            console.log('Thumbnail fetch falhou, abrindo em nova aba...', thumbnailError);
            
            // Último recurso: abrir em nova aba
            const fallbackUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            window.open(fallbackUrl, '_blank');
            
            toast({
              title: 'Download iniciado',
              description: `${label} será aberto em nova aba para download manual.`
            });
          }
        }
      } else {
        // Para outras URLs, tentar download direto via fetch
        try {
          const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
          });

          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${label.replace(/\s+/g, '-').toLowerCase()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.URL.revokeObjectURL(blobUrl);
            
            toast({
              title: 'Download concluído!',
              description: `${label} foi baixado com sucesso.`
            });
          } else {
            throw new Error('Fetch direto falhou');
          }
        } catch (directError) {
          console.log('Fetch direto falhou, usando método tradicional...', directError);
          
          // Fallback para método tradicional
          const link = document.createElement('a');
          link.href = url;
          link.download = `${label.replace(/\s+/g, '-').toLowerCase()}.jpg`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: 'Download iniciado',
            description: `Baixando ${label}...`
          });
        }
      }
    } catch (error) {
      console.error('Erro ao baixar foto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar a foto. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  // Log de debug
  const patientPhotos = patient ? {
    frente: (patient as any).foto_inicial_frente,
    lado: (patient as any).foto_inicial_lado,
    lado_2: (patient as any).foto_inicial_lado_2,
    costas: (patient as any).foto_inicial_costas,
  } : null;
  
  console.log('📸 PhotoComparison - Dados recebidos:', {
    hasPatient: !!patient,
    patientName: patient?.nome,
    checkinsCount: checkins.length,
    patientPhotos
  });
  
  console.log('📸 URLs das fotos (completas):', patientPhotos);

  const handleImageError = (photoId: string, url: string, originalUrl?: string) => {
    console.log('❌ Erro ao carregar imagem:', photoId);
    console.log('❌ URL que falhou:', url);
    
    // Tentar URL alternativa se ainda não tentou
    if (!alternativeUrls.has(photoId) && originalUrl) {
      console.log('🔄 Tentando URL alternativa (thumbnail)...');
      const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
      if (fileId) {
        const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        setAlternativeUrls(prev => new Map(prev).set(photoId, thumbnailUrl));
        return;
      }
    }
    
    setImageErrors(prev => new Set(prev).add(photoId));
  };

  const getPhotoId = (photo: PhotoData) => {
    return `${photo.checkinId}-${photo.photoNumber}`;
  };

  const getPhotoUrl = (photo: PhotoData) => {
    const photoId = getPhotoId(photo);
    return alternativeUrls.get(photoId) || photo.url;
  };

  // Adicionar fotos iniciais do paciente (se existirem)
  const initialPhotos: PhotoData[] = [];
  if (patient) {
    const patientWithInitialData = patient as any;
    if (patientWithInitialData.foto_inicial_frente) {
      const isVideo = getMediaType(patientWithInitialData.foto_inicial_frente) === 'video';
      // Tentar usar URL original primeiro, só converter se necessário
      const originalUrl = patientWithInitialData.foto_inicial_frente;
      const convertedUrl = originalUrl.includes('drive.google.com') 
        ? convertGoogleDriveUrl(originalUrl, isVideo) 
        : originalUrl;
      
      console.log('📸 Foto Frente - URL Original:', originalUrl);
      console.log('📸 Foto Frente - URL Convertida:', convertedUrl);
      console.log('📸 Foto Frente - É vídeo?', isVideo);
      
      initialPhotos.push({
        url: originalUrl, // Usar URL original, não convertida
        date: patientWithInitialData.data_fotos_iniciais ? new Date(patientWithInitialData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Data Inicial',
        weight: patientWithInitialData.peso_inicial?.toString() || 'N/A',
        checkinId: 'initial-frente',
        photoNumber: 0,
        isInitial: true,
        isVideo,
        angle: 'frente'
      });
    }
    if (patientWithInitialData.foto_inicial_lado) {
      const isVideo = getMediaType(patientWithInitialData.foto_inicial_lado) === 'video';
      const originalUrl = patientWithInitialData.foto_inicial_lado;
      initialPhotos.push({
        url: originalUrl,
        date: patientWithInitialData.data_fotos_iniciais ? new Date(patientWithInitialData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Data Inicial',
        weight: patientWithInitialData.peso_inicial?.toString() || 'N/A',
        checkinId: 'initial-lado',
        photoNumber: 0,
        isInitial: true,
        isVideo,
        angle: 'lado'
      });
    }
    if (patientWithInitialData.foto_inicial_lado_2) {
      const isVideo = getMediaType(patientWithInitialData.foto_inicial_lado_2) === 'video';
      const originalUrl = patientWithInitialData.foto_inicial_lado_2;
      initialPhotos.push({
        url: originalUrl,
        date: patientWithInitialData.data_fotos_iniciais ? new Date(patientWithInitialData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Data Inicial',
        weight: patientWithInitialData.peso_inicial?.toString() || 'N/A',
        checkinId: 'initial-lado-2',
        photoNumber: 0,
        isInitial: true,
        isVideo,
        angle: 'lado_2'
      });
    }
    if (patientWithInitialData.foto_inicial_costas) {
      const isVideo = getMediaType(patientWithInitialData.foto_inicial_costas) === 'video';
      const originalUrl = patientWithInitialData.foto_inicial_costas;
      initialPhotos.push({
        url: originalUrl,
        date: patientWithInitialData.data_fotos_iniciais ? new Date(patientWithInitialData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Data Inicial',
        weight: patientWithInitialData.peso_inicial?.toString() || 'N/A',
        checkinId: 'initial-costas',
        photoNumber: 0,
        isInitial: true,
        isVideo,
        angle: 'costas'
      });
    }
  }

  console.log('📸 initialPhotos criado:', initialPhotos.length, initialPhotos);

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
        isVideo,
        angle: 'frente'
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
        isVideo,
        angle: 'lado'
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
        isVideo,
        angle: 'lado_2'
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
        isVideo,
        angle: 'costas'
      });
    }
    return photos;
  });

  // Combinar fotos iniciais com fotos de check-ins
  const allPhotos = [...initialPhotos, ...checkinPhotos];
  
  console.log('📸 allPhotos final:', allPhotos.length, allPhotos);

  // ITEM 6 e 8: Filtrar fotos visíveis (apenas para pacientes, nutricionista vê todas)
  const visiblePhotos = isEditable 
    ? allPhotos // Nutricionista vê todas
    : allPhotos.filter(photo => {
        // Criar ID único para cada foto
        const photoId = photo.isInitial 
          ? `initial-${photo.angle}`
          : `checkin-${photo.checkinId}-foto-${photo.photoNumber}`;
        return isPhotoVisible(photoId);
      });

  console.log('👁️ Fotos visíveis:', visiblePhotos.length, 'de', allPhotos.length);

  // Agrupar fotos por data (do mais recente para o mais antigo)
  const photosByDate = visiblePhotos.reduce((acc, photo) => {
    const dateKey = photo.date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(photo);
    return acc;
  }, {} as Record<string, PhotoData[]>);

  // Ordenar datas (mais recente primeiro)
  const sortedDates = Object.keys(photosByDate).sort((a, b) => {
    // Converter data pt-BR para Date para ordenação
    const parseDate = (dateStr: string): Date => {
      // Formato: "22/01/2025"
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
      // Fallback para "Data Inicial" ou outras strings
      return new Date(0); // Retorna data muito antiga para fotos iniciais
    };

    const dateA = parseDate(a);
    const dateB = parseDate(b);
    return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
  });

  // Inicializar índice "Depois" quando visiblePhotos mudar
  if (selectedAfterIndex === null && visiblePhotos.length > 1) {
    setSelectedAfterIndex(visiblePhotos.length - 1);
  }

  const handleZoomPhoto = (photo: PhotoData) => {
    setSelectedPhoto(photo);
    setIsZoomOpen(true);
  };

  // Obter fotos selecionadas pelos índices
  const firstPhoto = visiblePhotos[selectedBeforeIndex] || visiblePhotos[0];
  const lastPhoto = visiblePhotos[selectedAfterIndex ?? visiblePhotos.length - 1] || visiblePhotos[visiblePhotos.length - 1];

  // Função para formatar label da foto
  const getPhotoLabel = (photo: PhotoData, index: number) => {
    const angleLabel = photo.angle === 'frente' ? '📷 Frente' : 
                       photo.angle === 'lado' ? '📷 Lado' : 
                       photo.angle === 'lado_2' ? '📷 Lado 2' : 
                       photo.angle === 'costas' ? '📷 Costas' : '📷';
    const prefix = photo.isInitial ? '⭐ BASELINE' : `#${index + 1}`;
    return `${prefix} - ${angleLabel} - ${photo.date} (${photo.weight}kg)`;
  };

  // Função para atualizar o ângulo da foto
  const handleUpdatePhotoAngle = async (photo: PhotoData, newAngle: 'frente' | 'lado' | 'lado_2' | 'costas') => {
    if (!patient) return;
    
    // Salvar posição do scroll antes de atualizar
    const scrollPosition = window.scrollY;
    
    setIsUpdatingAngle(true);
    try {
      if (photo.isInitial) {
        // Atualizar foto inicial do paciente
        if (!patient.id) {
          throw new Error('ID do paciente não encontrado');
        }

        const fieldMap: Record<string, string> = {
          'frente': 'foto_inicial_frente',
          'lado': 'foto_inicial_lado',
          'lado_2': 'foto_inicial_lado_2',
          'costas': 'foto_inicial_costas'
        };

        const oldField = fieldMap[photo.angle || ''];
        const newField = fieldMap[newAngle];

        if (!oldField || !newField) {
          throw new Error('Ângulo da foto não identificado');
        }

        // Se o novo campo é diferente do antigo, fazer a troca
        if (oldField !== newField) {
          // Buscar foto atual do novo campo (se existir)
          const { data: currentPatient } = await supabase
            .from('patients')
            .select(`${oldField}, ${newField}`)
            .eq('id', patient.id)
            .single();

          const photoUrl = (currentPatient as any)?.[oldField];
          const existingPhotoUrl = (currentPatient as any)?.[newField];

          // Fazer a troca
          const updates: any = {
            [oldField]: existingPhotoUrl || null,
            [newField]: photoUrl
          };

          const { error } = await supabase
            .from('patients')
            .update(updates)
            .eq('id', patient.id);

          if (error) throw error;

          toast({
            title: "Ângulo atualizado com sucesso",
            description: `Foto movida de ${photo.angle} para ${newAngle}`,
          });
        }
      } else {
        // Atualizar foto de check-in
        const fieldMap: Record<number, string> = {
          1: 'foto_1',
          2: 'foto_2',
          3: 'foto_3',
          4: 'foto_4'
        };

        const angleToFieldMap: Record<string, number> = {
          'frente': 1,
          'lado': 2,
          'lado_2': 3,
          'costas': 4
        };

        const oldFieldNumber = photo.photoNumber;
        const newFieldNumber = angleToFieldMap[newAngle];
        const oldField = fieldMap[oldFieldNumber];
        const newField = fieldMap[newFieldNumber];

        if (!oldField || !newField) {
          throw new Error('Campo da foto não identificado');
        }

        // Se o novo campo é diferente do antigo, fazer a troca
        if (oldField !== newField) {
          // Buscar check-in atual
          const { data: currentCheckin } = await supabase
            .from('checkin')
            .select(`${oldField}, ${newField}`)
            .eq('id', photo.checkinId)
            .single();

          const photoUrl = (currentCheckin as any)?.[oldField];
          const existingPhotoUrl = (currentCheckin as any)?.[newField];

          // Fazer a troca
          const updates: any = {
            [oldField]: existingPhotoUrl || null,
            [newField]: photoUrl
          };

          const { error } = await supabase
            .from('checkin')
            .update(updates)
            .eq('id', photo.checkinId);

          if (error) throw error;

          toast({
            title: "Ângulo atualizado com sucesso",
            description: `Foto movida de ${photo.angle} para ${newAngle}`,
          });
        }
      }

      // Recarregar dados
      if (onPhotoDeleted) {
        onPhotoDeleted();
      }
      
      // Restaurar posição do scroll após um pequeno delay para garantir que o DOM foi atualizado
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
    } catch (error) {
      console.error('Erro ao atualizar ângulo da foto:', error);
      toast({
        title: "Erro ao atualizar ângulo",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingAngle(false);
    }
  };

  // Função para deletar foto
  const handleDeletePhoto = async (photo: PhotoData) => {
    setIsDeleting(true);
    try {
      if (photo.isInitial) {
        // Deletar foto inicial do paciente
        if (!patient?.id) {
          throw new Error('ID do paciente não encontrado');
        }

        const fieldMap: Record<string, string> = {
          'frente': 'foto_inicial_frente',
          'lado': 'foto_inicial_lado',
          'lado_2': 'foto_inicial_lado_2',
          'costas': 'foto_inicial_costas'
        };

        const fieldToUpdate = fieldMap[photo.angle || ''];
        if (!fieldToUpdate) {
          throw new Error('Ângulo da foto não identificado');
        }

        const { error } = await supabase
          .from('patients')
          .update({ [fieldToUpdate]: null })
          .eq('id', patient.id);

        if (error) throw error;

        toast({
          title: "Foto deletada com sucesso",
          description: "A foto inicial foi removida.",
        });
      } else {
        // Deletar foto de check-in
        const fieldMap: Record<number, string> = {
          1: 'foto_1',
          2: 'foto_2',
          3: 'foto_3',
          4: 'foto_4'
        };

        const fieldToUpdate = fieldMap[photo.photoNumber];
        if (!fieldToUpdate) {
          throw new Error('Número da foto não identificado');
        }

        const { error } = await supabase
          .from('checkin')
          .update({ [fieldToUpdate]: null })
          .eq('id', photo.checkinId);

        if (error) throw error;

        toast({
          title: "Foto deletada com sucesso",
          description: "A foto do check-in foi removida.",
        });
      }

      // Chamar callback para recarregar dados
      if (onPhotoDeleted) {
        onPhotoDeleted();
      }
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      toast({
        title: "Erro ao deletar foto",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setPhotoToDelete(null);
    }
  };

  // Funções para modo de seleção de Antes/Depois
  const handleStartSelection = () => {
    setIsSelectionMode(true);
    setSelectedBeforePhoto(null);
    setSelectedAfterPhoto(null);
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedBeforePhoto(null);
    setSelectedAfterPhoto(null);
  };

  const handleSelectPhoto = (photo: PhotoData) => {
    if (!selectedBeforePhoto) {
      setSelectedBeforePhoto(photo);
      toast({
        title: "Foto ANTES selecionada",
        description: "Agora selecione a foto DEPOIS",
      });
    } else if (!selectedAfterPhoto) {
      setSelectedAfterPhoto(photo);
    }
  };

  const handleSaveComparison = async () => {
    if (!selectedBeforePhoto || !selectedAfterPhoto || !patient?.telefone) return;

    // Abrir modal de edição ao invés de salvar diretamente
    setShowEditModal(true);
  };

  const handleSaveFromEditor = async (editorData: {
    title: string;
    description?: string;
    beforeZoom: number;
    beforeX: number;
    beforeY: number;
    afterZoom: number;
    afterX: number;
    afterY: number;
  }) => {
    if (!selectedBeforePhoto || !selectedAfterPhoto || !patient?.telefone) return;

    // Converter data de DD/MM/YYYY para YYYY-MM-DD (ISO)
    const convertToISO = (dateStr: string): string => {
      // Se já está em formato ISO, retornar
      if (dateStr.includes('-') && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        return dateStr.split('T')[0];
      }
      
      // Converter de DD/MM/YYYY para YYYY-MM-DD
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Fallback: retornar data atual
      return new Date().toISOString().split('T')[0];
    };

    const data: CreateFeaturedComparisonData = {
      telefone: patient.telefone,
      before_photo_url: selectedBeforePhoto.url,
      before_photo_date: convertToISO(selectedBeforePhoto.date),
      before_weight: selectedBeforePhoto.weight ? parseFloat(selectedBeforePhoto.weight) : undefined,
      after_photo_url: selectedAfterPhoto.url,
      after_photo_date: convertToISO(selectedAfterPhoto.date),
      after_weight: selectedAfterPhoto.weight ? parseFloat(selectedAfterPhoto.weight) : undefined,
      title: editorData.title,
      description: editorData.description,
      is_visible: true,
      // Adicionar dados de zoom e posição
      before_zoom: editorData.beforeZoom,
      before_position_x: editorData.beforeX,
      before_position_y: editorData.beforeY,
      after_zoom: editorData.afterZoom,
      after_position_x: editorData.afterX,
      after_position_y: editorData.afterY,
    };

    await saveComparison(data);
    handleCancelSelection();
    setShowEditModal(false);
    if (onPhotoDeleted) onPhotoDeleted(); // Recarregar dados
  };

  if (visiblePhotos.length === 0) {
    const patientWithData = patient as any;
    const hasPhotoUrls = patientWithData?.foto_inicial_frente || 
                         patientWithData?.foto_inicial_lado || 
                         patientWithData?.foto_inicial_lado_2 || 
                         patientWithData?.foto_inicial_costas;
    
    return (
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Camera className="w-5 h-5 text-blue-400" />
                Evolução Fotográfica
              </CardTitle>
              <CardDescription className="text-slate-400">
                Comparação visual da evolução
              </CardDescription>
            </div>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 flex items-center justify-center"
              aria-label={isMinimized ? 'Expandir' : 'Minimizar'}
            >
              {isMinimized ? (
                <ChevronDown className="w-5 h-5 text-slate-300" />
              ) : (
                <ChevronUp className="w-5 h-5 text-slate-300" />
              )}
            </button>
          </div>
        </CardHeader>
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Camera className="w-16 h-16 text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Nenhuma foto disponível</p>
            <p className="text-slate-500 text-sm mt-2">
              As fotos dos check-ins aparecerão aqui para comparação
            </p>
            
            {hasPhotoUrls && (
              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-left max-w-2xl">
                <p className="text-yellow-400 font-semibold mb-2">⚠️ Debug: URLs encontradas mas fotos não processadas</p>
                <div className="text-xs text-yellow-300 space-y-1">
                  {patientWithData.foto_inicial_frente && (
                    <div>
                      <strong>Frente:</strong> {patientWithData.foto_inicial_frente.substring(0, 80)}...
                    </div>
                  )}
                  {patientWithData.foto_inicial_lado && (
                    <div>
                      <strong>Lado D:</strong> {patientWithData.foto_inicial_lado.substring(0, 80)}...
                    </div>
                  )}
                  {patientWithData.foto_inicial_lado_2 && (
                    <div>
                      <strong>Lado E:</strong> {patientWithData.foto_inicial_lado_2.substring(0, 80)}...
                    </div>
                  )}
                  {patientWithData.foto_inicial_costas && (
                    <div>
                      <strong>Costas:</strong> {patientWithData.foto_inicial_costas.substring(0, 80)}...
                    </div>
                  )}
                </div>
                <p className="text-yellow-300 text-xs mt-2">
                  Verifique o console do navegador (F12) para mais detalhes
                </p>
              </div>
            )}
          </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Camera className="w-5 h-5 text-blue-400" />
                Evolução Fotográfica
              </CardTitle>
              <CardDescription className="text-slate-400">
                Comparação visual da evolução - {isEditable ? `${visiblePhotos.length} de ${allPhotos.length} fotos visíveis` : `${visiblePhotos.length} ${visiblePhotos.length === 1 ? 'foto' : 'fotos'} disponíveis`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {patient && (
                <>
                  <AddCheckinPhotos
                    telefone={patient.telefone}
                    nome={patient.nome || 'Paciente'}
                    onSuccess={() => {
                      if (onPhotoDeleted) onPhotoDeleted();
                    }}
                  />
                  {checkins.length > 0 && (
                    <Button
                      onClick={() => setShowComparisonModal(true)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Comparar Fotos
                    </Button>
                  )}
                  {/* ITEM 4, 6, 8: Botões de Edição de Fotos (apenas para nutricionista) */}
                  {isEditable && (
                    <>
                      {!isSelectionMode ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleStartSelection}
                            className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300 hover:text-emerald-200"
                            title="Selecione 2 fotos para criar comparação Antes/Depois"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Criar Antes/Depois
                          </Button>
                          {/* Botão "Gerenciar Fotos" removido conforme solicitação do usuário */}
                        </>
                      ) : (
                        <>
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                            {!selectedBeforePhoto ? '1️⃣ Selecione foto ANTES' : 
                             !selectedAfterPhoto ? '2️⃣ Selecione foto DEPOIS' : 
                             '✅ Fotos selecionadas'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveComparison}
                            disabled={!selectedBeforePhoto || !selectedAfterPhoto || savingComparison}
                            className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300 hover:text-emerald-200"
                          >
                            {savingComparison ? 'Salvando...' : 'Salvar Comparação'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelSelection}
                            className="border-red-500/30 hover:bg-red-500/10 text-red-300 hover:text-red-200"
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 flex items-center justify-center"
                aria-label={isMinimized ? 'Expandir' : 'Minimizar'}
              >
                {isMinimized ? (
                  <ChevronDown className="w-5 h-5 text-slate-300" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-slate-300" />
                )}
              </button>
            </div>
          </div>
        </CardHeader>
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="space-y-6">
          {/* Seção antiga de comparação removida - mantida apenas para referência */}
          {false && allPhotos.length >= 2 && firstPhoto && lastPhoto && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-emerald-400" />
                  Comparação: Antes e Depois
                </h3>
              </div>

              {/* Seletores de Fotos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-700/30 p-4 rounded-lg border border-slate-600/30">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Foto "Antes"</label>
                  <Select
                    value={selectedBeforeIndex.toString()}
                    onValueChange={(value) => setSelectedBeforeIndex(parseInt(value))}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {allPhotos.map((photo, index) => (
                        <SelectItem 
                          key={`before-${index}`} 
                          value={index.toString()}
                          className="text-white hover:bg-slate-700"
                        >
                          {getPhotoLabel(photo, index)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Foto "Depois"</label>
                  <Select
                    value={(selectedAfterIndex ?? allPhotos.length - 1).toString()}
                    onValueChange={(value) => setSelectedAfterIndex(parseInt(value))}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {allPhotos.map((photo, index) => (
                        <SelectItem 
                          key={`after-${index}`} 
                          value={index.toString()}
                          className="text-white hover:bg-slate-700"
                        >
                          {getPhotoLabel(photo, index)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                    ) : isGoogleDriveUrl(firstPhoto.url) ? (
                      <GoogleDriveImage
                        src={firstPhoto.url}
                        alt="Foto Inicial"
                        className="w-full h-80 object-cover rounded-lg border-2 border-slate-600 hover:border-blue-500 transition-all cursor-pointer"
                        onClick={() => handleZoomPhoto(firstPhoto)}
                        onError={() => handleImageError(getPhotoId(firstPhoto), getPhotoUrl(firstPhoto), firstPhoto.url)}
                      />
                    ) : imageErrors.has(getPhotoId(firstPhoto)) ? (
                      <div className="w-full h-80 flex flex-col items-center justify-center bg-slate-700/50 rounded-lg border-2 border-slate-600">
                        <ExternalLink className="h-12 w-12 text-slate-400 mb-3" />
                        <p className="text-slate-300 mb-4">Foto não disponível</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(firstPhoto.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir em nova aba
                        </Button>
                      </div>
                    ) : (
                      <img 
                        src={getPhotoUrl(firstPhoto)} 
                        alt="Foto Inicial"
                        loading="lazy"
                        className="w-full h-96 object-cover rounded-lg border-2 border-slate-600 hover:border-blue-500 transition-all cursor-pointer"
                        onClick={() => handleZoomPhoto(firstPhoto)}
                        onError={() => handleImageError(getPhotoId(firstPhoto), getPhotoUrl(firstPhoto), firstPhoto.url)}
                      />
                    )}
                    <Badge className={`absolute top-2 left-2 ${firstPhoto.isInitial ? 'bg-purple-600/90' : 'bg-blue-600/90'} text-white`}>
                      {firstPhoto.isInitial ? 'BASELINE' : 'INICIAL'}
                    </Badge>
                    {!firstPhoto.isVideo && !imageErrors.has(getPhotoId(firstPhoto)) && (
                      <>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute top-1/2 -translate-y-1/2 right-12 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPhoto(firstPhoto.url, `Foto-Antes-${firstPhoto.date}-${firstPhoto.weight}kg`);
                          }}
                          title="Baixar foto"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                          onClick={() => handleZoomPhoto(firstPhoto)}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </>
                    )}
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
                    ) : isGoogleDriveUrl(lastPhoto.url) ? (
                      <GoogleDriveImage
                        src={lastPhoto.url}
                        alt="Foto Atual"
                        className="w-full h-80 object-cover rounded-lg border-2 border-slate-600 hover:border-emerald-500 transition-all cursor-pointer"
                        onClick={() => handleZoomPhoto(lastPhoto)}
                        onError={() => handleImageError(getPhotoId(lastPhoto), getPhotoUrl(lastPhoto), lastPhoto.url)}
                      />
                    ) : imageErrors.has(getPhotoId(lastPhoto)) ? (
                      <div className="w-full h-80 flex flex-col items-center justify-center bg-slate-700/50 rounded-lg border-2 border-slate-600">
                        <ExternalLink className="h-12 w-12 text-slate-400 mb-3" />
                        <p className="text-slate-300 mb-4">Foto não disponível</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(lastPhoto.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir em nova aba
                        </Button>
                      </div>
                    ) : (
                      <img
                        src={getPhotoUrl(lastPhoto)}
                        alt="Foto Atual"
                        loading="lazy"
                        className="w-full h-96 object-cover rounded-lg border-2 border-slate-600 hover:border-emerald-500 transition-all cursor-pointer"
                        onClick={() => handleZoomPhoto(lastPhoto)}
                        onError={() => handleImageError(getPhotoId(lastPhoto), getPhotoUrl(lastPhoto), lastPhoto.url)}
                      />
                    )}
                    <Badge className="absolute top-2 left-2 bg-emerald-600/90 text-white">
                      ATUAL
                    </Badge>
                    {!lastPhoto.isVideo && !imageErrors.has(getPhotoId(lastPhoto)) && (
                      <>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute top-1/2 -translate-y-1/2 right-12 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPhoto(lastPhoto.url, `Foto-Depois-${lastPhoto.date}-${lastPhoto.weight}kg`);
                          }}
                          title="Baixar foto"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                          onClick={() => handleZoomPhoto(lastPhoto)}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </>
                    )}
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

          {/* Galeria de Todas as Fotos Agrupadas por Data */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-400" />
              Galeria Completa ({allPhotos.length} {allPhotos.length === 1 ? 'foto' : 'fotos'})
            </h3>
            
            {sortedDates.map((date, dateIndex) => {
              const photosForDate = photosByDate[date];
              const isInitialDate = photosForDate[0]?.isInitial;
              
              return (
                <div key={date} className="space-y-3">
                  {/* Cabeçalho da Data */}
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <h4 className="text-base font-semibold text-white">
                        {date}
                      </h4>
                      {isInitialDate && (
                        <Badge className="bg-purple-600/90 text-white text-xs">
                          ⭐ Baseline
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1" />
                    <Badge variant="outline" className="text-slate-400 border-slate-600">
                      {photosForDate.length} {photosForDate.length === 1 ? 'foto' : 'fotos'}
                    </Badge>
                    {photosForDate[0]?.weight && photosForDate[0].weight !== 'N/A' && (
                      <Badge variant="outline" className="text-blue-400 border-blue-600/50">
                        {photosForDate[0].weight} kg
                      </Badge>
                    )}
                  </div>

                  {/* Grid de Fotos para esta Data */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photosForDate.map((photo, photoIndex) => {
                      // Encontrar índice global para badge
                      const globalIndex = allPhotos.findIndex(p => 
                        p.checkinId === photo.checkinId && p.photoNumber === photo.photoNumber
                      );
                      
                      return (
                        <div key={`${photo.checkinId}-${photo.photoNumber}`} className="space-y-2">
                          <div 
                            className={`relative group ${isSelectionMode ? 'cursor-pointer' : ''}`}
                            onClick={() => isSelectionMode && handleSelectPhoto(photo)}
                          >
                            {/* Indicador de Seleção */}
                            {isSelectionMode && (
                              <div className={`absolute inset-0 rounded-lg border-4 z-20 pointer-events-none transition-all ${
                                selectedBeforePhoto?.url === photo.url 
                                  ? 'border-red-500 bg-red-500/20' 
                                  : selectedAfterPhoto?.url === photo.url 
                                  ? 'border-emerald-500 bg-emerald-500/20' 
                                  : 'border-transparent hover:border-white/30'
                              }`}>
                                {selectedBeforePhoto?.url === photo.url && (
                                  <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                                    ANTES
                                  </div>
                                )}
                                {selectedAfterPhoto?.url === photo.url && (
                                  <div className="absolute top-2 right-2 bg-emerald-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                                    DEPOIS
                                  </div>
                                )}
                              </div>
                            )}
                            {photo.isVideo ? (
                              <video 
                                src={photo.url} 
                                controls
                                className="w-full h-48 object-cover rounded-lg border border-slate-600 hover:border-purple-500 transition-all"
                              />
                            ) : isGoogleDriveUrl(photo.url) ? (
                              <GoogleDriveImage
                                src={photo.url}
                                alt={`Foto ${globalIndex + 1}`}
                                className="w-full h-48 object-cover rounded-lg border border-slate-600 hover:border-purple-500 transition-all cursor-pointer hover:scale-105"
                                onClick={() => handleZoomPhoto(photo)}
                                onError={() => handleImageError(getPhotoId(photo), getPhotoUrl(photo), photo.url)}
                              />
                            ) : imageErrors.has(getPhotoId(photo)) ? (
                              <div className="w-full h-48 flex flex-col items-center justify-center bg-slate-700/50 rounded-lg border border-slate-600">
                                <ExternalLink className="h-8 w-8 text-slate-400 mb-2" />
                                <p className="text-xs text-slate-300 mb-2 px-2 text-center">Foto não disponível</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => window.open(photo.url, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Abrir
                                </Button>
                              </div>
                            ) : (
                              <img
                                src={getPhotoUrl(photo)}
                                alt={`Foto ${globalIndex + 1}`}
                                loading="lazy"
                                className="w-full h-48 object-cover rounded-lg border border-slate-600 hover:border-purple-500 transition-all cursor-pointer hover:scale-105"
                                onClick={() => handleZoomPhoto(photo)}
                                onError={() => handleImageError(getPhotoId(photo), getPhotoUrl(photo), photo.url)}
                              />
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className={`absolute top-2 left-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${photo.isInitial ? 'bg-purple-600/90 border-transparent' : 'bg-blue-600/90 border-transparent'} text-white cursor-pointer hover:opacity-80 transition-opacity z-10`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  {photo.angle === 'frente' ? '📷 Frente' : 
                                   photo.angle === 'lado' ? '📷 Lado D' : 
                                   photo.angle === 'lado_2' ? '📷 Lado E' : 
                                   photo.angle === 'costas' ? '📷 Costas' : 
                                   photo.isInitial ? '⭐' : `#${globalIndex + 1}`}
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-800 border-slate-600 z-50" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (photo.angle !== 'frente') {
                                      handleUpdatePhotoAngle(photo, 'frente');
                                    }
                                  }}
                                  disabled={isUpdatingAngle || photo.angle === 'frente'}
                                  className="text-white hover:bg-slate-700 cursor-pointer"
                                >
                                  📷 Frente {photo.angle === 'frente' && '✓'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (photo.angle !== 'lado') {
                                      handleUpdatePhotoAngle(photo, 'lado');
                                    }
                                  }}
                                  disabled={isUpdatingAngle || photo.angle === 'lado'}
                                  className="text-white hover:bg-slate-700 cursor-pointer"
                                >
                                  📷 Lado D {photo.angle === 'lado' && '✓'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (photo.angle !== 'lado_2') {
                                      handleUpdatePhotoAngle(photo, 'lado_2');
                                    }
                                  }}
                                  disabled={isUpdatingAngle || photo.angle === 'lado_2'}
                                  className="text-white hover:bg-slate-700 cursor-pointer"
                                >
                                  📷 Lado E {photo.angle === 'lado_2' && '✓'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (photo.angle !== 'costas') {
                                      handleUpdatePhotoAngle(photo, 'costas');
                                    }
                                  }}
                                  disabled={isUpdatingAngle || photo.angle === 'costas'}
                                  className="text-white hover:bg-slate-700 cursor-pointer"
                                >
                                  📷 Costas {photo.angle === 'costas' && '✓'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {/* Botão de download */}
                            <Button
                              size="sm"
                              variant="secondary"
                              className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPhoto(photo.url, `Foto-${photo.date}-${photo.weight}kg`);
                              }}
                              title="Baixar foto"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {/* Botão de deletar */}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPhotoToDelete(photo);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-xs text-center">
                            <p className="text-white font-semibold">{photo.weight} kg</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!photoToDelete} onOpenChange={(open) => !open && setPhotoToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Tem certeza que deseja deletar esta foto?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {photoToDelete && (
            <div className="px-6 pb-2">
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 space-y-1">
                <div className="text-sm text-slate-300">
                  <strong className="text-white">Data:</strong> {photoToDelete.date}
                </div>
                <div className="text-sm text-slate-300">
                  <strong className="text-white">Peso:</strong> {photoToDelete.weight} kg
                </div>
                <div className="text-sm text-slate-300">
                  <strong className="text-white">Tipo:</strong> {photoToDelete.isInitial ? 'Foto Inicial (Baseline)' : 'Foto de Check-in'}
                </div>
              </div>
              <div className="mt-3 text-red-400 font-semibold text-sm">
                ⚠️ Esta ação não pode ser desfeita!
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => photoToDelete && handleDeletePhoto(photoToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deletando...' : 'Deletar Foto'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Zoom */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-4xl bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between">
              <span>Foto - {selectedPhoto?.date}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-white">
                  {selectedPhoto?.weight} kg
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                  onClick={() => {
                    if (selectedPhoto) {
                      const link = document.createElement('a');
                      link.href = selectedPhoto.url;
                      link.download = `foto-${selectedPhoto.date}.jpg`;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Baixar
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="relative">
              {selectedPhoto.isVideo ? (
                <video 
                  src={selectedPhoto.url} 
                  controls
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                  onError={(e) => {
                    console.error('Erro ao carregar vídeo:', selectedPhoto.url);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : isGoogleDriveUrl(selectedPhoto.url) ? (
                // Usar imagem direta ao invés de iframe no modal para evitar controles do Google Drive
                <img
                  src={convertGoogleDriveUrl(selectedPhoto.url, false) || selectedPhoto.url}
                  alt="Foto ampliada"
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg bg-slate-800"
                  onError={(e) => {
                    console.error('Erro ao carregar imagem do Google Drive');
                    handleImageError(getPhotoId(selectedPhoto), getPhotoUrl(selectedPhoto), selectedPhoto.url);
                  }}
                  crossOrigin="anonymous"
                />
              ) : imageErrors.has(getPhotoId(selectedPhoto)) ? (
                <div className="w-full h-[70vh] flex flex-col items-center justify-center bg-slate-800/50 rounded-lg">
                  <ExternalLink className="h-16 w-16 text-slate-400 mb-4" />
                  <p className="text-slate-300 text-lg mb-6">Foto não disponível</p>
                  <Button
                    onClick={() => window.open(selectedPhoto.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir em nova aba
                  </Button>
                </div>
              ) : (
                <img
                  src={getPhotoUrl(selectedPhoto)}
                  alt="Foto ampliada"
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                  onError={() => handleImageError(getPhotoId(selectedPhoto), getPhotoUrl(selectedPhoto), selectedPhoto.url)}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Modal de Comparação de Fotos */}
      {patient && (
        <CheckinPhotoComparison
          patient={patient}
          checkins={checkins}
          open={showComparisonModal}
          onOpenChange={setShowComparisonModal}
        />
      )}

      {/* ITEM 4, 6, 8: Modal de Configuração de Visibilidade */}
      {patient && (
        <PhotoVisibilityModal
          open={showVisibilityModal}
          onClose={() => setShowVisibilityModal(false)}
          patient={patient}
          checkins={checkins}
          onSaved={() => {
            // Recarregar dados após salvar
            if (onPhotoDeleted) onPhotoDeleted();
          }}
        />
      )}

      {/* Modal de Edição da Comparação Antes/Depois */}
      {selectedBeforePhoto && selectedAfterPhoto && (
        <EditFeaturedComparisonModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          beforePhoto={selectedBeforePhoto}
          afterPhoto={selectedAfterPhoto}
          onSave={handleSaveFromEditor}
        />
      )}

    </>
  );
}
