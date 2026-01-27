import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check } from 'lucide-react';
import { useFeaturedComparison, CreateFeaturedComparisonData } from '@/hooks/use-featured-comparison';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];

interface Photo {
  url: string;
  date: string;
  weight?: string;
  checkinId?: string;
  angle?: string;
  isInitial?: boolean;
}

interface CreateFeaturedComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  telefone: string;
  checkins: Checkin[];
  patient?: Patient | null;
  onSuccess?: () => void;
}

export function CreateFeaturedComparisonModal({
  open,
  onOpenChange,
  telefone,
  checkins,
  onSuccess,
}: CreateFeaturedComparisonModalProps) {
  const { saveComparison, loading } = useFeaturedComparison(telefone);
  const [selectedBefore, setSelectedBefore] = useState<Photo | null>(null);
  const [selectedAfter, setSelectedAfter] = useState<Photo | null>(null);
  const [title, setTitle] = useState('Minha Transformação');
  const [description, setDescription] = useState('');

  // Extrair todas as fotos dos check-ins
  const allPhotos: Photo[] = [];
  
  console.log('🎯 CreateFeaturedComparisonModal: Total de check-ins:', checkins.length);
  
  checkins.forEach((checkin, index) => {
    const checkinAny = checkin as any;
    console.log(`🎯 Check-in ${index + 1}:`, {
      id: checkin.id,
      data: checkin.data_checkin,
      peso: checkin.peso,
      foto_frente: checkinAny.foto_frente,
      foto_costas: checkinAny.foto_costas,
      foto_lado_esquerdo: checkinAny.foto_lado_esquerdo,
      foto_lado_direito: checkinAny.foto_lado_direito,
    });
    
    // Tentar múltiplos nomes de campos para compatibilidade
    const photos = [
      { url: checkinAny.foto_frente || checkinAny.foto_frontal, angle: 'frente' },
      { url: checkinAny.foto_costas || checkinAny.foto_traseira, angle: 'costas' },
      { url: checkinAny.foto_lado_esquerdo || checkinAny.foto_lateral, angle: 'lado_esquerdo' },
      { url: checkinAny.foto_lado_direito || checkinAny.foto_lateral_direita, angle: 'lado_direito' },
    ];

    photos.forEach(({ url, angle }) => {
      if (url) {
        console.log(`✅ Foto encontrada: ${angle} - ${url.substring(0, 50)}...`);
        allPhotos.push({
          url,
          date: checkin.data_checkin,
          weight: checkin.peso,
          checkinId: checkin.id,
          angle,
        });
      }
    });
  });

  console.log('🎯 Total de fotos extraídas:', allPhotos.length);
  
  // Ordenar fotos por data (mais antigas primeiro)
  allPhotos.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleSave = async () => {
    if (!selectedBefore || !selectedAfter) {
      return;
    }

    const data: CreateFeaturedComparisonData = {
      telefone,
      before_photo_url: selectedBefore.url,
      before_photo_date: selectedBefore.date,
      before_weight: selectedBefore.weight ? parseFloat(selectedBefore.weight) : undefined,
      after_photo_url: selectedAfter.url,
      after_photo_date: selectedAfter.date,
      after_weight: selectedAfter.weight ? parseFloat(selectedAfter.weight) : undefined,
      title: title || 'Minha Transformação',
      description: description || undefined,
      is_visible: true,
    };

    try {
      await saveComparison(data);
      onSuccess?.();
      onOpenChange(false);
      // Resetar seleções
      setSelectedBefore(null);
      setSelectedAfter(null);
      setTitle('Minha Transformação');
      setDescription('');
    } catch (error) {
      console.error('Erro ao salvar comparação:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Criar Comparação Antes/Depois
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Selecione 2 fotos para criar uma comparação destacada que será exibida no portal público
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Aviso se não houver fotos */}
          {allPhotos.length === 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
              <p className="text-yellow-400 font-medium mb-2">⚠️ Nenhuma foto encontrada</p>
              <p className="text-yellow-300/80 text-sm">
                Os check-ins não possuem fotos cadastradas. Verifique se as fotos foram enviadas corretamente.
              </p>
              <p className="text-yellow-300/60 text-xs mt-2">
                Campos verificados: foto_frente, foto_costas, foto_lado_esquerdo, foto_lado_direito
              </p>
            </div>
          )}

          {/* Configurações */}
          <div className="space-y-4">
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

          {/* Seleção de Fotos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Foto ANTES */}
            <div>
              <Label className="text-white mb-3 block">
                1. Selecione a foto ANTES
                {selectedBefore && (
                  <Badge className="ml-2 bg-red-500/80 text-white">
                    Selecionada
                  </Badge>
                )}
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-2 bg-slate-800/50 rounded-lg">
                {allPhotos.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-slate-400">
                    <p className="mb-2">📸 Nenhuma foto disponível</p>
                    <p className="text-xs">Adicione fotos aos check-ins primeiro</p>
                  </div>
                ) : (
                  allPhotos.map((photo, index) => (
                    <button
                      key={`before-${index}`}
                      onClick={() => setSelectedBefore(photo)}
                      className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                        selectedBefore?.url === photo.url
                          ? 'border-red-500 ring-2 ring-red-500/50'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedBefore?.url === photo.url && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <div className="bg-red-500 rounded-full p-2">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-white text-xs">
                          {new Date(photo.date).toLocaleDateString('pt-BR')}
                        </p>
                        {photo.weight && (
                          <p className="text-slate-300 text-xs">
                            {photo.weight} kg
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Foto DEPOIS */}
            <div>
              <Label className="text-white mb-3 block">
                2. Selecione a foto DEPOIS
                {selectedAfter && (
                  <Badge className="ml-2 bg-emerald-500/80 text-white">
                    Selecionada
                  </Badge>
                )}
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-2 bg-slate-800/50 rounded-lg">
                {allPhotos.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-slate-400">
                    <p className="mb-2">📸 Nenhuma foto disponível</p>
                    <p className="text-xs">Adicione fotos aos check-ins primeiro</p>
                  </div>
                ) : (
                  allPhotos.map((photo, index) => (
                    <button
                      key={`after-${index}`}
                      onClick={() => setSelectedAfter(photo)}
                      className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                        selectedAfter?.url === photo.url
                          ? 'border-emerald-500 ring-2 ring-emerald-500/50'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedAfter?.url === photo.url && (
                        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                          <div className="bg-emerald-500 rounded-full p-2">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-white text-xs">
                          {new Date(photo.date).toLocaleDateString('pt-BR')}
                        </p>
                        {photo.weight && (
                          <p className="text-slate-300 text-xs">
                            {photo.weight} kg
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedBefore || !selectedAfter || loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {loading ? 'Salvando...' : 'Criar Comparação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
