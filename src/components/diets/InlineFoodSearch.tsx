import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Star } from 'lucide-react';
import { cn } from "@/lib/utils";
import { CustomFoodModal } from './CustomFoodModal';
import { customFoodsService, CreateCustomFoodInput } from '@/lib/custom-foods-service';
import { useToast } from "@/hooks/use-toast";
import { dietService } from '@/lib/diet-service';

interface FoodItem {
    name: string;
    calories_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fats_per_100g: number;
    category?: string;
    is_custom?: boolean;
}

interface InlineFoodSearchProps {
    form?: any;
    mealIndex?: number;
    foodDatabase: FoodItem[];
    onFoodSelect?: (food: FoodItem) => void;
    onSelect?: (food: FoodItem) => void;
    placeholder?: string;
    autoFocus?: boolean;
    className?: string;
}

export const InlineFoodSearch: React.FC<InlineFoodSearchProps> = ({
    form,
    mealIndex,
    foodDatabase,
    onFoodSelect,
    onSelect,
    placeholder = "Buscar alimento...",
    autoFocus = false,
    className
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [customFoodModalOpen, setCustomFoodModalOpen] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const { toast } = useToast();

    // Load favorites for prioritization
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    useEffect(() => {
        dietService.getFavorites().then(favs => setFavorites(new Set(favs))).catch(() => { });
    }, []);

    // Load custom categories for the modal
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const cats = await customFoodsService.getCategories();
                setCategories(cats);
            } catch (error) {
                console.error('Erro ao carregar categorias:', error);
            }
        };
        loadCategories();
    }, []);

    // Filter foods based on the search term
    const filteredFoods = useMemo(() => {
        if (!searchTerm.trim()) return [];

        const lowerTerm = searchTerm.toLowerCase();

        // Exact matches or starts with (higher priority)
        const exactMatches: FoodItem[] = [];
        const containsMatches: FoodItem[] = [];

        for (const food of foodDatabase) {
            const lowerName = food.name.toLowerCase();

            if (lowerName === lowerTerm || lowerName.startsWith(lowerTerm)) {
                exactMatches.push(food);
            } else if (lowerName.includes(lowerTerm)) {
                containsMatches.push(food);
            }

            // Limit results for performance
            if (exactMatches.length + containsMatches.length > 50) break;
        }

        // Sort each group: favorites first
        const sortByFavorites = (a: FoodItem, b: FoodItem) => {
            const aFav = favorites.has(a.name);
            const bFav = favorites.has(b.name);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return 0;
        };
        exactMatches.sort(sortByFavorites);
        containsMatches.sort(sortByFavorites);

        return [...exactMatches, ...containsMatches].slice(0, 50);
    }, [searchTerm, foodDatabase, favorites]);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            // Small timeout to ensure modal rendering doesn't steal focus
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [autoFocus]);

    // Reset selected index when search changes
    useEffect(() => {
        setSelectedIndex(0);
        if (searchTerm.trim().length > 0 && filteredFoods.length > 0) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [searchTerm, filteredFoods.length]);

    // Scroll selected item into view
    useEffect(() => {
        if (isOpen && listRef.current) {
            const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedItem) {
                selectedItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex, isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) return;

        // The maximum selectable index is filteredFoods.length (the 'Add Custom' button)
        const maxIndex = filteredFoods.length;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < maxIndex ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex === maxIndex) {
                    // Selected "Add Custom Food"
                    setCustomFoodModalOpen(true);
                } else if (filteredFoods.length > 0) {
                    // Selected an actual food
                    if (onFoodSelect) {
                        onFoodSelect(filteredFoods[selectedIndex]);
                    } else if (onSelect) {
                        onSelect(filteredFoods[selectedIndex]);
                    }
                    setSearchTerm('');
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
        }
    };

    // Detect click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Ignore if custom modal is open
            if (customFoodModalOpen) return;

            if (listRef.current && !listRef.current.contains(event.target as Node) &&
                inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [customFoodModalOpen]);

    const handleCreateCustomFood = async (data: CreateCustomFoodInput) => {
        try {
            const newFood = await customFoodsService.createCustomFood(data);
            toast({
                title: 'Alimento personalizado criado!',
                description: `${data.name} foi adicionado à sua lista.`,
            });
            setCustomFoodModalOpen(false);

            // Auto-select the newly created food
            const formattedFood: FoodItem = {
                name: newFood.name,
                calories_per_100g: newFood.calories_per_100g,
                protein_per_100g: newFood.protein_per_100g,
                carbs_per_100g: newFood.carbs_per_100g,
                fats_per_100g: newFood.fats_per_100g,
                category: newFood.category,
                is_custom: true
            };

            if (onFoodSelect) {
                onFoodSelect(formattedFood);
            } else if (onSelect) {
                onSelect(formattedFood);
            }
            setSearchTerm('');
            setIsOpen(false);

        } catch (error: any) {
            console.error('Erro ao criar alimento personalizado:', error);
            const errorMessage = error.message || 'Não foi possível criar o alimento personalizado';

            if (errorMessage.includes('não foi criada') || errorMessage.includes('does not exist') || errorMessage.includes('404')) {
                toast({
                    title: 'Tabela não encontrada',
                    description: 'A tabela de alimentos personalizados precisa ser criada. Execute o script SQL: create-custom-foods-system.sql no Supabase.',
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Erro ao criar alimento',
                    description: errorMessage,
                    variant: 'destructive',
                });
            }
        }
    };

    const getSourceBadge = (food: FoodItem) => {
        if (food.is_custom) {
            return <Badge className="bg-blue-500/15 text-blue-400 border-0 text-[9px] px-1 py-0 ml-2">Personalizado</Badge>;
        }

        // Simulação baseada no nome para o exemplo (em um DB real usaríamos a coluna de fonte)
        // No contexto do Supabase que este app usa, a maioria dos alimentos genéricos não têm "TACO" ou fonte confiável associada.
        // Vamos checar se o alimento pertence a alguma categoria genérica ou se foi inserido "à mão" sem ser flag custom
        const isGeneric =
            food.name.toLowerCase().includes("opção genérica") ||
            food.name.toLowerCase().includes("medida") ||
            (food.category && food.category.toLowerCase().includes("genéric"));

        if (isGeneric) {
            return <Badge className="bg-orange-500/15 text-orange-400 border-0 text-[9px] px-1 py-0 ml-2">Genérico</Badge>;
        }

        return <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[9px] px-1 py-0 ml-2">TACO/TBCA</Badge>;
    };

    return (
        <div className={cn("relative w-full", isOpen ? "z-50" : "z-10", className)}>
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (searchTerm.trim().length > 0 && filteredFoods.length > 0) {
                            setIsOpen(true);
                        }
                    }}
                    placeholder={placeholder}
                    className="pl-8 h-9 text-sm bg-white border border-gray-300 focus:border-green-500 focus:ring-0 focus:outline-none text-gray-900 placeholder:text-gray-400 rounded-md shadow-sm transition-all focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                    autoComplete="off"
                />
            </div>

            {isOpen && filteredFoods.length > 0 && (
                <ul
                    ref={listRef}
                    className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-2xl max-h-72 overflow-y-auto"
                >
                    {filteredFoods.map((food, index) => (
                        <li
                            key={`${food.name}-${index}`}
                            className={cn(
                                "px-3 py-2.5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-50 last:border-0 transition-colors",
                                index === selectedIndex ? "bg-green-50/80 text-gray-900" : "text-gray-700 hover:bg-gray-50"
                            )}
                            onClick={() => {
                                if (onFoodSelect) {
                                    onFoodSelect(food);
                                } else if (onSelect) {
                                    onSelect(food);
                                }
                                setSearchTerm('');
                                setIsOpen(false);
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="flex items-center">
                                {favorites.has(food.name) && (
                                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 mr-1.5 flex-shrink-0" />
                                )}
                                <span className={cn("text-sm font-medium truncate max-w-[240px]",
                                    index === selectedIndex ? "text-green-800" : ""
                                )}>
                                    {food.name}
                                </span>
                                {getSourceBadge(food)}
                            </div>
                            <div className="flex gap-3 text-xs text-gray-500 border-t sm:border-0 pt-1 sm:pt-0 mt-1 sm:mt-0 font-medium whitespace-nowrap">
                                <span className="text-orange-500 min-w-[50px]">{Math.round(food.calories_per_100g)} kcal</span>
                                <span className="min-w-[45px]">P: {Math.round(food.protein_per_100g)}g</span>
                                <span className="min-w-[45px]">C: {Math.round(food.carbs_per_100g)}g</span>
                                <span className="min-w-[45px]">G: {Math.round(food.fats_per_100g)}g</span>
                            </div>
                        </li>
                    ))}

                    {/* Button to add custom food */}
                    <li
                        className={cn(
                            "px-3 py-2.5 cursor-pointer flex items-center gap-2 border-t border-gray-100 transition-colors bg-blue-50/30 text-blue-600 hover:bg-blue-50",
                            filteredFoods.length === selectedIndex ? "bg-blue-100/50" : ""
                        )}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Optional: auto-fill name if user was typing
                            if (searchTerm.trim().length > 2) {
                                // We don't have direct access to the form inside CustomFoodModal from here without modifying it,
                                // but opening it is the main action. 
                            }
                            setCustomFoodModalOpen(true);
                        }}
                        onMouseEnter={() => setSelectedIndex(filteredFoods.length)}
                    >
                        <div className="bg-blue-100 p-1 rounded-md">
                            <Plus className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium">Cadastrar alimento personalizado</span>
                    </li>
                </ul>
            )}

            {/* Modal de Criar Alimento Personalizado */}
            <CustomFoodModal
                open={customFoodModalOpen}
                onOpenChange={(open) => {
                    setCustomFoodModalOpen(open);
                    if (!open && !isOpen) {
                        setIsOpen(true); // Keep search open if cancelled
                        setTimeout(() => inputRef.current?.focus(), 50);
                    }
                }}
                onSubmit={handleCreateCustomFood}
                categories={categories}
            />
        </div>
    );
};
