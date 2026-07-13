-- ============================================
-- HABITS TRACKER TABLES
-- ============================================

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text default '',
  frequency text default 'daily',
  color text default '#7F77DD',
  icon text default 'Activity',
  created_at timestamptz not null default now()
);

alter table public.habits enable row level security;

create policy "habits: owner all" on public.habits
  for all using (auth.uid() = user_id);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  log_date date not null default current_date,
  status text not null check (status in ('completed', 'skipped', 'failed')),
  created_at timestamptz not null default now(),
  unique(habit_id, log_date)
);

alter table public.habit_logs enable row level security;

create policy "habit_logs: owner all" on public.habit_logs
  for all using (
    exists (
      select 1 from public.habits h
      where h.id = habit_id and h.user_id = auth.uid()
    )
  );
