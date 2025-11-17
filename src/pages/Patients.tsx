import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PatientsListNew } from "@/components/patients/PatientsListNew";

export default function Patients() {
  return (
    <DashboardLayout>
      <PatientsListNew />
    </DashboardLayout>
  );
}