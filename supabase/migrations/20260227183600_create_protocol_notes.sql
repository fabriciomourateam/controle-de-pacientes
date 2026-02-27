-- Create protocol_notes table for tracking diet/routine adjustments per patient
CREATE TABLE IF NOT EXISTS protocol_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telefone TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_id UUID NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by patient phone
CREATE INDEX IF NOT EXISTS idx_protocol_notes_telefone ON protocol_notes (telefone);
CREATE INDEX IF NOT EXISTS idx_protocol_notes_created_at ON protocol_notes (created_at DESC);

-- Enable RLS
ALTER TABLE protocol_notes ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read all notes
CREATE POLICY "Authenticated users can read protocol notes"
    ON protocol_notes FOR SELECT
    TO authenticated
    USING (true);

-- Policy: authenticated users can insert notes
CREATE POLICY "Authenticated users can insert protocol notes"
    ON protocol_notes FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: author can update their own notes
CREATE POLICY "Authors can update their own protocol notes"
    ON protocol_notes FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid());

-- Policy: author can delete their own notes
CREATE POLICY "Authors can delete their own protocol notes"
    ON protocol_notes FOR DELETE
    TO authenticated
    USING (author_id = auth.uid());
