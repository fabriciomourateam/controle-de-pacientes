import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { laboratoryExamsService, LaboratoryExam } from '@/lib/laboratory-exams-service';
import { FlaskConical, Clock, CheckCircle, XCircle, Calendar, Download, Upload, FileText, Trash2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ExamsHistoryProps {
  patientId?: string;
  telefone: string;
  onUpdate?: () => void;
  refreshTrigger?: number;
  allowDelete?: boolean; // Permitir deletar exames (apenas para nutricionista)
}

export function ExamsHistory({ patientId, telefone, onUpdate, refreshTrigger, allowDelete = false }: ExamsHistoryProps) {
  // Log sempre que o componente renderiza (ANTES de qualquer hook)
  console.log('📋 ExamsHistory RENDERIZADO - patientId:', patientId, 'telefone:', telefone, 'refreshTrigger:', refreshTrigger);
  
  const { toast } = useToast();
  const [exams, setExams] = useState<LaboratoryExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<LaboratoryExam | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [resultNotes, setResultNotes] = useState('');
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<LaboratoryExam | null>(null);

  const loadExams = useCallback(async () => {
    if (!telefone && !patientId) {
      console.warn('ExamsHistory: telefone e patientId estão vazios');
      setExams([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Carregando exames - patientId:', patientId, 'telefone:', telefone);
      const data = patientId
        ? await laboratoryExamsService.getByPatientId(patientId)
        : await laboratoryExamsService.getByTelefone(telefone!);
      console.log('✅ Exames carregados:', data?.length || 0, 'exames', data);
      setExams(data || []);
    } catch (error: any) {
      console.error('❌ Erro ao carregar exames:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar os exames',
        variant: 'destructive'
      });
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [telefone, patientId, toast]);

  const handleDeleteExam = async () => {
    if (!examToDelete) return;

    try {
      setDeletingExamId(examToDelete.id);
      await laboratoryExamsService.delete(examToDelete.id);
      
      toast({
        title: 'Exame deletado',
        description: 'O exame foi removido com sucesso',
      });

      // Recarregar lista
      loadExams();
      
      // Chamar callback se fornecido
      if (onUpdate) {
        onUpdate();
      }

      setDeleteConfirmOpen(false);
      setExamToDelete(null);
    } catch (error: any) {
      console.error('Erro ao deletar exame:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível deletar o exame',
        variant: 'destructive'
      });
    } finally {
      setDeletingExamId(null);
    }
  };

  useEffect(() => {
    console.log('🔄 ExamsHistory: useEffect executado - telefone:', telefone, 'patientId:', patientId, 'refreshTrigger:', refreshTrigger);
    if (telefone || patientId) {
      console.log('✅ ExamsHistory: Parâmetros válidos, carregando exames...');
      loadExams();
    } else {
      console.warn('⚠️ ExamsHistory: telefone e patientId estão vazios, não é possível carregar exames');
      setExams([]);
      setLoading(false);
    }
  }, [telefone, patientId, refreshTrigger, loadExams]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-[#00C98A]/10 text-[#00A875] border-[#00C98A]/20"><CheckCircle className="w-3 h-3 mr-1" /> Completo</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><Calendar className="w-3 h-3 mr-1" /> Agendado</Badge>;
      case 'requested':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Solicitado</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{status}</Badge>;
    }
  };

  const handleUploadResult = async () => {
    if (!selectedExam || !resultFile) {
      toast({
        title: 'Arquivo necessário',
        description: 'Por favor, selecione um arquivo para upload',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);

      // Upload do arquivo
      const fileUrl = await laboratoryExamsService.uploadResultFile(resultFile, selectedExam.id);

      // Atualizar exame
      await laboratoryExamsService.update(selectedExam.id, {
        status: 'completed',
        result_file_url: fileUrl,
        result_notes: resultNotes || null,
        completed_at: new Date().toISOString().split('T')[0],
      });

      toast({
        title: 'Resultado adicionado! ✅',
        description: 'O resultado do exame foi salvo com sucesso',
      });

      setUploadModalOpen(false);
      setResultFile(null);
      setResultNotes('');
      setSelectedExam(null);
      loadExams();
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível fazer upload do resultado',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Tipo de arquivo inválido',
          description: 'Apenas PDF e imagens (PNG, JPG) são permitidos',
          variant: 'destructive'
        });
        return;
      }

      // Validar tamanho (máximo 30MB)
      if (file.size > 30 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 30MB',
          variant: 'destructive'
        });
        return;
      }

      setResultFile(file);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <CardContent className="p-8 text-center">
          <p className="text-[#777777]">Carregando exames...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#222222]">
            <FlaskConical className="w-5 h-5 text-[#00C98A]" />
            Exames
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <div className="text-center py-8">
              <FlaskConical className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-[#777777]">Nenhum exame solicitado ainda</p>
              {telefone && (
                <p className="text-xs text-[#777777] mt-2">Telefone: {telefone}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-[#222222] font-semibold text-lg mb-1">{exam.exam_name}</h3>
                      <p className="text-[#777777] text-sm">
                        Solicitado em {new Date(exam.requested_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {getStatusBadge(exam.status)}
                  </div>

                  {exam.instructions && (
                    <div className="mb-3 p-3 bg-[#00C98A]/5 border border-[#00C98A]/20 rounded-lg">
                      <p className="text-sm text-[#777777]">
                        <strong className="text-[#222222]">Instruções:</strong> {exam.instructions}
                      </p>
                    </div>
                  )}

                  {exam.result_file_url && (
                    <div className="mb-3">
                      <a
                        href={exam.result_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#00C98A] hover:text-[#00A875] text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Ver resultado
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {exam.status !== 'completed' && exam.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedExam(exam);
                          setUploadModalOpen(true);
                        }}
                        className="bg-gradient-to-br from-[#00C98A] to-[#00A875] text-white hover:from-[#00A875] hover:to-[#008a5c] border-0"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Adicionar Resultado
                      </Button>
                    )}
                    
                    {allowDelete && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setExamToDelete(exam);
                          setDeleteConfirmOpen(true);
                        }}
                        disabled={deletingExamId === exam.id}
                        className="bg-red-500 text-white hover:bg-red-600 border-0"
                      >
                        {deletingExamId === exam.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deletando...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Deletar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Upload */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Upload className="w-5 h-5 text-blue-400" />
              Adicionar Resultado do Exame
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedExam?.exam_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="result_file" className="text-slate-300">Arquivo do Resultado *</Label>
              <Input
                id="result_file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500">
                Formatos aceitos: PDF, PNG, JPG. Máximo 30MB.
              </p>
              {resultFile && (
                <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-sm text-green-300">
                  Arquivo selecionado: {resultFile.name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="result_notes" className="text-slate-300">Observações sobre o Resultado</Label>
              <Textarea
                id="result_notes"
                value={resultNotes}
                onChange={(e) => setResultNotes(e.target.value)}
                placeholder="Anotações sobre o resultado do exame..."
                className="bg-slate-700/50 border-slate-600 text-white min-h-[100px]"
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadModalOpen(false);
                  setResultFile(null);
                  setResultNotes('');
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleUploadResult}
                disabled={uploading || !resultFile}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {uploading ? 'Enviando...' : 'Salvar Resultado'}
              </Button>
            </div>
          </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Deleção */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-300">
                Tem certeza que deseja deletar o exame <strong>{examToDelete?.exam_name}</strong>? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteExam}
                disabled={deletingExamId !== null}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deletingExamId ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deletando...
                  </>
                ) : (
                  'Deletar'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
  
