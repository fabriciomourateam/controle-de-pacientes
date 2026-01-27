import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Edit, Trash2, Sparkles, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { FeaturedComparison as FeaturedComparisonType } from '@/hooks/use-featured-comparison';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FeaturedComparisonProps {
  comparison: FeaturedComparisonType;
  isEditable?: boolean;
  isCompact?: boolean; // NOVO: modo compacto
  onToggleVisibility?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function FeaturedComparison({
  comparison,
  isEditable = false,
  isCompact = false, // NOVO: modo compacto para página pública
  onToggleVisibility,
  onEdit,
  onDelete,
}: FeaturedComparisonProps) {
  console.log('🎯 FeaturedComparison RENDERIZADO:', {
    hasComparison: !!comparison,
    isEditable,
    isVisible: comparison?.is_visible,
    title: comparison?.title
  });
  
  const weightDiff = comparison.before_weight && comparison.after_weight
    ? comparison.before_weight - comparison.after_weight
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={isCompact ? 'max-w-4xl mx-auto' : ''}
    >
      <Card className="bg-gradient-to-br from-purple-900/30 via-slate-800/50 to-blue-900/30 border-purple-500/30 overflow-hidden">
        {/* Header */}
        <div className={`relative bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-purple-500/20 ${isCompact ? 'p-4' : 'p-6'}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className={`${isCompact ? 'w-5 h-5' : 'w-6 h-6'} text-yellow-400`} />
                <h3 className={`${isCompact ? 'text-xl' : 'text-2xl'} font-bold text-white`}>
                  {comparison.title}
                </h3>
              </div>
              {comparison.description && (
                <p className={`text-slate-300 ${isCompact ? 'text-xs' : 'text-sm'} max-w-2xl`}>
                  {comparison.description}
                </p>
              )}
            </div>

            {/* Botões de controle (apenas no modo editável) */}
            {isEditable && (
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleVisibility}
                  className={`gap-2 ${
                    comparison.is_visible
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                      : 'bg-slate-700/50 border-slate-600/50 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {comparison.is_visible ? (
                    <>
                      <Eye className="w-4 h-4" />
                      Visível
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Oculto
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="gap-2 bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/30"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="gap-2 bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Estatísticas */}
          <div className={`flex gap-4 ${isCompact ? 'mt-2' : 'mt-4'} flex-wrap`}>
            {weightDiff !== null && (
              <Badge className={`bg-emerald-500/20 text-emerald-300 border-emerald-500/30 ${isCompact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1'}`}>
                <TrendingDown className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
                {Math.abs(weightDiff).toFixed(1)} kg {weightDiff > 0 ? 'perdidos' : 'ganhos'}
              </Badge>
            )}
          </div>
        </div>

        {/* Comparação de Fotos */}
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Foto ANTES */}
            <div className="relative group">
              <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-900/90 to-transparent z-10 ${isCompact ? 'p-2' : 'p-4'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className={`bg-red-500/80 text-white border-0 ${isCompact ? 'text-xs mb-1' : 'mb-2'}`}>
                      ANTES
                    </Badge>
                    <p className={`text-white font-medium ${isCompact ? 'text-xs' : 'text-sm'}`}>
                      {format(new Date(comparison.before_photo_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    {comparison.before_weight && (
                      <p className={`text-slate-300 mt-1 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
                        {comparison.before_weight} kg
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="aspect-[3/4] relative overflow-hidden bg-slate-900 flex items-center justify-center">
                <img
                  src={comparison.before_photo_url}
                  alt="Foto Antes"
                  className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  style={{
                    transform: `scale(${comparison.before_zoom || 1}) translate(${(comparison.before_position_x || 0) / (comparison.before_zoom || 1)}px, ${(comparison.before_position_y || 0) / (comparison.before_zoom || 1)}px)`,
                    transformOrigin: 'center center'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Foto DEPOIS */}
            <div className="relative group">
              <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-900/90 to-transparent z-10 ${isCompact ? 'p-2' : 'p-4'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className={`bg-emerald-500/80 text-white border-0 ${isCompact ? 'text-xs mb-1' : 'mb-2'}`}>
                      DEPOIS
                    </Badge>
                    <p className={`text-white font-medium ${isCompact ? 'text-xs' : 'text-sm'}`}>
                      {format(new Date(comparison.after_photo_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    {comparison.after_weight && (
                      <p className={`text-slate-300 mt-1 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
                        {comparison.after_weight} kg
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="aspect-[3/4] relative overflow-hidden bg-slate-900 flex items-center justify-center">
                <img
                  src={comparison.after_photo_url}
                  alt="Foto Depois"
                  className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  style={{
                    transform: `scale(${comparison.after_zoom || 1}) translate(${(comparison.after_position_x || 0) / (comparison.after_zoom || 1)}px, ${(comparison.after_position_y || 0) / (comparison.after_zoom || 1)}px)`,
                    transformOrigin: 'center center'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
              </div>

              {/* Badge de conquista */}
              {weightDiff && weightDiff > 0 && (
                <div className="absolute bottom-4 right-4 z-10">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                    className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-3 shadow-lg"
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </motion.div>
                </div>
              )}
            </div>
          </div>

          {/* Mensagem motivacional */}
          {weightDiff && weightDiff > 0 && (
            <div className={`bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-t border-emerald-500/20 ${isCompact ? 'p-4' : 'p-6'}`}>
              <p className={`text-center text-white font-medium ${isCompact ? 'text-base' : 'text-lg'}`}>
                🎉 Incrível! Uma transformação de <span className="text-emerald-400 font-bold">{Math.abs(weightDiff).toFixed(1)} kg</span>!
              </p>
              <p className={`text-center text-slate-400 mt-2 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                Continue assim, você está no caminho certo! 💪
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
