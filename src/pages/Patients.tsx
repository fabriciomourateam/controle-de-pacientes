import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PatientsListNew } from "@/components/patients/PatientsListNew";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function Patients() {
  return (
    <AuthGuard sectionName="Pacientes" sectionIcon="👥">
      <DashboardLayout>
        <PatientsListNew />
      </DashboardLayout>
    </AuthGuard>
  );
}