import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, ArrowUp, ArrowDown } from 'lucide-react';
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
  sortBy: 'date' | 'name' | 'status' | 'score';
  onSortByChange: (sortBy: 'date' | 'name' | 'status' | 'score') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void;
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
  totalResults,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange
}: CheckinFiltersProps) {
  
  const clearAllFilters = () => {
    onSearchChange('');
    onStatusChange([]); // Limpar status ao limpar filtros
    onResponsibleChange([]);
  };

  // Verificar se "Pendente" está ativo (inclui pendente e em_analise)
  const isPendenteActive = selectedStatuses.includes('pendente') || selectedStatuses.includes('em_analise');
  const isEnviadoActive = selectedStatuses.includes('enviado');

  const hasActiveFilters = searchTerm || selectedStatuses.length > 0 || selectedResponsibles.length > 0;

  return (
    <Card className="bg-slate-800/40 border-slate-700/50">
      <CardContent className="p-3">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
          {/* Busca */}
          <div className="relative w-[380px]">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 text-sm"
            />
          </div>

          {/* Responsável */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Responsável</label>
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
              <SelectTrigger className="h-9 w-[180px] bg-slate-800/50 border-slate-600/50 text-white text-sm">
                <SelectValue placeholder="Todos" />
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

          {/* Status - Badges clicáveis */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Status</label>
            <div className="flex gap-2">
              <Badge
                onClick={() => {
                  if (isPendenteActive) {
                    // Se já está ativo, remover
                    onStatusChange(selectedStatuses.filter(s => s !== 'pendente' && s !== 'em_analise'));
                  } else {
                    // Se não está ativo, adicionar
                    const newStatuses = selectedStatuses.filter(s => s !== 'enviado');
                    onStatusChange([...newStatuses, 'pendente', 'em_analise']);
                  }
                }}
                className={`
                  cursor-pointer transition-all px-3 py-1.5 text-sm
                  ${isPendenteActive
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/30'
                    : 'bg-slate-700/50 text-slate-400 border-slate-600/50 hover:bg-slate-600/50'
                  }
                `}
              >
                Pendente
              </Badge>
              <Badge
                onClick={() => {
                  if (isEnviadoActive) {
                    // Se já está ativo, remover
                    onStatusChange(selectedStatuses.filter(s => s !== 'enviado'));
                  } else {
                    // Se não está ativo, adicionar
                    onStatusChange([...selectedStatuses, 'enviado']);
                  }
                }}
                className={`
                  cursor-pointer transition-all px-3 py-1.5 text-sm
                  ${isEnviadoActive
                    ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30'
                    : 'bg-slate-700/50 text-slate-400 border-slate-600/50 hover:bg-slate-600/50'
                  }
                `}
              >
                Enviado
              </Badge>
            </div>
          </div>

          {/* Ordenação */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Ordenar por</label>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value) => onSortByChange(value as 'date' | 'name' | 'status' | 'score')}>
                <SelectTrigger className="h-9 w-[140px] bg-slate-800/50 border-slate-600/50 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="score">Pontuação</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="h-9 bg-slate-800/50 border-slate-600/50 text-white hover:bg-slate-700/50 px-2"
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Badge de resultados e botão limpar */}
          <div className="flex items-end gap-2 ml-auto">
            <div className="flex items-center gap-2 h-9">
              <span className="text-xs text-slate-400">Filtro:</span>
              <Badge variant="outline" className="text-xs text-slate-300 border-slate-600 h-9 px-2">
                {totalResults}
              </Badge>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-9 w-9 p-0 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}