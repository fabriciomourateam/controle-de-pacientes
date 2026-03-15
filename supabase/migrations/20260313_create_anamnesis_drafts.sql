-- Create anamnesis_drafts table
CREATE TABLE IF NOT EXISTS public.anamnesis_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutri_user_id UUID NOT NULL,
    telefone TEXT NOT NULL,
    current_step INTEGER DEFAULT 1,
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(nutri_user_id, telefone)
);

-- Comments for documentation
COMMENT ON TABLE public.anamnesis_drafts IS 'Stores temporary progress of student anamnesis forms.';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_anamnesis_drafts_telefone ON public.anamnesis_drafts(telefone);
CREATE INDEX IF NOT EXISTS idx_anamnesis_drafts_nutri_user_id ON public.anamnesis_drafts(nutri_user_id);

-- Enable RLS (though usually service role is used for the public form)
ALTER TABLE public.anamnesis_drafts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can insert/update drafts" ON public.anamnesis_drafts
    FOR ALL USING (true) WITH CHECK (true);
