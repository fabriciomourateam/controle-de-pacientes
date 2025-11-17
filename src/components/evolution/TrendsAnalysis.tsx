import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Info, Lightbulb, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Trend } from '@/lib/trends-analysis';

interface TrendsAnalysisProps {
  trends: Trend[];
}

export function TrendsAnalysis({ trends }: TrendsAnalysisProps) {
  if (trends.length === 0) {
    return null;
  }

  const getTypeIcon = (type: Trend['type']) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="w-4 h-4" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4" />;
      case 'insight':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: Trend['type']) => {
    switch (type) {
      case 'positive':
        return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-200 border-emerald-400/40 shadow-lg shadow-emerald-500/10';
      case 'negative':
        return 'bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-200 border-rose-400/40 shadow-lg shadow-rose-500/10';
      case 'insight':
        return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-200 border-amber-400/40 shadow-lg shadow-amber-500/10';
      default:
        return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-200 border-blue-400/40 shadow-lg shadow-blue-500/10';
    }
  };

  const getTypeLabel = (type: Trend['type']) => {
    switch (type) {
      case 'positive':
        return 'Positivo';
      case 'negative':
        return 'Atenção';
      case 'insight':
        return 'Insight';
      default:
        return 'Neutro';
    }
  };



  return (
    <Card className="glass-card border-white/10 overflow-hidden bg-gradient-to-br from-slate-900/50 via-slate-800/40 to-slate-900/50 backdrop-blur-3xl shadow-2xl ring-1 ring-white/5">
      <CardHeader className="bg-gradient-to-r from-white/[0.08] via-white/[0.06] to-white/[0.08] border-b border-white/10 backdrop-blur-xl relative overflow-hidden">
        {/* Efeito de brilho animado no header */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 5,
            ease: "easeInOut"
          }}
        />
        
        {/* Partículas decorativas */}
        <div className="absolute top-2 right-4 w-2 h-2 bg-blue-400/40 rounded-full blur-sm animate-pulse"></div>
        <div className="absolute top-6 right-12 w-1.5 h-1.5 bg-purple-400/40 rounded-full blur-sm animate-pulse delay-75"></div>
        <div className="absolute top-4 right-20 w-1 h-1 bg-cyan-400/40 rounded-full blur-sm animate-pulse delay-150"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <motion.div 
            className="p-3.5 bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-fuchsia-500/20 rounded-2xl border border-blue-400/40 shadow-xl shadow-blue-500/25 backdrop-blur-sm relative overflow-hidden group"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {/* Brilho interno no hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <TrendingUp className="w-7 h-7 text-blue-100 relative z-10" />
          </motion.div>
          <div>
            <CardTitle className="text-2xl text-white font-semibold tracking-tight flex items-center gap-2">
              Análise de Tendências
              <Sparkles className="w-5 h-5 text-yellow-300/70 animate-pulse" />
            </CardTitle>
            <CardDescription className="text-slate-300 text-sm mt-1 font-light tracking-wide">
              Insights personalizados baseados nos seus dados
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-5">
        {trends.map((trend, index) => (
            <motion.div
              key={trend.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.08, 
                duration: 0.5,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ scale: 1.01 }}
            >
              <div 
                className={`
                  relative p-6 rounded-2xl border border-white/10
                  bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-white/[0.02]
                  hover:from-white/[0.10] hover:via-white/[0.06] hover:to-white/[0.03]
                  hover:border-white/20 hover:shadow-2xl hover:shadow-black/30
                  transition-all duration-500 ease-out
                  backdrop-blur-md
                  group
                  overflow-hidden
                `}
              >
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full"></div>
                
                {/* Barra lateral elegante com gradiente e glow */}
                <div className={`
                  absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl
                  bg-gradient-to-b ${trend.color} 
                  shadow-lg group-hover:w-2 transition-all duration-300
                `} />
                
                {/* Sombra interna sutil */}
                <div className="absolute inset-0 rounded-2xl shadow-inner shadow-black/10 pointer-events-none"></div>

                <div className="pl-4 relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-4">
                      {/* Ícone com background gradiente */}
                      <div className="relative">
                        <div className={`
                          absolute inset-0 bg-gradient-to-br ${trend.color} 
                          rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity
                        `}></div>
                        <div className="relative text-4xl filter drop-shadow-2xl">
                          {trend.icon}
                        </div>
                      </div>
                      
                      <h4 className="font-semibold text-white text-xl tracking-tight leading-tight">
                        {trend.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.08 + 0.2, type: "spring" }}
                      >
                        <Badge 
                          variant="outline" 
                          className={`${getTypeBadgeColor(trend.type)} text-xs font-medium backdrop-blur-sm px-3 py-1`}
                        >
                          <span className="mr-1.5">{getTypeIcon(trend.type)}</span>
                          {getTypeLabel(trend.type)}
                        </Badge>
                      </motion.div>
                    </div>
                  </div>

                  {/* Separador elegante */}
                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4"></div>

                  {/* Descrição */}
                  <p className="text-base text-slate-100 mb-5 leading-relaxed tracking-wide font-light">
                    {trend.description}
                  </p>

                  {/* Recomendação */}
                  {trend.recommendation && (
                    <motion.div 
                      className="mt-5 p-5 bg-gradient-to-br from-blue-500/[0.12] via-purple-500/[0.08] to-fuchsia-500/[0.06] rounded-xl border border-blue-400/25 backdrop-blur-md shadow-lg shadow-blue-500/5 relative overflow-hidden group/rec"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ delay: index * 0.08 + 0.4 }}
                    >
                      {/* Brilho sutil de fundo */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/rec:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="flex items-start gap-4 relative z-10">
                        <motion.div 
                          className="p-2.5 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-lg shadow-lg shadow-blue-500/20 border border-blue-400/30"
                          whileHover={{ rotate: 15, scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <Lightbulb className="w-5 h-5 text-blue-200 flex-shrink-0" />
                        </motion.div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-blue-200 mb-2.5 uppercase tracking-widest flex items-center gap-2">
                            <span>💡</span>
                            <span>Recomendação Personalizada</span>
                          </p>
                          <p className="text-sm text-slate-50 leading-relaxed tracking-wide font-light">
                            {trend.recommendation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

        {/* Separador decorativo */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="px-4 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-slate-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Footer com estatísticas - Design Minimalista */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="grid grid-cols-3 gap-8 text-center">
            {/* Positivos */}
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-400/20">
                <TrendingUp className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  {trends.filter(t => t.type === 'positive').length}
                </div>
                <div className="text-sm text-slate-400 mt-1">Positivos</div>
              </div>
            </div>

            {/* Insights */}
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-400/20">
                <Lightbulb className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  {trends.filter(t => t.type === 'insight').length}
                </div>
                <div className="text-sm text-slate-400 mt-1">Insights</div>
              </div>
            </div>

            {/* Atenção */}
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-400/20">
                <Info className="w-6 h-6 text-rose-300" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  {trends.filter(t => t.type === 'negative').length}
                </div>
                <div className="text-sm text-slate-400 mt-1">Atenção</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mensagem final premium */}
        <motion.div 
          className="text-center mt-8 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-white/[0.03] via-white/[0.05] to-white/[0.03] rounded-full border border-white/10 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: trends.length * 0.08 + 0.7 }}
        >
          <motion.div 
            className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-lg shadow-blue-400/50"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-sm text-slate-300 font-light tracking-wide">
            Análise baseada em <span className="font-semibold text-white">algoritmos inteligentes</span> nos seus dados
          </span>
          <motion.div 
            className="w-2 h-2 bg-gradient-to-r from-purple-400 to-fuchsia-400 rounded-full shadow-lg shadow-purple-400/50"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
        </motion.div>
      </CardContent>
    </Card>
  );
}

