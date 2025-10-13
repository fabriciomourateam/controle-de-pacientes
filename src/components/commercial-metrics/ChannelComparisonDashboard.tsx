import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowRight, Target } from "lucide-react";

interface ChannelComparisonProps {
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

export function ChannelComparisonDashboard({
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
}: ChannelComparisonProps) {
  const channels = [
    {
      name: 'Google',
      leads: Math.round(leadsGoogle),
      calls: Math.round(callsGoogle),
      conversion: leadsGoogle > 0 ? (callsGoogle / leadsGoogle) * 100 : 0,
      color: 'from-blue-500 to-blue-600',
      icon: '🔍',
    },
    {
      name: 'Google Forms',
      leads: Math.round(leadsGoogleForms),
      calls: Math.round(callsGoogleForms),
      conversion: leadsGoogleForms > 0 ? (callsGoogleForms / leadsGoogleForms) * 100 : 0,
      color: 'from-green-500 to-green-600',
      icon: '📝',
    },
    {
      name: 'Instagram',
      leads: Math.round(leadsInstagram),
      calls: Math.round(callsInstagram),
      conversion: leadsInstagram > 0 ? (callsInstagram / leadsInstagram) * 100 : 0,
      color: 'from-pink-500 to-purple-600',
      icon: '📸',
    },
    {
      name: 'Facebook',
      leads: Math.round(leadsFacebook),
      calls: Math.round(callsFacebook),
      conversion: leadsFacebook > 0 ? (callsFacebook / leadsFacebook) * 100 : 0,
      color: 'from-blue-600 to-indigo-600',
      icon: '👥',
    },
    {
      name: 'Seller',
      leads: Math.round(leadsSeller),
      calls: Math.round(callsSeller),
      conversion: leadsSeller > 0 ? (callsSeller / leadsSeller) * 100 : 0,
      color: 'from-orange-500 to-red-600',
      icon: '💼',
    },
    {
      name: 'Indicação',
      leads: Math.round(leadsIndicacao),
      calls: Math.round(callsIndicacao),
      conversion: leadsIndicacao > 0 ? (callsIndicacao / leadsIndicacao) * 100 : 0,
      color: 'from-yellow-500 to-orange-500',
      icon: '👋',
    },
    {
      name: 'Outros',
      leads: Math.round(leadsOutros),
      calls: Math.round(callsOutros),
      conversion: leadsOutros > 0 ? (callsOutros / leadsOutros) * 100 : 0,
      color: 'from-gray-500 to-gray-600',
      icon: '📊',
    },
  ].filter(channel => channel.leads > 0 || channel.calls > 0);

  // Ordenar por número de leads (maior para menor)
  const sortedChannels = [...channels].sort((a, b) => b.leads - a.leads);

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-400" />
          Comparação Rápida por Canal
        </CardTitle>
        <CardDescription className="text-slate-400">
          Visão completa: Leads → Calls → Taxa de Conversão
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedChannels.map((channel, index) => (
            <div
              key={index}
              className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30 hover:border-slate-500/50 transition-all hover:shadow-lg"
            >
              {/* Header do Canal */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{channel.icon}</span>
                  <h3 className="text-lg font-bold text-white">{channel.name}</h3>
                  {/* Badge de performance ao lado do nome */}
                  {channel.conversion >= 50 && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/50">
                      🔥 TOP
                    </span>
                  )}
                  {channel.conversion >= 30 && channel.conversion < 50 && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/50">
                      ⚡ BOM
                    </span>
                  )}
                  {channel.conversion < 30 && channel.conversion > 0 && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/50">
                      📊 OK
                    </span>
                  )}
                </div>
                <div className={`text-2xl font-bold ${
                  channel.conversion >= 50 ? 'text-green-400' : 
                  channel.conversion >= 30 ? 'text-yellow-400' : 
                  'text-red-400'
                }`}>
                  {channel.conversion.toFixed(1)}%
                </div>
              </div>

              {/* Métricas em linha com setas */}
              <div className="flex items-center justify-between gap-3 mb-3">
                {/* Leads */}
                <div className="flex-1 bg-blue-500/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-400 font-semibold mb-1">LEADS</p>
                  <p className="text-2xl font-bold text-white">{channel.leads}</p>
                </div>

                {/* Seta */}
                <ArrowRight className="w-6 h-6 text-slate-400 flex-shrink-0" />

                {/* Calls */}
                <div className="flex-1 bg-green-500/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-400 font-semibold mb-1">CALLS</p>
                  <p className="text-2xl font-bold text-white">{channel.calls}</p>
                </div>

                {/* Seta */}
                <ArrowRight className="w-6 h-6 text-slate-400 flex-shrink-0" />

                {/* Taxa */}
                <div className="flex-1 bg-purple-500/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-400 font-semibold mb-1">TAXA</p>
                  <p className={`text-2xl font-bold ${
                    channel.conversion >= 50 ? 'text-green-400' : 
                    channel.conversion >= 30 ? 'text-yellow-400' : 
                    'text-red-400'
                  }`}>
                    {channel.conversion.toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Barra de progresso visual */}
              <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className={`absolute h-full bg-gradient-to-r ${channel.color} transition-all duration-500`}
                  style={{ width: `${Math.min(channel.conversion, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Legenda */}
        <div className="mt-6 p-4 bg-slate-700/20 rounded-lg border border-slate-600/30">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-slate-300">≥ 50% = <span className="text-green-400 font-semibold">🔥 TOP</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-slate-300">30-49% = <span className="text-yellow-400 font-semibold">⚡ BOM</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-slate-300">&lt; 30% = <span className="text-blue-400 font-semibold">📊 OK</span></span>
            </div>
          </div>
        </div>

        {sortedChannels.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            Nenhum dado disponível para comparação
          </div>
        )}
      </CardContent>
    </Card>
  );
}

