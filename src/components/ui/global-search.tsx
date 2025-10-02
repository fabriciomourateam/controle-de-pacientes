import { useEffect, useRef } from 'react';
import { Search, Users, Calendar, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGlobalSearch, SearchResult } from '@/hooks/use-global-search';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { searchTerm, setSearchTerm, searchResults, isOpen, setIsOpen } = useGlobalSearch();

  // Fechar ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      // Ctrl/Cmd + K para focar na busca
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'patient':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'plan':
        return <Calendar className="w-4 h-4 text-green-500" />;
      case 'checkin':
        return <MessageSquare className="w-4 h-4 text-yellow-500" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Buscar pacientes, planos... (Ctrl+K)"
            className="pl-10 w-48 sm:w-64 md:w-80 input-premium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="start">
        <Command className="rounded-lg border shadow-md">
          <CommandList>
            {searchTerm.length < 2 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Digite pelo menos 2 caracteres para buscar...
              </div>
            ) : searchResults.length === 0 ? (
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            ) : (
              <CommandGroup heading="Resultados">
                {searchResults.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleResultClick(result)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent"
                  >
                    {getResultIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {result.title}
                      </div>
                      {result.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {result.type === 'patient' ? 'Paciente' : 
                       result.type === 'plan' ? 'Plano' : 'Check-in'}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
