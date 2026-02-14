create table if not exists public.workspace_schedules (
  id uuid default gen_random_uuid() primary key,
  week_start_date date not null,
  day_of_week integer not null, -- 0=Monday, ... 6=Sunday (we will map this in frontend)
  hour integer not null, -- 6 to 22
  person_name text,
  task_description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users,
  unique(week_start_date, day_of_week, hour)
);

alter table public.workspace_schedules enable row level security;

create policy "Authenticated users can view schedules"
  on public.workspace_schedules for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert schedules"
  on public.workspace_schedules for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update schedules"
  on public.workspace_schedules for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete schedules"
  on public.workspace_schedules for delete
  using (auth.role() = 'authenticated');
