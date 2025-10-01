import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PatientDetailsModal } from "@/components/modals/PatientDetailsModal";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { usePatients } from "@/hooks/use-supabase-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, RefreshCw } from "lucide-react";
import { PatientForm } from "@/components/forms/PatientForm";
import { RenewPlanModal } from "@/components/modals/RenewPlanModal";
import { useToast } from "@/hooks/use-toast";

export default function PatientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { patients, loading, updatePatient, deletePatient } = usePatients();
  const [patient, setPatient] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

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

  const handleEdit = (updatedPatient: any) => {
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
          <Button onClick={() => navigate("/patients")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Pacientes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/patients")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">{patient.nome || 'Paciente'}</h1>
              <p className="text-slate-400">Detalhes do paciente</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsRenewModalOpen(true)}
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Renovar Plano
            </Button>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Patient Details Modal */}
        <PatientDetailsModal
          patient={patient}
          open={true}
          onClose={() => navigate("/patients")}
          onEdit={() => setIsEditModalOpen(true)}
          onRenewPlan={() => setIsRenewModalOpen(true)}
        />

        {/* Edit Modal */}
        <PatientForm
          patient={patient}
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
    </DashboardLayout>
  );
}
