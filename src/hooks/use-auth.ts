import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  showPasswordModal: boolean;
}

export function useAuth(sectionName: string) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    showPasswordModal: false
  });

  useEffect(() => {
    // Verificar se o usuário já está autenticado para esta seção
    const isAuth = localStorage.getItem(`auth_${sectionName}`) === "true";
    
    setAuthState({
      isAuthenticated: isAuth,
      isLoading: false,
      showPasswordModal: !isAuth
    });
  }, [sectionName]);

  const handleAuthSuccess = () => {
    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      showPasswordModal: false
    });
  };

  const handleShowPasswordModal = () => {
    setAuthState(prev => ({
      ...prev,
      showPasswordModal: true
    }));
  };

  const handleClosePasswordModal = () => {
    setAuthState(prev => ({
      ...prev,
      showPasswordModal: false
    }));
  };

  const logout = () => {
    localStorage.removeItem(`auth_${sectionName}`);
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      showPasswordModal: true
    });
  };

  return {
    ...authState,
    handleAuthSuccess,
    handleShowPasswordModal,
    handleClosePasswordModal,
    logout
  };
}
