import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CSVImportService, ImportResult } from '@/lib/csv-import-service';
import { toast } from '@/hooks/use-toast';

interface CSVImportModalProps {
  onImportComplete?: () => void;
}

export function CSVImportModal({ onImportComplete }: CSVImportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvContent(content);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo CSV válido.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!csvContent) {
      toast({
        title: "Erro",
        description: "Nenhum arquivo CSV selecionado.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await CSVImportService.importCSV(csvContent);
      setImportResult(result);

      if (result.success) {
        toast({
          title: "Importação Concluída",
          description: `${result.importedRows} de ${result.totalRows} registros importados com sucesso.`,
        });
        onImportComplete?.();
      } else {
        toast({
          title: "Erro na Importação",
          description: "Alguns registros não puderam ser importados. Verifique os erros.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado durante a importação.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearAll = async () => {
    try {
      const result = await CSVImportService.clearAllPatients();
      if (result.success) {
        toast({
          title: "Dados Limpos",
          description: "Todos os pacientes foram removidos do banco de dados.",
        });
        onImportComplete?.();
        setShowClearConfirm(false);
        setIsOpen(false);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao limpar dados.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao limpar dados.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCsvFile(null);
    setCsvContent('');
    setImportResult(null);
    setShowClearConfirm(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="btn-premium">
          <Upload className="w-4 h-4 mr-2" />
          Importar CSV
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gold text-glow">
            Importar Dados do Notion
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload de Arquivo */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gold/30 rounded-lg p-6 text-center">
              <FileText className="w-12 h-12 mx-auto text-gold mb-4" />
              <h3 className="text-lg font-semibold text-gold mb-2">
                Selecione o arquivo CSV do Notion
              </h3>
              <p className="text-muted-foreground mb-4">
                Exporte sua tabela do Notion como CSV e selecione aqui
              </p>
              
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="btn-premium cursor-pointer inline-flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Arquivo CSV
              </label>
              
              {csvFile && (
                <div className="mt-4 p-3 bg-gold/10 rounded-lg">
                  <p className="text-sm text-gold">
                    <FileText className="w-4 h-4 inline mr-2" />
                    {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4">
            <Button
              onClick={handleImport}
              disabled={!csvContent || isImporting}
              className="btn-premium flex-1"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Dados
                </>
              )}
            </Button>

            <Button
              onClick={() => setShowClearConfirm(true)}
              variant="destructive"
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Todos
            </Button>
          </div>

          {/* Progress Bar */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando importação...</span>
                <span>Por favor, aguarde</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {/* Resultado da Importação */}
          {importResult && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gold">Resultado da Importação</h3>
              
              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-gold">{importResult.totalRows}</div>
                  <div className="text-sm text-muted-foreground">Total de Linhas</div>
                </div>
                <div className="text-center p-4 bg-bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-500">{importResult.importedRows}</div>
                  <div className="text-sm text-muted-foreground">Importadas</div>
                </div>
                <div className="text-center p-4 bg-bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-red-500">
                    {importResult.totalRows - importResult.importedRows}
                  </div>
                  <div className="text-sm text-muted-foreground">Com Erro</div>
                </div>
              </div>

              {/* Erros */}
              {importResult.errors.length > 0 && (
                <Alert className="border-red-500">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">Erros encontrados:</p>
                      <div className="max-h-32 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-600">
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
                <Alert className="border-yellow-500">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">Avisos:</p>
                      {importResult.warnings.map((warning, index) => (
                        <p key={index} className="text-sm text-yellow-600">
                          {warning}
                        </p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Sucesso */}
              {importResult.success && (
                <Alert className="border-green-500">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="text-green-600 font-semibold">
                      Importação concluída com sucesso! {importResult.importedRows} registros foram importados.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Confirmação de Limpeza */}
          {showClearConfirm && (
            <Alert className="border-red-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-4">
                  <p className="font-semibold text-red-600">
                    ⚠️ ATENÇÃO: Esta ação irá deletar TODOS os pacientes do banco de dados!
                  </p>
                  <p className="text-sm">
                    Esta ação não pode ser desfeita. Certifique-se de que você fez backup dos dados importantes.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleClearAll}
                      variant="destructive"
                      size="sm"
                    >
                      Sim, Deletar Tudo
                    </Button>
                    <Button
                      onClick={() => setShowClearConfirm(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
