import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DietPlanForm } from '@/components/diets/DietPlanForm';

function DietPlanEditor() {
  const { patientId, planId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadPatient();
    }
  }, [patientId]);

  const loadPatient = async () => {
    try {
      // Tentar buscar por ID primeiro, depois por telefone (para compatibilidade)
      let data, error;
      
      // Verificar se é um UUID (ID) ou telefone
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId || '');
      
      if (isUUID) {
        const result = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();
        data = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from('patients')
          .select('*')
          .eq('telefone', patientId)
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      setPatient(data);
    } catch (error) {
      console.error('Erro ao carregar paciente:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do paciente',
        variant: 'destructive',
      });
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSuccess = () => {
    toast({
      title: 'Sucesso!',
      description: 'Plano alimentar salvo com sucesso',
    });
    navigate(`/patients/${patientId}`);
  };

  const handleCancel = () => {
    navigate(`/patients/${patientId}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            size="sm"
            onClick={handleCancel}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {planId ? 'Editar' : 'Criar'} Plano Alimentar
            </h1>
            <p className="text-slate-400">
              {patient?.nome} • {patient?.telefone}
            </p>
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-lg border">
          <DietPlanForm
            open={true}
            onOpenChange={() => {}}
            patientId={patient?.id || patientId!}
            planId={planId}
            onSuccess={handleSaveSuccess}
            isPageMode={true}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}


export default DietPlanEditor;
