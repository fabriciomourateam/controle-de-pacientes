import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Activity, MoreVertical, Edit, Trash2, Calendar, List, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BioimpedanciaInput } from './BioimpedanciaInput';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Bioimpedancia {
  id: string;
  telefone: string;
  data_avaliacao: string;
  percentual_gordura: number;
  peso: number;
  massa_gorda: number;
  massa_magra: number;
  imc: number;
  tmb: number;
  classificacao: string | null;
  observacoes: string | null;
}

interface BioimpedanciaListProps {
  telefone: string;
  nome: string;
  idade: number | null;
  altura: number | null;
  pesoInicial?: number | null;
  sexo: string | null;
  onUpdate: () => void;
}

export function BioimpedanciaList({
  telefone,
  nome,
  idade,
  altura,
  pesoInicial,
  sexo,
  onUpdate
}: BioimpedanciaListProps) {
  const { toast } = useToast();
  const [bioimpedancias, setBioimpedancias] = useState<Bioimpedancia[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<Bioimpedancia | null>(null);
  const [editingBio, setEditingBio] = useState<Bioimpedancia | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Estado para controlar o limite de bioimpedâncias carregadas
  const [bioLimit, setBioLimit] = useState<number | null>(50); // Padrão: 50 avaliações
  const [showBioLimitControl, setShowBioLimitControl] = useState(false);

  const loadBioimpedancias = async () => {
    try {
      setLoading(true);
      // ✅ OTIMIZAÇÃO BÁSICA: Adicionar limite para reduzir egress
      let bioQuery = supabase
        .from('body_composition')
        .select('*')
        .eq('telefone', telefone)
        .order('data_avaliacao', { ascending: false });
      
      // Aplicar limite apenas se fornecido
      if (bioLimit !== null && bioLimit !== undefined) {
        bioQuery = bioQuery.limit(bioLimit);
      }
      
      const { data, error } = await bioQuery;

      if (error) throw error;
      setBioimpedancias(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar bioimpedâncias:', error);
      toast({
        title: 'Erro ao carregar',
        description: error.message || 'Não foi possível carregar as bioimpedâncias',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fechar menu de limite ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showBioLimitControl && !target.closest('.bio-limit-control-menu')) {
        setShowBioLimitControl(false);
      }
    };
    
    if (showBioLimitControl) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBioLimitControl]);

  useEffect(() => {
    loadBioimpedancias();
  }, [telefone, bioLimit]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const { error } = await supabase
        .from('body_composition')
        .delete()
        .eq('id', deleteConfirm.id);

      if (error) throw error;

      toast({
        title: 'Bioimpedância deletada',
        description: 'A avaliação foi removida com sucesso',
      });

      setDeleteConfirm(null);
      loadBioimpedancias();
      onUpdate();
    } catch (error: any) {
      console.error('Erro ao deletar bioimpedância:', error);
      toast({
        title: 'Erro ao deletar',
        description: error.message || 'Não foi possível deletar a bioimpedância',
        variant: 'destructive'
      });
    }
  };

  const handleEditSuccess = () => {
    setEditingBio(null);
    loadBioimpedancias();
    onUpdate();
  };

  if (loading || bioimpedancias.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2 relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="gap-2 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200"
        >
          <List className="w-4 h-4" />
          Ver Bioimpedâncias ({bioimpedancias.length})
        </Button>
        
        {/* Botão para controlar limite - Apenas ícone */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBioLimitControl(!showBioLimitControl)}
                className="gap-2 bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 text-white h-9 w-9 p-0"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Limite: {bioLimit ? `${bioLimit} avaliações` : 'Sem limite'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Menu de controle de limite */}
        {showBioLimitControl && (
          <Card className="bio-limit-control-menu absolute top-12 right-0 z-50 bg-slate-800 border-slate-600 shadow-lg min-w-[200px]">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="text-sm font-medium text-white mb-2">
                  Quantas avaliações carregar?
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant={bioLimit === 50 ? "default" : "outline"}
                    onClick={() => {
                      setBioLimit(50);
                      setShowBioLimitControl(false);
                      loadBioimpedancias();
                    }}
                    className="w-full justify-start"
                  >
                    50 avaliações (padrão)
                  </Button>
                  <Button
                    size="sm"
                    variant={bioLimit === 100 ? "default" : "outline"}
                    onClick={() => {
                      setBioLimit(100);
                      setShowBioLimitControl(false);
                      loadBioimpedancias();
                    }}
                    className="w-full justify-start"
                  >
                    100 avaliações
                  </Button>
                  <Button
                    size="sm"
                    variant={bioLimit === 200 ? "default" : "outline"}
                    onClick={() => {
                      setBioLimit(200);
                      setShowBioLimitControl(false);
                      loadBioimpedancias();
                    }}
                    className="w-full justify-start"
                  >
                    200 avaliações
                  </Button>
                  <Button
                    size="sm"
                    variant={bioLimit === null ? "default" : "outline"}
                    onClick={() => {
                      setBioLimit(null);
                      setShowBioLimitControl(false);
                      loadBioimpedancias();
                    }}
                    className="w-full justify-start text-orange-400 hover:text-orange-300"
                  >
                    Todas as avaliações (sem limite)
                  </Button>
                </div>
                <div className="text-xs text-slate-400 pt-2 border-t border-slate-700">
                  <p>⚠️ Limites maiores aumentam o tempo de carregamento</p>
                  <p>💡 Use "Todas" apenas quando necessário</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Histórico de Bioimpedâncias
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {bioimpedancias.length} {bioimpedancias.length === 1 ? 'avaliação' : 'avaliações'} cadastrada{bioimpedancias.length === 1 ? '' : 's'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {bioimpedancias.map((bio) => (
              <div
                key={bio.id}
                className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-semibold text-white">
                        {format(new Date(bio.data_avaliacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                      {bio.classificacao && (
                        <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                          {bio.classificacao}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-slate-400">% Gordura</p>
                        <p className="text-lg font-bold text-rose-400">{bio.percentual_gordura}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Peso</p>
                        <p className="text-lg font-bold text-white">{bio.peso} kg</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Massa Gorda</p>
                        <p className="text-lg font-bold text-red-400">{bio.massa_gorda.toFixed(1)} kg</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Massa Magra</p>
                        <p className="text-lg font-bold text-emerald-400">{bio.massa_magra.toFixed(1)} kg</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-slate-400">IMC</p>
                        <p className="text-sm font-semibold text-white">{bio.imc.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">TMB</p>
                        <p className="text-sm font-semibold text-amber-400">{bio.tmb} kcal/dia</p>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingBio(bio);
                          setModalOpen(false);
                        }}
                        className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setDeleteConfirm(bio);
                          setModalOpen(false);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-slate-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de deleção */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Confirmar exclusão</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tem certeza que deseja deletar a bioimpedância de{' '}
              {deleteConfirm && format(new Date(deleteConfirm.data_avaliacao), "dd/MM/yyyy", { locale: ptBR })}?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="border-slate-600 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de edição - renderizado inline */}
      {editingBio && (
        <BioimpedanciaInput
          telefone={telefone}
          nome={nome}
          idade={idade}
          altura={altura}
          pesoInicial={pesoInicial}
          sexo={sexo}
          editingBio={editingBio}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingBio(null)}
        />
      )}
    </>
  );
}

