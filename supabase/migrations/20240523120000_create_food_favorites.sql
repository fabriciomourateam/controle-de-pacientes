create table if not exists public.food_favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  food_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, food_name)
);

alter table public.food_favorites enable row level security;

create policy "Users can view their own favorites"
  on public.food_favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
  on public.food_favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on public.food_favorites for delete
  using (auth.uid() = user_id);
