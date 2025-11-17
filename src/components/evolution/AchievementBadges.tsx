import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Star, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Achievement } from '@/lib/achievement-system';

interface AchievementBadgesProps {
  achievements: Achievement[];
}

export function AchievementBadges({ achievements }: AchievementBadgesProps) {
  if (achievements.length === 0) {
    return null;
  }

  // Agrupar por tipo
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.type]) {
      acc[achievement.type] = [];
    }
    acc[achievement.type].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const typeLabels = {
    weight: { label: 'Perda de Peso', icon: Flame, color: 'text-orange-400' },
    consistency: { label: 'Consistência', icon: Star, color: 'text-blue-400' },
    performance: { label: 'Performance', icon: Zap, color: 'text-green-400' },
    body_fat: { label: 'Composição Corporal', icon: Target, color: 'text-teal-400' },
    milestone: { label: 'Marcos', icon: Trophy, color: 'text-yellow-400' }
  };

  return (
    <Card className="glass-card border-white/10 overflow-hidden bg-gradient-to-br from-slate-900/50 via-slate-800/40 to-slate-900/50 backdrop-blur-3xl shadow-2xl ring-1 ring-white/5">
      <CardHeader className="bg-gradient-to-r from-yellow-500/[0.08] via-orange-500/[0.06] to-pink-500/[0.08] border-b border-white/10 backdrop-blur-xl relative overflow-hidden">
        {/* Efeito de brilho animado */}
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
        <div className="absolute top-2 right-4 w-2 h-2 bg-yellow-400/40 rounded-full blur-sm animate-pulse"></div>
        <div className="absolute top-6 right-12 w-1.5 h-1.5 bg-orange-400/40 rounded-full blur-sm animate-pulse delay-75"></div>
        <div className="absolute top-4 right-20 w-1 h-1 bg-pink-400/40 rounded-full blur-sm animate-pulse delay-150"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <motion.div 
            className="p-3.5 bg-gradient-to-br from-yellow-500/30 via-orange-500/30 to-pink-500/20 rounded-2xl border border-yellow-400/40 shadow-xl shadow-yellow-500/25 backdrop-blur-sm relative overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Trophy className="w-7 h-7 text-yellow-100 relative z-10" />
          </motion.div>
          <div>
            <CardTitle className="text-2xl text-white font-semibold tracking-tight flex items-center gap-2">
              Conquistas Desbloqueadas
              <Star className="w-5 h-5 text-yellow-300/70 animate-pulse" />
            </CardTitle>
            <CardDescription className="text-slate-300 text-sm mt-1 font-light tracking-wide">
              {achievements.length} {achievements.length === 1 ? 'conquista alcançada' : 'conquistas alcançadas'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {Object.entries(groupedAchievements).map(([type, typeAchievements], groupIndex) => {
          const typeInfo = typeLabels[type as keyof typeof typeLabels];
          const IconComponent = typeInfo.icon;

          return (
            <motion.div 
              key={type} 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="p-2 bg-gradient-to-br from-white/10 to-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                  <IconComponent className={`w-5 h-5 ${typeInfo.color}`} />
                </div>
                <h3 className="font-semibold text-white text-lg tracking-tight">{typeInfo.label}</h3>
                <Badge variant="secondary" className="bg-white/10 text-slate-200 border-white/20 backdrop-blur-sm">
                  {typeAchievements.length}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      delay: (groupIndex * 0.1) + (index * 0.05),
                      duration: 0.5,
                      type: 'spring',
                      stiffness: 120
                    }}
                    whileHover={{ scale: 1.03, y: -4 }}
                  >
                    <div 
                      className={`
                        relative p-5 rounded-xl border
                        bg-gradient-to-br backdrop-blur-md
                        hover:shadow-2xl
                        transition-all duration-500 ease-out
                        cursor-pointer group
                        overflow-hidden
                      `}
                      style={{
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        background: `linear-gradient(135deg, 
                          rgba(255, 255, 255, 0.08) 0%, 
                          rgba(255, 255, 255, 0.04) 50%, 
                          rgba(255, 255, 255, 0.02) 100%
                        )`
                      }}
                    >
                      {/* Overlay colorido sutil */}
                      <div 
                        className={`absolute inset-0 bg-gradient-to-br ${achievement.color} opacity-[0.40] group-hover:opacity-[0.50] transition-opacity duration-500`}
                      />
                      
                      {/* Efeito de brilho no hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full"></div>
                      
                      {/* Barra lateral com cor da conquista */}
                      <div className={`
                        absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl
                        bg-gradient-to-b ${achievement.color}
                        shadow-lg group-hover:w-2 transition-all duration-300
                      `} />
                      
                      {/* Sombra interna */}
                      <div className="absolute inset-0 rounded-xl shadow-inner shadow-black/10 pointer-events-none"></div>

                      {/* Conteúdo */}
                      <div className="relative pl-3">
                        <div className="flex items-start gap-4">
                          {/* Ícone com background gradiente */}
                          <div className="relative">
                            <div className={`
                              absolute inset-0 bg-gradient-to-br ${achievement.color}
                              rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity
                            `}></div>
                            <div className="relative text-4xl filter drop-shadow-2xl">
                              {achievement.icon}
                            </div>
                          </div>

                          {/* Texto */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-base mb-2 leading-tight tracking-tight">
                              {achievement.title}
                            </h4>
                            <p className="text-sm text-slate-200 leading-relaxed font-light">
                              {achievement.description}
                            </p>
                            
                            {achievement.dateAchieved && (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-xs text-slate-400 font-light">
                                  🎉 {new Date(achievement.dateAchieved).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Badge "Novo" para conquistas recentes */}
                        {achievement.dateAchieved && 
                         (new Date().getTime() - achievement.dateAchieved.getTime()) < 7 * 24 * 60 * 60 * 1000 && (
                          <motion.div 
                            className="absolute -top-2 -right-2"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: (groupIndex * 0.1) + (index * 0.05) + 0.3, type: "spring" }}
                          >
                            <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] px-2.5 py-1 shadow-lg shadow-pink-500/50 border border-pink-400/30">
                              ✨ NOVO
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Separador decorativo */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="px-4 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-sm">
              <Trophy className="w-4 h-4 text-slate-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Mensagem motivacional premium */}
        <motion.div 
          className="p-6 bg-gradient-to-br from-purple-500/[0.12] via-pink-500/[0.08] to-fuchsia-500/[0.06] rounded-xl border border-purple-400/25 backdrop-blur-md shadow-lg shadow-purple-500/5 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Brilho de fundo */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          
          <div className="relative flex items-center justify-center gap-3">
            <div className="text-2xl">🏆</div>
            <p className="text-center text-sm text-slate-100 leading-relaxed tracking-wide font-light">
              <span className="font-semibold text-purple-200">
                Continue assim! 
              </span>
              {' '}Cada conquista é uma prova do seu esforço e dedicação.
            </p>
            <div className="text-2xl">✨</div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}

