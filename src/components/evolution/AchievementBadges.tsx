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
    <Card className="glass-card border-slate-700 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-pink-500/10 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Conquistas Desbloqueadas</CardTitle>
            <CardDescription>
              {achievements.length} {achievements.length === 1 ? 'conquista alcançada' : 'conquistas alcançadas'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {Object.entries(groupedAchievements).map(([type, typeAchievements], groupIndex) => {
          const typeInfo = typeLabels[type as keyof typeof typeLabels];
          const IconComponent = typeInfo.icon;

          return (
            <div key={type} className="space-y-3">
              <div className="flex items-center gap-2">
                <IconComponent className={`w-5 h-5 ${typeInfo.color}`} />
                <h3 className="font-semibold text-slate-200">{typeInfo.label}</h3>
                <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                  {typeAchievements.length}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {typeAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      delay: (groupIndex * 0.1) + (index * 0.05),
                      duration: 0.4,
                      type: 'spring',
                      stiffness: 100
                    }}
                  >
                    <div 
                      className={`
                        relative p-4 rounded-lg border border-slate-700
                        bg-gradient-to-br ${achievement.color} bg-opacity-10
                        hover:scale-105 transition-transform duration-200
                        cursor-pointer group
                      `}
                    >
                      {/* Brilho de fundo */}
                      <div className={`
                        absolute inset-0 rounded-lg bg-gradient-to-br ${achievement.color} 
                        opacity-0 group-hover:opacity-20 transition-opacity duration-300
                      `} />

                      {/* Conteúdo */}
                      <div className="relative">
                        <div className="flex items-start gap-3">
                          {/* Ícone grande */}
                          <div className={`
                            text-4xl flex-shrink-0
                            drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]
                            group-hover:scale-110 transition-transform duration-200
                          `}>
                            {achievement.icon}
                          </div>

                          {/* Texto */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-sm mb-1 leading-tight">
                              {achievement.title}
                            </h4>
                            <p className="text-xs text-slate-300 leading-tight">
                              {achievement.description}
                            </p>
                            
                            {achievement.dateAchieved && (
                              <p className="text-[10px] text-slate-400 mt-2">
                                {new Date(achievement.dateAchieved).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Badge "Novo" para conquistas recentes (últimos 7 dias) */}
                        {achievement.dateAchieved && 
                         (new Date().getTime() - achievement.dateAchieved.getTime()) < 7 * 24 * 60 * 60 * 1000 && (
                          <div className="absolute top-0 right-0">
                            <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] px-2 py-0.5">
                              NOVO
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Mensagem motivacional */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
          <p className="text-center text-sm text-slate-300">
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Continue assim! 
            </span>
            {' '}Cada conquista é uma prova do seu esforço e dedicação. 💪✨
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

