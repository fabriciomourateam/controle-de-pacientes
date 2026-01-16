import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Save, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { checkinService } from '@/lib/checkin-service';
import { extractMeasurements } from '@/lib/measurement-utils';

interface AddEvolutionDataProps {
  telefone: string;
  nome: string;
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showButton?: boolean; // Controla se o botão deve ser renderizado (padrão: true quando não controlado externamente)
}

export function AddEvolutionData({ telefone, nome, onSuccess, open: externalOpen, onOpenChange: externalOnOpenChange, showButton }: AddEvolutionDataProps) {
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

  // Estados para medidas
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [quadril, setQuadril] = useState('');

  // Função para obter data local sem problema de timezone
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [dataRegistro, setDataRegistro] = useState(getLocalDateString());

  // Refs para inputs de arquivo
  const frenteInputRef = useRef<HTMLInputElement>(null);
  const ladoInputRef = useRef<HTMLInputElement>(null);
  const lado2InputRef = useRef<HTMLInputElement>(null);
  const costasInputRef = useRef<HTMLInputElement>(null);

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
      setPeso('');
      setCintura('');
      setQuadril('');
      setDataRegistro(getLocalDateString());
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
      const { data, error } = await supabase.storage
        .from('patient-photos')
        .upload(path, file, {
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
    // Validar que pelo menos algo foi preenchido
    if (!fotoFrente && !fotoLado && !fotoLado2 && !fotoCostas && !peso && !cintura && !quadril) {
      toast({
        title: 'Atenção',
        description: 'Adicione pelo menos uma foto ou medida',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const photoUrls: { foto_1?: string; foto_2?: string; foto_3?: string; foto_4?: string } = {};

      // Upload das fotos
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

      // Preparar medidas
      let medidaString = '';
      if (cintura || quadril) {
        const medidas: string[] = [];
        if (cintura) medidas.push(`cintura ${cintura}`);
        if (quadril) medidas.push(`quadril ${quadril}`);
        medidaString = medidas.join('\n');
      }

      // Buscar check-ins existentes do paciente para verificar se já existe um na mesma data
      const existingCheckins = await checkinService.getByPhone(telefone);
      const existingCheckin = existingCheckins.find(
        c => c.data_checkin === dataRegistro
      );

      const checkinData: any = {
        telefone,
        data_checkin: dataRegistro,
        data_preenchimento: new Date().toISOString(),
        tipo_checkin: 'evolucao', // Marcar como registro de evolução
        ...photoUrls
      };

      // Adicionar peso se fornecido
      if (peso) {
        checkinData.peso = peso;
      }

      // Adicionar medidas se fornecidas
      if (medidaString) {
        checkinData.medida = medidaString;
      }

      if (existingCheckin) {
        // Atualizar check-in existente
        await checkinService.update(existingCheckin.id, checkinData);
      } else {
        // Criar novo check-in
        await checkinService.create(checkinData);
      }

      toast({
        title: 'Sucesso!',
        description: 'Dados adicionados à evolução com sucesso'
      });

      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar dados:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível salvar os dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Renderizar botão apenas se:
          1. Não está sendo controlado externamente (externalOpen === undefined) OU
          2. showButton === true (explicitamente solicitado)
      */}
      {(externalOpen === undefined || showButton === true) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          style={{
            backgroundImage: 'linear-gradient(to right, rgb(37, 99, 235), rgb(8, 145, 178))',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundImage = 'linear-gradient(to right, rgb(29, 78, 216), rgb(14, 116, 144))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundImage = 'linear-gradient(to right, rgb(37, 99, 235), rgb(8, 145, 178))';
          }}
          className="gap-2 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all border-0"
        >
          <Camera className="w-4 h-4" />
          Adicionar Dados
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Adicionar Dados de Evolução
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Adicione fotos, peso e medidas para uma data específica. Esses dados serão considerados na comparação de check-ins.
            </DialogDescription>
          </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Data do registro */}
          <div className="space-y-2">
            <Label htmlFor="data-registro" className="text-slate-300">
              Data do Registro *
            </Label>
            <Input
              id="data-registro"
              type="date"
              value={dataRegistro}
              onChange={(e) => setDataRegistro(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              required
            />
            <p className="text-xs text-slate-400">
              Selecione a data em que as fotos/medidas foram tiradas (pode ser diferente da data de hoje)
            </p>
          </div>

          {/* Medidas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-slate-400" />
              <Label className="text-slate-300 text-base font-semibold">Medidas</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="peso" className="text-slate-300">Peso (kg)</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ex: 75.5"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cintura" className="text-slate-300">Cintura (cm)</Label>
                <Input
                  id="cintura"
                  type="number"
                  step="0.1"
                  value={cintura}
                  onChange={(e) => setCintura(e.target.value)}
                  placeholder="Ex: 85"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quadril" className="text-slate-300">Quadril (cm)</Label>
                <Input
                  id="quadril"
                  type="number"
                  step="0.1"
                  value={quadril}
                  onChange={(e) => setQuadril(e.target.value)}
                  placeholder="Ex: 95"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>

          {/* Fotos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-slate-400" />
              <Label className="text-slate-300 text-base font-semibold">Fotos</Label>
            </div>

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
              <Label className="text-slate-300">Foto 2 - Lado D</Label>
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
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Dados
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
