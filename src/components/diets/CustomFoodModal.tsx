import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CustomFood } from "@/lib/custom-foods-service";

const customFoodSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  calories_per_100g: z.coerce.number().min(0, "Calorias devem ser >= 0"),
  protein_per_100g: z.coerce.number().min(0, "Proteínas devem ser >= 0"),
  carbs_per_100g: z.coerce.number().min(0, "Carboidratos devem ser >= 0"),
  fats_per_100g: z.coerce.number().min(0, "Gorduras devem ser >= 0"),
  fiber_per_100g: z.coerce.number().min(0, "Fibras devem ser >= 0").optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  is_favorite: z.boolean().default(false),
});

type CustomFoodFormData = z.infer<typeof customFoodSchema>;

interface CustomFoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CustomFoodFormData) => Promise<void>;
  food?: CustomFood | null;
  categories: string[];
}

const SUGGESTED_CATEGORIES = [
  "Proteínas",
  "Carboidratos",
  "Gorduras",
  "Vegetais",
  "Frutas",
  "Suplementos",
  "Bebidas",
  "Outros",
];

export function CustomFoodModal({
  open,
  onOpenChange,
  onSubmit,
  food,
  categories,
}: CustomFoodModalProps) {
  const form = useForm<CustomFoodFormData>({
    resolver: zodResolver(customFoodSchema),
    defaultValues: {
      name: "",
      calories_per_100g: 0,
      protein_per_100g: 0,
      carbs_per_100g: 0,
      fats_per_100g: 0,
      fiber_per_100g: 0,
      category: "",
      notes: "",
      is_favorite: false,
    },
  });

  // Preencher formulário quando editar
  useEffect(() => {
    if (food) {
      form.reset({
        name: food.name,
        calories_per_100g: food.calories_per_100g,
        protein_per_100g: food.protein_per_100g,
        carbs_per_100g: food.carbs_per_100g,
        fats_per_100g: food.fats_per_100g,
        fiber_per_100g: food.fiber_per_100g || 0,
        category: food.category || "",
        notes: food.notes || "",
        is_favorite: food.is_favorite,
      });
    } else {
      form.reset({
        name: "",
        calories_per_100g: 0,
        protein_per_100g: 0,
        carbs_per_100g: 0,
        fats_per_100g: 0,
        fiber_per_100g: 0,
        category: "",
        notes: "",
        is_favorite: false,
      });
    }
  }, [food, form]);

  const handleSubmit = async (data: CustomFoodFormData) => {
    await onSubmit(data);
    form.reset();
  };

  // Combinar categorias sugeridas com categorias existentes
  const allCategories = [
    ...new Set([...SUGGESTED_CATEGORIES, ...categories]),
  ].sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {food ? "Editar Alimento" : "Adicionar Alimento"}
          </DialogTitle>
          <DialogDescription>
            {food
              ? "Atualize as informações do alimento customizado."
              : "Adicione um novo alimento ao seu banco de dados pessoal."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Alimento *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Frango Grelhado Caseiro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valores Nutricionais */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calories_per_100g"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calorias (por 100g) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="165" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="protein_per_100g"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proteínas (g/100g) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="31" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carbs_per_100g"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carboidratos (g/100g) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fats_per_100g"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gorduras (g/100g) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="3.6" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fiber_per_100g"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fibras (g/100g)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>Opcional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Opcional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notas */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas/Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Preparado sem óleo, apenas grelhado"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Favorito */}
            <FormField
              control={form.control}
              name="is_favorite"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Marcar como Favorito</FormLabel>
                    <FormDescription>
                      Alimentos favoritos aparecem no topo da lista
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {food ? "Atualizar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
