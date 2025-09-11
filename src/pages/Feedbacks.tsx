import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FeedbacksList } from "@/components/feedbacks/FeedbacksList";

export default function Feedbacks() {
  return (
    <DashboardLayout>
      <FeedbacksList />
    </DashboardLayout>
  );
}