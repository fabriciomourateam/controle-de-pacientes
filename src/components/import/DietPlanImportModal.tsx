import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DietPlanImportService, DietPlanImportResult } from '@/lib/diet-plan-import-service';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePatients } from '@/hooks/use-supabase-data';

interface DietPlanImportModalProps {
  onImportComplete?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DietPlanImportModal({ onImportComplete, open: controlledOpen, onOpenChange }: DietPlanImportModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<DietPlanImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const { patients, loading: patientsLoading } = usePatients();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      setSelectedFile(file);
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo Excel (.xlsx) válido.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTemplate = () => {
    DietPlanImportService.generateTemplate();
    toast({
      title: "Template Baixado",
      description: "O modelo de importação foi baixado com sucesso!",
    });
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Nenhum arquivo selecionado.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPatientId) {
      toast({
        title: "Erro",
        description: "Selecione um paciente para associar os planos.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await DietPlanImportService.importFile(selectedFile, selectedPatientId);
      setImportResult(result);

      if (result.success) {
        toast({
          title: "Importação Concluída",
          description: `${result.importedPlans} plano(s) importado(s) com sucesso!`,
        });
        onImportComplete?.();
        setIsOpen(false);
      } else {
        toast({
          title: "Erro na Importação",
          description: "Alguns planos não puderam ser importados. Verifique os erros.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro inesperado durante a importação.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedPatientId('');
    setImportResult(null);
  };

  return (
    <>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20">
            <Upload className="w-4 h-4 mr-2" />
            Importar Planos
          </Button>
        </DialogTrigger>
      )}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-cyan-300">
            Importar Planos Alimentares
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Importe planos alimentares completos via Excel. Use uma única planilha simplificada - a plataforma busca automaticamente os alimentos no banco TACO e calcula as calorias automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Template */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-cyan-300 mb-1">📥 Baixar Modelo</h4>
                <p className="text-sm text-cyan-200/70">
                  Baixe o modelo Excel simplificado com 1 única planilha. A plataforma busca automaticamente os alimentos no banco TACO e calcula as calorias. Se o alimento não estiver no banco, você pode preencher manualmente.
                </p>
              </div>
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Modelo
              </Button>
            </div>
          </div>

          {/* Seleção de Paciente */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan-200/70">
              Paciente *
            </label>
            <Select
              value={selectedPatientId}
              onValueChange={setSelectedPatientId}
              disabled={patientsLoading}
            >
              <SelectTrigger className="border-cyan-500/30 bg-slate-950/50 text-white">
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {patientsLoading ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : (
                  patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.nome || patient.telefone}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">
              Os planos serão associados a este paciente
            </p>
          </div>

          {/* Upload de Arquivo */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-6 text-center">
              <FileText className="w-12 h-12 mx-auto text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold text-cyan-300 mb-2">
                Selecione o arquivo Excel
              </h3>
              <p className="text-slate-400 mb-4">
                O arquivo deve conter 1 única planilha com as colunas: Nome do Plano, Tipo Refeição, Nome Refeição, Horário, Alimento, Quantidade, Unidade, Calorias (opcional), Proteínas (opcional), Carboidratos (opcional), Gorduras (opcional), Instruções (opcional).
                <br />
                <span className="text-cyan-400/70 text-sm mt-2 block">
                  💡 Dica: Deixe as colunas de calorias vazias se o alimento estiver no banco TACO - a plataforma calculará automaticamente!
                </span>
              </p>
              
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="diet-plan-upload"
              />
              <label
                htmlFor="diet-plan-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-500/50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Arquivo Excel
              </label>
              
              {selectedFile && (
                <div className="mt-4 p-3 bg-cyan-500/10 rounded-lg">
                  <p className="text-sm text-cyan-300">
                    <FileText className="w-4 h-4 inline mr-2" />
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Botão de Importação */}
          <Button
            onClick={handleImport}
            disabled={!selectedFile || !selectedPatientId || isImporting}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Importar Planos
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Processando importação...</span>
                <span>Por favor, aguarde</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {/* Resultado da Importação */}
          {importResult && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-cyan-300">Resultado da Importação</h3>
              
              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="text-2xl font-bold text-cyan-400">{importResult.importedPlans}</div>
                  <div className="text-sm text-slate-400">Planos</div>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="text-2xl font-bold text-cyan-400">{importResult.importedMeals}</div>
                  <div className="text-sm text-slate-400">Refeições</div>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="text-2xl font-bold text-cyan-400">{importResult.importedFoods}</div>
                  <div className="text-sm text-slate-400">Alimentos</div>
                </div>
              </div>

              {/* Erros */}
              {importResult.errors.length > 0 && (
                <Alert className="border-red-500 bg-red-500/10">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold text-red-400">Erros encontrados:</p>
                      <div className="max-h-32 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-300">
                            {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Avisos */}
              {importResult.warnings.length > 0 && (
                <Alert className="border-yellow-500 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold text-yellow-400">Avisos:</p>
                      {importResult.warnings.map((warning, index) => (
                        <p key={index} className="text-sm text-yellow-300">
                          {warning}
                        </p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Sucesso */}
              {importResult.success && (
                <Alert className="border-green-500 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription>
                    <p className="text-green-400 font-semibold">
                      Importação concluída com sucesso! {importResult.importedPlans} plano(s) importado(s).
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

