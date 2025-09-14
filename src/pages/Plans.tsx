import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PlansList } from "@/components/plans/PlansList";
import { PasswordModal } from "@/components/modals/PasswordModal";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Plans() {
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Verificar se já está autenticado (pode ser melhorado com localStorage)
  useEffect(() => {
    const isAuth = localStorage.getItem('plans_authenticated');
    if (isAuth === 'true') {
      setIsAuthenticated(true);
      setShowPasswordModal(false);
    }
  }, []);

  const handlePasswordSuccess = () => {
    localStorage.setItem('plans_authenticated', 'true');
    setIsAuthenticated(true);
    setShowPasswordModal(false);
  };

  const handlePasswordClose = () => {
    setShowPasswordModal(false);
    // Redirecionar para o dashboard se cancelar
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('plans_authenticated');
    setIsAuthenticated(false);
    setShowPasswordModal(true);
    toast({
      title: "Sessão Encerrada",
      description: "Você foi deslogado da área de planos.",
    });
  };

  if (!isAuthenticated) {
    return (
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={handlePasswordClose}
        onSuccess={handlePasswordSuccess}
        title="Acesso aos Planos"
        description="Esta área é restrita. Digite a senha para acessar o gerenciamento de planos."
        correctPassword="F@123"
      />
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header com botão de logout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Área Protegida - Planos</h1>
              <p className="text-slate-400">Você está acessando uma área restrita</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-600/50 text-red-400 hover:bg-red-600/20 hover:text-red-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Área
          </Button>
        </div>
        
        <PlansList />
      </div>
    </DashboardLayout>
  );
}