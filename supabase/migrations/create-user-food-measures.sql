-- Criar a tabela user_food_measures para relacionar usuário -> alimento -> unidade -> gramas
CREATE TABLE IF NOT EXISTS public.user_food_measures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    food_name TEXT NOT NULL,
    unit_name TEXT NOT NULL,
    gram_weight NUMERIC NOT NULL CHECK (gram_weight > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Uma restrição única para evitar que o mesmo usuário cadastre a mesma unidade 2x pro mesmo alimento
    UNIQUE(user_id, food_name, unit_name)
);

-- Ativar RLS (Row Level Security)
ALTER TABLE public.user_food_measures ENABLE ROW LEVEL SECURITY;

-- Criar política para o usuário visualizar apenas suas próprias medidas
CREATE POLICY "Usuários podem ver suas próprias medidas" ON public.user_food_measures
    FOR SELECT USING (auth.uid() = user_id);

-- Criar política para o usuário inserir/atualizar apenas suas próprias medidas
CREATE POLICY "Usuários podem inserir suas próprias medidas" ON public.user_food_measures
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias medidas" ON public.user_food_measures
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias medidas" ON public.user_food_measures
    FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar a coluna updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at na tabela de medidas
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.user_food_measures
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Comentários para documentação (opcional mas boa prática)
COMMENT ON TABLE public.user_food_measures IS 'Guarda os pesos customizados (medidas caseiras) das unidades dos alimentos por usuário.';
COMMENT ON COLUMN public.user_food_measures.food_name IS 'Nome do alimento (ex: Arroz branco, cozido)';
COMMENT ON COLUMN public.user_food_measures.unit_name IS 'Nome da unidade customizada (ex: colher de sopa)';
COMMENT ON COLUMN public.user_food_measures.gram_weight IS 'O peso em gramas dessa unidade correspondente';
