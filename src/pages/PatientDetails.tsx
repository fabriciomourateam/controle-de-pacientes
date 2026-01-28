import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { usePatients } from "@/hooks/use-supabase-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, RefreshCw } from "lucide-react";
import { PatientForm } from "@/components/forms/PatientForm";
import { RenewPlanModal } from "@/components/modals/RenewPlanModal";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DietPlansList } from "@/components/diets/DietPlansList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { patients, loading, updatePatient, deletePatient } = usePatients();
  const [patient, setPatient] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("info");

  useEffect(() => {
    // Verificar se há parâmetro tab na URL
    const tabParam = searchParams.get('tab');
    if (tabParam === 'diets') {
      setActiveTab('diets');
    }
  }, [searchParams]);

  useEffect(() => {
    if (id && patients.length > 0) {
      const foundPatient = patients.find(p => p.id === id);
      if (foundPatient) {
        setPatient(foundPatient);
      } else {
        toast({
          title: "Paciente não encontrado",
          description: "O paciente solicitado não foi encontrado.",
          variant: "destructive",
        });
        navigate("/patients");
      }
    }
  }, [id, patients, navigate, toast]);

  const handleEdit = async (updatedPatient: any) => {
    setPatient(updatedPatient);
    setIsEditModalOpen(false);
    toast({
      title: "Paciente atualizado",
      description: "As informações do paciente foram atualizadas com sucesso.",
    });
  };

  const handleRenewPlan = (renewedPatient: any) => {
    setPatient(renewedPatient);
    setIsRenewModalOpen(false);
    toast({
      title: "Plano renovado",
      description: "O plano do paciente foi renovado com sucesso.",
    });
  };

  const handleDelete = async () => {
    if (!patient) return;
    
    try {
      await deletePatient(patient.id);
      toast({
        title: "Paciente removido",
        description: "O paciente foi removido com sucesso.",
      });
      navigate("/patients");
    } catch (error) {
      toast({
        title: "Erro ao remover paciente",
        description: "Ocorreu um erro ao tentar remover o paciente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-white mb-4">Paciente não encontrado</h1>
          <p className="text-slate-400 mb-6">O paciente solicitado não foi encontrado.</p>
          <Button 
            onClick={() => navigate("/patients")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Pacientes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
        {/* Capa com gradiente claro sobrepondo o fundo preto */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pointer-events-none rounded-3xl" 
             style={{ 
               background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.98) 0%, rgba(239, 246, 255, 0.98) 50%, rgba(238, 242, 255, 0.98) 100%)',
             }} />
        
        <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              onClick={() => navigate(`/checkins/evolution/${patient.telefone}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{patient.nome || 'Paciente'}</h1>
              <p className="text-slate-600">Detalhes do paciente</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsRenewModalOpen(true)}
              className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 bg-white/80 backdrop-blur-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Renovar Plano
            </Button>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Tabs para organizar informações */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="diets">Planos Alimentares</TabsTrigger>
            <TabsTrigger value="info">Informações</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6">
            {/* Patient Details - Conteúdo direto na página */}
            <div className="space-y-6">
              <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Informações do Paciente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Nome</label>
                      <p className="text-lg font-semibold text-slate-900">{patient.nome || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Telefone</label>
                      <p className="text-sm text-slate-700">{patient.telefone || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Email</label>
                      <p className="text-sm text-slate-700">{patient.email || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">CPF</label>
                      <p className="text-sm text-slate-700">{patient.cpf || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Gênero</label>
                      <p className="text-sm text-slate-700">{patient.genero || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Data de Nascimento</label>
                      <p className="text-sm text-slate-700">
                        {patient.data_nascimento 
                          ? new Date(patient.data_nascimento).toLocaleDateString('pt-BR')
                          : 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Plano</label>
                      <p className="text-sm text-slate-700">{patient.plano || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Vencimento</label>
                      <p className="text-sm text-slate-700">
                        {patient.vencimento 
                          ? new Date(patient.vencimento).toLocaleDateString('pt-BR')
                          : 'Não informado'}
                      </p>
                    </div>
                  </div>
                  {patient.observacao && (
                    <div>
                      <label className="text-sm font-medium text-slate-600">Observações</label>
                      <p className="text-sm mt-1 text-slate-700">{patient.observacao}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="diets" className="mt-6">
            <DietPlansList patientId={patient.id} />
          </TabsContent>
        </Tabs>

        {/* Edit Modal */}
        <PatientForm
          patient={patient}
          trigger={null}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSave={handleEdit}
        />

        {/* Renew Plan Modal */}
        <RenewPlanModal
          patient={patient}
          open={isRenewModalOpen}
          onClose={() => setIsRenewModalOpen(false)}
          onRenew={handleRenewPlan}
        />
        </div>
      </div>
    </DashboardLayout>
  );
}
