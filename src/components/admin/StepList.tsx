import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, MessageSquare, Type, List, Upload, Trash2, Plus } from 'lucide-react';
import { FlowStep } from '@/lib/checkin-flow-default';

interface StepListProps {
  steps: FlowStep[];
  selectedStepId: string | null;
  onSelectStep: (id: string) => void;
  onReorder: (steps: FlowStep[]) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const STEP_TYPE_CONFIG: Record<string, { icon: typeof MessageSquare; label: string; color: string }> = {
  message: { icon: MessageSquare, label: 'Mensagem', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  text: { icon: Type, label: 'Texto', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  number: { icon: Type, label: 'Número', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  choice: { icon: List, label: 'Opções', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  file: { icon: Upload, label: 'Fotos', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
};

function SortableStep({ step, isSelected, onSelect, onDelete }: {
  step: FlowStep; isSelected: boolean; onSelect: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const config = STEP_TYPE_CONFIG[step.type] || STEP_TYPE_CONFIG.message;
  const Icon = config.icon;

  const title = step.question
    ? step.question.substring(0, 50) + (step.question.length > 50 ? '...' : '')
    : step.messages?.[0]?.substring(0, 50) || step.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-500/5'
          : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50'
      }`}
      onClick={onSelect}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-700/50 rounded">
        <GripVertical className="w-4 h-4 text-slate-500" />
      </button>
      <Badge className={`${config.color} text-[10px] px-1.5 py-0 shrink-0`}>{config.label}</Badge>
      <span className="text-sm text-slate-300 truncate flex-1">{title}</span>
      {(step.conditionalMessages?.length ?? 0) > 0 && (
        <span className="text-[10px] text-amber-400/90 shrink-0" title={`${step.conditionalMessages!.length} mensagem(ns) condicional(is)`}>
          {step.conditionalMessages!.length} cond.
        </span>
      )}
      {step.field && <span className="text-[10px] text-slate-600 font-mono shrink-0">{step.field}</span>}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-colors shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function StepList({ steps, selectedStepId, onSelectStep, onReorder, onDelete, onAdd }: StepListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex(s => s.id === active.id);
      const newIndex = steps.findIndex(s => s.id === over.id);
      onReorder(arrayMove(steps, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">Steps ({steps.length})</h3>
        <Button size="sm" variant="outline" onClick={onAdd} className="h-7 text-xs border-slate-600 text-slate-300">
          <Plus className="w-3 h-3 mr-1" /> Novo Step
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {steps.map(step => (
              <SortableStep
                key={step.id}
                step={step}
                isSelected={selectedStepId === step.id}
                onSelect={() => onSelectStep(step.id)}
                onDelete={() => onDelete(step.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
