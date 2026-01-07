import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Palette, Check } from 'lucide-react';
import { assigneeColorsService, availableColors, colorNames } from '@/lib/assignee-colors-service';
import { cn } from '@/lib/utils';

interface AssigneeColorPickerProps {
  userId: string;
  memberName: string;
  onColorChange?: () => void;
}

export function AssigneeColorPicker({ userId, memberName, onColorChange }: AssigneeColorPickerProps) {
  const [open, setOpen] = useState(false);
  const currentColorIndex = assigneeColorsService.getMemberColorIndex(userId);

  const handleColorSelect = (colorIndex: number) => {
    assigneeColorsService.setMemberColor(userId, colorIndex);
    setOpen(false);
    if (onColorChange) {
      onColorChange();
    }
    // Forçar atualização da página para refletir a mudança
    window.location.reload();
  };

  const handleRemoveColor = () => {
    assigneeColorsService.removeMemberColor(userId);
    setOpen(false);
    if (onColorChange) {
      onColorChange();
    }
    // Forçar atualização da página para refletir a mudança
    window.location.reload();
  };

  const currentColor = currentColorIndex !== null 
    ? availableColors[currentColorIndex] 
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <Palette className="w-3 h-3 mr-1" />
          {currentColor ? (
            <span className="text-xs">Cor: {colorNames[currentColorIndex!]}</span>
          ) : (
            <span className="text-xs">Escolher Cor</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-slate-800 border-slate-700">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-white mb-2">
              Cor para {memberName}
            </p>
            <p className="text-xs text-slate-400 mb-3">
              Escolha a cor que aparecerá nos check-ins atribuídos a este membro
            </p>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {availableColors.map((color, index) => (
              <button
                key={index}
                onClick={() => handleColorSelect(index)}
                className={cn(
                  "w-full h-10 rounded border-2 transition-all hover:scale-110",
                  color.bg,
                  color.border,
                  currentColorIndex === index && "ring-2 ring-white ring-offset-2 ring-offset-slate-800"
                )}
                title={colorNames[index]}
              >
                {currentColorIndex === index && (
                  <Check className="w-4 h-4 text-white mx-auto" />
                )}
              </button>
            ))}
          </div>

          {currentColorIndex !== null && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveColor}
              className="w-full text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Remover cor personalizada
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
