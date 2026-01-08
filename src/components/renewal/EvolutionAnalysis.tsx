import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Star, Trophy, Target, Zap } from 'lucide-react';
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

interface EvolutionAnalysisProps {
  patient: Patient;
  checkins: CheckinData[];
  firstCheckin: CheckinData | null;
  lastCheckin: CheckinData | null;
  isPublicAccess?: boolean;
}

export function EvolutionAnalysis({ 
  patient, 
  checkins, 
  firstCheckin, 
  lastCheckin,
  isPublicAccess = false
}: EvolutionAnalysisProps) {
  
  const patientName = patient.nome.split(' ')[0];

  const getAchievements = () => {
    const achievements = [];
    
    // Analisar evolução de peso
    if (firstCheckin?.peso && lastCheckin?.peso) {
      const firstWeight = parseFloat(firstCheckin.peso.replace(',', '.'));
      const lastWeight = parseFloat(lastCheckin.peso.replace(',', '.'));
      const diff = lastWeight - firstWeight;
      
      if (diff < -2) {
        achievements.push({
          title: "Redução de Peso Consistente",
          description: `Você conseguiu uma redução saudável de ${Math.abs(diff).toFixed(1)}kg, mantendo massa magra. Isso é recomposição corporal de verdade!`
        });
      } else if (diff > 2) {
        achievements.push({
          title: "Ganho de Massa Magra",
          description: `Ganhou ${diff.toFixed(1)}kg de forma inteligente, priorizando músculo. Seu shape está mais definido e funcional.`
        });
      }
    }

    // Analisar medidas
    if (firstCheckin?.medida && lastCheckin?.medida) {
      const firstMeasures = firstCheckin.medida.match(/\d+/g);
      const lastMeasures = lastCheckin.medida.match(/\d+/g);
      
      if (firstMeasures && lastMeasures && firstMeasures.length >= 2 && lastMeasures.length >= 2) {
        const waistDiff = parseInt(lastMeasures[0]) - parseInt(firstMeasures[0]);
        if (waistDiff < -3) {
          achievements.push({
            title: "Cintura Mais Definida",
            description: `Reduziu ${Math.abs(waistDiff)}cm na cintura! Isso mostra que você perdeu gordura visceral e ganhou definição abdominal.`
          });
        }
      }
    }

    // Constância nos check-ins
    if (checkins.length >= 8) {
      achievements.push({
        title: "Constância Exemplar",
        description: `${checkins.length} check-ins mostram sua disciplina. Você entendeu que resultado vem de processo, não de pressa.`
      });
    }

    // Adicionar conquistas padrão se não houver dados suficientes
    if (achievements.length === 0) {
      achievements.push(
        {
          title: "Transformação Física Visível",
          description: "Sua evolução nas fotos é impressionante. Mais definição, melhor postura e um shape muito mais harmônico."
        },
        {
          title: "Disciplina e Foco",
          description: "Você abraçou o processo e seguiu as orientações. Isso fez toda a diferença na sua transformação."
        }
      );
    }

    return achievements.slice(0, 3); // Máximo 3 conquistas
  };

  const getImprovementAreas = () => {
    return [
      {
        title: "Definição Muscular",
        description: "Você já tem uma base sólida. Agora podemos focar em secar mais e destacar cada grupo muscular."
      },
      {
        title: "Posterior e Glúteos",
        description: "Área com muito potencial para crescer. Vamos trabalhar volume e formato para equilibrar ainda mais seu físico."
      },
      {
        title: "Abdômen e Core",
        description: "Já melhorou muito, mas ainda dá para refinar. Menos gordura localizada e mais definição dos músculos."
      }
    ];
  };

  const getHighlights = () => {
    return [
      {
        title: "Mindset de Atleta",
        description: "Você desenvolveu uma mentalidade vencedora. Não desiste, não arruma desculpa, só faz acontecer.",
        icon: <Trophy className="w-5 h-5 text-yellow-400" />
      },
      {
        title: "Recomposição Corporal",
        description: "Conseguiu o que muitos não conseguem: perder gordura e ganhar músculo ao mesmo tempo.",
        icon: <Target className="w-5 h-5 text-blue-400" />
      },
      {
        title: "Evolução Acelerada",
        description: "Seu corpo respondeu muito bem ao protocolo. Você tem genética favorável e soube aproveitá-la.",
        icon: <Zap className="w-5 h-5 text-purple-400" />
      }
    ];
  };

  const generateAchievementsContent = () => {
    const achievements = getAchievements();
    return `
      <div class="space-y-4">
        ${achievements.map(achievement => `
          <div class="bg-green-900/20 rounded-lg p-4 border border-green-700/30">
            <h4 class="font-semibold text-green-300 mb-2">${achievement.title}</h4>
            <p class="text-green-100 text-sm leading-relaxed">${achievement.description}</p>
          </div>
        `).join('')}
      </div>
    `;
  };

  const generateImprovementAreasContent = () => {
    const improvementAreas = getImprovementAreas();
    return `
      <div class="space-y-4">
        ${improvementAreas.map(area => `
          <div class="bg-yellow-900/20 rounded-lg p-4 border border-yellow-700/30">
            <h4 class="font-semibold text-yellow-300 mb-2">${area.title}</h4>
            <p class="text-yellow-100 text-sm leading-relaxed">${area.description}</p>
          </div>
        `).join('')}
      </div>
    `;
  };

  const generateHighlightsContent = () => {
    const highlights = getHighlights();
    return `
      <div class="space-y-4">
        ${highlights.map(highlight => `
          <div class="bg-purple-900/20 rounded-lg p-4 border border-purple-700/30">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-5 h-5 text-purple-400">⭐</div>
              <h4 class="font-semibold text-purple-300">${highlight.title}</h4>
            </div>
            <p class="text-purple-100 text-sm leading-relaxed">${highlight.description}</p>
          </div>
        `).join('')}
      </div>
    `;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conquistas Alcançadas */}
      <EditableRenewalSection
        patientTelefone={patient.telefone}
        sectionKey="achievements_content"
        title="Conquistas Alcançadas"
        icon={<CheckCircle className="w-6 h-6 text-green-400" />}
        defaultContent={generateAchievementsContent()}
        placeholder="Digite as conquistas personalizadas do paciente..."
        cardClassName="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/50"
        isPublicAccess={isPublicAccess}
      />

      {/* Próximos Objetivos */}
      <EditableRenewalSection
        patientTelefone={patient.telefone}
        sectionKey="improvement_areas_content"
        title="Próximos Objetivos"
        icon={<AlertCircle className="w-6 h-6 text-yellow-400" />}
        defaultContent={generateImprovementAreasContent()}
        placeholder="Digite os próximos objetivos personalizados..."
        cardClassName="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border-yellow-700/50"
        isPublicAccess={isPublicAccess}
      />

      {/* Destaques da Evolução */}
      <EditableRenewalSection
        patientTelefone={patient.telefone}
        sectionKey="highlights_content"
        title="Destaques da Evolução"
        icon={<Star className="w-6 h-6 text-purple-400" />}
        defaultContent={generateHighlightsContent()}
        placeholder="Digite os destaques personalizados da evolução..."
        cardClassName="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700/50"
        isPublicAccess={isPublicAccess}
      />
    </div>
  );
}