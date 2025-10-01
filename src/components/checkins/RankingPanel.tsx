import { useState, useMemo } from "react";
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Users, 
  Star,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCheckinsWithPatient } from "@/hooks/use-checkin-data";
import type { CheckinWithPatient } from "@/lib/checkin-service";

interface RankingData {
  patientId: string;
  patientName: string;
  totalScore: number;
  checkinCount: number;
  averageScore: number;
}

const RANKING_TYPES = [
  { value: 'total', label: 'Total', icon: Trophy, color: 'text-yellow-500' },
  { value: 'treino', label: 'Treino', icon: TrendingUp, color: 'text-blue-500' },
  { value: 'cardio', label: 'Cardio', icon: TrendingUp, color: 'text-green-500' },
  { value: 'sono', label: 'Sono', icon: Star, color: 'text-purple-500' },
  { value: 'agua', label: 'Hidratação', icon: Star, color: 'text-cyan-500' },
  { value: 'stress', label: 'Stress', icon: Star, color: 'text-orange-500' },
  { value: 'libido', label: 'Libido', icon: Star, color: 'text-pink-500' },
];

export function RankingPanel() {
  const [selectedRanking, setSelectedRanking] = useState('total');
  const [isExpanded, setIsExpanded] = useState(false);
  const { checkins } = useCheckinsWithPatient();

  // Função para calcular rankings
  const calculateRankings = useMemo(() => {
    if (!checkins || checkins.length === 0) return [];

    // Agrupar checkins por paciente
    const patientCheckins = checkins.reduce((acc, checkin) => {
      const patientId = checkin.patient?.id;
      const patientName = checkin.patient?.nome;
      
      if (!patientId || !patientName) return acc;

      if (!acc[patientId]) {
        acc[patientId] = {
          patientId,
          patientName,
          checkins: []
        };
      }

      acc[patientId].checkins.push(checkin);
      return acc;
    }, {} as Record<string, { patientId: string; patientName: string; checkins: CheckinWithPatient[] }>);

    // Calcular scores por categoria
    const rankings: RankingData[] = Object.values(patientCheckins).map(patient => {
      const scores = patient.checkins.map(checkin => {
        const getScore = (field: string) => {
          const value = (checkin as any)[field];
          return value ? parseFloat(value.toString()) : 0;
        };

        switch (selectedRanking) {
          case 'total':
            return getScore('total_pontuacao');
          case 'treino':
            return getScore('pontos_treinos');
          case 'cardio':
            return getScore('pontos_cardios');
          case 'sono':
            return getScore('pontos_sono');
          case 'agua':
            return getScore('pontos_agua');
          case 'stress':
            return getScore('pontos_stress');
          case 'libido':
            return getScore('pontos_libido');
          default:
            return getScore('total_pontuacao');
        }
      });

      const totalScore = scores.reduce((sum, score) => sum + score, 0);
      const averageScore = scores.length > 0 ? totalScore / scores.length : 0;

      return {
        patientId: patient.patientId,
        patientName: patient.patientName,
        totalScore,
        checkinCount: patient.checkins.length,
        averageScore: parseFloat(averageScore.toFixed(1))
      };
    });

    // Ordenar por score total (decrescente)
    return rankings.sort((a, b) => b.totalScore - a.totalScore);
  }, [checkins, selectedRanking]);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-slate-400 font-bold text-sm">
          {position}
        </span>;
    }
  };

  const getRankColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30";
      default:
        return "bg-gradient-to-r from-slate-800/40 to-slate-900/40 border-slate-700/50";
    }
  };

  const selectedRankingType = RANKING_TYPES.find(type => type.value === selectedRanking);
  const IconComponent = selectedRankingType?.icon || Trophy;

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-lg">
              <IconComponent className={`w-6 h-6 ${selectedRankingType?.color || 'text-yellow-500'}`} />
            </div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                Ranking de {selectedRankingType?.label || 'Total'}
                <Badge variant="outline" className="text-xs">
                  {rankings.length} pacientes
                </Badge>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Melhores pontuações por categoria
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedRanking} onValueChange={setSelectedRanking}>
              <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-600/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANKING_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${type.color}`} />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {rankings.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-400">Nenhum ranking disponível</p>
              <p className="text-sm text-slate-500 mt-1">Os rankings aparecerão conforme os checkins forem preenchidos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rankings.slice(0, 10).map((ranking, index) => (
                <div
                  key={ranking.patientId}
                  className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${getRankColor(index + 1)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(index + 1)}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                          {ranking.patientName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-white">{ranking.patientName}</h4>
                        <p className="text-sm text-slate-400">
                          {ranking.checkinCount} checkin{ranking.checkinCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">
                          {ranking.totalScore.toFixed(1)}
                        </span>
                        <span className="text-sm text-slate-400">pts</span>
                      </div>
                      <p className="text-sm text-slate-400">
                        Média: {ranking.averageScore}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {rankings.length > 10 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-slate-500">
                    E mais {rankings.length - 10} paciente{rankings.length - 10 !== 1 ? 's' : ''}...
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
