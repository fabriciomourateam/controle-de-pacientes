import { useEffect, useState } from "react";
import { popService } from "@/services/popService";
import { PopVersion } from "@/types/pop";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PopContent() {
    const navigate = useNavigate();
    const [version, setVersion] = useState<PopVersion | null>(null);

    useEffect(() => {
        const activeVersion = popService.getActiveVersion();
        setVersion(activeVersion);
    }, []);

    if (!version) {
        return <div className="p-8 text-center text-slate-500">Nenhum POP ativo encontrado.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/pop')} className="-ml-2 hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                    <BookOpen className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                        Procedimento Operacional Padrão (POP)
                    </h2>
                    <p className="text-slate-500 text-sm">
                        Metodologia e padronização da Consultoria Esportiva FMTeam.
                        <span className="ml-2 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            Versão Atual: {version.version}
                        </span>
                    </p>
                </div>
            </div>

            {/* Raciocínio de Montagem */}
            <Card className="border-l-4 border-l-amber-500 bg-amber-50/30">
                <CardHeader>
                    <CardTitle className="text-lg text-amber-900">Raciocínio de Montagem (Lógica Base)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-amber-900/80 space-y-3 leading-relaxed">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Montar pela <b>rotina real</b>, não pela dieta base.</li>
                        <li>Priorizar adesão antes de "perfeição".</li>
                        <li>Ajustar calorias conforme apetite ao longo do dia.</li>
                        <li>Refeições críticas (tarde/noite) merecem mais atenção e volume saciante.</li>
                        <li>Usar hábitos atuais como ponte de adesão. Não insista em alimento rejeitado.</li>
                        <li>Só usar suplemento se fizer sentido.</li>
                    </ul>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Etapas da Montagem</h3>
                <Accordion type="single" collapsible className="w-full bg-white rounded-xl shadow-sm border border-slate-200" defaultValue={version.steps[0]?.id}>
                    {version.steps.map((step, index) => (
                        <AccordionItem key={step.id} value={step.id} className="border-b last:border-0 px-2">
                            <AccordionTrigger className="hover:no-underline hover:bg-slate-50 px-4 py-4 rounded-lg data-[state=open]:text-amber-700 data-[state=open]:bg-amber-50/50">
                                <span className="text-left font-bold text-base text-slate-800">
                                    {step.title}
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 pt-4 text-slate-700 text-[15px] leading-relaxed prose prose-slate max-w-none 
                                prose-p:mb-2 prose-ul:my-2 prose-ul:pl-6 prose-li:mb-1 prose-li:leading-relaxed prose-strong:text-slate-900 border-t border-slate-100">
                                <div dangerouslySetInnerHTML={{ __html: step.content }} />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    );
}
