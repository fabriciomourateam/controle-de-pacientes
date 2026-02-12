import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AnamnesisFlowEditor } from "@/components/admin/AnamnesisFlowEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AnamnesisFlowEditorPage() {
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
                            Editor de Anamnese
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Personalize as seções e campos do formulário de anamnese para seus pacientes
                        </p>
                    </div>
                </div>

                <AnamnesisFlowEditor />
            </div>
        </DashboardLayout>
    );
}
