import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Target, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { metricsCalculations } from "@/lib/commercial-metrics-service";

interface DailyData {
  date: string;
  google: number;
  googleForms: number;
  instagram: number;
  facebook: number;
  seller: number;
  indicacao: number;
  outros: number;
  total: number;
}

interface ConversionByChannelProps {
  leadsGoogle: number;
  leadsGoogleForms: number;
  leadsInstagram: number;
  leadsFacebook: number;
  leadsSeller: number;
  leadsIndicacao: number;
  leadsOutros: number;
  callsGoogle: number;
  callsGoogleForms: number;
  callsInstagram: number;
  callsFacebook: number;
  callsSeller: number;
  callsIndicacao: number;
  callsOutros: number;
}

interface LeadsChartProps {
  data: DailyData[];
}

export function LeadsDailyChart({ data }: LeadsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Leads Diários
          </CardTitle>
          <CardDescription className="text-slate-400">
            Evolução diária de leads por canal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-400">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxTotal = Math.max(...data.map(d => d.total), 1);
  
  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Leads Diários
        </CardTitle>
        <CardDescription className="text-slate-400">
          Evolução diária de leads por canal (últimos 10 dias)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.slice(-10).map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{item.date}</span>
                <span className="text-white font-semibold">{item.total} leads</span>
              </div>
              <div className="relative h-8 bg-slate-700/30 rounded-lg overflow-hidden">
                <div 
                  className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${(item.total / maxTotal) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-xs text-white font-medium">
                  <span>Google: {item.google}</span>
                  <span>Instagram: {item.instagram}</span>
                  <span>Facebook: {item.facebook}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ChannelDistributionProps {
  channels: {
    name: string;
    value: number;
    color: string;
  }[];
}

export function ChannelDistributionChart({ channels }: ChannelDistributionProps) {
  const total = channels.reduce((sum, channel) => sum + channel.value, 0);

  if (total === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-400" />
            Distribuição por Canal
          </CardTitle>
          <CardDescription className="text-slate-400">
            Leads por origem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-400">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-400" />
          Distribuição por Canal
        </CardTitle>
        <CardDescription className="text-slate-400">
          Leads por origem
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {channels
            .filter(channel => channel.value > 0)
            .sort((a, b) => b.value - a.value)
            .map((channel, index) => {
              const percentage = (channel.value / total) * 100;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{channel.name}</span>
                    <span className="text-white font-semibold">
                      {channel.value} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="relative h-6 bg-slate-700/30 rounded-lg overflow-hidden">
                    <div 
                      className={`absolute h-full transition-all duration-500 ${channel.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricsTableProps {
  data: DailyData[];
}

export function MetricsTable({ data }: MetricsTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || data.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Tabela de Métricas Diárias</CardTitle>
          <CardDescription className="text-slate-400">
            Detalhamento completo por dia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-400">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Tabela de Métricas Diárias</CardTitle>
            <CardDescription className="text-slate-400">
              {data.length} {data.length === 1 ? 'dia' : 'dias'} em ordem cronológica
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-300 hover:text-white hover:bg-slate-700/50"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Minimizar
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Expandir
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Data</th>
                <th className="text-right py-3 px-4 text-slate-300 font-medium">Google</th>
                <th className="text-right py-3 px-4 text-slate-300 font-medium">Google Forms</th>
                <th className="text-right py-3 px-4 text-slate-300 font-medium">Instagram</th>
                <th className="text-right py-3 px-4 text-slate-300 font-medium">Facebook</th>
                <th className="text-right py-3 px-4 text-slate-300 font-medium">Seller</th>
                <th className="text-right py-3 px-4 text-slate-300 font-medium">Indicação</th>
                <th className="text-right py-3 px-4 text-slate-300 font-medium">Outros</th>
                <th className="text-right py-3 px-4 text-white font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => {
                // Função auxiliar para formatar valores
                const formatCell = (value: number) => {
                  // Arredonda para inteiro e formata
                  return Math.round(value).toLocaleString('pt-BR');
                };

                // Função para determinar a classe CSS baseada no valor
                const getCellClass = (value: number) => {
                  const roundedValue = Math.round(value);
                  if (roundedValue >= 10) {
                    return "py-3 px-4 text-right font-bold text-green-400 bg-green-500/10";
                  }
                  return "py-3 px-4 text-right text-slate-300";
                };

                return (
                  <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 text-slate-300">{item.date}</td>
                    <td className={getCellClass(item.google)}>{formatCell(item.google)}</td>
                    <td className={getCellClass(item.googleForms)}>{formatCell(item.googleForms)}</td>
                    <td className={getCellClass(item.instagram)}>{formatCell(item.instagram)}</td>
                    <td className={getCellClass(item.facebook)}>{formatCell(item.facebook)}</td>
                    <td className={getCellClass(item.seller)}>{formatCell(item.seller)}</td>
                    <td className={getCellClass(item.indicacao)}>{formatCell(item.indicacao)}</td>
                    <td className={getCellClass(item.outros)}>{formatCell(item.outros)}</td>
                    <td className="py-3 px-4 text-right text-white font-semibold">{formatCell(item.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
      )}
    </Card>
  );
}

export function ConversionByChannel({
  leadsGoogle,
  leadsGoogleForms,
  leadsInstagram,
  leadsFacebook,
  leadsSeller,
  leadsIndicacao,
  leadsOutros,
  callsGoogle,
  callsGoogleForms,
  callsInstagram,
  callsFacebook,
  callsSeller,
  callsIndicacao,
  callsOutros,
}: ConversionByChannelProps) {
  // Calcular taxa de conversão por canal
  const channels = [
    {
      name: 'Google',
      leads: leadsGoogle,
      calls: callsGoogle,
      conversion: leadsGoogle > 0 ? (callsGoogle / leadsGoogle) * 100 : 0,
      color: 'bg-blue-500'
    },
    {
      name: 'Google Forms',
      leads: leadsGoogleForms,
      calls: callsGoogleForms,
      conversion: leadsGoogleForms > 0 ? (callsGoogleForms / leadsGoogleForms) * 100 : 0,
      color: 'bg-green-500'
    },
    {
      name: 'Instagram',
      leads: leadsInstagram,
      calls: callsInstagram,
      conversion: leadsInstagram > 0 ? (callsInstagram / leadsInstagram) * 100 : 0,
      color: 'bg-pink-500'
    },
    {
      name: 'Facebook',
      leads: leadsFacebook,
      calls: callsFacebook,
      conversion: leadsFacebook > 0 ? (callsFacebook / leadsFacebook) * 100 : 0,
      color: 'bg-indigo-500'
    },
    {
      name: 'Seller',
      leads: leadsSeller,
      calls: callsSeller,
      conversion: leadsSeller > 0 ? (callsSeller / leadsSeller) * 100 : 0,
      color: 'bg-orange-500'
    },
    {
      name: 'Indicação',
      leads: leadsIndicacao,
      calls: callsIndicacao,
      conversion: leadsIndicacao > 0 ? (callsIndicacao / leadsIndicacao) * 100 : 0,
      color: 'bg-yellow-500'
    },
    {
      name: 'Outros',
      leads: leadsOutros,
      calls: callsOutros,
      conversion: leadsOutros > 0 ? (callsOutros / leadsOutros) * 100 : 0,
      color: 'bg-gray-500'
    },
  ].filter(channel => channel.leads > 0); // Mostrar apenas canais com leads

  // Ordenar por taxa de conversão (maior para menor)
  const sortedChannels = [...channels].sort((a, b) => b.conversion - a.conversion);

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Taxa de Conversão por Canal
        </CardTitle>
        <CardDescription className="text-slate-400">
          Porcentagem de leads que viram calls em cada canal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedChannels.map((channel, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${channel.color}`}></div>
                  <span className="text-slate-300 font-medium">{channel.name}</span>
                </div>
                <span className="text-white font-bold text-lg">{channel.conversion.toFixed(1)}%</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-700/30 p-2 rounded">
                  <p className="text-slate-400 text-xs">Leads</p>
                  <p className="text-white font-semibold">{Math.round(channel.leads)}</p>
                </div>
                <div className="bg-slate-700/30 p-2 rounded">
                  <p className="text-slate-400 text-xs">Calls</p>
                  <p className="text-green-400 font-semibold">{Math.round(channel.calls)}</p>
                </div>
                <div className="bg-slate-700/30 p-2 rounded">
                  <p className="text-slate-400 text-xs">Taxa</p>
                  <p className={`font-semibold ${
                    channel.conversion >= 50 ? 'text-green-400' : 
                    channel.conversion >= 30 ? 'text-yellow-400' : 
                    'text-red-400'
                  }`}>
                    {channel.conversion.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="relative h-2 bg-slate-700/30 rounded-full overflow-hidden">
                <div 
                  className={`absolute h-full ${channel.color} transition-all duration-500`}
                  style={{ width: `${Math.min(channel.conversion, 100)}%` }}
                />
              </div>
            </div>
          ))}

          {sortedChannels.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              Nenhum dado de conversão disponível
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

