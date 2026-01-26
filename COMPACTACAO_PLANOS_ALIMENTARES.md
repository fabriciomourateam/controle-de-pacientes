# Compactação e Unificação dos Planos Alimentares

## Objetivo
Remover as abas "Plano Ativo" e "Histórico" e unificar todos os planos em uma única visualização compacta, mantendo todas as funcionalidades existentes.

## Alterações Necessárias no Arquivo `DietPlansList.tsx`

### 1. Remover o componente Tabs
**Localização:** Linha ~565-1471

**Remover:**
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
  <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
    <TabsTrigger value="active">...</TabsTrigger>
    <TabsTrigger value="history">...</TabsTrigger>
  </TabsList>
  
  <TabsContent value="active">...</TabsContent>
  <TabsContent value="history">...</TabsContent>
</Tabs>
```

### 2. Adicionar contador de status no filtro
**Localização:** Após o filtro de favoritos (linha ~540)

**Adicionar:**
```tsx
<div className="flex items-center gap-2 text-sm text-slate-400">
  <Badge variant="outline" className="border-[#00C98A] text-[#00C98A] bg-[#00C98A]/10">
    <CheckCircle className="w-3 h-3 mr-1" />
    {activePlans.length} Ativo{activePlans.length !== 1 ? 's' : ''}
  </Badge>
  <Badge variant="outline" className="border-slate-400 text-slate-400 bg-slate-400/10">
    <History className="w-3 h-3 mr-1" />
    {inactivePlans.length} Inativo{inactivePlans.length !== 1 ? 's' : ''}
  </Badge>
</div>
```

### 3. Criar lista unificada
**Localização:** Substituir todo o conteúdo das Tabs

**Adicionar antes do return:**
```tsx
// Combinar todos os planos (ativos primeiro, depois inativos)
const allPlans = [...activePlans, ...inactivePlans];
```

**Substituir Tabs por:**
```tsx
<div className="space-y-3">
  {allPlans.length === 0 ? (
    <Card className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border-slate-700/40">
      <CardContent className="p-12 text-center">
        {/* Conteúdo do card vazio */}
      </CardContent>
    </Card>
  ) : (
    <>
      {allPlans.map((plan) => (
        <CompactPlanCard key={plan.id} plan={plan} />
      ))}
    </>
  )}
</div>
```

### 4. Criar componente CompactPlanCard
**Adicionar após calcularTotais:**

```tsx
const CompactPlanCard = ({ plan }: { plan: any }) => {
  const isActive = plan.status === 'active' || plan.active;
  const totais = calcularTotais(plan);
  
  return (
    <Card 
      className={`
        bg-white border hover:shadow-lg transition-all duration-300 overflow-hidden
        ${isActive ? 'border-[#00C98A]/30 shadow-[#00C98A]/10' : 'border-gray-200 opacity-90 hover:opacity-100'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Informações principais */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-base font-bold text-[#222222] flex items-center gap-2">
                <Utensils className={`w-4 h-4 ${isActive ? 'text-[#00C98A]' : 'text-gray-400'}`} />
                {plan.name}
              </h3>
              
              {/* Badge de Status - NOVO */}
              {isActive ? (
                <Badge className="bg-[#00C98A]/20 text-[#00C98A] border-[#00C98A]/30 text-xs h-5">
                  <Power className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="outline" className="border-gray-300 text-gray-500 bg-gray-50 text-xs h-5">
                  <PowerOff className="w-3 h-3 mr-1" />
                  Inativo
                </Badge>
              )}
              
              {/* Badges existentes */}
              {plan.is_released && (
                <Badge className="bg-green-500/20 text-green-700 border-green-500/30 text-xs h-5">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Liberado
                </Badge>
              )}
              
              {plan.favorite && (
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-600 bg-yellow-50 text-xs h-5">
                  <Star className="w-3 h-3 mr-1 fill-yellow-500" />
                  Favorito
                </Badge>
              )}
            </div>
            
            {plan.notes && (
              <p className="text-xs text-[#777777] line-clamp-1 mb-2">{plan.notes}</p>
            )}
            
            {/* Macros em linha compacta - NOVO LAYOUT */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="font-semibold text-[#222222]">{totais.calorias.toLocaleString('pt-BR')}</span>
                <span className="text-[#777777]">kcal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="font-semibold text-[#222222]">{totais.proteinas.toFixed(0)}g</span>
                <span className="text-[#777777]">prot</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="font-semibold text-[#222222]">{totais.carboidratos.toFixed(0)}g</span>
                <span className="text-[#777777]">carb</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-[#222222]">{totais.gorduras.toFixed(0)}g</span>
                <span className="text-[#777777]">gord</span>
              </div>
            </div>
            
            {/* Data de criação */}
            <div className="flex items-center gap-1 mt-2 text-xs text-[#777777]">
              <Calendar className="w-3 h-3" />
              {new Date(plan.created_at).toLocaleDateString('pt-BR')}
              {plan.released_at && (
                <>
                  <span className="mx-1">•</span>
                  <CheckCircle className="w-3 h-3" />
                  Liberado em {new Date(plan.released_at).toLocaleDateString('pt-BR')}
                </>
              )}
            </div>
          </div>
          
          {/* Ações - mantém dropdown existente */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              className="h-8 w-8 p-0"
            >
              <Star className={`w-4 h-4 ${plan.favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
            </Button>
            
            <DropdownMenu>
              {/* Mantém todo o conteúdo do dropdown existente */}
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
};
```

### 5. Adicionar ícones necessários
**Localização:** Imports no topo do arquivo

**Adicionar aos imports do lucide-react:**
```tsx
import { ..., Power, PowerOff } from 'lucide-react';
```

### 6. Remover estado não utilizado
**Localização:** Estados do componente

**Remover:**
```tsx
const [activeTab, setActiveTab] = useState<string>("active");
```

## Benefícios da Implementação

1. **Visualização Unificada**: Todos os planos em um único local
2. **Layout Compacto**: Altura reduzida dos cards (de ~400px para ~120px)
3. **Diferenciação Visual Clara**: Badge de status (Ativo/Inativo) em destaque
4. **Melhor UX**: Fácil comparação entre planos ativos e inativos
5. **Mantém Funcionalidades**: Todas as ações (editar, duplicar, deletar, etc.) preservadas
6. **Design Moderno**: Macros em linha, badges coloridos, hover effects

## Notas de Implementação

- O card compacto tem altura de aproximadamente 120px vs 400px+ do card original
- Planos ativos aparecem primeiro na lista (ordenação mantida)
- Badge de status usa cores do sistema: verde para ativo, cinza para inativo
- Macros exibidos em formato inline compacto com indicadores coloridos
- Todas as funcionalidades do dropdown menu são mantidas
- Filtro de favoritos continua funcionando normalmente
