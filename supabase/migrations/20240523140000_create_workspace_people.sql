-- Create workspace_people table
create table if not exists public.workspace_people (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    color text not null, -- Store hex code or tailwind class
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users(id)
);

-- Add RLS to workspace_people
alter table public.workspace_people enable row level security;

create policy "Users can view all people"
    on public.workspace_people for select
    using (true);

create policy "Authenticated users can insert people"
    on public.workspace_people for insert
    with check (auth.role() = 'authenticated');

create policy "Users can update their own created people or all authenticated (simplified for workspace)"
    on public.workspace_people for update
    using (auth.role() = 'authenticated');

create policy "Users can delete people"
    on public.workspace_people for delete
    using (auth.role() = 'authenticated');


-- Add person_id to workspace_schedules to link to workspace_people
alter table public.workspace_schedules 
add column if not exists person_id uuid references public.workspace_people(id);
