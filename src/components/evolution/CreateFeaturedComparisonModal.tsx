// ✅ VERSÃO FINAL - HARD RESET - Timestamp: 2026-01-27T00:45:00Z
// Copiado EXATAMENTE do PhotoComparisonEditor.tsx que FUNCIONA
// Usa .forEach() e acessa checkin.foto_1, checkin.foto_2, checkin.foto_3, checkin.foto_4
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
type Patient = Database['public']['Tables']['patients']['Row'];

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
  patient,
  onSuccess,
}: CreateFeaturedComparisonModalProps) {
  const { saveComparison, loading } = useFeaturedComparison(telefone);
  const [selectedBefore, setSelectedBefore] = useState<Photo | null>(null);
  const [selectedAfter, setSelectedAfter] = useState<Photo | null>(null);
  const [title, setTitle] = useState('Minha Transformação');
  const [description, setDescription] = useState('');

  // Extrair todas as fotos disponíveis (MESMA LÓGICA do PhotoComparisonEditor que funciona)
  const allPhotos: Photo[] = [];

  // 1. Fotos iniciais do paciente
  const patientWithData = patient as any;
  if (patientWithData?.foto_inicial_frente) {
    allPhotos.push({
      url: patientWithData.foto_inicial_frente,
      date: patientWithData.data_fotos_iniciais 
        ? new Date(patientWithData.data_fotos_iniciais).toISOString()
        : new Date().toISOString(),
      weight: patientWithData.peso_inicial?.toString(),
      checkinId: 'initial-frente',
      angle: 'frente',
      isInitial: true,
    });
  }
  if (patientWithData?.foto_inicial_lado) {
    allPhotos.push({
      url: patientWithData.foto_inicial_lado,
      date: patientWithData.data_fotos_iniciais 
        ? new Date(patientWithData.data_fotos_iniciais).toISOString()
        : new Date().toISOString(),
      weight: patientWithData.peso_inicial?.toString(),
      checkinId: 'initial-lado',
      angle: 'lado',
      isInitial: true,
    });
  }
  if (patientWithData?.foto_inicial_lado_2) {
    allPhotos.push({
      url: patientWithData.foto_inicial_lado_2,
      date: patientWithData.data_fotos_iniciais 
        ? new Date(patientWithData.data_fotos_iniciais).toISOString()
        : new Date().toISOString(),
      weight: patientWithData.peso_inicial?.toString(),
      checkinId: 'initial-lado-2',
      angle: 'lado_2',
      isInitial: true,
    });
  }
  if (patientWithData?.foto_inicial_costas) {
    allPhotos.push({
      url: patientWithData.foto_inicial_costas,
      date: patientWithData.data_fotos_iniciais 
        ? new Date(patientWithData.data_fotos_iniciais).toISOString()
        : new Date().toISOString(),
      weight: patientWithData.peso_inicial?.toString(),
      checkinId: 'initial-costas',
      angle: 'costas',
      isInitial: true,
    });
  }

  // 2. Fotos dos check-ins (do mais antigo ao mais recente - IGUAL PhotoComparisonEditor)
  const sortedCheckins = [...checkins].sort((a, b) => 
    new Date(a.data_checkin).getTime() - new Date(b.data_checkin).getTime()
  );

  sortedCheckins.forEach((checkin) => {
    if (checkin.foto_1) {
      allPhotos.push({
        url: checkin.foto_1,
        date: checkin.data_checkin,
        weight: checkin.peso,
        checkinId: checkin.id,
        angle: 'frente',
      });
    }
    if (checkin.foto_2) {
      allPhotos.push({
        url: checkin.foto_2,
        date: checkin.data_checkin,
        weight: checkin.peso,
        checkinId: checkin.id,
        angle: 'lado',
      });
    }
    if (checkin.foto_3) {
      allPhotos.push({
        url: checkin.foto_3,
        date: checkin.data_checkin,
        weight: checkin.peso,
        checkinId: checkin.id,
        angle: 'lado_2',
      });
    }
    if (checkin.foto_4) {
      allPhotos.push({
        url: checkin.foto_4,
        date: checkin.data_checkin,
        weight: checkin.peso,
        checkinId: checkin.id,
        angle: 'costas',
      });
    }
  });
  
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
                Nem os check-ins nem o paciente possuem fotos cadastradas.
              </p>
              <p className="text-yellow-300/60 text-xs mt-2">
                Campos verificados: foto_inicial_frente, foto_inicial_lado, foto_inicial_lado_2, foto_inicial_costas (paciente) + foto_1, foto_2, foto_3, foto_4 (check-ins)
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
                    <p className="text-xs">Adicione fotos ao paciente ou check-ins primeiro</p>
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
                        {photo.isInitial && (
                          <p className="text-yellow-300 text-xs">📸 Inicial</p>
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
                    <p className="text-xs">Adicione fotos ao paciente ou check-ins primeiro</p>
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
                        {photo.isInitial && (
                          <p className="text-yellow-300 text-xs">📸 Inicial</p>
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
