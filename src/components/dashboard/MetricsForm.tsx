import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from '@/lib/auth-helpers';
import { Plus, Edit, Loader2 } from 'lucide-react';

interface DashboardDados {
  id?: number;
  mes?: string;
  ano?: string;
  mes_numero?: string;
  data_referencia?: string;
  ativos_total_inicio_mes?: string;
  entraram?: string;
  sairam?: string;
  vencimentos?: string;
  nao_renovou?: string;
  desistencia?: string;
  congelamento?: string;
  percentual_renovacao?: string;
  percentual_churn?: string;
}

interface MetricsFormProps {
  data?: DashboardDados;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const meses = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export function MetricsForm({ data, onSuccess, trigger }: MetricsFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<DashboardDados>({
    mes: '',
    ano: new Date().getFullYear().toString(),
    mes_numero: '',
    data_referencia: '',
    ativos_total_inicio_mes: '',
    entraram: '',
    sairam: '',
    vencimentos: '',
    nao_renovou: '',
    desistencia: '',
    congelamento: '',
    percentual_renovacao: '',
    percentual_churn: '',
  });

  useEffect(() => {
    if (data) {
      setFormData({
        mes: data.mes || '',
        ano: data.ano || new Date().getFullYear().toString(),
        mes_numero: data.mes_numero || '',
        data_referencia: data.data_referencia || '',
        ativos_total_inicio_mes: data.ativos_total_inicio_mes || '',
        entraram: data.entraram || '',
        sairam: data.sairam || '',
        vencimentos: data.vencimentos || '',
        nao_renovou: data.nao_renovou || '',
        desistencia: data.desistencia || '',
        congelamento: data.congelamento || '',
        percentual_renovacao: data.percentual_renovacao || '',
        percentual_churn: data.percentual_churn || '',
      });
    } else {
      // Reset form
      setFormData({
        mes: '',
        ano: new Date().getFullYear().toString(),
        mes_numero: '',
        data_referencia: '',
        ativos_total_inicio_mes: '',
        entraram: '',
        sairam: '',
        vencimentos: '',
        nao_renovou: '',
        desistencia: '',
        congelamento: '',
        percentual_renovacao: '',
        percentual_churn: '',
      });
    }
  }, [data, open]);

  const handleMesChange = (mesNumero: string) => {
    const mesSelecionado = meses.find(m => m.value === mesNumero);
    setFormData({
      ...formData,
      mes_numero: mesNumero,
      mes: mesSelecionado?.label || '',
      data_referencia: formData.ano 
        ? `${formData.ano}-${mesNumero.padStart(2, '0')}-01` 
        : '',
    });
  };

  const handleAnoChange = (ano: string) => {
    setFormData({
      ...formData,
      ano: ano,
      data_referencia: formData.mes_numero 
        ? `${ano}-${formData.mes_numero.padStart(2, '0')}-01` 
        : '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      // Calcular percentuais se necessário
      const ativosInicio = parseFloat(formData.ativos_total_inicio_mes || '0');
      const entraram = parseFloat(formData.entraram || '0');
      const sairam = parseFloat(formData.sairam || '0');
      const naoRenovou = parseFloat(formData.nao_renovou || '0');
      const vencimentos = parseFloat(formData.vencimentos || '0');

      // Calcular percentual de renovação
      const percentualRenovacao = vencimentos > 0 
        ? ((vencimentos - naoRenovou) / vencimentos) * 100 
        : 0;

      // Calcular percentual de churn
      const percentualChurn = ativosInicio > 0 
        ? (sairam / ativosInicio) * 100 
        : 0;

      const dadosParaSalvar: any = {
        ...formData,
        percentual_renovacao: formData.percentual_renovacao || percentualRenovacao.toFixed(2),
        percentual_churn: formData.percentual_churn || percentualChurn.toFixed(2),
        user_id: userId, // Garantir que user_id seja definido
      };

      if (data?.id) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('dashboard_dados')
          .update(dadosParaSalvar)
          .eq('id', data.id)
          .eq('user_id', userId); // Garantir que só atualiza seus próprios dados

        if (error) throw error;

        toast({
          title: 'Métrica atualizada!',
          description: 'Os dados foram atualizados com sucesso.',
        });
      } else {
        // Inserir novo registro
        const { error } = await supabase
          .from('dashboard_dados')
          .insert(dadosParaSalvar);

        if (error) throw error;

        toast({
          title: 'Métrica criada!',
          description: 'Os dados foram inseridos com sucesso.',
        });
      }

      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro ao salvar métrica:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar os dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            {data ? (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Métrica
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {data ? 'Editar Métrica Operacional' : 'Nova Métrica Operacional'}
          </DialogTitle>
          <DialogDescription>
            {data 
              ? 'Edite os dados da métrica mensal' 
              : 'Preencha os dados da métrica mensal'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ano">Ano *</Label>
              <Input
                id="ano"
                type="number"
                value={formData.ano}
                onChange={(e) => handleAnoChange(e.target.value)}
                required
                min="2020"
                max="2100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mes">Mês *</Label>
              <Select
                value={formData.mes_numero}
                onValueChange={handleMesChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ativos_total_inicio_mes">Pacientes Ativos no Início do Mês *</Label>
            <Input
              id="ativos_total_inicio_mes"
              type="number"
              value={formData.ativos_total_inicio_mes}
              onChange={(e) => setFormData({ ...formData, ativos_total_inicio_mes: e.target.value })}
              required
              min="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entraram">Novos Pacientes (Entraram) *</Label>
              <Input
                id="entraram"
                type="number"
                value={formData.entraram}
                onChange={(e) => setFormData({ ...formData, entraram: e.target.value })}
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sairam">Pacientes que Saíram *</Label>
              <Input
                id="sairam"
                type="number"
                value={formData.sairam}
                onChange={(e) => setFormData({ ...formData, sairam: e.target.value })}
                required
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vencimentos">Vencimentos do Mês</Label>
              <Input
                id="vencimentos"
                type="number"
                value={formData.vencimentos}
                onChange={(e) => setFormData({ ...formData, vencimentos: e.target.value })}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nao_renovou">Não Renovou</Label>
              <Input
                id="nao_renovou"
                type="number"
                value={formData.nao_renovou}
                onChange={(e) => setFormData({ ...formData, nao_renovou: e.target.value })}
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="desistencia">Desistências</Label>
              <Input
                id="desistencia"
                type="number"
                value={formData.desistencia}
                onChange={(e) => setFormData({ ...formData, desistencia: e.target.value })}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="congelamento">Congelamentos</Label>
              <Input
                id="congelamento"
                type="number"
                value={formData.congelamento}
                onChange={(e) => setFormData({ ...formData, congelamento: e.target.value })}
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="percentual_renovacao">Taxa de Renovação (%)</Label>
              <Input
                id="percentual_renovacao"
                type="number"
                step="0.01"
                value={formData.percentual_renovacao}
                onChange={(e) => setFormData({ ...formData, percentual_renovacao: e.target.value })}
                min="0"
                max="100"
                placeholder="Será calculado automaticamente se deixado em branco"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentual_churn">Taxa de Churn (%)</Label>
              <Input
                id="percentual_churn"
                type="number"
                step="0.01"
                value={formData.percentual_churn}
                onChange={(e) => setFormData({ ...formData, percentual_churn: e.target.value })}
                min="0"
                max="100"
                placeholder="Será calculado automaticamente se deixado em branco"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {data ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

