import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/use-profile";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Calendar, 
  Shield, 
  Save,
  Edit,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CreditCard,
  Crown,
  Sparkles
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { subscriptionService } from "@/lib/subscription-service";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    crm: '',
    clinic: '',
    address: '',
    bio: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile, loading, saving, saveProfile, updatePassword, uploadAvatar } = useProfile();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Atualizar formData quando profile carregar
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        specialty: profile.specialty || '',
        crm: profile.crm || '',
        clinic: profile.clinic || '',
        address: profile.address || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  // Carregar assinatura atual
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const sub = await subscriptionService.getCurrentSubscription();
        setSubscription(sub);
      } catch (error) {
        console.error('Erro ao carregar assinatura:', error);
      } finally {
        setLoadingSubscription(false);
      }
    };
    loadSubscription();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      await saveProfile(formData);
      setIsEditing(false);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handlePasswordSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }
    
    try {
      await updatePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await uploadAvatar(file);
      } catch (error) {
        // Erro já tratado no hook
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      </DashboardLayout>
    );
  }

  // Se não há perfil (usuário não autenticado), mostrar mensagem
  if (!profile || !profile.id) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Shield className="w-24 h-24 text-amber-400 mb-6" />
            <h2 className="text-2xl font-semibold text-white mb-4">
              Acesso Restrito
            </h2>
            <p className="text-slate-400 mb-8 max-w-md">
              Você precisa estar logado para acessar seu perfil. Faça login para continuar.
            </p>
            <Button
              onClick={() => window.location.href = '/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <User className="w-8 h-8 text-blue-400" />
              Meu Perfil
            </h1>
            <p className="text-slate-400 mt-1">
              Gerencie suas informações pessoais
            </p>
          </div>
          
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Pessoais */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Dados básicos do seu perfil profissional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={saving}
                      className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4 mr-2" />
                      )}
                      Alterar Foto
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                      className="bg-slate-700/50 border-slate-600/50 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="bg-slate-700/50 border-slate-600/50 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className="bg-slate-700/50 border-slate-600/50 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crm" className="text-slate-300">CRN</Label>
                    <Input
                      id="crm"
                      value={formData.crm}
                      onChange={(e) => handleInputChange('crm', e.target.value)}
                      disabled={!isEditing}
                      className="bg-slate-700/50 border-slate-600/50 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty" className="text-slate-300">Especialidade</Label>
                  <Input
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) => handleInputChange('specialty', e.target.value)}
                    disabled={!isEditing}
                    className="bg-slate-700/50 border-slate-600/50 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic" className="text-slate-300">Clínica/Consultório</Label>
                  <Input
                    id="clinic"
                    value={formData.clinic}
                    onChange={(e) => handleInputChange('clinic', e.target.value)}
                    disabled={!isEditing}
                    className="bg-slate-700/50 border-slate-600/50 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-slate-300">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    className="bg-slate-700/50 border-slate-600/50 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-slate-300">Biografia</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    className="bg-slate-700/50 border-slate-600/50 text-white min-h-[100px]"
                    placeholder="Conte um pouco sobre você..."
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar - Informações da Conta e Alterar Senha */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Informações da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Data de Cadastro</Label>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </div>
                </div>
                <Separator className="bg-slate-700" />
                <div className="space-y-2">
                  <Label className="text-slate-300">Última Atualização</Label>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assinatura */}
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingSubscription ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  </div>
                ) : subscription ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Plano Atual</Label>
                      <div className="flex items-center gap-2">
                        {subscription.subscription_plans?.name === 'advanced' ? (
                          <Crown className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-blue-400" />
                        )}
                        <span className="text-white font-medium">
                          {subscription.subscription_plans?.display_name || 'Plano Básico'}
                        </span>
                      </div>
                    </div>
                    <Separator className="bg-slate-700" />
                    <div className="space-y-2">
                      <Label className="text-slate-300">Status</Label>
                      <Badge 
                        variant="outline" 
                        className={
                          subscription.status === 'active' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : subscription.status === 'trial'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }
                      >
                        {subscription.status === 'active' ? 'Ativo' : 
                         subscription.status === 'trial' ? 'Trial' : 
                         subscription.status === 'expired' ? 'Expirado' : 'Inativo'}
                      </Badge>
                    </div>
                    {subscription.current_period_end && (
                      <>
                        <Separator className="bg-slate-700" />
                        <div className="space-y-2">
                          <Label className="text-slate-300">
                            {subscription.status === 'trial' ? 'Trial expira em' : 'Próxima cobrança'}
                          </Label>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Calendar className="w-4 h-4" />
                            {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-slate-400 text-sm mb-2">Nenhuma assinatura ativa</p>
                  </div>
                )}
                <Button
                  onClick={() => navigate('/pricing')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {subscription ? 'Gerenciar Assinatura' : 'Ver Planos'}
                </Button>
              </CardContent>
            </Card>

            {/* Alterar Senha */}
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-400" />
                  Alterar Senha
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-slate-300 text-sm">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      className="bg-slate-700/50 border-slate-600/50 text-white pr-10 text-sm"
                      placeholder="Senha atual"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-slate-300 text-sm">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="bg-slate-700/50 border-slate-600/50 text-white text-sm"
                    placeholder="Nova senha"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300 text-sm">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="bg-slate-700/50 border-slate-600/50 text-white text-sm"
                    placeholder="Confirme a senha"
                  />
                </div>
                <Button
                  onClick={handlePasswordSave}
                  disabled={saving}
                  size="sm"
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold mt-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4 mr-2" />
                  )}
                  Alterar Senha
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
