import { useState, useRef } from 'react';
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

interface InitialDataInputProps {
  telefone: string;
  nome: string;
  onSuccess: () => void;
}

export function InitialDataInput({ telefone, nome, onSuccess }: InitialDataInputProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Estados para as fotos
  const [fotoFrente, setFotoFrente] = useState<File | null>(null);
  const [fotoLado, setFotoLado] = useState<File | null>(null);
  const [fotoCostas, setFotoCostas] = useState<File | null>(null);
  
  // Preview URLs
  const [previewFrente, setPreviewFrente] = useState<string>('');
  const [previewLado, setPreviewLado] = useState<string>('');
  const [previewCostas, setPreviewCostas] = useState<string>('');

  // Estados para as medidas
  const [pesoInicial, setPesoInicial] = useState('');
  const [alturaInicial, setAlturaInicial] = useState('');
  const [cinturaInicial, setCinturaInicial] = useState('');
  const [quadrilInicial, setQuadrilInicial] = useState('');
  const [dataFotos, setDataFotos] = useState(new Date().toISOString().split('T')[0]);

  // Refs para inputs de arquivo
  const frenteInputRef = useRef<HTMLInputElement>(null);
  const ladoInputRef = useRef<HTMLInputElement>(null);
  const costasInputRef = useRef<HTMLInputElement>(null);

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

  const removePhoto = (
    setFile: (file: File | null) => void,
    setPreview: (url: string) => void
  ) => {
    setFile(null);
    setPreview('');
  };

  const uploadPhoto = async (file: File, type: string): Promise<string | null> => {
    try {
      console.log('📤 Iniciando upload:', { type, fileName: file.name, size: file.size });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${telefone}_inicial_${type}_${Date.now()}.${fileExt}`;
      const filePath = `patient-photos/${fileName}`;

      console.log('📁 Caminho do arquivo:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('patient-photos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        throw uploadError;
      }

      console.log('✅ Upload concluído!');

      const { data: { publicUrl } } = supabase.storage
        .from('patient-photos')
        .getPublicUrl(filePath);

      console.log('🔗 URL gerada:', publicUrl);

      return publicUrl;
    } catch (error) {
      console.error('💥 Erro ao fazer upload da foto:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('🚀 Iniciando salvamento dos dados iniciais...');

      // Validar se pelo menos uma foto foi enviada
      if (!fotoFrente && !fotoLado && !fotoCostas) {
        toast({
          title: 'Atenção',
          description: 'Adicione pelo menos uma foto',
          variant: 'destructive'
        });
        return;
      }

      console.log('📋 Dados para salvar:', {
        peso: pesoInicial,
        altura: alturaInicial,
        cintura: cinturaInicial,
        quadril: quadrilInicial,
        temFotoFrente: !!fotoFrente,
        temFotoLado: !!fotoLado,
        temFotoCostas: !!fotoCostas
      });

      // Upload das fotos
      let fotoFrenteUrl = null;
      let fotoLadoUrl = null;
      let fotoCostasUrl = null;

      if (fotoFrente) {
        console.log('📸 Fazendo upload da foto frontal...');
        fotoFrenteUrl = await uploadPhoto(fotoFrente, 'frente');
      }
      if (fotoLado) {
        console.log('📸 Fazendo upload da foto lateral...');
        fotoLadoUrl = await uploadPhoto(fotoLado, 'lado');
      }
      if (fotoCostas) {
        console.log('📸 Fazendo upload da foto de costas...');
        fotoCostasUrl = await uploadPhoto(fotoCostas, 'costas');
      }

      console.log('🔗 URLs geradas:', {
        frente: fotoFrenteUrl,
        lado: fotoLadoUrl,
        costas: fotoCostasUrl
      });

      // Atualizar o paciente com os dados iniciais
      const updateData: any = {
        data_fotos_iniciais: dataFotos
      };

      if (fotoFrenteUrl) updateData.foto_inicial_frente = fotoFrenteUrl;
      if (fotoLadoUrl) updateData.foto_inicial_lado = fotoLadoUrl;
      if (fotoCostasUrl) updateData.foto_inicial_costas = fotoCostasUrl;
      if (pesoInicial) updateData.peso_inicial = parseFloat(pesoInicial);
      if (alturaInicial) updateData.altura_inicial = parseFloat(alturaInicial);
      if (cinturaInicial) updateData.medida_cintura_inicial = parseFloat(cinturaInicial);
      if (quadrilInicial) updateData.medida_quadril_inicial = parseFloat(quadrilInicial);

      console.log('💾 Salvando no banco de dados:', updateData);

      const { error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('telefone', telefone);

      if (error) {
        console.error('❌ Erro ao salvar no banco:', error);
        throw error;
      }

      console.log('✅ Dados salvos com sucesso!');

      toast({
        title: 'Sucesso!',
        description: 'Dados iniciais cadastrados com sucesso'
      });

      setOpen(false);
      onSuccess();
      
      // Limpar formulário
      setFotoFrente(null);
      setFotoLado(null);
      setFotoCostas(null);
      setPreviewFrente('');
      setPreviewLado('');
      setPreviewCostas('');
      setPesoInicial('');
      setAlturaInicial('');
      setCinturaInicial('');
      setQuadrilInicial('');
    } catch (error) {
      console.error('Erro ao salvar dados iniciais:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar os dados iniciais',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all">
          <Camera className="w-4 h-4" />
          Adicionar Dados Iniciais
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📸 Dados Iniciais - {nome}</DialogTitle>
          <DialogDescription>
            Cadastre fotos, peso, altura e medidas iniciais do paciente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Data */}
          <div>
            <Label htmlFor="data">📅 Data dos Registros</Label>
            <Input
              id="data"
              type="date"
              value={dataFotos}
              onChange={(e) => setDataFotos(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Medidas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="peso">⚖️ Peso Inicial (kg)</Label>
              <Input
                id="peso"
                type="number"
                step="0.1"
                placeholder="Ex: 75.5"
                value={pesoInicial}
                onChange={(e) => setPesoInicial(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="altura">📏 Altura (m)</Label>
              <Input
                id="altura"
                type="number"
                step="0.01"
                placeholder="Ex: 1.75"
                value={alturaInicial}
                onChange={(e) => setAlturaInicial(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cintura">📐 Cintura (cm)</Label>
              <Input
                id="cintura"
                type="number"
                step="0.1"
                placeholder="Ex: 85"
                value={cinturaInicial}
                onChange={(e) => setCinturaInicial(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="quadril">📐 Quadril (cm)</Label>
              <Input
                id="quadril"
                type="number"
                step="0.1"
                placeholder="Ex: 95"
                value={quadrilInicial}
                onChange={(e) => setQuadrilInicial(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Fotos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">📷 Fotos Iniciais</h3>
            
            {/* Foto Frente */}
            <div>
              <Label>Foto Frontal</Label>
              <div className="mt-2">
                {previewFrente ? (
                  <div className="relative inline-block">
                    <img
                      src={previewFrente}
                      alt="Preview Frente"
                      className="w-40 h-40 object-cover rounded-lg border-2 border-blue-500"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removePhoto(setFotoFrente, setPreviewFrente)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => frenteInputRef.current?.click()}
                    className="w-40 h-40 border-dashed"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8" />
                      <span className="text-xs">Upload</span>
                    </div>
                  </Button>
                )}
                <input
                  ref={frenteInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, setFotoFrente, setPreviewFrente)}
                />
              </div>
            </div>

            {/* Foto Lado */}
            <div>
              <Label>Foto Lateral</Label>
              <div className="mt-2">
                {previewLado ? (
                  <div className="relative inline-block">
                    <img
                      src={previewLado}
                      alt="Preview Lado"
                      className="w-40 h-40 object-cover rounded-lg border-2 border-blue-500"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removePhoto(setFotoLado, setPreviewLado)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => ladoInputRef.current?.click()}
                    className="w-40 h-40 border-dashed"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8" />
                      <span className="text-xs">Upload</span>
                    </div>
                  </Button>
                )}
                <input
                  ref={ladoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, setFotoLado, setPreviewLado)}
                />
              </div>
            </div>

            {/* Foto Costas */}
            <div>
              <Label>Foto de Costas</Label>
              <div className="mt-2">
                {previewCostas ? (
                  <div className="relative inline-block">
                    <img
                      src={previewCostas}
                      alt="Preview Costas"
                      className="w-40 h-40 object-cover rounded-lg border-2 border-blue-500"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removePhoto(setFotoCostas, setPreviewCostas)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => costasInputRef.current?.click()}
                    className="w-40 h-40 border-dashed"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8" />
                      <span className="text-xs">Upload</span>
                    </div>
                  </Button>
                )}
                <input
                  ref={costasInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, setFotoCostas, setPreviewCostas)}
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Salvar Dados Iniciais'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

