import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Scale, Ruler, Target } from 'lucide-react';

interface CheckinData {
  id: string;
  peso: string;
  medida: string;
  data_checkin: string;
  created_at: string;
}

interface MetricsComparisonProps {
  firstCheckin: CheckinData | null;
  lastCheckin: CheckinData | null;
  allCheckins: CheckinData[];
  isVerticalLayout?: boolean;
}

export function MetricsComparison({ 
  firstCheckin, 
  lastCheckin, 
  allCheckins,
  isVerticalLayout = false
}: MetricsComparisonProps) {
  
  const parseWeight = (peso: string) => {
    if (!peso) return null;
    const cleaned = peso.replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  };

  const parseMeasurements = (medida: string) => {
    if (!medida) return { waist: null, hip: null };
    
    // Tentar extrair números da string (formato: "cintura X quadril Y" ou "X Y")
    const numbers = medida.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      return {
        waist: parseInt(numbers[0]),
        hip: parseInt(numbers[1])
      };
    }
    
    return { waist: null, hip: null };
  };

  const firstWeight = firstCheckin ? parseWeight(firstCheckin.peso) : null;
  const lastWeight = lastCheckin ? parseWeight(lastCheckin.peso) : null;
  const firstMeasures = firstCheckin ? parseMeasurements(firstCheckin.medida) : { waist: null, hip: null };
  const lastMeasures = lastCheckin ? parseMeasurements(lastCheckin.medida) : { waist: null, hip: null };

  const weightDiff = (firstWeight && lastWeight) ? lastWeight - firstWeight : null;
  const waistDiff = (firstMeasures.waist && lastMeasures.waist) ? lastMeasures.waist - firstMeasures.waist : null;
  const hipDiff = (firstMeasures.hip && lastMeasures.hip) ? lastMeasures.hip - firstMeasures.hip : null;

  const getTrendIcon = (diff: number | null, reverse = false) => {
    if (diff === null) return <Minus className="w-4 h-4 text-slate-400" />;
    
    const isPositive = reverse ? diff < 0 : diff > 0;
    const isNegative = reverse ? diff > 0 : diff < 0;
    
    if (isPositive) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (isNegative) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendColor = (diff: number | null, reverse = false) => {
    if (diff === null) return 'text-slate-400';
    
    const isPositive = reverse ? diff < 0 : diff > 0;
    const isNegative = reverse ? diff > 0 : diff < 0;
    
    if (isPositive) return 'text-green-400';
    if (isNegative) return 'text-red-400';
    return 'text-slate-400';
  };

  const formatDiff = (diff: number | null, unit: string, reverse = false) => {
    if (diff === null) return 'N/A';
    
    const absValue = Math.abs(diff);
    const isPositive = reverse ? diff < 0 : diff > 0;
    const isNegative = reverse ? diff > 0 : diff < 0;
    
    if (isPositive) return `+${absValue.toFixed(1)}${unit}`;
    if (isNegative) return `-${absValue.toFixed(1)}${unit}`;
    return `0${unit}`;
  };

  const getProgressMessage = () => {
    const messages = [];
    
    if (weightDiff !== null) {
      if (weightDiff > 0) {
        messages.push(`Ganhou ${Math.abs(weightDiff).toFixed(1)}kg de massa`);
      } else if (weightDiff < 0) {
        messages.push(`Perdeu ${Math.abs(weightDiff).toFixed(1)}kg`);
      }
    }
    
    if (waistDiff !== null && waistDiff < 0) {
      messages.push(`Reduziu ${Math.abs(waistDiff)}cm na cintura`);
    }
    
    if (hipDiff !== null && hipDiff < 0) {
      messages.push(`Reduziu ${Math.abs(hipDiff)}cm no quadril`);
    }
    
    return messages.length > 0 ? messages.join(' • ') : 'Manteve estabilidade nas métricas';
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600 h-full">
      <CardHeader className={isVerticalLayout ? "pb-4" : ""}>
        <CardTitle className={`${isVerticalLayout ? 'text-xl' : 'text-2xl'} text-white flex items-center gap-3`}>
          <Target className={`${isVerticalLayout ? 'w-6 h-6' : 'w-7 h-7'} text-blue-400`} />
          {isVerticalLayout ? 'Métricas' : 'Comparativo de Métricas'}
        </CardTitle>
        <div className="text-slate-400 text-sm">
          {isVerticalLayout ? 'Evolução dos números' : 'Evolução dos seus números desde o início'}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid ${isVerticalLayout ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-3 gap-6'}`}>
          {/* Peso */}
          <div className={`bg-slate-900/30 rounded-lg ${isVerticalLayout ? 'p-4' : 'p-6'} border border-slate-700/50`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">Peso</h3>
              </div>
              {getTrendIcon(weightDiff)}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Início:</span>
                <span className="text-white font-medium">
                  {firstWeight ? `${firstWeight.toFixed(1)}kg` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Atual:</span>
                <span className="text-white font-medium">
                  {lastWeight ? `${lastWeight.toFixed(1)}kg` : 'N/A'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-700/50">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Diferença:</span>
                  <span className={`font-bold ${getTrendColor(weightDiff)}`}>
                    {formatDiff(weightDiff, 'kg')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cintura */}
          <div className={`bg-slate-900/30 rounded-lg ${isVerticalLayout ? 'p-4' : 'p-6'} border border-slate-700/50`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-yellow-400" />
                <h3 className="font-semibold text-white">Cintura</h3>
              </div>
              {getTrendIcon(waistDiff, true)}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Início:</span>
                <span className="text-white font-medium">
                  {firstMeasures.waist ? `${firstMeasures.waist}cm` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Atual:</span>
                <span className="text-white font-medium">
                  {lastMeasures.waist ? `${lastMeasures.waist}cm` : 'N/A'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-700/50">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Diferença:</span>
                  <span className={`font-bold ${getTrendColor(waistDiff, true)}`}>
                    {formatDiff(waistDiff, 'cm', true)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quadril */}
          <div className={`bg-slate-900/30 rounded-lg ${isVerticalLayout ? 'p-4' : 'p-6'} border border-slate-700/50`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold text-white">Quadril</h3>
              </div>
              {getTrendIcon(hipDiff, true)}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Início:</span>
                <span className="text-white font-medium">
                  {firstMeasures.hip ? `${firstMeasures.hip}cm` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Atual:</span>
                <span className="text-white font-medium">
                  {lastMeasures.hip ? `${lastMeasures.hip}cm` : 'N/A'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-700/50">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Diferença:</span>
                  <span className={`font-bold ${getTrendColor(hipDiff, true)}`}>
                    {formatDiff(hipDiff, 'cm', true)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo da evolução - apenas no layout horizontal */}
          {!isVerticalLayout && (
            <div className="md:col-span-3">
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h4 className="font-semibold text-white">Resumo da Recomposição</h4>
                </div>
                <p className="text-slate-300">
                  {getProgressMessage()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Resumo compacto para layout vertical */}
        {isVerticalLayout && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h4 className="font-semibold text-white text-sm">Resumo</h4>
            </div>
            <p className="text-slate-300 text-sm">
              {getProgressMessage()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}