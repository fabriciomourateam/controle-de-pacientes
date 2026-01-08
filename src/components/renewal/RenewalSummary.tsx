import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EditableRenewalSection } from './EditableRenewalSection';
import { MessageSquare, Sparkles, TrendingUp, Users, Calendar, Award } from 'lucide-react';

interface Patient {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  created_at: string;
}

interface CheckinData {
  id: string;
  peso: string;
  medida: string;
  data_checkin: string;
  created_at: string;
}

interface RenewalSummaryProps {
  patient: Patient;
  checkins: CheckinData[];
  firstCheckin: CheckinData | null;
  lastCheckin: CheckinData | null;
  journeyTime: string;
  isPublicAccess?: boolean;
}

// Função para detectar gênero baseado no nome
const detectGender = (nome: string): 'masculino' | 'feminino' | 'neutro' => {
  const nomeNormalizado = nome.toLowerCase().trim();
  const primeiroNome = nomeNormalizado.split(' ')[0];
  
  // Terminações tipicamente femininas
  const terminacoesFemininas = ['a', 'ana', 'ina', 'ela', 'lia', 'ria', 'isa', 'esa'];
  // Nomes tipicamente femininos
  const nomesFemininos = [
    'maria', 'ana', 'joana', 'carla', 'paula', 'julia', 'lucia', 'patricia',
    'fernanda', 'amanda', 'sandra', 'claudia', 'monica', 'andrea', 'cristina',
    'daniela', 'gabriela', 'isabela', 'mariana', 'carolina', 'beatriz', 'leticia',
    'vanessa', 'priscila', 'fabiana', 'adriana', 'simone', 'renata', 'camila',
    'bianca', 'larissa', 'natalia', 'sabrina', 'viviane', 'michele', 'roberta',
    'fabiola', 'luana', 'tatiana', 'eliane', 'rosana', 'solange', 'denise'
  ];
  
  // Verificar se é nome tipicamente feminino
  if (nomesFemininos.includes(primeiroNome)) {
    return 'feminino';
  }
  
  // Verificar terminações femininas
  if (terminacoesFemininas.some(term => primeiroNome.endsWith(term))) {
    return 'feminino';
  }
  
  // Nomes tipicamente masculinos
  const nomesMasculinos = [
    'joao', 'jose', 'antonio', 'francisco', 'carlos', 'paulo', 'pedro', 'lucas',
    'luiz', 'marcos', 'luis', 'gabriel', 'rafael', 'daniel', 'marcelo', 'bruno',
    'eduardo', 'felipe', 'raimundo', 'rodrigo', 'manoel', 'nelson', 'roberto',
    'fernando', 'sergio', 'alberto', 'joao', 'jorge', 'ricardo', 'flavio',
    'alessandro', 'fabricio', 'andre', 'diego', 'thiago', 'leonardo', 'gustavo'
  ];
  
  if (nomesMasculinos.includes(primeiroNome)) {
    return 'masculino';
  }
  
  // Se não conseguir determinar, usar neutro
  return 'neutro';
};

