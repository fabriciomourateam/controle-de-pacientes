import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Settings, Eye, EyeOff } from "lucide-react";

export interface ColumnOption {
  key: string;
  label: string;
  required?: boolean;
}

interface ColumnSelectorProps {
  columns: ColumnOption[];
  visibleColumns: string[];
  onColumnsChange: (columns: string[]) => void;
}

export function ColumnSelector({ columns, visibleColumns, onColumnsChange }: ColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleColumnToggle = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (column?.required) return; // Não permite desabilitar colunas obrigatórias

    const newVisibleColumns = visibleColumns.includes(columnKey)
      ? visibleColumns.filter(col => col !== columnKey)
      : [...visibleColumns, columnKey];
    
    onColumnsChange(newVisibleColumns);
  };

  const handleSelectAll = () => {
    const allColumns = columns.map(col => col.key);
    onColumnsChange(allColumns);
  };

  const handleSelectNone = () => {
    const requiredColumns = columns.filter(col => col.required).map(col => col.key);
    onColumnsChange(requiredColumns);
  };

  const visibleCount = visibleColumns.length;
  const totalCount = columns.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white">
          <Settings className="w-4 h-4 mr-2" />
          Colunas ({visibleCount}/{totalCount})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-slate-900/95 backdrop-blur-sm border-slate-700/50" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white">Colunas visíveis</h4>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-7 px-2 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white"
              >
                Todas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectNone}
                className="h-7 px-2 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white"
              >
                Nenhuma
              </Button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {columns.map((column) => {
              const isVisible = visibleColumns.includes(column.key);
              const isRequired = column.required;
              
              return (
                <div
                  key={column.key}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={column.key}
                    checked={isVisible}
                    onCheckedChange={() => handleColumnToggle(column.key)}
                    disabled={isRequired}
                    className="border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label
                    htmlFor={column.key}
                    className={`text-sm flex-1 cursor-pointer ${
                      isRequired ? 'text-slate-400' : 'text-slate-300'
                    }`}
                  >
                    {column.label}
                    {isRequired && (
                      <Badge variant="outline" className="ml-2 text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                        Obrigatória
                      </Badge>
                    )}
                  </label>
                  {isVisible ? (
                    <Eye className="w-4 h-4 text-green-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="pt-2 border-t border-slate-600/30">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Visíveis: {visibleCount}</span>
              <span>Total: {totalCount}</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

