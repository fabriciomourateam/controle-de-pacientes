import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { XCircle, Snowflake, Calendar, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CancellationOrFreeze {
  id: string;
  nome: string;
  plano: string;
  data: string;
  motivo: string;
  tipo: 'cancelamento' | 'congelamento';
}

export function RecentCancellationsAndFreezes() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CancellationOrFreeze[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // Função helper para extrair data de diferentes formatos
  const extractDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    
    try {
      if (typeof dateValue === 'string') {
        try {
          const parsed = JSON.parse(dateValue);
          if (parsed.start) return new Date(parsed.start);
        } catch {
          return new Date(dateValue);
        }
      }
      
      if (typeof dateValue === 'object' && dateValue.start) {
        return new Date(dateValue.start);
      }
      
      return new Date(dateValue);
    } catch {
      return null;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Buscar pacientes cancelados (RESCISÃO ou Negativado)
      const { data: cancelados, error: errorCancelados } = await supabase
        .from('patients')
        .select('id, nome, plano, data_cancelamento, motivo_cancelamento')
        .not('data_cancelamento', 'is', null)
        .or('plano.ilike.%RESCISÃO%,plano.ilike.%Negativado%')
        .order('data_cancelamento', { ascending: false })
        .limit(50);

      // Buscar pacientes congelados
      const { data: congelados, error: errorCongelados } = await supabase
        .from('patients')
        .select('id, nome, plano, data_congelamento, motivo_congelamento')
        .not('data_congelamento', 'is', null)
        .ilike('plano', '%CONGELADO%')
        .order('data_congelamento', { ascending: false })
        .limit(50);

      if (errorCancelados) throw errorCancelados;
      if (errorCongelados) throw errorCongelados;

      // Processar dados
      const processed: CancellationOrFreeze[] = [];

      // Adicionar cancelamentos
      (cancelados || []).forEach((patient: any) => {
        const dataCancelamento = extractDate(patient.data_cancelamento);
        if (dataCancelamento) {
          processed.push({
            id: patient.id,
            nome: patient.nome,
            plano: patient.plano || 'Sem plano',
            data: dataCancelamento.toISOString(),
            motivo: patient.motivo_cancelamento || 'Não informado',
            tipo: 'cancelamento'
          });
        }
      });

      // Adicionar congelamentos
      (congelados || []).forEach((patient: any) => {
        const dataCongelamento = extractDate(patient.data_congelamento);
        if (dataCongelamento) {
          processed.push({
            id: patient.id,
            nome: patient.nome,
            plano: patient.plano || 'Sem plano',
            data: dataCongelamento.toISOString(),
            motivo: patient.motivo_congelamento || 'Não informado',
            tipo: 'congelamento'
          });
        }
      });

      // Ordenar por data (mais recente primeiro)
      processed.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      setItems(processed);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de cancelamentos e congelamentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelamentos = items.filter(i => i.tipo === 'cancelamento');
  const congelamentos = items.filter(i => i.tipo === 'congelamento');

  if (loading) {
    return (
      <Card className="bg-slate-800/40 border-slate-700">
        <CardContent className="p-12 text-center">
          <div className="text-slate-400">Carregando dados...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cancelamentos Recentes */}
      <Card className="bg-slate-800/40 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            Cancelamentos Recentes
          </CardTitle>
          <CardDescription className="text-slate-400">
            {cancelamentos.length} cancelamento(s) nos últimos 90 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cancelamentos.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Nenhum cancelamento recente
            </div>
          ) : (
            <div className="space-y-3">
              {cancelamentos.map(item => (
                <Card key={item.id} className="bg-red-500/5 border-red-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-red-500/20 text-red-400">
                          {item.nome?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">{item.nome}</h4>
                          <Badge variant="outline" className="text-slate-300 text-xs">
                            {item.plano}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(item.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-2 border border-slate-600/30">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-slate-400 mb-0.5">
                                Motivo
                              </p>
                              <p className="text-sm text-slate-300">{item.motivo}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Congelamentos Recentes */}
      <Card className="bg-slate-800/40 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Snowflake className="w-5 h-5 text-cyan-400" />
            Congelamentos Recentes
          </CardTitle>
          <CardDescription className="text-slate-400">
            {congelamentos.length} congelamento(s) nos últimos 90 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {congelamentos.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Nenhum congelamento recente
            </div>
          ) : (
            <div className="space-y-3">
              {congelamentos.map(item => (
                <Card key={item.id} className="bg-cyan-500/5 border-cyan-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                          {item.nome?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">{item.nome}</h4>
                          <Badge variant="outline" className="text-slate-300 text-xs">
                            {item.plano}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(item.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-2 border border-slate-600/30">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-slate-400 mb-0.5">
                                Motivo
                              </p>
                              <p className="text-sm text-slate-300">{item.motivo}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
