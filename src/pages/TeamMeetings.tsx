import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeetingsList } from "@/components/meetings/MeetingsList";
import { DailyReportsList } from "@/components/meetings/DailyReportsList";
import { ActionItemsList } from "@/components/meetings/ActionItemsList";
import { Calendar, ClipboardList, CheckSquare } from "lucide-react";

export default function TeamMeetings() {
  const [activeTab, setActiveTab] = useState("daily");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Reuniões e Acompanhamento
          </h1>
          <p className="text-slate-400">
            Gerencie reuniões, acompanhamento diário e itens de ação da equipe
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Acompanhamento Diário
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Itens de Ação
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Reuniões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-6">
            <DailyReportsList />
          </TabsContent>

          <TabsContent value="actions" className="mt-6">
            <ActionItemsList />
          </TabsContent>

          <TabsContent value="meetings" className="mt-6">
            <MeetingsList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
