import { Card, CardContent } from '@/components/ui/card';
import { EditableRenewalSection } from './EditableRenewalSection';

interface EditableMotivationalCardProps {
  patient: any;
  isPublicAccess?: boolean;
}

export function EditableMotivationalCard({ patient, isPublicAccess = false }: EditableMotivationalCardProps) {
  const defaultContent = `
    <div class="text-center">
      <h4 class="text-xl font-bold text-white mb-3">
        Sua Transformação é Visível! 🔥
      </h4>
      <p class="text-slate-300">
        As fotos não mentem - sua dedicação e esforço estão claramente refletidos na sua evolução física. 
        Continue assim que os resultados só vão melhorar!
      </p>
    </div>
  `;

  return (
    <Card className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
      <CardContent className="pt-6">
        <EditableRenewalSection
          sectionKey="motivational_message"
          patientPhone={patient?.telefone}
          defaultContent={defaultContent}
          isPublicAccess={isPublicAccess}
          className="min-h-[100px]"
        />
      </CardContent>
    </Card>
  );
}