import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, X, FileText, BarChart3, Table, Eye } from "lucide-react";
import { ReportData, reportsService } from "@/lib/reports-service";

interface ReportViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ReportData | null;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
}

export function ReportViewModal({ isOpen, onClose, reportData, onExport }: ReportViewModalProps) {
  if (!reportData) return null;

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'table':
        return <Table className="w-5 h-5 text-blue-400" />;
      case 'chart':
        return <BarChart3 className="w-5 h-5 text-green-400" />;
      case 'summary':
        return <FileText className="w-5 h-5 text-purple-400" />;
      default:
        return <Eye className="w-5 h-5 text-gray-400" />;
    }
  };

  const renderTableData = (data: any[]) => {
    if (!data || data.length === 0) return <p className="text-slate-400">Nenhum dado disponível</p>;

    const headers = Object.keys(data[0]);
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-600">
              {headers.map((header) => (
                <th key={header} className="text-left p-3 text-slate-300 font-medium bg-slate-800/50">
                  {header.charAt(0).toUpperCase() + header.slice(1).replace(/([A-Z])/g, ' $1')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b border-slate-700 hover:bg-slate-800/30">
                {headers.map((header) => (
                  <td key={header} className="p-3 text-slate-300">
                    {row[header] || 'N/A'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderChartData = (data: any[]) => {
    if (!data || data.length === 0) return <p className="text-slate-400">Nenhum dado disponível</p>;

    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">
                {item.month || item.period || `Item ${index + 1}`}
              </span>
              <span className="text-blue-400 font-bold">
                {item.count || item.value || 'N/A'}
              </span>
            </div>
            {item.patients && (
              <p className="text-sm text-slate-400 mt-1">
                {item.patients.length} paciente(s)
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSummaryData = (data: any) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
              <p className="text-slate-400 text-sm">
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </p>
              <p className="text-white text-lg font-semibold">{String(value)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    switch (reportData.type) {
      case 'table':
        return renderTableData(reportData.data);
      case 'chart':
        return renderChartData(reportData.data);
      case 'summary':
        return renderSummaryData(reportData.data);
      default:
        return <p className="text-slate-400">Tipo de relatório não suportado</p>;
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (onExport) {
      onExport(format);
    } else {
      // Exportação direta usando o serviço
      switch (format) {
        case 'csv':
          reportsService.exportToCSV(reportData);
          break;
        case 'excel':
          reportsService.exportToExcel(reportData);
          break;
        case 'pdf':
          reportsService.exportToPDF(reportData);
          break;
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] bg-slate-900 border-slate-700">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getReportIcon(reportData.type)}
              <div>
                <DialogTitle className="text-white text-xl">{reportData.title}</DialogTitle>
                <DialogDescription className="text-slate-400 mt-1">
                  {reportData.description}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {reportData.category}
              </Badge>
              <span className="text-xs text-slate-400">
                Gerado em: {new Date(reportData.generatedAt).toLocaleString('pt-BR')}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => handleExport('csv')}
              >
                <Download className="w-4 h-4 mr-1" />
                CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => handleExport('excel')}
              >
                <Download className="w-4 h-4 mr-1" />
                Excel
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => handleExport('pdf')}
              >
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator className="bg-slate-700" />

        <ScrollArea className="flex-1 pr-4">
          <div className="py-4">
            {renderReportContent()}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
