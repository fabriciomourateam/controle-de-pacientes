import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface SortingOption {
  field: string;
  label: string;
}

export interface PatientSorting {
  field: string;
  direction: 'asc' | 'desc';
}

interface PatientSortingProps {
  sorting: PatientSorting;
  onSortingChange: (sorting: PatientSorting) => void;
  options: SortingOption[];
}

export function PatientSorting({ sorting, onSortingChange, options }: PatientSortingProps) {
  const handleFieldChange = (field: string) => {
    onSortingChange({ ...sorting, field });
  };

  const handleDirectionToggle = () => {
    onSortingChange({
      ...sorting,
      direction: sorting.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getSortingIcon = () => {
    if (sorting.direction === 'asc') {
      return <ArrowUp className="w-4 h-4" />;
    }
    return <ArrowDown className="w-4 h-4" />;
  };

  const getSortingLabel = () => {
    const option = options.find(opt => opt.field === sorting.field);
    return option ? option.label : 'Selecionar campo';
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-300">Ordenar por:</span>
      <Select value={sorting.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-48 bg-slate-800/50 border-slate-600/50 text-white">
          <SelectValue placeholder="Selecionar campo" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.field} value={option.field}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDirectionToggle}
        className="h-9 px-3 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
      >
        {getSortingIcon()}
      </Button>
    </div>
  );
}

