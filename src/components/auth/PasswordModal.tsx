import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sectionName: string;
  sectionIcon?: string;
}

export function PasswordModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  sectionName, 
  sectionIcon = "🔒" 
}: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [correctPassword, setCorrectPassword] = useState<string>("");

  // Buscar senha do Supabase quando o modal abrir
  useEffect(() => {
    const fetchPassword = async () => {
      try {
        const { data, error } = await supabase
          .from('page_passwords')
          .select('password_hash')
          .eq('page_name', sectionName)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Erro ao buscar senha do Supabase:', error);
          // Fallback para senhas hardcoded se houver erro
          const fallbackPasswords: Record<string, string> = {
            "Dashboard": "Dashboard",
            "Pacientes": "Pacientes",
            "Checkins": "Checkins",
            "Planos": "Planos",
            "Métricas Operacionais": "Operacional",
            "Métricas Comerciais": "Comercial",
            "Workspace": "Workspace",
            "Bioimpedância": "Bioimpedância",
            "Relatórios": "Relatórios"
          };
          setCorrectPassword(fallbackPasswords[sectionName] || "");
        } else if (data) {
          setCorrectPassword(data.password_hash);
        }
      } catch (err) {
        console.error('Erro ao buscar senha:', err);
      }
    };

    if (isOpen && sectionName) {
      fetchPassword();
    }
  }, [isOpen, sectionName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simular delay de validação
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (password === correctPassword) {
      // Salvar no localStorage que o usuário está autenticado para esta seção
      localStorage.setItem(`auth_${sectionName}`, "true");
      onSuccess();
      setPassword("");
    } else {
      setError("Senha incorreta. Tente novamente.");
    }
    
    setIsLoading(false);
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-400" />
            Acesso Restrito
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Digite a senha para acessar a seção <strong>{sectionName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading || !password.trim()}
            >
              {isLoading ? "Verificando..." : "Acessar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>

        <div className="text-xs text-slate-500 text-center pt-2">
          <p>🔒 Área restrita - Acesso autorizado apenas</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
