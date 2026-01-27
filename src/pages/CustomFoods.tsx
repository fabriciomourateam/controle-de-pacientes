import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MoreVertical, Pencil, Trash2, Heart, Star } from "lucide-react";
import { useCustomFoods } from "@/hooks/use-custom-foods";
import { CustomFoodModal } from "@/components/diets/CustomFoodModal";
import { CustomFood, CreateCustomFoodInput, UpdateCustomFoodInput } from "@/lib/custom-foods-service";

export default function CustomFoods() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<CustomFood | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [foodToDelete, setFoodToDelete] = useState<CustomFood | null>(null);

  const {
    foods,
    categories,
    loading,
    createFood,
    updateFood,
    deleteFood,
    toggleFavorite,
  } = useCustomFoods({
    search,
    category: categoryFilter || undefined,
    favoritesOnly,
  });

  const handleCreateFood = async (data: CreateCustomFoodInput) => {
    await createFood(data);
    setModalOpen(false);
  };

  const handleUpdateFood = async (data: CreateCustomFoodInput) => {
    if (!editingFood) return;
    
    const updateData: UpdateCustomFoodInput = {
      id: editingFood.id,
      ...data,
    };
    
    await updateFood(updateData);
    setModalOpen(false);
    setEditingFood(null);
  };

  const handleDeleteFood = async () => {
    if (!foodToDelete) return;
    await deleteFood(foodToDelete.id);
    setDeleteDialogOpen(false);
    setFoodToDelete(null);
  };

  const handleEditClick = (food: CustomFood) => {
    setEditingFood(food);
    setModalOpen(true);
  };

  const handleDeleteClick = (food: CustomFood) => {
    setFoodToDelete(food);
    setDeleteDialogOpen(true);
  };

  const handleToggleFavorite = async (food: CustomFood) => {
    await toggleFavorite(food.id, !food.is_favorite);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingFood(null);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alimentos Customizados</h1>
          <p className="text-muted-foreground">
            Gerencie seu banco de dados pessoal de alimentos
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Alimento
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Busque e filtre seus alimentos customizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Categoria */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Favoritos */}
            <Button
              variant={favoritesOnly ? "default" : "outline"}
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className="w-full"
            >
              <Star className={`mr-2 h-4 w-4 ${favoritesOnly ? "fill-current" : ""}`} />
              {favoritesOnly ? "Mostrando Favoritos" : "Todos os Alimentos"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alimentos */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando alimentos...</p>
        </div>
      ) : foods.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {search || categoryFilter || favoritesOnly
                ? "Nenhum alimento encontrado com os filtros aplicados."
                : "Você ainda não tem alimentos customizados."}
            </p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro Alimento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {foods.map((food) => (
            <Card key={food.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {food.name}
                      {food.is_favorite && (
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      )}
                    </CardTitle>
                    {food.category && (
                      <Badge variant="secondary" className="mt-2">
                        {food.category}
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleFavorite(food)}>
                        <Heart className="mr-2 h-4 w-4" />
                        {food.is_favorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditClick(food)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(food)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Valores Nutricionais */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Calorias</p>
                    <p className="font-semibold">{food.calories_per_100g} kcal</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Proteínas</p>
                    <p className="font-semibold">{food.protein_per_100g}g</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Carboidratos</p>
                    <p className="font-semibold">{food.carbs_per_100g}g</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gorduras</p>
                    <p className="font-semibold">{food.fats_per_100g}g</p>
                  </div>
                  {food.fiber_per_100g !== undefined && food.fiber_per_100g > 0 && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Fibras</p>
                      <p className="font-semibold">{food.fiber_per_100g}g</p>
                    </div>
                  )}
                </div>

                {/* Notas */}
                {food.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">{food.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Adicionar/Editar */}
      <CustomFoodModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        onSubmit={editingFood ? handleUpdateFood : handleCreateFood}
        food={editingFood}
        categories={categories}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{foodToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFood} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
