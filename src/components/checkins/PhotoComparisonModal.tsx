import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { X, ChevronLeft, ChevronRight, Upload, Loader2, Image as ImageIcon, Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Slider } from '../ui/slider';
import { getMediaType } from '@/lib/media-utils';
import { convertGoogleDriveUrl, isGoogleDriveUrl } from '@/lib/google-drive-utils';
import { GoogleDriveImage } from '../ui/google-drive-image';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

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
  const { toast } = useToast();
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
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [previousCheckinIdState, setPreviousCheckinIdState] = useState<string | null>(null);
  
  // Estados para upload múltiplo
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'initial' | 'previous' | 'current' | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePositions, setFilePositions] = useState<{ [key: number]: PhotoAngle }>({});
  const [uploadingMultiple, setUploadingMultiple] = useState(false);
  const [hidePreviousColumn, setHidePreviousColumn] = useState(false);
  
  // Estados para zoom individual de cada coluna
  const [zoomInitial, setZoomInitial] = useState(100);
  const [zoomPrevious, setZoomPrevious] = useState(100);
  const [zoomCurrent, setZoomCurrent] = useState(100);
  
  // Estados para posição (pan) de cada coluna
  const [posInitial, setPosInitial] = useState({ x: 0, y: 0 });
  const [posPrevious, setPosPrevious] = useState({ x: 0, y: 0 });
  const [posCurrent, setPosCurrent] = useState({ x: 0, y: 0 });
  
  // Estados para controle de drag
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeColumn, setActiveColumn] = useState<'initial' | 'previous' | 'current' | null>(null);
  
  // Refs para inputs de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null); // Para upload simples (uma foto)
  const multipleFileInputRef = useRef<HTMLInputElement>(null); // Para upload múltiplo
  const [pendingUpload, setPendingUpload] = useState<{ type: 'initial' | 'previous' | 'current', angle: PhotoAngle } | null>(null);

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
      let prevCheckinId = previousCheckinId;
      if (previousCheckinId) {
        const { data } = await supabase
          .from('checkin')
          .select('id, foto_1, foto_2, foto_3, foto_4, data_checkin')
          .eq('id', previousCheckinId)
          .single();
        previousCheckinData = data;
        if (data) setPreviousCheckinIdState(data.id);
      } else {
        const checkinDateStr = typeof checkinDate === 'string' ? checkinDate : checkinDate.toISOString().split('T')[0];
        const { data } = await supabase
          .from('checkin')
          .select('id, foto_1, foto_2, foto_3, foto_4, data_checkin')
          .eq('telefone', telefone)
          .lt('data_checkin', checkinDateStr)
          .order('data_checkin', { ascending: false })
          .limit(1)
          .maybeSingle();
        previousCheckinData = data;
        if (data) {
          prevCheckinId = data.id;
          setPreviousCheckinIdState(data.id);
        }
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
      // Limpar upload múltiplo
      setSelectedFiles([]);
      setFilePositions({});
      setUploadType(null);
      setShowUploadModal(false);
      // Resetar zoom e posição
      setZoomInitial(100);
      setZoomPrevious(100);
      setZoomCurrent(100);
      setPosInitial({ x: 0, y: 0 });
      setPosPrevious({ x: 0, y: 0 });
      setPosCurrent({ x: 0, y: 0 });
      // Resetar estado de ocultar coluna anterior
      setHidePreviousColumn(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, checkinId, telefone, checkinDate, previousCheckinId]);

  // Auto-ocultar coluna anterior quando não há check-in anterior
  useEffect(() => {
    if (open && !previousDate) {
      setHidePreviousColumn(true);
    }
  }, [open, previousDate]);

  // Cleanup de URLs de preview quando arquivos são removidos ou modal fecha
  useEffect(() => {
    return () => {
      // URLs serão automaticamente coletadas pelo garbage collector quando o componente desmontar
      // Mas podemos forçar a revogação se necessário
    };
  }, [selectedFiles]);

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

  // Função para upload de foto
  const uploadPhoto = async (file: File, type: 'initial' | 'previous' | 'current', angle: PhotoAngle): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      let fileName = '';
      let filePath = '';
      
      if (type === 'initial') {
        fileName = `${telefone}_inicial_${angle}_${Date.now()}.${fileExt}`;
        // Não incluir o nome do bucket no caminho, pois .from() já especifica o bucket
        filePath = fileName;
      } else {
        const checkinIdForUpload = type === 'current' ? checkinId : previousCheckinIdState;
        if (!checkinIdForUpload) return null;
        const photoIndex = angle === 'frente' ? 1 : angle === 'lado' ? 2 : angle === 'lado_2' ? 3 : 4;
        fileName = `${telefone}_checkin_${checkinIdForUpload}_foto${photoIndex}_${Date.now()}.${fileExt}`;
        // Não incluir o nome do bucket no caminho, pois .from() já especifica o bucket
        filePath = fileName;
      }

      const { error: uploadError } = await supabase.storage
        .from('patient-photos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('patient-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      return null;
    }
  };

  // Função para salvar foto inicial
  const handleSaveInitialPhoto = async (file: File, angle: PhotoAngle) => {
    const uploadKey = `initial_${angle}`;
    setUploading(prev => ({ ...prev, [uploadKey]: true }));
    
    try {
      const photoUrl = await uploadPhoto(file, 'initial', angle);
      if (!photoUrl) {
        toast({
          title: 'Erro',
          description: 'Falha ao fazer upload da foto',
          variant: 'destructive'
        });
        return;
      }

      const fieldMap: { [key in PhotoAngle]: string } = {
        frente: 'foto_inicial_frente',
        lado: 'foto_inicial_lado',
        lado_2: 'foto_inicial_lado_2',
        costas: 'foto_inicial_costas'
      };

      const { error } = await supabase
        .from('patients')
        .update({
          [fieldMap[angle]]: photoUrl,
          data_fotos_iniciais: new Date().toISOString().split('T')[0]
        })
        .eq('telefone', telefone);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Foto inicial adicionada com sucesso!'
      });

      // Recarregar fotos
      await loadPhotos();
    } catch (error) {
      console.error('Erro ao salvar foto inicial:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar foto inicial',
        variant: 'destructive'
      });
    } finally {
      setUploading(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  // Função para salvar foto do checkin anterior
  const handleSavePreviousPhoto = async (file: File, angle: PhotoAngle) => {
    if (!previousCheckinIdState) return;
    
    const uploadKey = `previous_${angle}`;
    setUploading(prev => ({ ...prev, [uploadKey]: true }));
    
    try {
      const photoUrl = await uploadPhoto(file, 'previous', angle);
      if (!photoUrl) {
        toast({
          title: 'Erro',
          description: 'Falha ao fazer upload da foto',
          variant: 'destructive'
        });
        return;
      }

      const fieldMap: { [key in PhotoAngle]: string } = {
        frente: 'foto_1',
        lado: 'foto_2',
        lado_2: 'foto_3',
        costas: 'foto_4'
      };

      const { error } = await supabase
        .from('checkin')
        .update({ [fieldMap[angle]]: photoUrl })
        .eq('id', previousCheckinIdState);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Foto do check-in anterior adicionada com sucesso!'
      });

      // Recarregar fotos
      await loadPhotos();
    } catch (error) {
      console.error('Erro ao salvar foto do checkin anterior:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar foto do check-in anterior',
        variant: 'destructive'
      });
    } finally {
      setUploading(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  // Função para salvar foto do checkin atual
  const handleSaveCurrentPhoto = async (file: File, angle: PhotoAngle) => {
    const uploadKey = `current_${angle}`;
    setUploading(prev => ({ ...prev, [uploadKey]: true }));
    
    try {
      const photoUrl = await uploadPhoto(file, 'current', angle);
      if (!photoUrl) {
        toast({
          title: 'Erro',
          description: 'Falha ao fazer upload da foto',
          variant: 'destructive'
        });
        return;
      }

      const fieldMap: { [key in PhotoAngle]: string } = {
        frente: 'foto_1',
        lado: 'foto_2',
        lado_2: 'foto_3',
        costas: 'foto_4'
      };

      const { error } = await supabase
        .from('checkin')
        .update({ [fieldMap[angle]]: photoUrl })
        .eq('id', checkinId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Foto do check-in atual adicionada com sucesso!'
      });

      // Recarregar fotos
      await loadPhotos();
    } catch (error) {
      console.error('Erro ao salvar foto do checkin atual:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar foto do check-in atual',
        variant: 'destructive'
      });
    } finally {
      setUploading(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  // Handler para quando arquivo é selecionado (modo simples - uma foto)
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUpload) return;

    const { type, angle } = pendingUpload;
    setPendingUpload(null);
    
    if (type === 'initial') {
      await handleSaveInitialPhoto(file, angle);
    } else if (type === 'previous') {
      await handleSavePreviousPhoto(file, angle);
    } else {
      await handleSaveCurrentPhoto(file, angle);
    }

    e.target.value = '';
  };

  // Handler para seleção múltipla de fotos
  const handleMultipleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSelectedFiles(files);
    // Inicializar posições com base nas disponíveis
    const initialPositions: { [key: number]: PhotoAngle } = {};
    if (uploadType) {
      const available = getAvailablePositions(uploadType);
      files.forEach((_, index) => {
        // Usar posição disponível ou a primeira disponível se não houver mais
        initialPositions[index] = available[index] || available[0] || 'frente';
      });
    } else {
      // Fallback: usar frente para todos
      files.forEach((_, index) => {
        initialPositions[index] = 'frente';
      });
    }
    setFilePositions(initialPositions);
    e.target.value = '';
  };

  // Função para fazer upload de múltiplas fotos
  const handleUploadMultiplePhotos = async () => {
    if (!uploadType || selectedFiles.length === 0) return;

    setUploadingMultiple(true);
    const updates: { [key: string]: string } = {};
    
    try {
      // Upload de cada foto
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const angle = filePositions[i] || 'frente';
        
        const photoUrl = await uploadPhoto(file, uploadType, angle);
        if (!photoUrl) {
          toast({
            title: 'Erro',
            description: `Falha ao fazer upload da foto ${i + 1}`,
            variant: 'destructive'
          });
          continue;
        }

        // Mapear para o campo correto
        if (uploadType === 'initial') {
          const fieldMap: { [key in PhotoAngle]: string } = {
            frente: 'foto_inicial_frente',
            lado: 'foto_inicial_lado',
            lado_2: 'foto_inicial_lado_2',
            costas: 'foto_inicial_costas'
          };
          updates[fieldMap[angle]] = photoUrl;
        } else {
          const fieldMap: { [key in PhotoAngle]: string } = {
            frente: 'foto_1',
            lado: 'foto_2',
            lado_2: 'foto_3',
            costas: 'foto_4'
          };
          updates[fieldMap[angle]] = photoUrl;
        }
      }

      // Atualizar banco de dados
      if (Object.keys(updates).length > 0) {
        if (uploadType === 'initial') {
          updates.data_fotos_iniciais = new Date().toISOString().split('T')[0];
          const { error } = await supabase
            .from('patients')
            .update(updates)
            .eq('telefone', telefone);
          
          if (error) throw error;
        } else if (uploadType === 'previous' && previousCheckinIdState) {
          const { error } = await supabase
            .from('checkin')
            .update(updates)
            .eq('id', previousCheckinIdState);
          
          if (error) throw error;
        } else if (uploadType === 'current') {
          const { error } = await supabase
            .from('checkin')
            .update(updates)
            .eq('id', checkinId);
          
          if (error) throw error;
        }

        toast({
          title: 'Sucesso',
          description: `${Object.keys(updates).length} foto(s) adicionada(s) com sucesso!`
        });

        // Recarregar fotos
        await loadPhotos();
        
        // Fechar modal e limpar estado
        setShowUploadModal(false);
        setSelectedFiles([]);
        setFilePositions({});
        setUploadType(null);
      }
    } catch (error) {
      console.error('Erro ao fazer upload múltiplo:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao fazer upload das fotos',
        variant: 'destructive'
      });
    } finally {
      setUploadingMultiple(false);
    }
  };

  // Obter posições disponíveis baseado no tipo
  const getAvailablePositions = (type: 'initial' | 'previous' | 'current'): PhotoAngle[] => {
    const allPositions: PhotoAngle[] = ['frente', 'lado', 'lado_2', 'costas'];
    
    if (type === 'initial') {
      return allPositions.filter(pos => !initialPhotos[pos]);
    } else if (type === 'previous') {
      return allPositions.filter(pos => !previousPhotos[pos]);
    } else {
      return allPositions.filter(pos => !currentPhotos[pos]);
    }
  };

  // Refs para manter referências atualizadas dos estados
  const isDraggingRef = useRef(isDragging);
  const activeColumnRef = useRef(activeColumn);
  const dragStartRef = useRef(dragStart);
  const posInitialRef = useRef(posInitial);
  const posPreviousRef = useRef(posPrevious);
  const posCurrentRef = useRef(posCurrent);

  // Atualizar refs quando estados mudarem
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    activeColumnRef.current = activeColumn;
  }, [activeColumn]);

  useEffect(() => {
    dragStartRef.current = dragStart;
  }, [dragStart]);

  useEffect(() => {
    posInitialRef.current = posInitial;
  }, [posInitial]);

  useEffect(() => {
    posPreviousRef.current = posPrevious;
  }, [posPrevious]);

  useEffect(() => {
    posCurrentRef.current = posCurrent;
  }, [posCurrent]);

  // Handlers para drag (arrastar imagem) - CORRIGIDOS
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !activeColumnRef.current) return;
    
    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    const currentPos = activeColumnRef.current === 'initial' ? posInitialRef.current : 
                       activeColumnRef.current === 'previous' ? posPreviousRef.current : posCurrentRef.current;
    
    const newPos = { x: currentPos.x + dx, y: currentPos.y + dy };
    
    if (activeColumnRef.current === 'initial') {
      setPosInitial(newPos);
    } else if (activeColumnRef.current === 'previous') {
      setPosPrevious(newPos);
    } else {
      setPosCurrent(newPos);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleGlobalMouseUp = useCallback(() => {
    setIsDragging(false);
    setActiveColumn(null);
    
    // Restaurar cursor
    document.body.style.cursor = '';
    
    // Remover event listeners globais
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [handleGlobalMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent, column: 'initial' | 'previous' | 'current') => {
    // Permitir arrastar sempre que há uma foto
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setActiveColumn(column);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    // Adicionar event listeners globais para melhor controle
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    // Mudar cursor para grabbing
    document.body.style.cursor = 'grabbing';
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Esta função agora é apenas para compatibilidade, o drag real usa os handlers globais
    if (!isDragging || !activeColumn) return;
    e.preventDefault();
  }, [isDragging, activeColumn]);

  const handleMouseUp = useCallback(() => {
    // Fallback para quando o mouse up acontece dentro do elemento
    if (isDragging) {
      handleGlobalMouseUp();
    }
  }, [isDragging, handleGlobalMouseUp]);

  // Handlers para touch (mobile) - MELHORADOS
  const handleTouchStart = useCallback((e: React.TouchEvent, column: 'initial' | 'previous' | 'current') => {
    // Permitir arrastar sempre que há uma foto
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setActiveColumn(column);
    setDragStart({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !activeColumn) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.x;
    const dy = touch.clientY - dragStart.y;
    
    const currentPos = activeColumn === 'initial' ? posInitial : 
                       activeColumn === 'previous' ? posPrevious : posCurrent;
    
    const newPos = { x: currentPos.x + dx, y: currentPos.y + dy };
    
    if (activeColumn === 'initial') {
      setPosInitial(newPos);
    } else if (activeColumn === 'previous') {
      setPosPrevious(newPos);
    } else {
      setPosCurrent(newPos);
    }
    
    setDragStart({ x: touch.clientX, y: touch.clientY });
  }, [isDragging, activeColumn, dragStart, posInitial, posPrevious, posCurrent]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setActiveColumn(null);
  }, []);

  // Handler para zoom com scroll do mouse
  const handleWheel = useCallback((e: React.WheelEvent, column: 'initial' | 'previous' | 'current') => {
    e.preventDefault();
    
    const currentZoom = column === 'initial' ? zoomInitial : 
                        column === 'previous' ? zoomPrevious : zoomCurrent;
    
    const delta = e.deltaY > 0 ? -10 : 10;
    const newZoom = Math.max(50, Math.min(200, currentZoom + delta));
    
    if (column === 'initial') {
      setZoomInitial(newZoom);
    } else if (column === 'previous') {
      setZoomPrevious(newZoom);
    } else {
      setZoomCurrent(newZoom);
    }
    
    // Se o zoom voltar para 100% ou menos, resetar posição
    if (newZoom <= 100) {
      if (column === 'initial') {
        setPosInitial({ x: 0, y: 0 });
      } else if (column === 'previous') {
        setPosPrevious({ x: 0, y: 0 });
      } else {
        setPosCurrent({ x: 0, y: 0 });
      }
    }
  }, [zoomInitial, zoomPrevious, zoomCurrent]);

  // Cleanup dos event listeners quando o componente desmontar
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  // Reset drag state quando modal fechar
  React.useEffect(() => {
    if (!open) {
      setIsDragging(false);
      setActiveColumn(null);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [open]);

  const renderPhoto = (photoUrl: string | undefined, date: string, source: string, type: 'initial' | 'previous' | 'current', angle: PhotoAngle, zoom: number, pos: { x: number, y: number }) => {
    const uploadKey = `${type}_${angle}`;
    const isUploading = uploading[uploadKey];

    if (!photoUrl) {
      // Verificar se há outras fotos ausentes para oferecer upload múltiplo
      const availablePositions = getAvailablePositions(type);
      const hasAnyEmpty = availablePositions.length > 0;

      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/50 rounded border border-slate-700 min-h-[150px] md:min-h-[200px] gap-2 p-2 md:p-4">
          <span className="text-xs text-slate-500">Sem foto</span>
          {hasAnyEmpty && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setUploadType(type);
                      setShowUploadModal(true);
                    }}
                    disabled={isUploading}
                    className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adicionar Fotos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    }

    const isVideo = getMediaType(photoUrl) === 'video';
    const url = getPhotoUrl(photoUrl, isVideo);
    const canDrag = true; // Sempre permitir drag quando há foto
    const isActiveDrag = isDragging && activeColumn === type;

    return (
      <div 
        className={`w-full h-full flex items-center justify-center bg-slate-900 rounded border border-slate-700 overflow-hidden min-h-[150px] md:min-h-[200px] relative select-none ${
          canDrag 
            ? isActiveDrag 
              ? 'cursor-grabbing' 
              : 'cursor-grab hover:bg-slate-800/50' 
            : 'cursor-default'
        }`}
        onMouseDown={(e) => handleMouseDown(e, type)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={(e) => handleTouchStart(e, type)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={(e) => handleWheel(e, type)}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      >
        {/* Indicador visual quando pode arrastar */}
        {canDrag && !isActiveDrag && zoom === 100 && (
          <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
            🖱️ Clique e arraste
          </div>
        )}
        
        {/* Indicador de zoom ativo */}
        {zoom > 100 && (
          <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
            {zoom}%
          </div>
        )}
        
        {/* Indicador de posição quando arrastado */}
        {(pos.x !== 0 || pos.y !== 0) && (
          <div className="absolute bottom-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
            📍 {Math.round(pos.x)}, {Math.round(pos.y)}
          </div>
        )}
        
        <div 
          className={`w-full h-full flex items-center justify-center ${
            isActiveDrag ? '' : 'transition-transform duration-150 ease-out'
          }`}
          style={{ 
            transform: `scale(${zoom / 100}) translate(${pos.x / (zoom / 100)}px, ${pos.y / (zoom / 100)}px)`,
            transformOrigin: 'center center'
          }}
        >
          {isVideo ? (
            <video
              src={url || photoUrl}
              controls
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
            />
          ) : (
            <GoogleDriveImage
              src={photoUrl}
              alt={`${source} - ${date}`}
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
              style={{ userSelect: 'none' }}
            />
          )}
        </div>
        
        {/* Overlay para melhor controle de drag - sempre ativo quando há foto */}
        <div 
          className="absolute inset-0 z-5 bg-transparent"
          onMouseDown={(e) => handleMouseDown(e, type)}
          onTouchStart={(e) => handleTouchStart(e, type)}
        />
      </div>
    );
  };

  // Componente para controles de zoom e posição - MELHORADO
  const ZoomControls = ({ 
    zoom, 
    setZoom, 
    pos, 
    setPos, 
    color 
  }: { 
    zoom: number, 
    setZoom: (z: number) => void, 
    pos: { x: number, y: number },
    setPos: (p: { x: number, y: number }) => void,
    color: string 
  }) => {
    const hasChanges = zoom !== 100 || pos.x !== 0 || pos.y !== 0;
    
    return (
      <div className="flex flex-col items-center gap-1 mt-1">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            className={`h-5 w-5 p-0 text-${color}-400 hover:text-${color}-300`}
            disabled={zoom <= 50}
          >
            <ZoomOut className="w-3 h-3" />
          </Button>
          <div className="w-14 md:w-16 px-1">
            <Slider
              value={[zoom]}
              onValueChange={(v) => setZoom(v[0])}
              min={50}
              max={200}
              step={5}
              className="h-1"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.min(200, zoom + 10))}
            className={`h-5 w-5 p-0 text-${color}-400 hover:text-${color}-300`}
            disabled={zoom >= 200}
          >
            <ZoomIn className="w-3 h-3" />
          </Button>
          <span className="text-[9px] text-slate-500 w-7">{zoom}%</span>
          {hasChanges && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setZoom(100);
                      setPos({ x: 0, y: 0 });
                    }}
                    className="h-5 w-5 p-0 text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Resetar zoom e posição</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {/* Dica sobre controles */}
        <div className="text-[8px] text-slate-500 text-center">
          🖱️ Scroll para zoom • Clique e arraste para mover
        </div>
      </div>
    );
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[90vw] max-h-[75vh] p-0 bg-slate-900 border-slate-700 flex flex-col">
        <DialogHeader className="p-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-slate-200 flex items-center gap-2">
              Comparação de Fotos
            </DialogTitle>
            <div className="flex items-center gap-2">
              {previousDate && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHidePreviousColumn(!hidePreviousColumn)}
                        className="text-slate-400 hover:text-white h-8 px-2"
                      >
                        {hidePreviousColumn ? (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            <span className="text-xs">Mostrar Anterior</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            <span className="text-xs">Ocultar Anterior</span>
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{hidePreviousColumn ? 'Mostrar coluna do check-in anterior' : 'Ocultar coluna do check-in anterior'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-slate-400 hover:text-white h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center flex-1 p-8">
            <div className="text-slate-400">Carregando fotos...</div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Input oculto para upload de fotos (modo simples) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
            {/* Grid de comparação - lado a lado em mobile também */}
            <div className={`flex-1 grid gap-2 md:gap-4 p-2 md:p-4 overflow-auto min-h-0 ${
              hidePreviousColumn 
                ? 'grid-cols-2' 
                : 'grid-cols-2 md:grid-cols-3'
            }`}>
              {/* Coluna 1: Inicial */}
              <div className="flex flex-col">
                <div className="mb-2 text-center">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/30 text-xs font-medium">
                      ⭐ Dados Iniciais
                    </div>
                    {getAvailablePositions('initial').length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUploadType('initial');
                                setShowUploadModal(true);
                              }}
                              className="h-6 w-6 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Adicionar Fotos</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
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
                <div className="flex-1 min-h-[150px] md:min-h-[200px]">
                  {renderPhoto(initialPhotos[selectedAngleInitial], initialDate, 'Inicial', 'initial', selectedAngleInitial, zoomInitial, posInitial)}
                </div>
                {/* Controles de zoom e posição */}
                {initialPhotos[selectedAngleInitial] && (
                  <div className="flex justify-center">
                    <ZoomControls zoom={zoomInitial} setZoom={setZoomInitial} pos={posInitial} setPos={setPosInitial} color="green" />
                  </div>
                )}
              </div>

              {/* Coluna 2: Check-in Anterior */}
              {!hidePreviousColumn && (
              <div className="flex flex-col">
                <div className="mb-2 text-center">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium">
                      📅 Check-in Anterior
                    </div>
                    {previousDate && getAvailablePositions('previous').length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUploadType('previous');
                                setShowUploadModal(true);
                              }}
                              className="h-6 w-6 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Adicionar Fotos</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
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
                <div className="flex-1 min-h-[150px] md:min-h-[200px]">
                  {previousDate ? (
                    renderPhoto(previousPhotos[selectedAnglePrevious], previousDate, 'Anterior', 'previous', selectedAnglePrevious, zoomPrevious, posPrevious)
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800/50 rounded border border-slate-700 min-h-[150px] md:min-h-[200px]">
                      <span className="text-xs text-slate-500">Sem check-in anterior</span>
                    </div>
                  )}
                </div>
                {/* Controles de zoom e posição */}
                {previousDate && previousPhotos[selectedAnglePrevious] && (
                  <div className="flex justify-center">
                    <ZoomControls zoom={zoomPrevious} setZoom={setZoomPrevious} pos={posPrevious} setPos={setPosPrevious} color="purple" />
                  </div>
                )}
              </div>
              )}

              {/* Coluna 3: Check-in Atual */}
              <div className="flex flex-col">
                <div className="mb-2 text-center">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-medium">
                      📸 Check-in Atual
                    </div>
                    {getAvailablePositions('current').length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUploadType('current');
                                setShowUploadModal(true);
                              }}
                              className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Adicionar Fotos</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
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
                <div className="flex-1 min-h-[150px] md:min-h-[200px]">
                  {renderPhoto(currentPhotos[selectedAngleCurrent], currentDate, 'Atual', 'current', selectedAngleCurrent, zoomCurrent, posCurrent)}
                </div>
                {/* Controles de zoom e posição */}
                {currentPhotos[selectedAngleCurrent] && (
                  <div className="flex justify-center">
                    <ZoomControls zoom={zoomCurrent} setZoom={setZoomCurrent} pos={posCurrent} setPos={setPosCurrent} color="blue" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Modal para upload múltiplo de fotos */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-200">
              Adicionar Fotos - {
                uploadType === 'initial' ? 'Dados Iniciais' :
                uploadType === 'previous' ? 'Check-in Anterior' :
                'Check-in Atual'
              }
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Selecione múltiplas fotos e escolha a posição de cada uma
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Input de arquivo */}
            <div>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                ref={multipleFileInputRef}
                onChange={handleMultipleFilesSelected}
              />
              <Button
                variant="outline"
                onClick={() => multipleFileInputRef.current?.click()}
                className="w-full border-green-500/50 text-green-400 hover:bg-green-500/20"
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Fotos
              </Button>
              {selectedFiles.length > 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  {selectedFiles.length} foto(s) selecionada(s)
                </p>
              )}
            </div>

            {/* Lista de fotos selecionadas com seleção de posição */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {selectedFiles.map((file, index) => {
                  const previewUrl = URL.createObjectURL(file);
                  const availablePositions = uploadType ? getAvailablePositions(uploadType) : ['frente', 'lado', 'lado_2', 'costas'];

                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded border border-slate-700">
                      {/* Preview da foto */}
                      <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-slate-700">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={previewUrl}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Nome do arquivo e seleção de posição */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 truncate mb-2">
                          {file.name}
                        </p>
                        <Select
                          value={filePositions[index] || availablePositions[0] || 'frente'}
                          onValueChange={(value: PhotoAngle) => {
                            setFilePositions(prev => ({ ...prev, [index]: value }));
                          }}
                        >
                          <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-slate-200">
                            <SelectValue placeholder="Selecione a posição" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePositions.map((pos) => (
                              <SelectItem key={pos} value={pos}>
                                {pos === 'frente' ? '📷 Foto 1 (Frente)' :
                                 pos === 'lado' ? '📷 Foto 2 (Lado D)' :
                                 pos === 'lado_2' ? '📷 Foto 3 (Lado E)' :
                                 '📷 Foto 4 (Costas)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Botão remover */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                          const newPositions = { ...filePositions };
                          delete newPositions[index];
                          setFilePositions(newPositions);
                          URL.revokeObjectURL(previewUrl);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles([]);
                  setFilePositions({});
                  setUploadType(null);
                  // Revogar URLs de preview
                  selectedFiles.forEach(() => {
                    // URLs serão automaticamente coletadas pelo garbage collector
                  });
                }}
                disabled={uploadingMultiple}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadMultiplePhotos}
                disabled={selectedFiles.length === 0 || uploadingMultiple}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {uploadingMultiple ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}Foto(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

