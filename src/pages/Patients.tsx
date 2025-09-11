import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PatientsList } from "@/components/patients/PatientsList";

export default function Patients() {
  return (
    <DashboardLayout>
      <PatientsList />
    </DashboardLayout>
  );
}