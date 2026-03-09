import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Copy, Plus, ArrowDownUp, Trash2, GripVertical, Check, Scale, Search, Edit2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { InlineFoodSearch } from './InlineFoodSearch';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';

interface InlineFoodRowProps {
    id?: string;
    mealIndex: number;
    foodIndex: number;
    form: any;
    foodDatabase: any[];
    isSub?: boolean;
    parentIndex?: number;
    handleFoodSelect: (mealIndex: number, foodIndex: number, foodName: string) => void;
    recalculateFoodMacros: (mealIndex: number, foodIndex: number) => void;
    removeFoodFromMeal: (mealIndex: number, foodIndex: number) => void;
    setSubstitutionsFoodIndex: (index: { mealIndex: number; foodIndex: number } | null) => void;
    setSubstitutionsModalOpen: (open: boolean) => void;
    calculateMealMacros: (mealIndex: number) => void;
    calculateTotals: () => void;
    onAddSub?: (parentIndex: number) => void;
    onSwapWithParent?: (subIndex: number) => void;
    isEditingNew?: boolean; // Se true, começa focado no quantity
    onCommitNew?: () => void; // Quando confirma o novo alimento e deve criar a próxima linha limpa
}

export const InlineFoodRow: React.FC<InlineFoodRowProps> = ({
    id,
    mealIndex,
    foodIndex,
    form,
    foodDatabase,
    isSub = false,
    parentIndex,
    handleFoodSelect,
    recalculateFoodMacros,
    removeFoodFromMeal,
    setSubstitutionsFoodIndex,
    setSubstitutionsModalOpen,
    calculateMealMacros,
    calculateTotals,
    onAddSub,
    onSwapWithParent,
    isEditingNew = false,
    onCommitNew
}) => {
    // Monitorar a "food" via react-hook-form para re-renderizar quando form mudar
    const foodPath = isSub
        ? `meals.${mealIndex}.foods.${parentIndex}.substitutions.${foodIndex}`
        : `meals.${mealIndex}.foods.${foodIndex}`;

    const food = useWatch({
        name: foodPath,
        control: form.control,
    }) || {};

    const substitutions = useWatch({
        name: `meals.${mealIndex}.foods.${foodIndex}.substitutions`,
        control: form.control,
    }) || [];

    const [isEditing, setIsEditing] = useState(isEditingNew);
    const [qtyValue, setQtyValue] = useState(food?.quantity?.toString() || "");
    const [unitValue, setUnitValue] = useState(food?.unit || "");

    // Novo subtituto inline
    const [isAddingSub, setIsAddingSub] = useState(false);
    const [showAllSubs, setShowAllSubs] = useState(false);

    // Substitutions state (Collapsible & Sortable)
    const [isSubsCollapsed, setIsSubsCollapsed] = useState(false);
    const [isSortedAlphabetically, setIsSortedAlphabetically] = useState(false);

    // Custom Measure Flow
    const [measurePopoverOpen, setMeasurePopoverOpen] = useState(false);
    const [customMeasureWeight, setCustomMeasureWeight] = useState("");

    const qtyRef = useRef<HTMLInputElement>(null);
    const unitRef = useRef<HTMLInputElement>(null);

    const sortableId = `food-${mealIndex}-${foodIndex}`;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: sortableId,
        disabled: isSub || isEditing,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Focus qty on render if new
    useEffect(() => {
        if (isEditingNew && qtyRef.current) {
            setTimeout(() => qtyRef.current?.focus(), 50);
            qtyRef.current.select();
        }
    }, [isEditingNew]);

    // Se trocar de food (ao buscar no InlineFoodSearch quando está editando no lugar)
    const handleFoodChange = (newFoodData: any) => {
        form.setValue(`${foodPath}.food_name`, newFoodData.name);

        if (!isSub) {
            handleFoodSelect(mealIndex, foodIndex, newFoodData.name);
        } else {
            // Lógica para sub, já que não tem macros na store principal
            form.setValue(`${foodPath}.unit`, 'g'); // padrao
        }

        // Ao selecionar alimento editando o próprio item, foca quantia de novo
        qtyRef.current?.focus();
        qtyRef.current?.select();
    };

    const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            unitRef.current?.focus();
            unitRef.current?.select();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (unitValue && !['g', 'ml', ''].includes(unitValue.toLowerCase().trim()) && !customMeasureWeight && !food?.gram_weight_per_unit) {
                setMeasurePopoverOpen(true);
                return;
            }
            commitChanges();
            if (isSub && onAddSub && parentIndex !== undefined) {
                onAddSub(parentIndex);
            }
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            if (isEditingNew && !food?.food_name) {
                if (isSub) {
                    setIsAddingSub(false);
                } else {
                    removeFoodFromMeal(mealIndex, foodIndex); // Remove empty row on escape
                }
            }
        }
    };

    const handleUnitKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (unitValue && !['g', 'ml', ''].includes(unitValue.toLowerCase().trim()) && !customMeasureWeight && !food?.gram_weight_per_unit) {
                setMeasurePopoverOpen(true);
                return;
            }
            commitChanges();
            if (e.key === 'Enter' && isSub && onAddSub && parentIndex !== undefined) {
                onAddSub(parentIndex);
            }
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            if (isEditingNew && !food?.food_name) {
                if (isSub) {
                    setIsAddingSub(false);
                } else {
                    removeFoodFromMeal(mealIndex, foodIndex); // Remove empty row on escape
                }
            }
        }
    };

    const commitChanges = () => {
        // Only commit if food is selected and qty is valid
        if (!food?.food_name) return;

        const parsedQty = parseFloat(qtyValue.replace(',', '.'));

        if (!isNaN(parsedQty) && parsedQty > 0) {
            const oldParsedQty = parseFloat(food?.quantity?.toString() || '0');
            const oldWeight = food?.gram_weight_per_unit || 1;
            const oldEffectiveQuantity = oldParsedQty * oldWeight;

            form.setValue(`${foodPath}.quantity`, parsedQty);
            form.setValue(`${foodPath}.unit`, unitValue || 'g');

            // Handle Custom Measure Weight if defined
            let effectiveQuantity = parsedQty;
            if (customMeasureWeight) {
                const parsedWeight = parseFloat(customMeasureWeight.replace(',', '.'));
                if (!isNaN(parsedWeight) && parsedWeight > 0) {
                    form.setValue(`${foodPath}.gram_weight_per_unit`, parsedWeight);
                    effectiveQuantity = parsedQty * parsedWeight;
                } else {
                    form.setValue(`${foodPath}.gram_weight_per_unit`, null);
                }
            } else if (food?.gram_weight_per_unit) {
                effectiveQuantity = parsedQty * food.gram_weight_per_unit;
            }

            if (!isSub) {
                recalculateFoodMacros(mealIndex, foodIndex);

                // Check for Auto-Scaling Substitutes
                if (oldEffectiveQuantity > 0 && effectiveQuantity > 0 && effectiveQuantity !== oldEffectiveQuantity) {
                    const ratio = effectiveQuantity / oldEffectiveQuantity;
                    const currentSubs = form.getValues(`meals.${mealIndex}.foods.${foodIndex}.substitutions`) || [];

                    if (currentSubs.length > 0) {
                        const newSubs = currentSubs.map((sub: any) => {
                            const oldSubQty = parseFloat(sub.quantity?.toString() || '0');
                            if (oldSubQty <= 0) return sub;

                            let scaledQty = oldSubQty * ratio;
                            // Round to nearest 5 or 0
                            scaledQty = Math.round(scaledQty / 5) * 5;
                            if (scaledQty <= 0) scaledQty = Math.round(oldSubQty * ratio); // Fallback se ficar zero (para itens peq)
                            if (scaledQty <= 0) scaledQty = 1;

                            // Atualizar macros do sub
                            const subName = sub.food_name;
                            const subWeight = sub.gram_weight_per_unit || 1;
                            const subEffectiveQty = scaledQty * subWeight;

                            const cleanName = subName.split(/[,\(]/)[0].trim();
                            const matchedFood = foodDatabase.find((f: any) => f.name.toLowerCase() === subName.toLowerCase()) ||
                                foodDatabase.find((f: any) => f.name.toLowerCase().includes(cleanName.toLowerCase()));

                            const updatedSub = { ...sub, quantity: scaledQty };
                            if (matchedFood) {
                                const multiplier = subEffectiveQty / 100;
                                updatedSub.calories = Math.round(matchedFood.calories_per_100g * multiplier);
                                updatedSub.protein = Math.round(matchedFood.protein_per_100g * multiplier * 10) / 10;
                                updatedSub.carbs = Math.round(matchedFood.carbs_per_100g * multiplier * 10) / 10;
                                updatedSub.fats = Math.round(matchedFood.fats_per_100g * multiplier * 10) / 10;
                            }
                            return updatedSub;
                        });
                        form.setValue(`meals.${mealIndex}.foods.${foodIndex}.substitutions`, newSubs);
                    }
                }
            } else {
                // Manually calculate macros for sub based on foodDatabase
                const cleanName = food?.food_name.split(/[,\(]/)[0].trim();
                const matchedFood = foodDatabase.find(f => f.name.toLowerCase() === food?.food_name.toLowerCase()) ||
                    foodDatabase.find(f => f.name.toLowerCase().includes(cleanName.toLowerCase()));

                if (matchedFood) {
                    const multiplier = effectiveQuantity / 100;
                    form.setValue(`${foodPath}.calories`, Math.round(matchedFood.calories_per_100g * multiplier));
                    form.setValue(`${foodPath}.protein`, Math.round(matchedFood.protein_per_100g * multiplier * 10) / 10);
                    form.setValue(`${foodPath}.carbs`, Math.round(matchedFood.carbs_per_100g * multiplier * 10) / 10);
                    form.setValue(`${foodPath}.fats`, Math.round(matchedFood.fats_per_100g * multiplier * 10) / 10);
                } else {
                    // Se não for encontrado na base (ex: nome mudado custom), zera ou mantem o anterior (melhor não forçar zero se tiver custom)
                    if (parsedQty <= 0) {
                        form.setValue(`${foodPath}.calories`, 0);
                        form.setValue(`${foodPath}.protein`, 0);
                        form.setValue(`${foodPath}.carbs`, 0);
                        form.setValue(`${foodPath}.fats`, 0);
                    }
                }
            }

            setIsEditing(false);

            if (onCommitNew && isEditingNew) {
                onCommitNew();
            }
        }
    };

    // 1: Edit State (Render Inputs)
    if (isEditing) {
        return (
            <div ref={setNodeRef} style={style} className={cn(
                "flex items-center gap-2 p-1.5 rounded-md bg-green-50/50 border border-green-200/50 shadow-sm",
                isSub && "ml-8 bg-blue-50/50 border-blue-200/50 shadow-none border-l-2 border-l-blue-400"
            )}>
                {isSub && <div className="w-4 h-4 text-blue-400 font-bold -mt-0.5 opacity-60 ml-1">↳</div>}

                {/* If no food selected yet or changing food */}
                <div className="flex-1 min-w-[200px]">
                    {food?.food_name ? (
                        <div className="relative">
                            <Input
                                value={food.food_name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    form.setValue(`${foodPath}.food_name`, val);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleQtyKeyDown(e as any);
                                }}
                                className="h-9 w-full bg-white border border-gray-200 rounded-md text-sm text-gray-700 shadow-sm hover:border-blue-300 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-blue-500 outline-none pr-8"
                                placeholder="Nome do alimento"
                            />
                            {/* Clear icon to go back to search */}
                            <button
                                type="button"
                                onClick={() => form.setValue(`${foodPath}.food_name`, '')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                                title="Trocar alimento"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                    ) : (
                        <InlineFoodSearch
                            foodDatabase={foodDatabase}
                            onSelect={handleFoodChange}
                            autoFocus={true}
                        />
                    )}
                </div>

                <div>
                    <Input
                        ref={qtyRef}
                        type="number"
                        min="0"
                        step="0.1"
                        value={qtyValue}
                        onChange={(e) => setQtyValue(e.target.value)}
                        onKeyDown={handleQtyKeyDown}
                        placeholder="Qtd"
                        className="w-16 h-9 text-right text-sm bg-white border border-gray-300 px-1 text-gray-900 shadow-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-green-500 outline-none"
                    />
                </div>

                <div className="w-20">
                    <Input
                        ref={unitRef}
                        type="text"
                        list="diet-units"
                        value={unitValue}
                        onChange={(e) => setUnitValue(e.target.value)}
                        onKeyDown={handleUnitKeyDown}
                        placeholder="Unid"
                        className="h-9 w-20 text-sm bg-white border border-gray-300 px-2 text-center text-gray-700 shadow-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-green-500 outline-none"
                    />
                    <datalist id="diet-units">
                        <option value="g" />
                        <option value="ml" />
                        <option value="colher(es)" />
                        <option value="fatia(s)" />
                        <option value="unidade(s)" />
                        <option value="pedaço(s)" />
                        <option value="xícara(s)" />
                        <option value="porção(ões)" />
                    </datalist>
                </div>

                <div className="flex items-center gap-1">
                    <Popover open={measurePopoverOpen} onOpenChange={setMeasurePopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-9 w-9 p-0 rounded-md shadow-sm border transition-colors",
                                    (food?.gram_weight_per_unit || customMeasureWeight)
                                        ? "bg-purple-100/50 text-purple-600 border-purple-200 hover:bg-purple-100"
                                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100"
                                )}
                                title="Configurar peso da porção (Medida Caseira)"
                            >
                                <Scale className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4 z-[110] bg-white border border-gray-200 shadow-xl rounded-xl" sideOffset={5} align="start">
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2 text-gray-800">
                                    <Scale className="h-4 w-4 text-purple-500" />
                                    Medida Equivalente
                                </h4>
                                <p className="text-xs text-gray-500 leading-tight">
                                    Quantas gramas a unidade selecionada ({unitValue || 'unidade'}) possui? O sistema usará este peso base para multiplicar os macros invés de gramas.
                                </p>
                                <div className="space-y-4 w-full pt-1">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Nome da Medida</Label>
                                        <Input
                                            type="text"
                                            placeholder="Ex: 1 unidade de 70g"
                                            value={unitValue}
                                            onChange={(e) => setUnitValue(e.target.value)}
                                            className="h-8 text-sm flex-1 bg-gray-50 border-gray-300 text-gray-900 focus-visible:ring-purple-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Peso correspondente (g)</Label>
                                        <div className="flex gap-2 w-full">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                placeholder="Ex: 70"
                                                value={customMeasureWeight || food?.gram_weight_per_unit || ""}
                                                onChange={(e) => setCustomMeasureWeight(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        setMeasurePopoverOpen(false);
                                                    }
                                                }}
                                                className="h-8 text-sm flex-1 bg-gray-50 border-gray-300 text-gray-900 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                                            />
                                            <Button
                                                size="sm"
                                                className="h-8 bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm transition-all"
                                                onClick={() => setMeasurePopoverOpen(false)}
                                            >
                                                OK
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={commitChanges}
                        className="h-9 w-9 p-0 text-white bg-[#00C98A] hover:bg-[#00A875] rounded-md shadow-sm"
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }

    // Renderizar a badge de fonte conforme a regra
    const renderSourceBadge = () => {
        if (!food?.food_name) return null;

        // Verifica se a comida inteira possui fonte customizada (no caso de usar Supabase, precisariamos do flag aqui)
        // Por enquanto faremos uma verificacao parecida com InlineSearch pelo nome
        const isGeneric =
            food.food_name.toLowerCase().includes("opção genérica") ||
            food.food_name.toLowerCase().includes("medida") ||
            (food.category && food.category.toLowerCase().includes("genéric"));

        if (isGeneric) {
            return <Badge className="ml-2 py-0 px-1.5 border-0 bg-orange-100 text-orange-700 text-[9px] uppercase font-bold tracking-wider inline-flex">GENÉRICO</Badge>;
        }

        // Simulação do custom se houver _baseStats.is_custom salvo
        if (food._baseStats?.is_custom) {
            return <Badge className="ml-2 py-0 px-1.5 border-0 bg-blue-100 text-blue-700 text-[9px] uppercase font-bold tracking-wider inline-flex">CUSTOM</Badge>;
        }

        return <Badge className="ml-2 py-0 px-1.5 border-0 bg-green-100 text-green-700 text-[9px] uppercase font-bold tracking-wider inline-flex">TACO/TBCA</Badge>;
    };

    // 2: View State (Render Clean Row)
    return (
        <div ref={setNodeRef} style={style} className={cn(
            "flex flex-col gap-1 w-full",
            isDragging && "z-50 relative"
        )}>
            <div
                className={cn(
                    "group flex items-center justify-between p-2 rounded-md hover:bg-green-50/50 transition-colors border border-transparent hover:border-green-200/50 cursor-pointer",
                    isSub && "ml-8 hover:bg-blue-50/50 hover:border-blue-200/50 border-l-2 border-l-transparent hover:border-l-blue-400"
                )}
                onClick={() => {
                    setQtyValue(food?.quantity?.toString() || "");
                    setUnitValue(food?.unit || "");
                    setIsEditing(true);
                    setTimeout(() => {
                        qtyRef.current?.focus();
                        qtyRef.current?.select();
                    }, 50);
                }}
            >
                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                    {isSub ? (
                        <div
                            {...(id ? attributes : {})}
                            {...(id ? listeners : {})}
                            className={cn("text-blue-400/60 font-medium ml-1 flex-shrink-0", id && "cursor-grab active:cursor-grabbing")}
                            onClick={(e) => { if (id) e.stopPropagation(); }}
                        >
                            {id ? <GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" /> : "↳"}
                        </div>
                    ) : (
                        <div
                            {...attributes}
                            {...listeners}
                            className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none p-1 -ml-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}

                    <div className="flex-1 truncate">
                        <span className="text-sm font-medium text-gray-700">
                            {food?.quantity} {food?.unit} <span className="text-gray-400 font-normal mx-0.5">de</span> {food?.food_name}
                        </span>
                        {renderSourceBadge()}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mr-2 flex-shrink-0">
                        <span className="w-10 text-right font-bold text-orange-500">{food?.calories || 0}kcal</span>
                        <span className="w-10 text-right">P: {food?.protein || 0}</span>
                        <span className="w-10 text-right">C: {food?.carbs || 0}</span>
                        <span className="w-10 text-right">G: {food?.fats || 0}</span>
                    </div>
                </div>

                {/* Row Actions */}
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    {!isSub && substitutions.length > 0 && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentSubs = form.getValues(`meals.${mealIndex}.foods.${foodIndex}.substitutions`) || [];
                                    const sortedSubs = [...currentSubs].sort((a, b) => {
                                        if (isSortedAlphabetically) {
                                            // Revert to original order? We don't have original index, so let's just reverse alphabet or leave it
                                            return b.food_name.localeCompare(a.food_name);
                                        }
                                        return a.food_name.localeCompare(b.food_name);
                                    });
                                    form.setValue(`meals.${mealIndex}.foods.${foodIndex}.substitutions`, sortedSubs);
                                    setIsSortedAlphabetically(!isSortedAlphabetically);
                                }}
                                className={cn("h-7 px-2 text-[10px] uppercase font-bold tracking-wide flex items-center gap-1 border border-transparent", isSortedAlphabetically ? "text-purple-600 bg-purple-50 hover:bg-purple-100" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100")}
                                title="Ordenar alfabeticamente (A-Z)"
                            >
                                A-Z
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsSubsCollapsed(!isSubsCollapsed);
                                }}
                                className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                title={isSubsCollapsed ? "Expandir substituições" : "Ocultar substituições"}
                            >
                                {isSubsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                            </Button>
                        </>
                    )}

                    {isSub && onSwapWithParent ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSwapWithParent(foodIndex);
                            }}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                            title="Tornar este o alimento principal"
                        >
                            <ArrowDownUp className="h-3.5 w-3.5" />
                        </Button>
                    ) : (
                        !isSub && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsAddingSub(true);
                                }}
                                className="h-7 px-2 text-[10px] uppercase font-bold tracking-wide text-blue-500 hover:text-blue-600 hover:bg-blue-50 flex items-center gap-1 border border-transparent hover:border-blue-200"
                            >
                                <Plus className="h-3 w-3" /> Substituto
                            </Button>
                        )
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isSub && parentIndex !== undefined) {
                                // Remove sub
                                const currentSubs = form.getValues(`meals.${mealIndex}.foods.${parentIndex}.substitutions`) || [];
                                const newSubs = [...currentSubs];
                                newSubs.splice(foodIndex, 1);
                                form.setValue(`meals.${mealIndex}.foods.${parentIndex}.substitutions`, newSubs);
                            } else {
                                // Remove main
                                removeFoodFromMeal(mealIndex, foodIndex);
                            }
                        }}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Renderizar substituições aninhadas */}
            {!isSub && substitutions.length > 0 && !isSubsCollapsed && (
                <DndContext
                    sensors={useSensors(
                        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
                        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
                    )}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => {
                        const { active, over } = event;
                        if (!over || active.id === over.id) return;

                        const currentSubs = form.getValues(`meals.${mealIndex}.foods.${foodIndex}.substitutions`) || [];
                        const oldIdx = currentSubs.findIndex((_: any, i: number) => `sub-${mealIndex}-${foodIndex}-${i}` === active.id);
                        const newIdx = currentSubs.findIndex((_: any, i: number) => `sub-${mealIndex}-${foodIndex}-${i}` === over.id);

                        if (oldIdx !== -1 && newIdx !== -1) {
                            const reordered = arrayMove(currentSubs, oldIdx, newIdx);
                            form.setValue(`meals.${mealIndex}.foods.${foodIndex}.substitutions`, reordered);
                        }
                    }}
                >
                    <SortableContext
                        items={substitutions.map((_: any, i: number) => `sub-${mealIndex}-${foodIndex}-${i}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        {substitutions.slice(0, showAllSubs ? undefined : 5).map((sub: any, subIndex: number) => (
                            <InlineFoodRow
                                key={`sub-${mealIndex}-${foodIndex}-${subIndex}`}
                                id={`sub-${mealIndex}-${foodIndex}-${subIndex}`}
                                mealIndex={mealIndex}
                                foodIndex={subIndex}
                                parentIndex={foodIndex}
                                form={form}
                                foodDatabase={foodDatabase}
                                isSub={true}
                                handleFoodSelect={handleFoodSelect}
                                recalculateFoodMacros={recalculateFoodMacros}
                                removeFoodFromMeal={removeFoodFromMeal}
                                setSubstitutionsFoodIndex={setSubstitutionsFoodIndex}
                                setSubstitutionsModalOpen={setSubstitutionsModalOpen}
                                calculateMealMacros={calculateMealMacros}
                                calculateTotals={calculateTotals}
                                isEditingNew={sub._isNew}
                                onCommitNew={() => {
                                    const currentSubs = form.getValues(`meals.${mealIndex}.foods.${foodIndex}.substitutions`) || [];
                                    if (currentSubs[subIndex]) {
                                        currentSubs[subIndex]._isNew = false;
                                        form.setValue(`meals.${mealIndex}.foods.${foodIndex}.substitutions`, currentSubs);
                                    }
                                    setIsAddingSub(true);
                                }}
                                onAddSub={() => setIsAddingSub(true)}
                                onSwapWithParent={(subIndexParam) => {
                                    // Implementação do Swap
                                    const currentFoods = form.getValues(`meals.${mealIndex}.foods`) || [];
                                    const parentFood = currentFoods[foodIndex];
                                    const subFood = parentFood.substitutions[subIndexParam];

                                    // Cria novo parent baseado no sub
                                    const newParent = {
                                        ...subFood,
                                        calories: 0, // Precisa recalcular com o macro multiplier do foodCache
                                        protein: 0,
                                        carbs: 0,
                                        fats: 0,
                                        notes: parentFood.notes,
                                        substitutions: [
                                            ...parentFood.substitutions.filter((_: any, i: number) => i !== subIndexParam),
                                            { // Antigo parent vira sub
                                                food_name: parentFood.food_name,
                                                quantity: parentFood.quantity,
                                                unit: parentFood.unit
                                            }
                                        ]
                                    };

                                    // Atualiza no form
                                    currentFoods[foodIndex] = newParent;
                                    form.setValue(`meals.${mealIndex}.foods`, currentFoods);

                                    // Encontra o novo alimento principal no BD para pegar os macros
                                    const dbFood = foodDatabase.find(f => f.name === subFood.food_name);
                                    if (dbFood) {
                                        form.setValue(`meals.${mealIndex}.foods.${foodIndex}.calories`, Math.round((subFood.quantity * dbFood.calories_per_100g) / 100));
                                        form.setValue(`meals.${mealIndex}.foods.${foodIndex}.protein`, Math.round((subFood.quantity * dbFood.protein_per_100g * 10) / 100) / 10);
                                        form.setValue(`meals.${mealIndex}.foods.${foodIndex}.carbs`, Math.round((subFood.quantity * dbFood.carbs_per_100g * 10) / 100) / 10);
                                        form.setValue(`meals.${mealIndex}.foods.${foodIndex}.fats`, Math.round((subFood.quantity * dbFood.fats_per_100g * 10) / 100) / 10);

                                        calculateMealMacros(mealIndex);
                                        calculateTotals();
                                    } else {
                                        // Dispara recalculo generico caso não encontre (deve encontrar)
                                        handleFoodSelect(mealIndex, foodIndex, subFood.food_name);
                                    }
                                }}
                            />
                        ))}
                    </SortableContext>
                    {substitutions.length > 5 && (
                        <div className="ml-8 mt-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAllSubs(!showAllSubs);
                                }}
                                className="h-7 px-2 text-[10px] uppercase font-bold tracking-wide text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex items-center border border-transparent hover:border-gray-200"
                            >
                                {showAllSubs ? "Ver menos" : `+ ${substitutions.length - 5} substitutos`}
                            </Button>
                        </div>
                    )}
                </DndContext>
            )}

            {/* Input the novo substituto (indentado) */}
            {!isSubsCollapsed && isAddingSub && (
                <div className="ml-8 mt-1">
                    <InlineFoodSearch
                        form={form}
                        mealIndex={mealIndex}
                        foodDatabase={foodDatabase}
                        autoFocus={true}
                        placeholder="Buscar substituto..."
                        onFoodSelect={(selectedSub) => {
                            const newSub = {
                                food_name: selectedSub.name,
                                quantity: 100, // deafult
                                unit: "g",
                                _isNew: true
                            };

                            const currentSubs = form.getValues(`meals.${mealIndex}.foods.${foodIndex}.substitutions`) || [];
                            form.setValue(`meals.${mealIndex}.foods.${foodIndex}.substitutions`, [...currentSubs, newSub]);

                            setIsAddingSub(false);
                        }}
                    />
                </div>
            )}
        </div>
    );
};
