import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Users,
  Settings,
  BarChart3,
  MessageSquare,
  Trash2
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  popular?: boolean;
}

interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  items: string[];
}

export default function HelpPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const handleClearCache = async () => {
    try {
      // Limpar caches do Service Worker
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Limpar localStorage (exceto dados de autenticação)
      const authKeys = ['sb-qhzifnyjyxdushxorzrk-auth-token'];
      const keysToKeep: Record<string, string> = {};
      authKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) keysToKeep[key] = value;
      });
      localStorage.clear();
      Object.entries(keysToKeep).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      toast({
        title: "Cache Limpo",
        description: "Cache do aplicativo foi limpo com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível limpar o cache.",
        variant: "destructive",
      });
    }
  };

  const helpSections: HelpSection[] = [
    {
      id: "patients",
      title: "Gestão de Pacientes",
      description: "Administre seus pacientes",
      icon: Users,
      color: "text-green-400",
      items: [
        "Adicionar novos pacientes",
        "Editar informações",
        "Gerenciar planos",
        "Histórico de acompanhamento"
      ]
    },
    {
      id: "checkins",
      title: "Sistema de Checkins",
      description: "Acompanhe o progresso",
      icon: MessageSquare,
      color: "text-purple-400",
      items: [
        "Como fazer checkins",
        "Entendendo as pontuações",
        "Relatórios de progresso"
      ]
    },
    {
      id: "metrics",
      title: "Métricas e Relatórios",
      description: "Analise o desempenho",
      icon: BarChart3,
      color: "text-orange-400",
      items: [
        "Dashboard de métricas",
        "Relatórios mensais",
        "Análise de crescimento"
      ]
    },
  ];

  const faqItems: FAQItem[] = [
    {
      id: "1",
      question: "Como adicionar um novo paciente?",
      answer: "Clique no botão 'Novo Paciente' no dashboard ou vá para a página de Pacientes. Preencha as informações básicas como nome, telefone, e-mail e selecione um plano. O sistema irá criar automaticamente um perfil completo para acompanhamento.",
      category: "patients",
      popular: true
    },
    {
      id: "2",
      question: "Como funciona o sistema de checkins?",
      answer: "Os checkins são questionários que seus pacientes preenchem regularmente para avaliar progresso. O sistema calcula pontuações baseadas em treino, alimentação, sono e outros fatores. Você pode acompanhar a evolução através do dashboard.",
      category: "checkins",
      popular: true
    },
    {
      id: "3",
      question: "Como interpretar as métricas do dashboard?",
      answer: "O dashboard mostra KPIs importantes como taxa de renovação, churn, crescimento mensal e saúde do negócio. Valores em verde indicam bom desempenho, amarelo indica atenção e vermelho indica problemas que precisam ser resolvidos.",
      category: "metrics",
      popular: true
    },
    {
      id: "4",
      question: "Como funciona o filtro de meses nas métricas?",
      answer: "O filtro permite analisar dados de períodos específicos. Você pode selecionar meses individuais ou usar os filtros pré-definidos (3, 6, 12 meses) para comparar diferentes períodos.",
      category: "metrics"
    },
    {
      id: "6",
      question: "Como editar informações de um paciente?",
      answer: "Na página de Pacientes, clique no nome do paciente desejado ou no botão de editar. Você pode alterar dados pessoais, plano, vencimento e outras informações. As alterações são salvas automaticamente.",
      category: "patients"
    },
    {
      id: "7",
      question: "O que são 'Checkins Pendentes'?",
      answer: "São pacientes que não fizeram checkin há mais de 30 dias. Isso ajuda a identificar quem precisa de acompanhamento mais próximo ou motivação para manter o engajamento.",
      category: "checkins"
    },
    {
      id: "8",
      question: "Como interpretar o 'Score Médio'?",
      answer: "O score médio é calculado baseado nas pontuações dos checkins. Valores acima de 70 indicam bom engajamento, entre 50-70 indicam atenção moderada, e abaixo de 50 indicam necessidade de intervenção.",
      category: "metrics"
    }
  ];

  const filteredFAQs = faqItems.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Central de Ajuda</h1>
            <p className="text-slate-400 mt-1">
              Encontre respostas para suas dúvidas e aprenda a usar o sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-400 border-green-400">
              <CheckCircle className="w-3 h-3 mr-1" />
              Sistema Online
            </Badge>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Pesquisar na central de ajuda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <Mail className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">E-mail</h3>
              <p className="text-sm text-slate-400">suporte@fmteam.com</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <Phone className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Telefone</h3>
              <p className="text-sm text-slate-400">(11) 99141-8266</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Horário</h3>
              <p className="text-sm text-slate-400">24/7 Online</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Help Sections */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold text-white">Categorias</h2>
            {helpSections.map((section) => (
              <Card key={section.id} className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white text-sm">
                    <section.icon className={`w-4 h-4 ${section.color}`} />
                    {section.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1">
                    {section.items.map((item, index) => (
                      <li key={index} className="text-xs text-slate-300 flex items-center gap-2">
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Perguntas Frequentes</h2>
              <div className="flex gap-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  className="text-xs"
                >
                  Todas
                </Button>
                <Button
                  variant={selectedCategory === "patients" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("patients")}
                  className="text-xs"
                >
                  Pacientes
                </Button>
                <Button
                  variant={selectedCategory === "metrics" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("metrics")}
                  className="text-xs"
                >
                  Métricas
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredFAQs.map((faq) => (
                <Card key={faq.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader 
                    className="cursor-pointer hover:bg-slate-700/30 transition-colors"
                    onClick={() => toggleFAQ(faq.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-white text-sm">
                          {faq.question}
                        </CardTitle>
                        {faq.popular && (
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400 text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                      {expandedFAQ === faq.id ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedFAQ === faq.id && (
                    <CardContent className="pt-0">
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {filteredFAQs.length === 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6 text-center">
                  <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">Nenhum resultado encontrado</h3>
                  <p className="text-slate-400 text-sm">
                    Tente usar termos diferentes ou verifique a ortografia
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sistema */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="w-5 h-5 text-cyan-400" />
              Sistema
            </CardTitle>
            <CardDescription className="text-slate-400">
              Informações e manutenção do aplicativo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Versão</span>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    1.0.0
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">Versão atual do sistema</p>
              </div>
              
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Status</span>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Online
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">Sistema funcionando normalmente</p>
              </div>
              
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <Button 
                  onClick={handleClearCache}
                  size="sm"
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Cache
                </Button>
                <p className="text-xs text-slate-500 mt-2 text-center">Limpa dados temporários</p>
              </div>
            </div>
          </CardContent>
        </Card>


      </div>
    </DashboardLayout>
  );
}
