import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditableRenewalSection } from './EditableRenewalSection';
import { TrendingUp, TrendingDown, Minus, Scale, Ruler, Target, Edit } from 'lucide-react';
import { useState } from 'react';

interface CheckinData {
  id: string;
  peso: string;
  medida: string;
  data_checkin: string;
  created_at: string;
}

interface EditableMetricsCardProps {
  firstCheckin: CheckinData | null;
  lastCheckin: CheckinData | null;
  allCheckins: CheckinData[];
  isVerticalLayout?: boolean;
  patient: any;
  isPublicAccess?: boolean;
}

export function EditableMetricsCard({ 
  firstCheckin, 
  lastCheckin, 
  allCheckins,
  isVerticalLayout = false,
  patient,
  isPublicAccess = false
}: EditableMetricsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const parseWeight = (peso: string) => {
    if (!peso) return null;
    const cleaned = peso.replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  };

  const parseMeasurements = (medida: string) => {
    if (!medida) return { waist: null, hip: null };
    
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

  // Conteúdo padrão para edição
  const defaultMetricsContent = `
    <div class="grid ${isVerticalLayout ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-3 gap-6'}">
      <!-- Peso -->
      <div class="bg-slate-900/30 rounded-lg ${isVerticalLayout ? 'p-4' : 'p-6'} border border-slate-700/50">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 bg-purple-400 rounded"></div>
            <h3 class="font-semibold text-white">Peso</h3>
          </div>
          ${getTrendIcon(weightDiff) ? '📈' : '📉'}
        </div>
        
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-slate-400 text-sm">Início:</span>
            <span class="text-white font-medium">
              ${firstWeight ? `${firstWeight.toFixed(1)}kg` : 'N/A'}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400 text-sm">Atual:</span>
            <span class="text-white font-medium">
              ${lastWeight ? `${lastWeight.toFixed(1)}kg` : 'N/A'}
            </span>
          </div>
          <div class="pt-2 border-t border-slate-700/50">
            <div class="flex justify-between items-center">
              <span class="text-slate-400 text-sm">Diferença:</span>
              <span class="font-bold ${getTrendColor(weightDiff)}">
                ${formatDiff(weightDiff, 'kg')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cintura -->
      <div class="bg-slate-900/30 rounded-lg ${isVerticalLayout ? 'p-4' : 'p-6'} border border-slate-700/50">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 bg-yellow-400 rounded"></div>
            <h3 class="font-semibold text-white">Cintura</h3>
          </div>
          ${getTrendIcon(waistDiff, true) ? '📈' : '📉'}
        </div>
        
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-slate-400 text-sm">Início:</span>
            <span class="text-white font-medium">
              ${firstMeasures.waist ? `${firstMeasures.waist}cm` : 'N/A'}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400 text-sm">Atual:</span>
            <span class="text-white font-medium">
              ${lastMeasures.waist ? `${lastMeasures.waist}cm` : 'N/A'}
            </span>
          </div>
          <div class="pt-2 border-t border-slate-700/50">
            <div class="flex justify-between items-center">
              <span class="text-slate-400 text-sm">Diferença:</span>
              <span class="font-bold ${getTrendColor(waistDiff, true)}">
                ${formatDiff(waistDiff, 'cm', true)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quadril -->
      <div class="bg-slate-900/30 rounded-lg ${isVerticalLayout ? 'p-4' : 'p-6'} border border-slate-700/50">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 bg-green-400 rounded"></div>
            <h3 class="font-semibold text-white">Quadril</h3>
          </div>
          ${getTrendIcon(hipDiff, true) ? '📈' : '📉'}
        </div>
        
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-slate-400 text-sm">Início:</span>
            <span class="text-white font-medium">
              ${firstMeasures.hip ? `${firstMeasures.hip}cm` : 'N/A'}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400 text-sm">Atual:</span>
            <span class="text-white font-medium">
              ${lastMeasures.hip ? `${lastMeasures.hip}cm` : 'N/A'}
            </span>
          </div>
          <div class="pt-2 border-t border-slate-700/50">
            <div class="flex justify-between items-center">
              <span class="text-slate-400 text-sm">Diferença:</span>
              <span class="font-bold ${getTrendColor(hipDiff, true)}">
                ${formatDiff(hipDiff, 'cm', true)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Resumo ${isVerticalLayout ? 'compacto' : ''} -->
    <div class="mt-${isVerticalLayout ? '4' : '6'} p-${isVerticalLayout ? '3' : '4'} bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
      <div class="flex items-center gap-2 mb-${isVerticalLayout ? '1' : '2'}">
        <div class="w-${isVerticalLayout ? '4' : '5'} h-${isVerticalLayout ? '4' : '5'} bg-blue-400 rounded"></div>
        <h4 class="font-semibold text-white text-${isVerticalLayout ? 'sm' : 'base'}">Resumo${isVerticalLayout ? '' : ' da Recomposição'}</h4>
      </div>
      <p class="text-slate-300 text-${isVerticalLayout ? 'sm' : 'base'}">
        ${getProgressMessage()}
      </p>
    </div>
  `;

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600 h-full">
      <CardHeader className={isVerticalLayout ? "pb-4" : ""}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className={`${isVerticalLayout ? 'w-6 h-6' : 'w-7 h-7'} text-blue-400`} />
            <div>
              <CardTitle className={`${isVerticalLayout ? 'text-xl' : 'text-2xl'} text-white`}>
                {isVerticalLayout ? 'Métricas' : 'Comparativo de Métricas'}
              </CardTitle>
              <div className="text-slate-400 text-sm">
                {isVerticalLayout ? 'Evolução dos números' : 'Evolução dos seus números desde o início'}
              </div>
            </div>
          </div>
          {!isPublicAccess && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="text-slate-400 hover:text-white"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing && !isPublicAccess ? (
          <EditableRenewalSection
            sectionKey="metrics_comparison"
            patientPhone={patient?.telefone}
            defaultContent={defaultMetricsContent}
            isPublicAccess={isPublicAccess}
            className="min-h-[400px]"
          />
        ) : (
          <>
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
            </div>

            {/* Resumo da evolução */}
            <div className={`mt-${isVerticalLayout ? '4' : '6'} p-${isVerticalLayout ? '3' : '4'} bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`w-${isVerticalLayout ? '4' : '5'} h-${isVerticalLayout ? '4' : '5'} text-blue-400`} />
                <h4 className={`font-semibold text-white text-${isVerticalLayout ? 'sm' : 'base'}`}>
                  Resumo{isVerticalLayout ? '' : ' da Recomposição'}
                </h4>
              </div>
              <p className={`text-slate-300 text-${isVerticalLayout ? 'sm' : 'base'}`}>
                {getProgressMessage()}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}