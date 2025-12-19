import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { EvolutionExportPage } from './EvolutionExportPage';

interface PatientData {
  nome: string;
  data_nascimento?: string | null;
  telefone?: string;
  peso_inicial?: number | string | null;
  altura_inicial?: number | string | null;
  created_at?: string;
}

interface CheckinData {
  data_checkin: string;
  peso?: string;
  medida?: string;
  treino?: string;
  cardio?: string;
  agua?: string;
  sono?: string;
  pontuacao_total?: number;
}

interface BodyCompositionData {
  date?: string;
  data_avaliacao?: string;
  bodyFat?: number | null;
  percentual_gordura?: number | null;
  muscleMass?: number | null;
  massa_muscular?: number | null;
  visceralFat?: number | null;
  gordura_visceral?: number | null;
}

interface EvolutionPDFExporterProps {
  patient: PatientData;
  checkins: CheckinData[];
  bodyCompositions?: BodyCompositionData[];
  disabled?: boolean;
}

export function EvolutionPDFExporter({ 
  patient,
  checkins,
  bodyCompositions,
  disabled = false 
}: EvolutionPDFExporterProps) {
  const [showExportPage, setShowExportPage] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setShowExportPage(true)}
        className="border-slate-600 hover:bg-slate-800 text-white min-h-[44px]"
      >
        <Download className="w-4 h-4 mr-2" />
        Exportar
      </Button>

      {showExportPage && (
        <EvolutionExportPage
          patient={patient}
          checkins={checkins}
          bodyCompositions={bodyCompositions}
          onClose={() => setShowExportPage(false)}
        />
      )}
    </>
  );
}
