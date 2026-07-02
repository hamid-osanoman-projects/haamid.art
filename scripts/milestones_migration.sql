-- ============================================
-- WORK MILESTONES (freelance project milestones)
-- ============================================

create table if not exists public.work_milestones (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  title text not null,
  description text default '',
  due_date date,
  completed boolean not null default false,
  completed_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_milestones_work on public.work_milestones(work_id);

alter table public.work_milestones enable row level security;

create policy "milestones: owner all" on public.work_milestones
  for all using (
    exists (
      select 1 from public.works w
      where w.id = work_id and w.user_id = auth.uid()
    )
  );
