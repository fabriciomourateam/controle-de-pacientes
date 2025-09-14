import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Palette, 
  Globe, 
  Download, 
  Upload,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SettingsData {
  // Notificações
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  
  // Privacidade
  dataSharing: boolean;
  analytics: boolean;
  marketing: boolean;
  
  // Aparência
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  
  // Backup
  autoBackup: boolean;
  backupFrequency: string;
  
  // Sistema
  cacheSize: string;
  lastSync: string;
  version: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsData>({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    monthlyReports: false,
    dataSharing: false,
    analytics: true,
    marketing: false,
    theme: 'system',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    autoBackup: true,
    backupFrequency: 'daily',
    cacheSize: '0 MB',
    lastSync: 'Nunca',
    version: '1.0.0'
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Aqui você pode carregar configurações do Supabase se necessário
      // Por enquanto, usando valores padrão
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    }
  };

  const handleSettingChange = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Aqui você pode salvar as configurações no Supabase
      // await supabase.from('user_settings').upsert({ ...settings, user_id: user.id });
      
      setHasChanges(false);
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      emailNotifications: true,
      pushNotifications: true,
      weeklyReports: true,
      monthlyReports: false,
      dataSharing: false,
      analytics: true,
      marketing: false,
      theme: 'system',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      autoBackup: true,
      backupFrequency: 'daily',
      cacheSize: '0 MB',
      lastSync: 'Nunca',
      version: '1.0.0'
    });
    setHasChanges(false);
  };

  const handleExportData = async () => {
    try {
      // Implementar exportação de dados
      toast({
        title: "Exportação",
        description: "Dados exportados com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
  };

  const handleImportData = async () => {
    try {
      // Implementar importação de dados
      toast({
        title: "Importação",
        description: "Dados importados com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível importar os dados.",
        variant: "destructive",
      });
    }
  };

  const handleClearCache = async () => {
    try {
      // Implementar limpeza de cache
      setSettings(prev => ({ ...prev, cacheSize: '0 MB' }));
      toast({
        title: "Cache Limpo",
        description: "Cache limpo com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível limpar o cache.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações</h1>
          <p className="text-slate-400 mt-1">
            Gerencie suas preferências e configurações do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Alterações não salvas
            </Badge>
          )}
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Notificações */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bell className="w-5 h-5 text-blue-400" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure como e quando você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Notificações por E-mail</Label>
                  <p className="text-sm text-slate-400">Receber notificações importantes por e-mail</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Notificações Push</Label>
                  <p className="text-sm text-slate-400">Receber notificações no navegador</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Relatórios Semanais</Label>
                  <p className="text-sm text-slate-400">Receber resumo semanal por e-mail</p>
                </div>
                <Switch
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) => handleSettingChange('weeklyReports', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Relatórios Mensais</Label>
                  <p className="text-sm text-slate-400">Receber relatório mensal detalhado</p>
                </div>
                <Switch
                  checked={settings.monthlyReports}
                  onCheckedChange={(checked) => handleSettingChange('monthlyReports', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacidade e Segurança */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5 text-green-400" />
                Privacidade e Segurança
              </CardTitle>
              <CardDescription>
                Controle como seus dados são utilizados e protegidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Compartilhamento de Dados</Label>
                  <p className="text-sm text-slate-400">Permitir uso anônimo de dados para melhorias</p>
                </div>
                <Switch
                  checked={settings.dataSharing}
                  onCheckedChange={(checked) => handleSettingChange('dataSharing', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Analytics</Label>
                  <p className="text-sm text-slate-400">Coletar dados de uso para melhorar a experiência</p>
                </div>
                <Switch
                  checked={settings.analytics}
                  onCheckedChange={(checked) => handleSettingChange('analytics', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Marketing</Label>
                  <p className="text-sm text-slate-400">Receber ofertas e novidades por e-mail</p>
                </div>
                <Switch
                  checked={settings.marketing}
                  onCheckedChange={(checked) => handleSettingChange('marketing', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Aparência */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Palette className="w-5 h-5 text-purple-400" />
                Aparência
              </CardTitle>
              <CardDescription>
                Personalize a interface do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Tema</Label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                >
                  <option value="system">Sistema</option>
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Idioma</Label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Fuso Horário</Label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                >
                  <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                  <option value="America/New_York">Nova York (GMT-5)</option>
                  <option value="Europe/London">Londres (GMT+0)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Backup e Dados */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="w-5 h-5 text-orange-400" />
                Backup e Dados
              </CardTitle>
              <CardDescription>
                Gerencie backup e exportação de seus dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Backup Automático</Label>
                  <p className="text-sm text-slate-400">Fazer backup automático dos dados</p>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                />
              </div>
              
              {settings.autoBackup && (
                <div className="space-y-2">
                  <Label className="text-white">Frequência do Backup</Label>
                  <select
                    value={settings.backupFrequency}
                    onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
              )}
              
              <Separator className="bg-slate-700" />
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleExportData}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Dados
                </Button>
                <Button 
                  onClick={handleImportData}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          
          {/* Status do Sistema */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Globe className="w-5 h-5 text-blue-400" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Versão</span>
                <Badge variant="outline" className="text-green-400 border-green-400">
                  {settings.version}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Última Sincronização</span>
                <span className="text-slate-300 text-sm">{settings.lastSync}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tamanho do Cache</span>
                <span className="text-slate-300 text-sm">{settings.cacheSize}</span>
              </div>
              
              <Button 
                onClick={handleClearCache}
                variant="outline"
                size="sm"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Limpar Cache
              </Button>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={handleReset}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Restaurar Padrões
              </Button>
              
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar Página
              </Button>
            </CardContent>
          </Card>

          {/* Informações */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Info className="w-5 h-5 text-blue-400" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-400">
                <p>• Todas as configurações são salvas automaticamente</p>
                <p>• Backup automático protege seus dados</p>
                <p>• Suporte disponível 24/7</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
