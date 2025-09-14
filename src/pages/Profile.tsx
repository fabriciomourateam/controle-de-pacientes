import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useProfile } from "@/hooks/use-profile";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Settings, 
  Save,
  Edit,
  Camera,
  Lock,
  Key,
  Eye,
  EyeOff,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Download,
  Upload,
  Trash2
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

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

  // Estados para Ações Rápidas
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Estados para configurações
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    dataSharing: false,
    analytics: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile, loading, saving, saveProfile, updatePassword, uploadAvatar } = useProfile();
  const { apiKeys, loading: apiKeysLoading, saving: apiKeysSaving, createNewApiKey, removeApiKey } = useApiKeys();
  const { toast } = useToast();

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

  // Funções para Ações Rápidas
  const handleSettingsChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    // Aqui você pode salvar as configurações no Supabase
    toast({
      title: "Sucesso",
      description: "Configurações salvas com sucesso!",
    });
    setShowSettingsModal(false);
  };

  const handleCopyApiKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      toast({
        title: "Copiado",
        description: "Chave API copiada para a área de transferência!",
      });
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a chave.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    try {
      await removeApiKey(keyId);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleGenerateApiKey = async () => {
    try {
      const { key, apiKey } = await createNewApiKey({
        name: `API ${apiKeys.length + 1}`,
        permissions: ['read', 'write']
      });
      
      // Mostrar a chave gerada em um modal
      setNewApiKey(key);
      setShowNewKeyModal(true);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleExportData = () => {
    // Simular exportação de dados
    toast({
      title: "Exportação",
      description: "Seus dados foram exportados com sucesso!",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Atenção",
      description: "Esta funcionalidade requer confirmação adicional.",
      variant: "destructive",
    });
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
              Gerencie suas informações pessoais e configurações
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
                      className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
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
                    <Label htmlFor="crm" className="text-slate-300">CRM</Label>
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

            {/* Informações da Conta */}
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Informações da Conta
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Dados de acesso e segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Data de Cadastro</Label>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-4 h-4" />
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Última Atualização</Label>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-4 h-4" />
                      {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-700" />

                <div className="space-y-4">
                  <h4 className="text-white font-medium">Alterar Senha</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-slate-300">Senha Atual</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          className="bg-slate-700/50 border-slate-600/50 text-white pr-10"
                          placeholder="Digite sua senha atual"
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
                      <Label htmlFor="newPassword" className="text-slate-300">Nova Senha</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        className="bg-slate-700/50 border-slate-600/50 text-white"
                        placeholder="Digite sua nova senha"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-slate-300">Confirmar Nova Senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        className="bg-slate-700/50 border-slate-600/50 text-white"
                        placeholder="Confirme sua nova senha"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={handlePasswordSave}
                      disabled={saving}
                      className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4 mr-2" />
                      )}
                      Alterar Senha
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status da Conta */}
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-lg">Status da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Plano Atual</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Profissional
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Status</span>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    Ativo
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Verificação</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Verificado
                  </Badge>
                </div>
              </CardContent>
            </Card>


            {/* Ações Rápidas */}
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] bg-slate-900/95 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Configurações da Conta</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Gerencie suas preferências e configurações
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Notificações</Label>
                          <p className="text-sm text-slate-400">Receber notificações do sistema</p>
                        </div>
                        <Switch
                          checked={settings.notifications}
                          onCheckedChange={(checked) => handleSettingsChange('notifications', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Atualizações por E-mail</Label>
                          <p className="text-sm text-slate-400">Receber e-mails sobre mudanças</p>
                        </div>
                        <Switch
                          checked={settings.emailUpdates}
                          onCheckedChange={(checked) => handleSettingsChange('emailUpdates', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Compartilhamento de Dados</Label>
                          <p className="text-sm text-slate-400">Permitir uso anônimo de dados</p>
                        </div>
                        <Switch
                          checked={settings.dataSharing}
                          onCheckedChange={(checked) => handleSettingsChange('dataSharing', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Analytics</Label>
                          <p className="text-sm text-slate-400">Coletar dados de uso</p>
                        </div>
                        <Switch
                          checked={settings.analytics}
                          onCheckedChange={(checked) => handleSettingsChange('analytics', checked)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowSettingsModal(false)}
                        className="border-slate-600 text-slate-300"
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
                        Salvar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showApiKeysModal} onOpenChange={setShowApiKeysModal}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      API Keys
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] bg-slate-900/95 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Gerenciar API Keys</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Gerencie suas chaves de API para integrações
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-white font-semibold">Suas Chaves API</h3>
                        <Button 
                          onClick={handleGenerateApiKey} 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          disabled={apiKeysSaving}
                        >
                          {apiKeysSaving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Key className="w-4 h-4 mr-2" />
                          )}
                          Nova Chave
                        </Button>
                      </div>
                      
                      {apiKeysLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                          <span className="ml-2 text-slate-400">Carregando API Keys...</span>
                        </div>
                      ) : apiKeys.length === 0 ? (
                        <div className="text-center py-8">
                          <Key className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                          <p className="text-slate-400">Nenhuma API Key encontrada</p>
                          <p className="text-sm text-slate-500">Clique em "Nova Chave" para criar uma</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {apiKeys.map((apiKey) => (
                            <div key={apiKey.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-white font-medium">{apiKey.name}</h4>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteApiKey(apiKey.id)}
                                  className="border-red-600 text-red-400 hover:bg-red-600/20"
                                  disabled={apiKeysSaving}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <code className="flex-1 p-2 bg-slate-900 text-slate-300 rounded text-sm font-mono">
                                  {apiKey.key_hash.substring(0, 16)}...
                                </code>
                                <Button
                                  size="sm"
                                  onClick={() => handleCopyApiKey(apiKey.key_hash)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {copiedKey === apiKey.key_hash ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                              <div className="text-xs text-slate-400">
                                Criada: {new Date(apiKey.created_at).toLocaleDateString('pt-BR')} | 
                                Último uso: {apiKey.last_used ? new Date(apiKey.last_used).toLocaleDateString('pt-BR') : 'Nunca'}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                Permissões: {apiKey.permissions.join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowApiKeysModal(false)}
                        className="border-slate-600 text-slate-300"
                      >
                        Fechar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Modal para mostrar nova chave API */}
                <Dialog open={showNewKeyModal} onOpenChange={setShowNewKeyModal}>
                  <DialogContent className="sm:max-w-[500px] bg-slate-900/95 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Nova API Key Gerada</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Sua nova chave API foi criada. Copie e guarde em local seguro.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                          <div>
                            <h4 className="text-yellow-400 font-semibold mb-1">Importante</h4>
                            <p className="text-sm text-slate-300">
                              Esta chave só será exibida uma vez. Guarde-a em local seguro!
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white">Sua Nova API Key:</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-3 bg-slate-900 text-slate-300 rounded text-sm font-mono break-all">
                            {newApiKey}
                          </code>
                          <Button
                            onClick={() => handleCopyApiKey(newApiKey)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {copiedKey === newApiKey ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={() => {
                          setShowNewKeyModal(false);
                          setNewApiKey('');
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Entendi
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Privacidade
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] bg-slate-900/95 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Privacidade e Dados</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Gerencie sua privacidade e dados pessoais
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <h4 className="text-white font-semibold mb-2">Exportar Dados</h4>
                        <p className="text-sm text-slate-400 mb-3">
                          Baixe uma cópia dos seus dados pessoais
                        </p>
                        <Button onClick={handleExportData} variant="outline" className="border-slate-600 text-slate-300">
                          <Download className="w-4 h-4 mr-2" />
                          Exportar Dados
                        </Button>
                      </div>
                      
                      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <h4 className="text-white font-semibold mb-2">Excluir Conta</h4>
                        <p className="text-sm text-slate-400 mb-3">
                          Excluir permanentemente sua conta e todos os dados
                        </p>
                        <Button 
                          onClick={handleDeleteAccount} 
                          variant="outline" 
                          className="border-red-600 text-red-400 hover:bg-red-600/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir Conta
                        </Button>
                      </div>

                      <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                        <div className="flex items-start gap-2">
                          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                          <div>
                            <h4 className="text-blue-400 font-semibold mb-1">Informações Importantes</h4>
                            <p className="text-sm text-slate-300">
                              Seus dados são protegidos e criptografados. A exclusão da conta é irreversível.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowPrivacyModal(false)}
                        className="border-slate-600 text-slate-300"
                      >
                        Fechar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
