import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from '@/lib/auth-helpers';
import { Plus, Edit, Loader2, TrendingUp, Phone, DollarSign } from 'lucide-react';

interface LeadData {
  id?: number;
  DATA?: string;
  GOOGLE?: number;
  GOOGLE_FORMS?: number;
  INSTAGRAM?: number;
  FACEBOOK?: number;
  SELLER?: number;
  INDICACAO?: number;
  OUTROS?: number;
  TOTAL?: number;
}

interface CallData {
  id?: number;
  AGENDADAS?: string;
  TOTAL_DE_CALLS_AGENDADAS?: number;
  PERCENT_QUE_VAI_PRA_CALL?: number;
}

interface VendaData {
  id?: number;
  VENDAS?: string;
  TOTAL_DE_VENDAS?: number;
  VALOR_TOTAL?: number;
}

interface CommercialMetricsFormProps {
  type: 'lead' | 'call' | 'venda';
  data?: LeadData | CallData | VendaData;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CommercialMetricsForm({ type, data, onSuccess, trigger }: CommercialMetricsFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [leadData, setLeadData] = useState<LeadData>({
    DATA: new Date().toISOString().split('T')[0],
    GOOGLE: 0,
    GOOGLE_FORMS: 0,
    INSTAGRAM: 0,
    FACEBOOK: 0,
    SELLER: 0,
    INDICACAO: 0,
    OUTROS: 0,
    TOTAL: 0,
  });

  const [callData, setCallData] = useState<CallData>({
    AGENDADAS: new Date().toISOString().split('T')[0],
    TOTAL_DE_CALLS_AGENDADAS: 0,
    PERCENT_QUE_VAI_PRA_CALL: 0,
  });

  const [vendaData, setVendaData] = useState<VendaData>({
    VENDAS: new Date().toISOString().split('T')[0],
    TOTAL_DE_VENDAS: 0,
    VALOR_TOTAL: 0,
  });

  useEffect(() => {
    if (data) {
      if (type === 'lead') {
        setLeadData(data as LeadData);
      } else if (type === 'call') {
        setCallData(data as CallData);
      } else if (type === 'venda') {
        setVendaData(data as VendaData);
      }
    } else {
      // Reset forms
      setLeadData({
        DATA: new Date().toISOString().split('T')[0],
        GOOGLE: 0,
        GOOGLE_FORMS: 0,
        INSTAGRAM: 0,
        FACEBOOK: 0,
        SELLER: 0,
        INDICACAO: 0,
        OUTROS: 0,
        TOTAL: 0,
      });
      setCallData({
        AGENDADAS: new Date().toISOString().split('T')[0],
        TOTAL_DE_CALLS_AGENDADAS: 0,
        PERCENT_QUE_VAI_PRA_CALL: 0,
      });
      setVendaData({
        VENDAS: new Date().toISOString().split('T')[0],
        TOTAL_DE_VENDAS: 0,
        VALOR_TOTAL: 0,
      });
    }
  }, [data, open, type]);

  const calculateTotalLeads = (leads: LeadData) => {
    const total = (leads.GOOGLE || 0) +
      (leads.GOOGLE_FORMS || 0) +
      (leads.INSTAGRAM || 0) +
      (leads.FACEBOOK || 0) +
      (leads.SELLER || 0) +
      (leads.INDICACAO || 0) +
      (leads.OUTROS || 0);
    return total;
  };

  const handleLeadChange = (field: keyof LeadData, value: number) => {
    const updated = { ...leadData, [field]: value };
    updated.TOTAL = calculateTotalLeads(updated);
    setLeadData(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      let tableName = '';
      let dadosParaSalvar: any = { user_id: userId };

      if (type === 'lead') {
        tableName = 'leads_que_entraram';
        dadosParaSalvar = {
          ...leadData,
          TOTAL: calculateTotalLeads(leadData),
          user_id: userId,
        };
      } else if (type === 'call') {
        tableName = 'Total de Calls Agendadas';
        dadosParaSalvar = {
          ...callData,
          user_id: userId,
        };
      } else if (type === 'venda') {
        tableName = 'Total de Vendas';
        dadosParaSalvar = {
          ...vendaData,
          user_id: userId,
        };
      }

      if (data?.id) {
        // Atualizar
        const { error } = await supabase
          .from(tableName)
          .update(dadosParaSalvar)
          .eq('id', data.id)
          .eq('user_id', userId);

        if (error) throw error;

        toast({
          title: 'Dados atualizados!',
          description: 'Os dados foram atualizados com sucesso.',
        });
      } else {
        // Inserir
        const { error } = await supabase
          .from(tableName)
          .insert(dadosParaSalvar);

        if (error) throw error;

        toast({
          title: 'Dados criados!',
          description: 'Os dados foram inseridos com sucesso.',
        });
      }

      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar os dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderLeadForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="data">Data *</Label>
        <Input
          id="data"
          type="date"
          value={leadData.DATA}
          onChange={(e) => setLeadData({ ...leadData, DATA: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="google">Google</Label>
          <Input
            id="google"
            type="number"
            value={leadData.GOOGLE || 0}
            onChange={(e) => handleLeadChange('GOOGLE', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="google_forms">Google Forms</Label>
          <Input
            id="google_forms"
            type="number"
            value={leadData.GOOGLE_FORMS || 0}
            onChange={(e) => handleLeadChange('GOOGLE_FORMS', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram</Label>
          <Input
            id="instagram"
            type="number"
            value={leadData.INSTAGRAM || 0}
            onChange={(e) => handleLeadChange('INSTAGRAM', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="facebook">Facebook</Label>
          <Input
            id="facebook"
            type="number"
            value={leadData.FACEBOOK || 0}
            onChange={(e) => handleLeadChange('FACEBOOK', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seller">Seller</Label>
          <Input
            id="seller"
            type="number"
            value={leadData.SELLER || 0}
            onChange={(e) => handleLeadChange('SELLER', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="indicacao">Indicação</Label>
          <Input
            id="indicacao"
            type="number"
            value={leadData.INDICACAO || 0}
            onChange={(e) => handleLeadChange('INDICACAO', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="outros">Outros</Label>
          <Input
            id="outros"
            type="number"
            value={leadData.OUTROS || 0}
            onChange={(e) => handleLeadChange('OUTROS', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="total">Total</Label>
          <Input
            id="total"
            type="number"
            value={leadData.TOTAL || 0}
            disabled
            className="bg-slate-100"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {data ? 'Atualizar' : 'Salvar'}
        </Button>
      </div>
    </form>
  );

  const renderCallForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="agendadas">Data das Calls Agendadas *</Label>
        <Input
          id="agendadas"
          type="date"
          value={callData.AGENDADAS}
          onChange={(e) => setCallData({ ...callData, AGENDADAS: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="total_calls">Total de Calls Agendadas *</Label>
        <Input
          id="total_calls"
          type="number"
          value={callData.TOTAL_DE_CALLS_AGENDADAS || 0}
          onChange={(e) => setCallData({ ...callData, TOTAL_DE_CALLS_AGENDADAS: parseInt(e.target.value) || 0 })}
          required
          min="0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="percent_call">Percentual que vai para Call (%)</Label>
        <Input
          id="percent_call"
          type="number"
          step="0.01"
          value={callData.PERCENT_QUE_VAI_PRA_CALL || 0}
          onChange={(e) => setCallData({ ...callData, PERCENT_QUE_VAI_PRA_CALL: parseFloat(e.target.value) || 0 })}
          min="0"
          max="100"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {data ? 'Atualizar' : 'Salvar'}
        </Button>
      </div>
    </form>
  );

  const renderVendaForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vendas">Data das Vendas *</Label>
        <Input
          id="vendas"
          type="date"
          value={vendaData.VENDAS}
          onChange={(e) => setVendaData({ ...vendaData, VENDAS: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="total_vendas">Total de Vendas *</Label>
        <Input
          id="total_vendas"
          type="number"
          value={vendaData.TOTAL_DE_VENDAS || 0}
          onChange={(e) => setVendaData({ ...vendaData, TOTAL_DE_VENDAS: parseInt(e.target.value) || 0 })}
          required
          min="0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="valor_total">Valor Total (R$)</Label>
        <Input
          id="valor_total"
          type="number"
          step="0.01"
          value={vendaData.VALOR_TOTAL || 0}
          onChange={(e) => setVendaData({ ...vendaData, VALOR_TOTAL: parseFloat(e.target.value) || 0 })}
          min="0"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {data ? 'Atualizar' : 'Salvar'}
        </Button>
      </div>
    </form>
  );

  const getTitle = () => {
    if (type === 'lead') return data ? 'Editar Lead' : 'Novo Lead';
    if (type === 'call') return data ? 'Editar Call' : 'Nova Call';
    if (type === 'venda') return data ? 'Editar Venda' : 'Nova Venda';
    return 'Nova Métrica';
  };

  const getIcon = () => {
    if (type === 'lead') return <TrendingUp className="w-4 h-4 mr-2" />;
    if (type === 'call') return <Phone className="w-4 h-4 mr-2" />;
    if (type === 'venda') return <DollarSign className="w-4 h-4 mr-2" />;
    return <Plus className="w-4 h-4 mr-2" />;
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
                {getIcon()}
                {getTitle()}
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {type === 'lead' && 'Registre os leads que entraram por canal'}
            {type === 'call' && 'Registre as calls agendadas'}
            {type === 'venda' && 'Registre as vendas realizadas'}
          </DialogDescription>
        </DialogHeader>

        {type === 'lead' && renderLeadForm()}
        {type === 'call' && renderCallForm()}
        {type === 'venda' && renderVendaForm()}
      </DialogContent>
    </Dialog>
  );
}

