-- pop_roles table
CREATE TABLE IF NOT EXISTS public.pop_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Dropped constraint to allow mock users temporarily
    role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'intern')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- pop_versions table
CREATE TABLE IF NOT EXISTS public.pop_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    author_id UUID, -- Dropped constraint to allow mock users temporarily
    changelog TEXT,
    is_active BOOLEAN DEFAULT false,
    steps JSONB DEFAULT '[]'::jsonb NOT NULL,
    checklist_categories JSONB DEFAULT '[]'::jsonb NOT NULL,
    checklist_items JSONB DEFAULT '[]'::jsonb NOT NULL,
    common_errors JSONB DEFAULT '[]'::jsonb NOT NULL
);

-- pop_sessions table
CREATE TABLE IF NOT EXISTS public.pop_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES public.pop_versions(id) ON DELETE CASCADE,
    intern_id UUID NOT NULL, -- Dropped constraint to allow mock users temporarily
    supervisor_id UUID, -- Dropped constraint to allow mock users temporarily
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'ready_for_review', 'in_correction', 'approved')),
    patient_case JSONB DEFAULT '{}'::jsonb NOT NULL,
    completed_step_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
    step_notes JSONB DEFAULT '{}'::jsonb NOT NULL,
    intern_general_notes TEXT DEFAULT '',
    intern_questions TEXT DEFAULT '',
    checked_item_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
    supervisor_feedback TEXT DEFAULT '',
    supervisor_adjustments TEXT DEFAULT '',
    score NUMERIC DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.pop_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pop_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pop_sessions ENABLE ROW LEVEL SECURITY;

-- Basic Policies for Authenticated Team Members
CREATE POLICY "Allow authenticated users to read pop_roles" ON public.pop_roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert pop_roles" ON public.pop_roles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update pop_roles" ON public.pop_roles FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read pop_versions" ON public.pop_versions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert pop_versions" ON public.pop_versions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update pop_versions" ON public.pop_versions FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read pop_sessions" ON public.pop_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert pop_sessions" ON public.pop_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update pop_sessions" ON public.pop_sessions FOR UPDATE USING (auth.role() = 'authenticated');
