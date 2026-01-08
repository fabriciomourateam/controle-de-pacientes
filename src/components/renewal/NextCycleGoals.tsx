import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Rocket, Flame, Sparkles, Calendar, TrendingUp } from 'lucide-react';
import { EditableRenewalSection } from './EditableRenewalSection';

interface Patient {
  id: string;
  nome: string;
  telefone: string;
  created_at: string;
}

interface CheckinData {
  id: string;
  peso: string;
  medida: string;
  data_checkin: string;
  created_at: string;
}

interface NextCycleGoalsProps {
  patient: Patient;
  checkins: CheckinData[];
  lastCheckin: CheckinData | null;
  isPublicAccess?: boolean;
}

export function NextCycleGoals({ 
  patient, 
  checkins, 
  lastCheckin,
  isPublicAccess = false
}: NextCycleGoalsProps) {
  
  const patientName = patient.nome.split(' ')[0];

  const generatePersonalizedGoals = () => {
    const goals = [];
    
    // Analisar peso atual para definir metas
    if (lastCheckin?.peso) {
      const currentWeight = parseFloat(lastCheckin.peso.replace(',', '.'));
      
      if (currentWeight > 80) {
        goals.push({
          title: "Recomposição Corporal Avançada",
          description: "Ganhar 2-3kg de massa magra mantendo a cintura atual. Foco em volume muscular com definição.",
          timeline: "6-8 meses",
          icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
          iconEmoji: "📈",
          color: "from-blue-500/10 to-blue-600/10 border-blue-500/20"
        });
      } else {
        goals.push({
          title: "Ganho de Massa Magra",
          description: "Aumentar 3-4kg de músculo de qualidade. Seu corpo está pronto para crescer com inteligência.",
          timeline: "8-10 meses",
          icon: <Rocket className="w-5 h-5 text-green-400" />,
          iconEmoji: "🚀",
          color: "from-green-500/10 to-green-600/10 border-green-500/20"
        });
      }
    }

    // Analisar medidas para definir metas específicas
    if (lastCheckin?.medida) {
      const measures = lastCheckin.medida.match(/\d+/g);
      if (measures && measures.length >= 2) {
        const waist = parseInt(measures[0]);
        
        if (waist > 85) {
          goals.push({
            title: "Definição Abdominal",
            description: "Reduzir mais 3-4cm na cintura com foco em gordura visceral. Abdômen mais definido e funcional.",
            timeline: "4-6 meses",
            icon: <Target className="w-5 h-5 text-yellow-400" />,
            iconEmoji: "🎯",
            color: "from-yellow-500/10 to-yellow-600/10 border-yellow-500/20"
          });
        } else {
          goals.push({
            title: "Refinamento do Shape",
            description: "Manter a cintura e focar em definição muscular. Cada músculo mais evidente e simétrico.",
            timeline: "6-8 meses",
            icon: <Sparkles className="w-5 h-5 text-purple-400" />,
            iconEmoji: "✨",
            color: "from-purple-500/10 to-purple-600/10 border-purple-500/20"
          });
        }
      }
    }

    // Meta de performance/funcionalidade
    goals.push({
      title: "Performance e Força",
      description: "Aumentar força em 20-30% nos exercícios principais. Corpo mais forte, mais resistente e funcional.",
      timeline: "3-6 meses",
      icon: <Flame className="w-5 h-5 text-red-400" />,
      iconEmoji: "🔥",
      color: "from-red-500/10 to-red-600/10 border-red-500/20"
    });

    return goals.slice(0, 3); // Máximo 3 metas
  };

  const getMotivationalMessage = () => {
    return `${patientName}, você chegou até aqui porque tem algo que a maioria não tem: persistência e visão de longo prazo.

    O que conquistou foi só o aquecimento. Agora que seu corpo já entendeu o processo, que sua mente já está disciplinada e que você já provou para si mesmo que é capaz, é hora de ir para o próximo nível.

    Não estou falando de mudanças radicais. Estou falando de refinamento, de pegar tudo que você já construiu e levar para um patamar que vai te surpreender.

    Você está muito perto do físico que sempre quis. Muito perto mesmo. E eu sei exatamente como te levar até lá.`;
  };

  const generateGoalsContent = () => {
    const goals = generatePersonalizedGoals();
    const motivationalMessage = getMotivationalMessage();
    
    return `
      <!-- Mensagem motivacional -->
      <div class="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-6 border border-green-500/20 mb-8">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-5 h-5 text-green-400">🎯</div>
          <h3 class="font-semibold text-white">Agora é Hora de Refinar o Shape</h3>
        </div>
        <div class="text-slate-200 leading-relaxed whitespace-pre-line">
          ${motivationalMessage}
        </div>
      </div>

      <!-- Metas específicas -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${goals.map(goal => `
          <div class="bg-gradient-to-br ${goal.color} rounded-lg p-6 border">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-5 h-5">${goal.iconEmoji}</div>
              <h4 class="font-semibold text-white">${goal.title}</h4>
            </div>
            <p class="text-slate-200 text-sm leading-relaxed mb-4">${goal.description}</p>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 text-slate-400">📅</div>
              <span class="text-slate-300 text-sm font-medium">${goal.timeline}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Call to action -->
      <div class="mt-8 p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
        <div class="text-center">
          <h3 class="text-xl font-bold text-white mb-2">Você Está Pronto para o Próximo Nível? 🔥</h3>
          <p class="text-slate-300 mb-4">
            Essas metas não são sonhos. São objetivos realistas baseados na sua evolução atual. 
            Você já provou que consegue, agora é só continuar o processo.
          </p>
          <div class="flex items-center justify-center gap-2 text-yellow-400">
            <span class="text-2xl">✨</span>
            <span class="font-semibold">Vamos juntos conquistar cada uma dessas metas!</span>
            <span class="text-2xl">✨</span>
          </div>
        </div>
      </div>
    `;
  };

  const goals = generatePersonalizedGoals();

  return (
    <EditableRenewalSection
      patientTelefone={patient.telefone}
      sectionKey="next_cycle_goals_content"
      title="Metas para o Próximo Ciclo"
      icon={<Rocket className="w-7 h-7 text-green-400" />}
      defaultContent={generateGoalsContent()}
      placeholder="Digite as metas personalizadas para o próximo ciclo..."
      cardClassName="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600"
      isPublicAccess={isPublicAccess}
    />
  );
}