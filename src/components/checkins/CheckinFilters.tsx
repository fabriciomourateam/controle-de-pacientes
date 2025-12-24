import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckinStatus, TeamMember } from '@/hooks/use-checkin-management';

interface CheckinFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatuses: CheckinStatus[];
  onStatusChange: (statuses: CheckinStatus[]) => void;
  selectedResponsibles: string[];
  onResponsibleChange: (responsibles: string[]) => void;
  teamMembers: TeamMember[];
  totalResults: number;
}

const statusOptions: Array<{ value: CheckinStatus; label: string; color: string }> = [
  { value: 'pendente', label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'em_analise', label: 'Em Análise', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'enviado', label: 'Enviado', color: 'bg-green-500/20 text-green-400 border-green-500/30' }
];

export function CheckinFilters({
  searchTerm,
  onSearchChange,
  selectedStatuses,
  onStatusChange,
  selectedResponsibles,
  onResponsibleChange,
  teamMembers,
  totalResults
}: CheckinFiltersProps) {
  
  const clearAllFilters = () => {
    onSearchChange('');
    onStatusChange(['pendente']); // Voltar para pendente ao limpar
    onResponsibleChange([]);
  };

  const hasActiveFilters = searchTerm || selectedStatuses.length > 0 || selectedResponsibles.length > 0;

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardContent className="p-6">
        {/* Header dos Filtros */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-white">Filtros</h3>
            <Badge variant="outline" className="text-slate-300 border-slate-600">
              {totalResults} resultado{totalResults !== 1 ? 's' : ''}
            </Badge>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Linha 1: Busca */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Buscar Paciente
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Digite o nome do paciente..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Linha 2: Responsável e Status (lado a lado) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Responsável */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Responsável
              </label>
              <Select
                value={selectedResponsibles[0] || 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    onResponsibleChange([]);
                  } else {
                    onResponsibleChange([value]);
                  }
                }}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white">
                  <SelectValue placeholder="Todos os responsáveis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os responsáveis</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.is_owner && '👑 '}
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status do Check-in
              </label>
              <Select
                value={selectedStatuses[0] || 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    onStatusChange([]);
                  } else {
                    onStatusChange([value as CheckinStatus]);
                  }
                }}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}