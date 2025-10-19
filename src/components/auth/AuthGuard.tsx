import { ReactNode } from "react";
import { PasswordModal } from "./PasswordModal";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { RefreshCw, Lock } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  sectionName: string;
  sectionIcon?: string;
}

export function AuthGuard({ children, sectionName, sectionIcon }: AuthGuardProps) {
  const {
    isAuthenticated,
    isLoading,
    showPasswordModal,
    handleAuthSuccess,
    handleShowPasswordModal,
    handleClosePasswordModal
  } = useAuth(sectionName);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-slate-400">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <Lock className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Acesso Restrito</h1>
            <p className="text-slate-400">
              Esta seção requer autenticação para ser acessada.
            </p>
          </div>
          
          <Button 
            onClick={handleShowPasswordModal}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Lock className="w-4 h-4 mr-2" />
            Acessar {sectionName}
          </Button>
        </div>

        <PasswordModal
          isOpen={showPasswordModal}
          onClose={handleClosePasswordModal}
          onSuccess={handleAuthSuccess}
          sectionName={sectionName}
          sectionIcon={sectionIcon}
        />
      </div>
    );
  }

  return (
    <>
      {children}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={handleClosePasswordModal}
        onSuccess={handleAuthSuccess}
        sectionName={sectionName}
        sectionIcon={sectionIcon}
      />
    </>
  );
}