export function RenewalSummary({ 
  patient, 
  checkins, 
  firstCheckin, 
  lastCheckin, 
  journeyTime,
  isPublicAccess = false
}: RenewalSummaryProps) {
  
  const generatePersonalizedSummary = () => {
    const patientName = patient.nome.split(' ')[0]; // Primeiro nome
    const totalCheckins = checkins.length;
    const gender = detectGender(patient.nome);
    
    // Palavras que mudam com o gênero
    const gendered = {
      perdido: gender === 'feminino' ? 'perdida' : 'perdido',
      disciplinado: gender === 'feminino' ? 'disciplinada' : 'disciplinado',
      focado: gender === 'feminino' ? 'focada' : 'focado',
      outro: gender === 'feminino' ? 'outra' : 'outro'
    };
    
    // Calcular evolução de peso se disponível
    let weightEvolution = '';
    if (firstCheckin?.peso && lastCheckin?.peso) {
      const firstWeight = parseFloat(firstCheckin.peso.replace(',', '.'));
      const lastWeight = parseFloat(lastCheckin.peso.replace(',', '.'));
      const diff = lastWeight - firstWeight;
      
      if (diff > 0) {
        weightEvolution = `ganhou ${Math.abs(diff).toFixed(1)}kg`;
      } else if (diff < 0) {
        weightEvolution = `perdeu ${Math.abs(diff).toFixed(1)}kg`;
      } else {
        weightEvolution = 'manteve o peso';
      }
    }

    // Calcular evolução de medidas se disponível
    let measurementEvolution = '';
    if (firstCheckin?.medida && lastCheckin?.medida) {
      // Extrair números das medidas (assumindo formato "cintura X quadril Y")
      const firstMeasures = firstCheckin.medida.match(/\d+/g);
      const lastMeasures = lastCheckin.medida.match(/\d+/g);
      
      if (firstMeasures && lastMeasures && firstMeasures.length >= 2 && lastMeasures.length >= 2) {
        const waistDiff = parseInt(lastMeasures[0]) - parseInt(firstMeasures[0]);
        if (waistDiff < 0) {
          measurementEvolution = ` e reduziu ${Math.abs(waistDiff)}cm na cintura`;
        } else if (waistDiff > 0) {
          measurementEvolution = ` e ganhou ${waistDiff}cm na cintura`;
        }
      }
    }

    return `<p>Olha só, <strong>${patientName}</strong>! Que jornada incrível você teve nesses <strong>${journeyTime}</strong>.</p>
    
    <p>Quando começamos, eu sabia que você tinha potencial, mas confesso que você me surpreendeu. Em <strong>${totalCheckins} check-ins</strong>, você mostrou uma constância que poucos têm. ${weightEvolution ? `Você <strong>${weightEvolution}</strong>${measurementEvolution}` : 'Sua evolução física foi notável'}, mas o que mais me impressiona é como você se tornou mais <strong>${gendered.disciplinado}</strong> e <strong>${gendered.focado}</strong>.</p>

    <p>Lembro quando você chegou aqui, meio <em>${gendered.perdido}</em>, sem saber direito por onde começar. Hoje você é <strong>${gendered.outro} pessoa</strong> - não só fisicamente, mas mentalmente também. Você entendeu o processo, abraçou a metodologia e, principalmente, <strong>confiou no trabalho</strong>.</p>

    <p>Sua recomposição corporal está <strong>show</strong>! Você não só mudou números na balança, mudou a forma como seu corpo funciona. Mais massa magra, menos gordura, mais definição... isso é resultado de quem fez a coisa certa, do jeito certo, no tempo certo.</p>

    <p>E o melhor de tudo: você ainda tem <strong>muito mais potencial</strong> para explorar. O que conquistou até aqui é só o começo do que você pode alcançar.</p>`;
  };

  const defaultContent = generatePersonalizedSummary();

  return (
    <div className="space-y-8">
      {/* Seção editável da evolução */}
      <EditableRenewalSection
        patientTelefone={patient.telefone}
        sectionKey="summary_content"
        title="Sua Evolução"
        icon={<MessageSquare className="w-6 h-6 text-yellow-400" />}
        defaultContent={defaultContent}
        placeholder="Digite uma mensagem personalizada sobre a evolução do paciente..."
        isPublicAccess={isPublicAccess}
      />
      
      {/* Estatísticas visuais modernas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl p-4 border border-yellow-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {journeyTime}
              </div>
              <div className="text-sm text-slate-400">
                de jornada juntos
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {checkins.length}
              </div>
              <div className="text-sm text-slate-400">
                check-ins realizados
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Award className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400 flex items-center gap-1">
                <TrendingUp className="w-5 h-5" />
                100%
              </div>
              <div className="text-sm text-slate-400">
                comprometimento
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}