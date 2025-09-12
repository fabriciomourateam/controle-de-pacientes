import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCheckinsWithPatient } from "@/hooks/use-checkin-data";

interface CheckinFormProps {
  trigger: React.ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
}

export function CheckinForm({ trigger, onSave, onCancel }: CheckinFormProps) {
  const [open, setOpen] = useState(false);
  
  console.log('CheckinForm renderizado, open:', open);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    telefone: "",
    mes_ano: "",
    peso: "",
    medida: "",
    treino: "",
    cardio: "",
    agua: "",
    sono: "",
    ref_livre: "",
    beliscos: "",
    oq_comeu_ref_livre: "",
    oq_beliscou: "",
    comeu_menos: "",
    fome_algum_horario: "",
    alimento_para_incluir: "",
    melhora_visual: "",
    quais_pontos: "",
    objetivo: "",
    dificuldades: "",
    stress: "",
    libido: "",
    tempo: "",
    descanso: "",
    tempo_cardio: "",
    foto_1: "",
    foto_2: "",
    foto_3: "",
    foto_4: "",
    telefone_checkin: "",
    pontos_treinos: "",
    pontos_cardios: "",
    pontos_descanso_entre_series: "",
    pontos_refeicao_livre: "",
    pontos_beliscos: "",
    pontos_agua: "",
    pontos_sono: "",
    pontos_qualidade_sono: "",
    pontos_stress: "",
    pontos_libido: "",
    total_pontuacao: "",
    percentual_aproveitamento: ""
  });

  const { toast } = useToast();
  const { refetch } = useCheckinsWithPatient();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validar campos obrigatórios
      if (!formData.telefone || !formData.mes_ano) {
        toast({
          title: "Erro",
          description: "Telefone e mês/ano são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      // Normalizar telefone (remover formatação)
      const normalizedPhone = formData.telefone.replace(/\D/g, '');

      // Verificar se paciente existe
      const { data: existingPatient, error: patientError } = await supabase
        .from('patients')
        .select('id, telefone')
        .eq('telefone', normalizedPhone)
        .single();

      let patientId = existingPatient?.id;

      // Se paciente não existe, criar um básico
      if (!existingPatient) {
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert({
            telefone: normalizedPhone,
            nome: `Paciente ${normalizedPhone}`,
            inicio_acompanhamento: new Date().toISOString().split('T')[0],
            plano: 'Plano Básico',
            observacao: 'Paciente criado automaticamente via checkin'
          })
          .select('id')
          .single();

        if (createError) {
          throw createError;
        }

        patientId = newPatient.id;
      }

      // Preparar dados do checkin
      const checkinData = {
        telefone: normalizedPhone,
        mes_ano: formData.mes_ano,
        data_checkin: new Date().toISOString().split('T')[0],
        data_preenchimento: new Date().toISOString(),
        peso: formData.peso || null,
        medida: formData.medida || null,
        treino: formData.treino || null,
        cardio: formData.cardio || null,
        agua: formData.agua || null,
        sono: formData.sono || null,
        ref_livre: formData.ref_livre || null,
        beliscos: formData.beliscos || null,
        oq_comeu_ref_livre: formData.oq_comeu_ref_livre || null,
        oq_beliscou: formData.oq_beliscou || null,
        comeu_menos: formData.comeu_menos || null,
        fome_algum_horario: formData.fome_algum_horario || null,
        alimento_para_incluir: formData.alimento_para_incluir || null,
        melhora_visual: formData.melhora_visual || null,
        quais_pontos: formData.quais_pontos || null,
        objetivo: formData.objetivo || null,
        dificuldades: formData.dificuldades || null,
        stress: formData.stress || null,
        libido: formData.libido || null,
        tempo: formData.tempo || null,
        descanso: formData.descanso || null,
        tempo_cardio: formData.tempo_cardio || null,
        foto_1: formData.foto_1 || null,
        foto_2: formData.foto_2 || null,
        foto_3: formData.foto_3 || null,
        foto_4: formData.foto_4 || null,
        telefone_checkin: formData.telefone_checkin || null,
        pontos_treinos: formData.pontos_treinos || null,
        pontos_cardios: formData.pontos_cardios || null,
        pontos_descanso_entre_series: formData.pontos_descanso_entre_series || null,
        pontos_refeicao_livre: formData.pontos_refeicao_livre || null,
        pontos_beliscos: formData.pontos_beliscos || null,
        pontos_agua: formData.pontos_agua || null,
        pontos_sono: formData.pontos_sono || null,
        pontos_qualidade_sono: formData.pontos_qualidade_sono || null,
        pontos_stress: formData.pontos_stress || null,
        pontos_libido: formData.pontos_libido || null,
        total_pontuacao: formData.total_pontuacao || null,
        percentual_aproveitamento: formData.percentual_aproveitamento || null
      };

      // Inserir checkin
      const { error: checkinError } = await supabase
        .from('checkin')
        .insert(checkinData);

      if (checkinError) {
        throw checkinError;
      }

      toast({
        title: "Sucesso",
        description: "Checkin criado com sucesso!",
      });

      // Limpar formulário
      setFormData({
        telefone: "",
        mes_ano: "",
        peso: "",
        medida: "",
        treino: "",
        cardio: "",
        agua: "",
        sono: "",
        ref_livre: "",
        beliscos: "",
        oq_comeu_ref_livre: "",
        oq_beliscou: "",
        comeu_menos: "",
        fome_algum_horario: "",
        alimento_para_incluir: "",
        melhora_visual: "",
        quais_pontos: "",
        objetivo: "",
        dificuldades: "",
        stress: "",
        libido: "",
        tempo: "",
        descanso: "",
        tempo_cardio: "",
        foto_1: "",
        foto_2: "",
        foto_3: "",
        foto_4: "",
        telefone_checkin: "",
        pontos_treinos: "",
        pontos_cardios: "",
        pontos_descanso_entre_series: "",
        pontos_refeicao_livre: "",
        pontos_beliscos: "",
        pontos_agua: "",
        pontos_sono: "",
        pontos_qualidade_sono: "",
        pontos_stress: "",
        pontos_libido: "",
        total_pontuacao: "",
        percentual_aproveitamento: ""
      });

      setOpen(false);
      refetch();
      onSave?.();

    } catch (error) {
      console.error('Erro ao criar checkin:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o checkin. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    onCancel?.();
  };

  return (
    <>
      <div onClick={() => {
        console.log('Trigger clicado!');
        setOpen(true);
      }}>
        {trigger}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="text-white">Novo Checkin</DialogTitle>
          <DialogDescription className="text-slate-400">
            Preencha os dados do checkin do paciente
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Dados Básicos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Dados Básicos</h3>
            
            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-slate-300">Telefone *</Label>
              <Input
                id="telefone"
                placeholder="(34) 99999-9999"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mes_ano" className="text-slate-300">Mês/Ano *</Label>
              <Input
                id="mes_ano"
                placeholder="2024-01"
                value={formData.mes_ano}
                onChange={(e) => handleInputChange('mes_ano', e.target.value)}
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="peso" className="text-slate-300">Peso (kg)</Label>
              <Input
                id="peso"
                placeholder="70.5"
                value={formData.peso}
                onChange={(e) => handleInputChange('peso', e.target.value)}
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medida" className="text-slate-300">Medida (cm)</Label>
              <Input
                id="medida"
                placeholder="85.0"
                value={formData.medida}
                onChange={(e) => handleInputChange('medida', e.target.value)}
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Atividades */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Atividades</h3>
            
            <div className="space-y-2">
              <Label htmlFor="treino" className="text-slate-300">Treino</Label>
              <Textarea
                id="treino"
                placeholder="Descreva os treinos realizados..."
                value={formData.treino}
                onChange={(e) => handleInputChange('treino', e.target.value)}
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardio" className="text-slate-300">Cardio</Label>
              <Textarea
                id="cardio"
                placeholder="Descreva as atividades cardiovasculares..."
                value={formData.cardio}
                onChange={(e) => handleInputChange('cardio', e.target.value)}
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agua" className="text-slate-300">Hidratação</Label>
              <Textarea
                id="agua"
                placeholder="Quantidade de água consumida..."
                value={formData.agua}
                onChange={(e) => handleInputChange('agua', e.target.value)}
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sono" className="text-slate-300">Sono</Label>
              <Textarea
                id="sono"
                placeholder="Qualidade e duração do sono..."
                value={formData.sono}
                onChange={(e) => handleInputChange('sono', e.target.value)}
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Alimentação */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Alimentação</h3>
            
            <div className="space-y-2">
              <Label htmlFor="ref_livre" className="text-slate-300">Refeição Livre</Label>
              <Textarea
                id="ref_livre"
                placeholder="Descreva a refeição livre..."
                value={formData.ref_livre}
                onChange={(e) => handleInputChange('ref_livre', e.target.value)}
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="beliscos" className="text-slate-300">Beliscos</Label>
              <Textarea
                id="beliscos"
                placeholder="Descreva os beliscos..."
                value={formData.beliscos}
                onChange={(e) => handleInputChange('beliscos', e.target.value)}
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alimento_para_incluir" className="text-slate-300">Alimentos para Incluir</Label>
              <Textarea
                id="alimento_para_incluir"
                placeholder="Alimentos que gostaria de incluir..."
                value={formData.alimento_para_incluir}
                onChange={(e) => handleInputChange('alimento_para_incluir', e.target.value)}
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Pontuação */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Pontuação</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="pontos_treinos" className="text-slate-300">Treino</Label>
                <Input
                  id="pontos_treinos"
                  placeholder="8"
                  value={formData.pontos_treinos}
                  onChange={(e) => handleInputChange('pontos_treinos', e.target.value)}
                  className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pontos_cardios" className="text-slate-300">Cardio</Label>
                <Input
                  id="pontos_cardios"
                  placeholder="7"
                  value={formData.pontos_cardios}
                  onChange={(e) => handleInputChange('pontos_cardios', e.target.value)}
                  className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pontos_sono" className="text-slate-300">Sono</Label>
                <Input
                  id="pontos_sono"
                  placeholder="8"
                  value={formData.pontos_sono}
                  onChange={(e) => handleInputChange('pontos_sono', e.target.value)}
                  className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pontos_agua" className="text-slate-300">Água</Label>
                <Input
                  id="pontos_agua"
                  placeholder="9"
                  value={formData.pontos_agua}
                  onChange={(e) => handleInputChange('pontos_agua', e.target.value)}
                  className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_pontuacao" className="text-slate-300">Total</Label>
                <Input
                  id="total_pontuacao"
                  placeholder="75"
                  value={formData.total_pontuacao}
                  onChange={(e) => handleInputChange('total_pontuacao', e.target.value)}
                  className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentual_aproveitamento" className="text-slate-300">% Aproveitamento</Label>
                <Input
                  id="percentual_aproveitamento"
                  placeholder="85.5"
                  value={formData.percentual_aproveitamento}
                  onChange={(e) => handleInputChange('percentual_aproveitamento', e.target.value)}
                  className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading} className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? "Salvando..." : "Salvar Checkin"}
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
