import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { checkinService } from '@/lib/checkin-service';
import { processPhotoFile } from '@/lib/heic-converter';

interface AddPhotosToCheckinProps {
  checkinId: string;
  checkinDate: string;
  pacienteNome?: string;
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddPhotosToCheckin({ 
  checkinId, 
  checkinDate,
  pacienteNome = 'Paciente',
  onSuccess, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange 
}: AddPhotosToCheckinProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Estados para as fotos
  const [fotoFrente, setFotoFrente] = useState<File | null>(null);
  const [fotoLado, setFotoLado] = useState<File | null>(null);
  const [fotoLado2, setFotoLado2] = useState<File | null>(null);
  const [fotoCostas, setFotoCostas] = useState<File | null>(null);
  
  // Preview URLs
  const [previewFrente, setPreviewFrente] = useState<string>('');
  const [previewLado, setPreviewLado] = useState<string>('');
  const [previewLado2, setPreviewLado2] = useState<string>('');
  const [previewCostas, setPreviewCostas] = useState<string>('');

  // Refs para inputs de arquivo
  const frenteInputRef = useRef<HTMLInputElement>(null);
  const ladoInputRef = useRef<HTMLInputElement>(null);
  const lado2InputRef = useRef<HTMLInputElement>(null);
  const costasInputRef = useRef<HTMLInputElement>(null);

  // Buscar telefone do paciente através do check-in
  const [telefone, setTelefone] = useState<string>('');

  useEffect(() => {
    if (open && checkinId) {
      // Buscar telefone do check-in
      const fetchCheckin = async () => {
        try {
          const { data } = await supabase
            .from('checkin')
            .select('telefone')
            .eq('id', checkinId)
            .single();
          
          if (data?.telefone) {
            setTelefone(data.telefone);
          }
        } catch (error) {
          console.error('Erro ao buscar telefone do check-in:', error);
        }
      };
      fetchCheckin();
    }
  }, [open, checkinId]);

  // Limpar formulário quando fechar
  useEffect(() => {
    if (!open) {
      setFotoFrente(null);
      setFotoLado(null);
      setFotoLado2(null);
      setFotoCostas(null);
      setPreviewFrente('');
      setPreviewLado('');
      setPreviewLado2('');
      setPreviewCostas('');
    }
  }, [open]);

  const handleFileChange = (
    file: File | null,
    setFile: (file: File | null) => void,
    setPreview: (url: string) => void
  ) => {
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (file: File, path: string): Promise<string | null> => {
    try {
      // Processar arquivo (converte HEIC para JPEG automaticamente se necessário)
      const processedFile = await processPhotoFile(file);
      
      const { data, error } = await supabase.storage
        .from('patient-photos')
        .upload(path, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('patient-photos')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!fotoFrente && !fotoLado && !fotoLado2 && !fotoCostas) {
      toast({
        title: 'Atenção',
        description: 'Adicione pelo menos uma foto',
        variant: 'destructive'
      });
      return;
    }

    if (!telefone) {
      toast({
        title: 'Erro',
        description: 'Não foi possível identificar o paciente',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const photoUrls: { foto_1?: string; foto_2?: string; foto_3?: string; foto_4?: string } = {};

      // Upload das fotos (apenas as que foram selecionadas)
      if (fotoFrente) {
        const timestamp = Date.now();
        const fileName = `${telefone}/checkin-fotos/${timestamp}-frente.jpg`;
        const url = await uploadPhoto(fotoFrente, fileName);
        if (url) photoUrls.foto_1 = url;
      }

      if (fotoLado) {
        const timestamp = Date.now();
        const fileName = `${telefone}/checkin-fotos/${timestamp}-lado.jpg`;
        const url = await uploadPhoto(fotoLado, fileName);
        if (url) photoUrls.foto_2 = url;
      }

      if (fotoLado2) {
        const timestamp = Date.now();
        const fileName = `${telefone}/checkin-fotos/${timestamp}-lado2.jpg`;
        const url = await uploadPhoto(fotoLado2, fileName);
        if (url) photoUrls.foto_3 = url;
      }

      if (fotoCostas) {
        const timestamp = Date.now();
        const fileName = `${telefone}/checkin-fotos/${timestamp}-costas.jpg`;
        const url = await uploadPhoto(fotoCostas, fileName);
        if (url) photoUrls.foto_4 = url;
      }

      // Atualizar check-in existente apenas com as fotos selecionadas
      // As fotos existentes que não foram substituídas serão preservadas automaticamente
      await checkinService.update(checkinId, photoUrls);

      toast({
        title: 'Sucesso!',
        description: 'Fotos adicionadas ao check-in com sucesso'
      });

      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar fotos:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível salvar as fotos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20">
          <Camera className="w-4 h-4" />
          Adicionar Fotos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Adicionar Fotos ao Check-in
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Adicione fotos ao check-in de <strong className="text-white">{new Date(checkinDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong> de {pacienteNome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Foto Frente */}
          <div className="space-y-2">
            <Label className="text-slate-300">Foto 1 - Frente</Label>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  ref={frenteInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, setFotoFrente, setPreviewFrente)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => frenteInputRef.current?.click()}
                  className="w-full bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {fotoFrente ? 'Trocar Foto' : 'Selecionar Foto'}
                </Button>
              </div>
              {previewFrente && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-600">
                  <img src={previewFrente} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFotoFrente(null);
                      setPreviewFrente('');
                      if (frenteInputRef.current) frenteInputRef.current.value = '';
                    }}
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Foto Lado */}
          <div className="space-y-2">
            <Label className="text-slate-300">Foto 2 - Lado</Label>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  ref={ladoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, setFotoLado, setPreviewLado)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => ladoInputRef.current?.click()}
                  className="w-full bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {fotoLado ? 'Trocar Foto' : 'Selecionar Foto'}
                </Button>
              </div>
              {previewLado && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-600">
                  <img src={previewLado} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFotoLado(null);
                      setPreviewLado('');
                      if (ladoInputRef.current) ladoInputRef.current.value = '';
                    }}
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Foto Lado 2 */}
          <div className="space-y-2">
            <Label className="text-slate-300">Foto 3 - Lado E</Label>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  ref={lado2InputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, setFotoLado2, setPreviewLado2)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => lado2InputRef.current?.click()}
                  className="w-full bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {fotoLado2 ? 'Trocar Foto' : 'Selecionar Foto'}
                </Button>
              </div>
              {previewLado2 && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-600">
                  <img src={previewLado2} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFotoLado2(null);
                      setPreviewLado2('');
                      if (lado2InputRef.current) lado2InputRef.current.value = '';
                    }}
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Foto Costas */}
          <div className="space-y-2">
            <Label className="text-slate-300">Foto 4 - Costas</Label>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  ref={costasInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, setFotoCostas, setPreviewCostas)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => costasInputRef.current?.click()}
                  className="w-full bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {fotoCostas ? 'Trocar Foto' : 'Selecionar Foto'}
                </Button>
              </div>
              {previewCostas && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-600">
                  <img src={previewCostas} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFotoCostas(null);
                      setPreviewCostas('');
                      if (costasInputRef.current) costasInputRef.current.value = '';
                    }}
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || (!fotoFrente && !fotoLado && !fotoLado2 && !fotoCostas)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Fotos'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
