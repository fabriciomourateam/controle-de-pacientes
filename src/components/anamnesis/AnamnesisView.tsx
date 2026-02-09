import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ClipboardList, MapPin, Target, Heart, Utensils, Clock, 
  Dumbbell, MessageSquare, ChevronDown, ChevronUp 
} from 'lucide-react';
import { anamnesisService, type PatientAnamnesis, type AnamnesisData } from '@/lib/anamnesis-service';

interface AnamnesisViewProps {
  patientId: string;
}

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon: Icon, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200/80 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-slate-800 text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export function AnamnesisView({ patientId }: AnamnesisViewProps) {
  const [anamnesis, setAnamnesis] = useState<PatientAnamnesis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await anamnesisService.getByPatientId(patientId);
        setAnamnesis(data);
      } catch (error) {
        console.error('Erro ao carregar anamnese:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId]);

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!anamnesis) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-500" />
            Anamnese
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-sm">Nenhuma anamnese cadastrada para este paciente.</p>
        </CardContent>
      </Card>
    );
  }

  const d = anamnesis.data;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-500" />
            Anamnese
          </CardTitle>
          <Badge variant="outline" className="text-xs text-slate-500">
            {new Date(anamnesis.created_at).toLocaleDateString('pt-BR')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Dados Pessoais Extras */}
        {(d.instagram || d.idade) && (
          <Section title="Dados Pessoais" icon={ClipboardList} defaultOpen>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
              <Field label="Instagram" value={d.instagram} />
              <Field label="Idade" value={d.idade ? `${d.idade} anos` : undefined} />
            </div>
          </Section>
        )}

        {/* Endereço */}
        {(d.rua || d.cidade || d.cep) && (
          <Section title="Endereço" icon={MapPin}>
            <div className="pt-3">
              <p className="text-sm text-slate-700">
                {[d.rua, d.numero && `nº ${d.numero}`, d.bairro, d.cidade, d.estado, d.cep].filter(Boolean).join(', ')}
              </p>
            </div>
          </Section>
        )}

        {/* Objetivos */}
        <Section title="Histórico e Objetivos" icon={Target}>
          <div className="space-y-3 pt-3">
            <Field label="Onde conheceu" value={d.onde_conheceu} />
            <Field label="Objetivo detalhado" value={d.objetivo_detalhado} />
            <Field label="Relato sobre o objetivo" value={d.relato_objetivo} />
            <Field label="Já foi em nutricionista" value={d.ja_foi_nutricionista} />
            <Field label="O que funcionou" value={d.o_que_funcionou} />
            <Field label="Maior dificuldade" value={d.maior_dificuldade} />
          </div>
        </Section>

        {/* Saúde */}
        <Section title="Saúde e Restrições" icon={Heart}>
          <div className="space-y-3 pt-3">
            <Field label="Restrição alimentar" value={d.restricao_alimentar} />
            <Field label="Alergia / Intolerância" value={d.alergia_intolerancia} />
            <Field label="Tabagismo" value={d.fuma} />
            <Field label="Bebida alcoólica" value={d.bebida_alcoolica} />
            <Field label="Problema de saúde" value={d.problema_saude} />
            <Field label="Medicamento contínuo" value={d.medicamento_continuo} />
            <Field label="Uso hormonal" value={d.uso_hormonal} />
            <Field label="Protocolo hormonal" value={d.protocolo_hormonal} />
            <Field label="Interesse hormonal" value={d.interesse_hormonal} />
            <Field label="Ciclo menstrual" value={d.ciclo_menstrual} />
            <Field label="TPM" value={d.tpm} />
            <Field label="Método contraceptivo" value={d.metodo_contraceptivo} />
          </div>
        </Section>

        {/* Alimentação */}
        <Section title="Hábitos Alimentares" icon={Utensils}>
          <div className="space-y-3 pt-3">
            <Field label="Moradia / Compras" value={d.mora_com_quantas_pessoas} />
            <Field label="Cozinha" value={d.habito_cozinhar} />
            <Field label="Alimentos que não gosta" value={d.alimentos_nao_gosta} />
            <Field label="Problemas com alimentos" value={d.problema_alimentos_especificos} />
            <Field label="Preferência carboidratos" value={d.preferencia_carboidratos} />
            <Field label="Preferência proteínas" value={d.preferencia_proteinas} />
            <Field label="Preferência frutas" value={d.preferencia_frutas} />
            <Field label="Horário de mais fome" value={d.hora_mais_fome} />
            <Field label="Apetite" value={d.apetite} />
            <Field label="Mastigação" value={d.mastigacao} />
            <Field label="Alimentos que faz questão" value={d.alimentos_faz_questao} />
            <Field label="Hábito intestinal" value={d.habito_intestinal} />
            <Field label="Hábito urinário" value={d.habito_urinario} />
            <Field label="Suplementos" value={d.suplementos} />
            <Field label="Litros de água/dia" value={d.litros_agua} />
          </div>
        </Section>

        {/* Rotina */}
        <Section title="Rotina" icon={Clock}>
          <div className="space-y-3 pt-3">
            <Field label="Horário estudo" value={d.horario_estudo} />
            <Field label="Horário trabalho" value={d.horario_trabalho} />
            <Field label="Trabalha em pé ou sentado" value={d.trabalha_pe_sentado} />
            <Field label="Tempo em pé" value={d.tempo_em_pe} />
            <Field label="Horário treino" value={d.horario_treino} />
            <Field label="Acorda" value={d.horario_acordar} />
            <Field label="Dorme" value={d.horario_dormir} />
            <Field label="Horas de sono" value={d.horas_sono} />
            <Field label="Qualidade do sono" value={d.qualidade_sono} />
            <Field label="Hábito de café" value={d.habito_cafe} />
            <Field label="Café sem açúcar" value={d.cafe_sem_acucar} />
            <Field label="Alimentação fim de semana" value={d.alimentacao_fim_semana} />
            <Field label="Leva refeições" value={d.levar_refeicoes_trabalho} />
            <Field label="Pesa refeições" value={d.pesar_refeicoes} />
          </div>
        </Section>

        {/* Refeições */}
        <Section title="Refeições" icon={Utensils}>
          <div className="space-y-3 pt-3">
            {[1,2,3,4,5,6].map(n => {
              const numStr = n.toString().padStart(2, '0');
              const ref = (d as any)[`refeicao_${numStr}`];
              const hor = (d as any)[`horario_refeicao_${numStr}`];
              if (!ref && !hor) return null;
              return (
                <div key={n} className="bg-slate-50 rounded-lg p-3">
                  <span className="text-xs font-semibold text-slate-600">Refeição {numStr}</span>
                  {hor && <p className="text-xs text-blue-600 mt-0.5">{hor}</p>}
                  {ref && <p className="text-sm text-slate-700 mt-1">{ref}</p>}
                </div>
              );
            })}
          </div>
        </Section>

        {/* Treinos */}
        <Section title="Treinos e Atividade Física" icon={Dumbbell}>
          <div className="space-y-3 pt-3">
            <Field label="Atividades físicas" value={d.atividades_fisicas} />
            <Field label="Horas/dia de treino" value={d.horas_treino_dia} />
            <Field label="Treina há quanto tempo" value={d.tempo_treinando} />
            <Field label="Treina em jejum" value={d.treina_jejum} />
            <Field label="Já treinou em jejum" value={d.ja_treinou_jejum} />
            <Field label="Frequência musculação" value={d.frequencia_musculacao} />
            <Field label="Recuperação pós-treino" value={d.recuperacao_pos_treino} />
            <Field label="Disponibilidade musculação" value={d.disponibilidade_musculacao} />
            <Field label="Divisão de treino" value={d.divisao_treino} />
            <Field label="Exercícios/grupo" value={d.exercicios_por_grupo} />
            <Field label="Séries/exercício" value={d.series_por_exercicio} />
            <Field label="Repetições/série" value={d.repeticoes_por_serie} />
            <Field label="Prioridade muscular" value={d.prioridade_muscular} />
            <Field label="Lesões" value={d.lesoes} />
            <Field label="Aeróbico dias/semana" value={d.aerobico_dias_semana} />
            <Field label="Tempo aeróbico" value={d.tempo_aerobico} />
            <Field label="Aeróbico preferido" value={d.aerobico_preferido} />
          </div>
        </Section>

        {/* Observações */}
        {(d.observacao_alimentar || d.observacao_treinos || d.indicacoes_amigos) && (
          <Section title="Observações Finais" icon={MessageSquare}>
            <div className="space-y-3 pt-3">
              <Field label="Observações alimentar" value={d.observacao_alimentar} />
              <Field label="Observações treinos" value={d.observacao_treinos} />
              <Field label="Indicações" value={d.indicacoes_amigos} />
            </div>
          </Section>
        )}
      </CardContent>
    </Card>
  );
}
