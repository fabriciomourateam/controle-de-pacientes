import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Download, X, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { customFoodsService } from "@/lib/custom-foods-service";

interface CustomFoodsImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void;
}

interface ImportedFood {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fiber_per_100g?: number;
  category?: string;
}

interface ImportResult {
  success: number;
  errors: Array<{ row: number; name: string; error: string }>;
  skipped: Array<{ row: number; name: string; reason: string }>;
}

export function CustomFoodsImportModal({
  open,
  onOpenChange,
  onImportSuccess,
}: CustomFoodsImportModalProps) {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Cabeçalhos
    const headers = [
      "Nome",
      "Calorias (por 100g)",
      "Proteínas (por 100g)",
      "Carboidratos (por 100g)",
      "Gorduras (por 100g)",
      "Fibras (por 100g) - Opcional",
      "Categoria - Opcional",
    ];
    
    // Dados de exemplo
    const exampleData = [
      ["Frango Grelhado", 165, 31, 0, 3.6, 0, "Proteínas"],
      ["Batata Doce Cozida", 86, 1.6, 20.1, 0.1, 3.2, "Carboidratos"],
      ["Azeite Extra Virgem", 884, 0, 0, 100, 0, "Gorduras"],
    ];
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);
    
    // Ajustar largura das colunas
    ws["!cols"] = [
      { wch: 25 }, // Nome
      { wch: 18 }, // Calorias
      { wch: 18 }, // Proteínas
      { wch: 20 }, // Carboidratos
      { wch: 18 }, // Gorduras
      { wch: 20 }, // Fibras
      { wch: 20 }, // Categoria
    ];
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, "Alimentos Personalizados");
    
    // Fazer download
    XLSX.writeFile(wb, "modelo-importacao-alimentos-personalizados.xlsx");
    
    toast({
      title: "Modelo baixado!",
      description: "Preencha o arquivo Excel e faça o upload novamente.",
    });
  };

  const parseExcelFile = async (file: File): Promise<ImportedFood[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          
          // Pegar primeira planilha
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Converter para JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
          }) as any[][];
          
          if (jsonData.length < 2) {
            reject(new Error("O arquivo deve ter pelo menos uma linha de cabeçalho e uma linha de dados."));
            return;
          }
          
          // Pegar cabeçalhos (primeira linha)
          const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim());
          
          // Encontrar índices das colunas
          const nameIndex = headers.findIndex((h: string) => 
            h.includes("nome") || h.includes("name")
          );
          const caloriesIndex = headers.findIndex((h: string) => 
            h.includes("caloria") || h.includes("kcal")
          );
          const proteinIndex = headers.findIndex((h: string) => 
            h.includes("proteína") || h.includes("proteina") || h.includes("protein")
          );
          const carbsIndex = headers.findIndex((h: string) => 
            h.includes("carboidrato") || h.includes("carb") || h.includes("carbs")
          );
          const fatsIndex = headers.findIndex((h: string) => 
            h.includes("gordura") || h.includes("fat") || h.includes("lipídio")
          );
          const fiberIndex = headers.findIndex((h: string) => 
            h.includes("fibra") || h.includes("fiber")
          );
          const categoryIndex = headers.findIndex((h: string) => 
            h.includes("categoria") || h.includes("category")
          );
          
          if (nameIndex === -1 || caloriesIndex === -1 || proteinIndex === -1 || 
              carbsIndex === -1 || fatsIndex === -1) {
            reject(new Error("Colunas obrigatórias não encontradas. Use o modelo para garantir o formato correto."));
            return;
          }
          
          // Processar linhas de dados
          const foods: ImportedFood[] = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Pular linhas vazias
            if (!row[nameIndex] || String(row[nameIndex]).trim() === "") {
              continue;
            }
            
            const name = String(row[nameIndex]).trim();
            const calories = parseFloat(String(row[caloriesIndex] || 0));
            const protein = parseFloat(String(row[proteinIndex] || 0));
            const carbs = parseFloat(String(row[carbsIndex] || 0));
            const fats = parseFloat(String(row[fatsIndex] || 0));
            const fiber = fiberIndex !== -1 ? parseFloat(String(row[fiberIndex] || 0)) : undefined;
            const category = categoryIndex !== -1 ? String(row[categoryIndex] || "").trim() : undefined;
            
            if (name && !isNaN(calories) && !isNaN(protein) && !isNaN(carbs) && !isNaN(fats)) {
              foods.push({
                name,
                calories_per_100g: calories,
                protein_per_100g: protein,
                carbs_per_100g: carbs,
                fats_per_100g: fats,
                fiber_per_100g: fiber !== undefined && !isNaN(fiber) ? fiber : undefined,
                category: category || undefined,
              });
            }
          }
          
          if (foods.length === 0) {
            reject(new Error("Nenhum alimento válido encontrado no arquivo."));
            return;
          }
          
          resolve(foods);
        } catch (error: any) {
          reject(new Error(`Erro ao processar arquivo: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Erro ao ler o arquivo."));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validar extensão
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls).",
        variant: "destructive",
      });
      return;
    }
    
    setIsImporting(true);
    setImportResult(null);
    
    try {
      // Processar arquivo
      const foods = await parseExcelFile(file);
      
      // Importar alimentos
      const result: ImportResult = {
        success: 0,
        errors: [],
        skipped: [],
      };
      
      for (let i = 0; i < foods.length; i++) {
        const food = foods[i];
        try {
          // Verificar se já existe
          const existing = await customFoodsService.searchByName(food.name);
          
          if (existing) {
            result.skipped.push({
              row: i + 2, // +2 porque linha 1 é cabeçalho e índice começa em 0
              name: food.name,
              reason: "Alimento já existe no banco",
            });
            continue;
          }
          
          // Criar alimento
          await customFoodsService.createCustomFood({
            name: food.name,
            calories_per_100g: food.calories_per_100g,
            protein_per_100g: food.protein_per_100g,
            carbs_per_100g: food.carbs_per_100g,
            fats_per_100g: food.fats_per_100g,
            fiber_per_100g: food.fiber_per_100g,
            category: food.category,
            is_favorite: false,
          });
          
          result.success++;
        } catch (error: any) {
          result.errors.push({
            row: i + 2,
            name: food.name,
            error: error.message || "Erro desconhecido",
          });
        }
      }
      
      setImportResult(result);
      
      // Mostrar toast com resultado
      if (result.success > 0) {
        toast({
          title: "Importação concluída!",
          description: `${result.success} alimento(s) importado(s) com sucesso.${result.errors.length > 0 ? ` ${result.errors.length} erro(s).` : ""}${result.skipped.length > 0 ? ` ${result.skipped.length} alimento(s) já existente(s).` : ""}`,
        });
        
        // Chamar callback de sucesso
        onImportSuccess?.();
      } else {
        toast({
          title: "Nenhum alimento importado",
          description: result.errors.length > 0 
            ? `Erros encontrados: ${result.errors.map(e => e.name).join(", ")}`
            : "Todos os alimentos já existem no banco.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao importar",
        description: error.message || "Não foi possível processar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClose = () => {
    setImportResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-green-500/30 bg-white text-[#222222]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-[#222222]">
            <FileSpreadsheet className="w-6 h-6 text-[#00C98A]" />
            Importar Alimentos Personalizados
          </DialogTitle>
          <DialogDescription className="text-[#777777]">
            Faça upload de um arquivo Excel para importar múltiplos alimentos personalizados de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Botão para baixar modelo */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-[#00C98A]" />
              <div>
                <p className="text-sm font-medium text-[#222222]">Baixar modelo Excel</p>
                <p className="text-xs text-[#777777]">Use o modelo para garantir o formato correto</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="border-green-500/30 text-[#00C98A] hover:bg-green-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Modelo
            </Button>
          </div>

          {/* Área de upload */}
          <div className="border-2 border-dashed border-green-500/30 rounded-lg p-8 text-center hover:border-green-500/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="excel-upload"
              disabled={isImporting}
            />
            <label
              htmlFor="excel-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <Upload className="w-8 h-8 text-[#00C98A]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#222222]">
                  {isImporting ? "Processando..." : "Clique para selecionar ou arraste o arquivo Excel"}
                </p>
                <p className="text-xs text-[#777777] mt-1">
                  Formatos suportados: .xlsx, .xls
                </p>
              </div>
              <Button
                type="button"
                disabled={isImporting}
                className="bg-[#00C98A] hover:bg-[#00A875] text-white"
                onClick={(e) => {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
              >
                {isImporting ? "Processando..." : "Selecionar Arquivo"}
              </Button>
            </label>
          </div>

          {/* Resultado da importação */}
          {importResult && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-[#222222]">
                  Resultado da Importação
                </span>
              </div>
              
              {importResult.success > 0 && (
                <div className="text-sm text-green-600">
                  ✅ {importResult.success} alimento(s) importado(s) com sucesso
                </div>
              )}
              
              {importResult.skipped.length > 0 && (
                <div className="text-sm text-yellow-600">
                  ⚠️ {importResult.skipped.length} alimento(s) já existente(s) (pulados):
                  <ul className="ml-4 mt-1 list-disc">
                    {importResult.skipped.slice(0, 5).map((item, idx) => (
                      <li key={idx} className="text-xs">
                        Linha {item.row}: {item.name}
                      </li>
                    ))}
                    {importResult.skipped.length > 5 && (
                      <li className="text-xs">... e mais {importResult.skipped.length - 5}</li>
                    )}
                  </ul>
                </div>
              )}
              
              {importResult.errors.length > 0 && (
                <div className="text-sm text-red-600">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {importResult.errors.length} erro(s):
                  </div>
                  <ul className="ml-4 mt-1 list-disc">
                    {importResult.errors.slice(0, 5).map((item, idx) => (
                      <li key={idx} className="text-xs">
                        Linha {item.row}: {item.name} - {item.error}
                      </li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li className="text-xs">... e mais {importResult.errors.length - 5}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="border-gray-300 text-[#222222] hover:bg-gray-100"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
