import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FlowEditor } from "@/components/admin/FlowEditor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CheckinFlowEditorPage() {
    const navigate = useNavigate();

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/dashboard')}
                        className="text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            Editor de Check-in
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Personalize as perguntas e o tema do check-in para seus pacientes
                        </p>
                    </div>
                </div>

                <FlowEditor />
            </div>
        </DashboardLayout>
    );
}
