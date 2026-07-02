-- ============================================
-- UPGRADE WORKS TABLE
-- ============================================

-- Add missing columns to existing works table
alter table public.works
  add column if not exists track_personal boolean default false,
  add column if not exists project_url text default '',
  add column if not exists github_url text default '',
  add column if not exists color text default '#7F77DD',
  add column if not exists icon text default '📋',
  add column if not exists progress int default 0
    check (progress between 0 and 100),
  add column if not exists blocked_reason text default '',
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists is_recurring boolean default false,
  add column if not exists recur_interval text default ''
    check (recur_interval in ('', 'daily', 'weekly', 'monthly'));

-- Update track check to include personal
alter table public.works
  drop constraint if exists works_track_check;

alter table public.works
  add constraint works_track_check
  check (track in ('company', 'freelance', 'personal'));

-- Update status to include more granular states
alter table public.works
  drop constraint if exists works_status_check;

alter table public.works
  add constraint works_status_check
  check (status in (
    'backlog',        -- Not started, not scheduled
    'this_week',      -- Planned for this week
    'in_progress',    -- Actively working on
    'blocked',        -- Stuck, waiting for something
    'in_review',      -- Waiting for feedback or review
    'done',           -- Completed
    'cancelled',      -- Won't do
    'on_hold'         -- Paused temporarily
  ));

-- ============================================
-- TIME LOGS (detailed time tracking per task)
-- ============================================

create table if not exists public.work_time_logs (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  hours numeric(4,1) not null check (hours > 0 and hours <= 24),
  description text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_time_logs_work on public.work_time_logs(work_id);
create index if not exists idx_time_logs_user_date on public.work_time_logs(user_id, date);

alter table public.work_time_logs enable row level security;

create policy "time_logs: owner all" on public.work_time_logs
  for all using (auth.uid() = user_id);

-- ============================================
-- SUBTASKS (checklist inside a task)
-- ============================================

create table if not exists public.work_subtasks (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_subtasks_work on public.work_subtasks(work_id);

alter table public.work_subtasks enable row level security;

create policy "subtasks: owner all" on public.work_subtasks
  for all using (
    exists (
      select 1 from public.works w
      where w.id = work_id and w.user_id = auth.uid()
    )
  );

-- ============================================
-- WORK ATTACHMENTS (links, files, references)
-- ============================================

create table if not exists public.work_attachments (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  type text not null check (type in ('link', 'file', 'figma', 'github', 'doc')),
  title text not null,
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.work_attachments enable row level security;

create policy "attachments: owner all" on public.work_attachments
  for all using (
    exists (
      select 1 from public.works w
      where w.id = work_id and w.user_id = auth.uid()
    )
  );

-- ============================================
-- WEEKLY PLANS (Sunday planning session)
-- ============================================

create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,             -- Monday of that week
  goals text[] default '{}',            -- 3 main goals for the week
  notes text default '',                -- Free-form planning notes
  review_notes text default '',         -- End-of-week review (filled Sunday)
  tasks_planned int default 0,
  tasks_completed int default 0,
  hours_logged numeric(5,1) default 0,
  created_at timestamptz not null default now(),
  unique(user_id, week_start)
);

alter table public.weekly_plans enable row level security;

create policy "weekly_plans: owner all" on public.weekly_plans
  for all using (auth.uid() = user_id);

-- ============================================
-- WORK LABELS (custom tags with colors)
-- ============================================

create table if not exists public.work_labels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text not null default '#7F77DD',
  created_at timestamptz not null default now()
);

alter table public.work_labels enable row level security;

create policy "labels: owner all" on public.work_labels
  for all using (auth.uid() = user_id);

-- ============================================
-- USEFUL VIEWS
-- ============================================

-- Works with time totals
create or replace view public.works_with_time as
select
  w.*,
  coalesce(t.total_hours, 0) as logged_hours,
  coalesce(s.total_subtasks, 0) as subtask_count,
  coalesce(s.done_subtasks, 0) as subtasks_done,
  case
    when coalesce(s.total_subtasks, 0) = 0 then w.progress
    else round((coalesce(s.done_subtasks, 0)::numeric / s.total_subtasks) * 100)
  end as computed_progress
from public.works w
left join (
  select work_id, sum(hours) as total_hours
  from public.work_time_logs
  group by work_id
) t on t.work_id = w.id
left join (
  select
    work_id,
    count(*) as total_subtasks,
    count(*) filter (where completed = true) as done_subtasks
  from public.work_subtasks
  group by work_id
) s on s.work_id = w.id;

-- This week's tasks
create or replace view public.this_week_works as
select * from public.works
where (
  status = 'this_week'
  or status = 'in_progress'
  or (due_date between current_date and current_date + 7)
)
and status not in ('done', 'cancelled');
