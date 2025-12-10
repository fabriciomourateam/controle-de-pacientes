import React, { useState, useEffect } from 'react';
import { BookOpen, Star, Search, Plus, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { dietTemplateService, TemplateWithMeals } from '@/lib/diet-template-service';

interface TemplateLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  onTemplateSelected: (planId: string) => void;
}

const categories = [
  { value: 'all', label: 'Todos' },
  { value: 'emagrecimento', label: 'Emagrecimento' },
  { value: 'ganho_peso', label: 'Ganho de Peso' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'hipertrofia', label: 'Hipertrofia' },
  { value: 'outros', label: 'Outros' },
];

export function TemplateLibraryModal({
  open,
  onOpenChange,
  patientId,
  onTemplateSelected,
}: TemplateLibraryModalProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateWithMeals[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<TemplateWithMeals[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('my');

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, activeTab]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      if (activeTab === 'my') {
        const data = await dietTemplateService.getAll();
        setTemplates(data);
      } else {
        const data = await dietTemplateService.getPublic();
        setPublicTemplates(data);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      const planId = await dietTemplateService.createPlanFromTemplate(
        templateId,
        patientId
      );
      
      toast({
        title: 'Template aplicado',
        description: 'Plano criado com sucesso a partir do template',
      });
      
      onTemplateSelected(planId);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao aplicar template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = (activeTab === 'my' ? templates : publicTemplates).filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto border-cyan-500/30 bg-slate-900/95 backdrop-blur-xl text-white">
        <DialogHeader>
          <DialogTitle className="text-cyan-300 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Biblioteca de Planos
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Escolha um template para criar um novo plano rapidamente
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my">Meus Templates</TabsTrigger>
            <TabsTrigger value="public">Templates Públicos</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {/* Busca e Filtros */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950/50 border-slate-700 text-white"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-950/50 border border-slate-700 rounded-md text-white"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Lista de Templates */}
            {loading ? (
              <div className="text-center py-8 text-slate-400">Carregando...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                Nenhum template encontrado
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map(template => (
                  <Card
                    key={template.id}
                    className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-colors"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white flex items-center gap-2">
                            {template.name}
                            {template.is_favorite && (
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            )}
                          </CardTitle>
                          <Badge variant="outline" className="mt-2 border-cyan-500/50 text-cyan-300">
                            {categories.find(c => c.value === template.category)?.label || template.category}
                          </Badge>
                        </div>
                      </div>
                      {template.description && (
                        <p className="text-sm text-slate-400 mt-2">{template.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                        <div>
                          <span className="text-slate-400">Calorias: </span>
                          <span className="text-cyan-400 font-semibold">
                            {template.total_calories ? Math.round(template.total_calories) : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Proteínas: </span>
                          <span className="text-cyan-400 font-semibold">
                            {template.total_protein ? `${Math.round(template.total_protein)}g` : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Refeições: </span>
                          <span className="text-cyan-400 font-semibold">
                            {template.template_meals?.length || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Usado: </span>
                          <span className="text-cyan-400 font-semibold">
                            {template.usage_count || 0}x
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleUseTemplate(template.id)}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                        disabled={loading}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Usar Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}








