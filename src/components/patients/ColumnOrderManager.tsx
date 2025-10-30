import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GripVertical, Settings } from "lucide-react";
import { ColumnOption } from "./ColumnSelector";

interface SortableItemProps {
  id: string;
  label: string;
}

function SortableItem({ id, label }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-slate-500/50 transition-colors"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>
      <span className="text-slate-300">{label}</span>
    </div>
  );
}

interface ColumnOrderManagerProps {
  columns: ColumnOption[];
  columnOrder?: string[];
  onOrderChange: (newOrder: string[]) => void;
}

export function ColumnOrderManager({ columns, columnOrder, onOrderChange }: ColumnOrderManagerProps) {
  const [open, setOpen] = useState(false);
  const [localOrder, setLocalOrder] = useState<string[]>(
    columnOrder || columns.map(col => col.key)
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    onOrderChange(localOrder);
    setOpen(false);
  };

  const handleReset = () => {
    const defaultOrder = columns.map(col => col.key);
    setLocalOrder(defaultOrder);
  };

  // Ordenar colunas conforme a ordem salva
  const orderedColumns = localOrder
    .map(key => columns.find(col => col.key === key))
    .filter(Boolean) as ColumnOption[];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-slate-700/50 border-slate-600/50 text-slate-300 hover:text-white hover:bg-slate-600/50"
        >
          <Settings className="w-4 h-4 mr-2" />
          Reordenar Colunas
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Reordenar Colunas</DialogTitle>
          <DialogDescription className="text-slate-400">
            Arraste as colunas para reorganizar a ordem na tabela
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localOrder}
              strategy={verticalListSortingStrategy}
            >
              {orderedColumns.map((column) => (
                <SortableItem
                  key={column.key}
                  id={column.key}
                  label={column.label}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="flex justify-between gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            className="bg-slate-700/50 border-slate-600/50 text-slate-300 hover:text-white hover:bg-slate-600/50"
          >
            Resetar
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-slate-700/50 border-slate-600/50 text-slate-300 hover:text-white hover:bg-slate-600/50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Salvar Ordem
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
