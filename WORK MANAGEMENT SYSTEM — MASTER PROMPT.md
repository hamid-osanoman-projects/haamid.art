# WORK MANAGEMENT SYSTEM — MASTER PROMPT
## haaamid.art · Hamid U V · Complete Work OS
### Personal + Company + Freelance — Full Specification

---

> **How to use:** After the agent has read MASTER_PROMPT.md and the main sessions are complete,
> paste this document as an UPDATE to the existing works system built in Session 07.
> Tell the agent: "Read this. This replaces and expands everything built in Session 07.
> We are upgrading the works management system completely."

---

## WHAT WE ARE UPGRADING

The basic works system was built in Session 07. This prompt expands it into a
**complete professional work OS** covering every aspect of how Hamid manages work:

- Company tasks (things Hamid does for his employer)
- Freelance projects (client work Hamid does independently)
- Personal projects (side projects, learning, experiments)
- Work statuses, priorities, deadlines, time tracking
- Client communication log
- Invoice and payment tracking
- Weekly planning and review
- Work analytics and insights

---

## THREE TRACKS — HOW HAMID THINKS ABOUT WORK

```
TRACK 1: COMPANY
  Work Hamid does as an employee.
  Tasks assigned by team, manager, or self-assigned internal work.
  No invoicing. No client. Just tasks to track and complete.
  Examples: "Fix login bug", "Build dashboard UI", "Code review for Ahmad"

TRACK 2: FREELANCE
  Projects Hamid does for external paying clients.
  Has budget, timeline, milestones, invoices.
  Examples: "Rebuild TechCo website", "E-commerce for client X"

TRACK 3: PERSONAL
  Side projects, learning goals, experiments.
  No client, no invoice. Just Hamid building things for himself.
  Examples: "Learn Three.js", "Build haaamid.art", "Read Next.js docs"
```

---

## DATABASE SCHEMA UPDATE

Run this SQL in Supabase to ADD columns to the existing works table
and create new supporting tables:

```sql
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
```

---

## FOLDER STRUCTURE (update/expand)

```
app/(dashboard)/
└── works/
    ├── page.tsx                    # Works home — all tracks overview
    ├── company/
    │   └── page.tsx                # Company Kanban board
    ├── freelance/
    │   ├── page.tsx                # Freelance project cards
    │   └── [id]/
    │       └── page.tsx            # Freelance project detail
    ├── personal/
    │   └── page.tsx                # Personal projects / goals
    ├── all/
    │   └── page.tsx                # All works across all tracks, table view
    ├── week/
    │   └── page.tsx                # This week's plan + review
    └── time/
        └── page.tsx                # Time tracking log

components/dashboard/works/
├── KanbanBoard.tsx                 # Drag-drop Kanban columns
├── KanbanColumn.tsx                # Single column (droppable)
├── TaskCard.tsx                    # Task card in Kanban
├── TaskDrawer.tsx                  # Right-side detail panel
├── TaskForm.tsx                    # Add/edit task form
├── SubtaskList.tsx                 # Checklist of subtasks
├── TimeLogPanel.tsx                # Time logging + history
├── ActivityFeed.tsx                # Append-only update log
├── AttachmentsList.tsx             # Links, files, Figma refs
├── StatusSelector.tsx              # Status dropdown with icons
├── PrioritySelector.tsx            # Priority picker
├── WorkCard.tsx                    # Freelance/personal project card
├── WorkDetail.tsx                  # Full project detail page
├── MilestoneList.tsx               # Milestone checklist
├── InvoicePanel.tsx                # Invoice management
├── WeeklyPlan.tsx                  # Weekly planning widget
├── WorkFilters.tsx                 # Filter bar (status, priority, track)
├── WorkSearch.tsx                  # Search across all works
└── WorkAnalytics.tsx               # Charts and insights

api/
└── works/
    ├── route.ts                    # GET all, POST new
    ├── [id]/
    │   ├── route.ts                # GET one, PUT update, DELETE
    │   ├── updates/route.ts        # POST activity log entry
    │   ├── subtasks/route.ts       # GET/POST subtasks
    │   ├── subtasks/[sid]/route.ts # PUT/DELETE single subtask
    │   ├── time/route.ts           # GET/POST time logs
    │   ├── time/[tid]/route.ts     # DELETE time log
    │   ├── attachments/route.ts    # GET/POST attachments
    │   └── send-review/route.ts    # Send review request to client
    ├── week/route.ts               # GET/POST weekly plan
    └── stats/route.ts              # Work analytics data
```

---

## SECTION 1 — WORKS HOME PAGE (/dashboard/works)

This is the first page Hamid sees when he clicks Works.
It is a **command center** — one page that shows everything.

```
Layout: full width, no sidebar panel yet

TOP ROW — 5 quick stat cards:
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│  Due today   │  This week   │  In progress │   Blocked    │  Done (week) │
│      3       │      8       │      5       │      1       │      7       │
│  company:2   │  all tracks  │  all tracks  │  !! urgent   │  📈 +2 vs   │
│  freelance:1 │              │              │              │  last week   │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘

MIDDLE ROW — 3 column layout:

Left column (40%): TODAY'S FOCUS
  - Tasks due today (sorted by priority)
  - Tasks Hamid marked "this week" that aren't done
  - Each task: track badge (company/freelance/personal) + title + priority dot
  - Click → opens task drawer
  - "+ Quick add" at bottom — inline input, press Enter to add

Middle column (35%): ACTIVE PROJECTS
  - Freelance projects with status = 'in_progress'
  - Each: project name, client, progress bar, days until deadline
  - Color-coded deadline: green (>7d), amber (3-7d), red (<3d)
  - Click → goes to /dashboard/works/freelance/[id]

Right column (25%): WEEKLY SNAPSHOT
  - Current week's plan (goals from weekly_plans table)
  - Hours logged this week (sum from work_time_logs)
  - Tasks completed vs planned this week
  - "Plan this week" button → /dashboard/works/week

BOTTOM ROW — Recent activity feed:
  - Last 10 work_updates across all works
  - Format: "[task name] — [update text] — [time ago]"
  - Grouped by today / yesterday / this week
```

---

## SECTION 2 — COMPANY WORKS (/dashboard/works/company)

This is where Hamid tracks everything he does for his employer.

### Page layout

```
HEADER:
  - Page title: "Company works"
  - View toggle: Kanban | List | Table
  - Quick filters row:
    [ All ] [ Today ] [ This week ] [ Overdue ] [ Blocked ] [ Mine ] [ High priority ]
  - Search box (live filter, searches title + description + tags)
  - "+ Add task" button (opens slide-over form)

KANBAN VIEW (default):
  Columns in order:
  1. Backlog      — grey header
  2. This Week    — blue header
  3. In Progress  — purple header (Hamid's accent color)
  4. Blocked      — red header
  5. In Review    — amber header
  6. Done         — green header (auto-collapses after 10 items, "show more")

  Each column:
  - Header: column name + task count
  - Task cards (draggable)
  - "+ Add task" at bottom of each column
  - Scroll independently

  TASK CARD shows:
  ┌─────────────────────────────────────────────┐
  │ 🔴 [urgent]  ⚡ Frontend                    │
  │                                             │
  │ Fix the authentication redirect bug         │
  │                                             │
  │ ■■■■□□□□□□  40%                             │
  │                                             │
  │ 📅 Jan 15   ⏱ 2.5h   💬 3                  │
  └─────────────────────────────────────────────┘

  Card elements explained:
  - Top: priority dot + priority label + tag chips
  - Middle: task title (2 lines max, ellipsis)
  - Progress bar (from subtasks completion or manual %)
  - Bottom row: due date + hours logged + update count

  Card interactions:
  - Drag between columns → updates status in Supabase
  - Click anywhere on card → opens Task Drawer (right side panel)
  - Right-click → context menu:
      Edit | Duplicate | Move to freelance | Move to personal |
      Copy link | Delete
  - Hover → shows quick actions: [✓ Done] [⏸ Block] [⏰ Snooze]

LIST VIEW:
  All tasks in a flat list, grouped by status
  Columns: [ ] checkbox | Priority | Title | Tags | Due date | Hours | Status
  Click row → opens Task Drawer
  Check checkbox → marks as done instantly

TABLE VIEW:
  Dense data table, all fields visible, sortable columns
  Good for end-of-week review or reporting
```

### Task Drawer — the heart of the system

When Hamid clicks a task, a panel slides in from the right (width: 480px on desktop, full screen on mobile). This is where all the work happens.

```
TASK DRAWER LAYOUT:

─── HEADER ───────────────────────────────────────────
[Track badge: COMPANY]  [Status selector ▾]  [⋮ More]
  Title (large, click to edit inline, auto-saves)
──────────────────────────────────────────────────────

─── META ROW ─────────────────────────────────────────
Priority [▾]  |  Due date [📅]  |  Est. [⏱ hrs]  |  Labels [🏷 +]
──────────────────────────────────────────────────────

─── PROGRESS ─────────────────────────────────────────
Progress: [■■■■■□□□□□] 50%  [manual slider OR auto from subtasks]
──────────────────────────────────────────────────────

─── TABS ─────────────────────────────────────────────
[ Details ] [ Subtasks ] [ Time ] [ Updates ] [ Attachments ]

DETAILS TAB:
  Description — rich textarea (markdown, auto-saves on blur)
  Tags — type to add, click × to remove
  If blocked: "Blocked reason" text field (required when status=blocked)
  Recurring toggle — if on: select interval (daily/weekly/monthly)
  Started at / Completed at (auto-set, but editable)

SUBTASKS TAB:
  Checklist of subtasks
  ☐ Write unit tests
  ☑ Set up database schema
  ☐ Build the UI
  ☐ Code review
  Each subtask:
  - Checkbox (click to toggle complete)
  - Title (click to edit inline)
  - Drag handle to reorder
  - × to delete
  Bottom: text input to add new subtask (press Enter to add)
  Progress auto-calculates from subtask completion

TIME TAB:
  "Log time" input: [date] [hours] [description] [+ Log] button
  Today's date pre-filled, easy to change
  Time log history:
  Jan 15  2.5h  "Fixed the redirect logic"       [×]
  Jan 14  1.0h  "Initial investigation"           [×]
  Jan 13  0.5h  "Set up test environment"         [×]
  ───────────────────────────────────
  Total: 4.0h logged  /  6.0h estimated  (67%)

UPDATES TAB:
  Append-only activity log (like a work journal for this task)
  Shows all updates in reverse chronological order:

  Today 14:32
  "Identified root cause — the middleware was stripping the
  auth cookie on redirect. Fix is ready, needs testing."

  Today 09:15
  "Started investigating. Reproduced on staging."

  Yesterday 17:00
  "Task assigned by Ahmad. Priority marked urgent."

  Text input at top to add new update (Ctrl+Enter to submit)
  Cannot edit or delete updates (intentional — it's a log)

ATTACHMENTS TAB:
  List of links, files, and references:
  🔗 Figma design — figma.com/file/...
  🐙 GitHub PR — github.com/...
  📄 Requirements doc — notion.so/...
  📎 Screenshot.png — (uploaded to Supabase Storage)
  [ + Add link ] button — type or paste URL, auto-detects type
  [ + Upload file ] button — uploads to Supabase Storage images bucket

─── FOOTER ───────────────────────────────────────────
[Delete task]              [Mark done ✓] or [Reopen]
──────────────────────────────────────────────────────
```

### Status selector — detailed

```typescript
// Status options with icons and colors
const statuses = [
  { value: 'backlog',     label: 'Backlog',     icon: '○',  color: '#737373' },
  { value: 'this_week',   label: 'This week',   icon: '◎',  color: '#3B82F6' },
  { value: 'in_progress', label: 'In progress', icon: '●',  color: '#7F77DD' },
  { value: 'blocked',     label: 'Blocked',     icon: '⊗',  color: '#EF4444' },
  { value: 'in_review',   label: 'In review',   icon: '◑',  color: '#F59E0B' },
  { value: 'done',        label: 'Done',        icon: '✓',  color: '#22C55E' },
  { value: 'cancelled',   label: 'Cancelled',   icon: '✕',  color: '#525252' },
  { value: 'on_hold',     label: 'On hold',     icon: '⏸',  color: '#A855F7' },
]

// When status changes to 'done': auto-set completed_at = now()
// When status changes from 'backlog' to anything active: auto-set started_at = now()
// When status changes to 'blocked': require blocked_reason to be filled
```

### Priority selector

```typescript
const priorities = [
  { value: 'urgent', label: 'Urgent', color: '#EF4444', icon: '🔴', description: 'Drop everything' },
  { value: 'high',   label: 'High',   color: '#F97316', icon: '🟠', description: 'Do this week' },
  { value: 'medium', label: 'Medium', color: '#3B82F6', icon: '🔵', description: 'Do this sprint' },
  { value: 'low',    label: 'Low',    color: '#737373', icon: '⚪', description: 'Do when time allows' },
]
```

---

## SECTION 3 — FREELANCE WORKS (/dashboard/works/freelance)

Freelance is project-based, not task-based. Each entry is a whole project with a client, budget, timeline, and deliverables.

### Project list page

```
HEADER:
  Page title: "Freelance projects"
  View toggle: Cards | Pipeline | Table
  Filter: [ All ] [ Lead ] [ Active ] [ Complete ] [ On hold ]
  "+ New project" button

PIPELINE VIEW (default — shows the sales funnel):

  Lead        Proposal     Active      Complete    On Hold
  ────────    ────────     ────────    ────────    ────────
  [Card]      [Card]       [Card]      [Card]      [Card]
  [Card]                   [Card]
                           [Card]

  Revenue shown at bottom of each column:
  "3 projects · 1,500 OMR"

PROJECT CARD shows:
  ┌─────────────────────────────────────────────┐
  │ [Client avatar/initials]  TechCo Muscat     │
  │ SaaS Dashboard Redesign                     │
  │                                             │
  │ ████████░░  80% complete                    │
  │                                             │
  │ 💰 1,200 OMR   📅 Jan 30   ⏱ 24h logged    │
  │                                             │
  │ [INVOICE: 600 OMR unpaid] ⚠️               │
  └─────────────────────────────────────────────┘

  Color accent bar on left = status color
  Invoice warning badge if there's an unpaid invoice
```

### Project detail page (/dashboard/works/freelance/[id])

```
Full page (not a drawer — projects have too much content)

─── PAGE HEADER ──────────────────────────────────────
  Back ←   SaaS Dashboard Redesign
  [Status pipeline: Lead → Proposal → Active → Complete]
                              ↑ (current step highlighted)
  Edit | Archive | Delete
──────────────────────────────────────────────────────

─── QUICK STATS ROW ──────────────────────────────────
  Budget: 1,200 OMR  |  Paid: 600 OMR  |  Deadline: Jan 30  |  Days left: 12  |  Hours: 24.5h
──────────────────────────────────────────────────────

─── TAB NAVIGATION ───────────────────────────────────
  [ Overview ] [ Milestones ] [ Time log ] [ Invoices ]
  [ Updates ] [ Client ] [ Attachments ]
──────────────────────────────────────────────────────

OVERVIEW TAB:
  Description / scope of work (markdown, editable)
  Tech stack used (same chip input as other places)
  Project URL (live link) + GitHub URL
  Notes (private, for Hamid only)

MILESTONES TAB:
  Visual timeline of milestones:

  ✓  Project kickoff & requirements         Jan 5   ──── done
  ✓  Design mockups delivered               Jan 10  ──── done
  ●  Frontend implementation                Jan 20  ──── in progress
  ○  Backend API integration                Jan 25  ──── pending
  ○  Testing & QA                           Jan 28  ──── pending
  ○  Final delivery & handover              Jan 30  ──── pending

  Progress: 2 of 6 milestones complete (33%)

  Each milestone:
  - Checkbox (click to complete)
  - Title (editable)
  - Due date (date picker)
  - Drag to reorder
  - Delete button
  - Optional: description, notes
  "Add milestone" at bottom

TIME LOG TAB:
  Same as company task time log, but shows
  total across the whole project (not per task)
  Also shows: hourly rate (if set) × hours = value generated

INVOICES TAB:
  Invoice list:
  ┌────────────────────────────────────────────────────────────┐
  │ Invoice #001  │  600 OMR  │  Due Jan 15  │  PAID ✓         │
  │ Invoice #002  │  600 OMR  │  Due Jan 30  │  UNPAID ⚠       │
  └────────────────────────────────────────────────────────────┘
  Total: 1,200 OMR  |  Paid: 600 OMR  |  Outstanding: 600 OMR

  "Create invoice" button → modal:
    Amount, currency (OMR default), due date, notes
    Saves to invoices table
    Option to send email reminder to client via Resend

  Mark paid button → sets status=paid, paid_at=now()

  "Send review request" button →
    Sends email to client with magic link token
    /review?token=abc → client fills review form
    (connects to the review system from main portfolio)

UPDATES TAB:
  Project-level activity log
  Same append-only format as task updates
  Good for logging client calls, feedback, decisions

CLIENT TAB:
  Shows linked client from clients table:
  Name, company, email, phone
  Quick action: send email | schedule meeting | view all projects
  "Change client" dropdown if wrong client linked

ATTACHMENTS TAB:
  Same as task attachments
  Good for: contract PDFs, design files, briefs
```

---

## SECTION 4 — PERSONAL WORKS (/dashboard/works/personal)

```
Personal projects are different from company and freelance.
No client, no invoice, no deadline pressure.
More like a learning and building tracker.

PAGE LAYOUT:

HEADER:
  "Personal projects"
  "+ New project"

TWO SECTIONS:

1. ACTIVE PROJECTS (status = in_progress or this_week)
   Card grid, 3 columns:
   ┌──────────────────────────────┐
   │ 🎨                           │
   │ Learn Three.js               │
   │ Personal · Learning          │
   │                              │
   │ ████████░░  80%              │
   │ Last updated: 2 days ago     │
   └──────────────────────────────┘

   Card has a large emoji icon (set by Hamid when creating)
   Category tags: Learning / Building / Research / Reading / Other

2. BACKLOG (status = backlog)
   Simple list view:
   ○ Read "Clean Code" book
   ○ Experiment with Rust
   ○ Build a CLI tool for Supabase
   ○ Set up home server

   Each item: click to open drawer, drag to reorder,
   checkbox to complete

ADD PERSONAL PROJECT MODAL:
  Title, emoji icon picker, category, description,
  target completion date (optional), no client/budget needed
```

---

## SECTION 5 — ALL WORKS TABLE (/dashboard/works/all)

```
A power-user view showing every task and project
across all three tracks in one searchable table.

TABLE COLUMNS (sortable, resizable):
  Track | Status | Priority | Title | Client/Context | Due date | Hours | Updated

FILTER BAR ABOVE TABLE:
  Track:    [ All ▾ ] [ Company ] [ Freelance ] [ Personal ]
  Status:   [ All ▾ ] (multi-select status checkboxes)
  Priority: [ All ▾ ] [ Urgent ] [ High ] [ Medium ] [ Low ]
  Date:     [ All ▾ ] [ Overdue ] [ Today ] [ This week ] [ This month ]
  Search:   [🔍 Search all works...          ]

BULK ACTIONS (appear when rows are checked):
  Change status | Change priority | Delete | Export to CSV

EXPORT TO CSV:
  Downloads all filtered works as a CSV file
  Columns: id, title, track, status, priority, due_date,
           estimated_hours, actual_hours, client, tags, created_at
```

---

## SECTION 6 — WEEKLY PLAN (/dashboard/works/week)

```
Hamid's weekly planning and review ritual.
Opens every Monday morning to plan, every Sunday to review.

PAGE LAYOUT:

HEADER:
  "Week of Jan 13 – Jan 19, 2025"
  [ ← Previous week ] [ This week ] [ Next week → ]

LEFT SIDE (60%) — THE PLAN:

  THIS WEEK'S GOALS (top 3):
  ┌─────────────────────────────────────────────────┐
  │ 1. [ Complete TechCo dashboard milestone 3    ] │
  │ 2. [ Fix company auth bug and get it reviewed ] │
  │ 3. [ Log at least 2h on Three.js learning     ] │
  └─────────────────────────────────────────────────┘
  (editable text inputs, saved to weekly_plans.goals)

  THIS WEEK'S TASKS (pulled from works):
  Tasks with due_date this week OR status='this_week':

  Company (3):
  ☐ 🔴 Fix authentication redirect bug    — due Jan 15
  ☐ 🔵 Code review for Ahmad's PR         — due Jan 16
  ☐ 🟠 Update API documentation           — due Jan 17

  Freelance (2):
  ☐ 🟠 Deliver TechCo milestone 3        — due Jan 18
  ☐ 🔵 Client call with Sarah R          — Jan 17 14:00

  Personal (1):
  ☐ 🔵 Three.js tutorial — chapters 4-6  — no deadline

  "Add to this week" — opens quick-add to add tasks to plan

  DRAG TASKS to reorder within each section
  Completed tasks show with strikethrough, moved to bottom

RIGHT SIDE (40%) — THE REVIEW:

  HOURS THIS WEEK:
  Mon  ████░░░░  2.5h
  Tue  ██████░░  3.0h
  Wed  ░░░░░░░░  0.0h  ← missed
  Thu  ████░░░░  2.0h
  Fri  ██░░░░░░  1.0h
  Sat  ░░░░░░░░  0.0h
  Sun  ░░░░░░░░  0.0h
  Total: 8.5h this week

  QUICK LOG TIME (right here without going to a task):
  Task: [dropdown of this week's tasks ▾]
  Hours: [___] Description: [___________] [+ Log]

  END OF WEEK REVIEW (appears on Sunday or if looking at past week):
  "What went well?"  [textarea]
  "What was blocked?" [textarea]
  "Carry over to next week?" [checklist of undone tasks]
  [Save review] button

BOTTOM — WEEKLY STATS:
  Tasks planned: 6  |  Tasks completed: 4  |  Completion rate: 67%
  Hours logged: 8.5h  |  Company: 4.5h  |  Freelance: 3.5h  |  Personal: 0.5h
```

---

## SECTION 7 — TIME TRACKING (/dashboard/works/time)

```
Dedicated time tracking view — shows where Hamid's time goes.

PAGE LAYOUT:

DATE RANGE SELECTOR: [ This week ▾ ] or custom date range

SUMMARY CARDS:
  Total hours | Company hours | Freelance hours | Personal hours | Avg per day

BAR CHART:
  Daily hours for the selected range
  Stacked bars: company (purple) | freelance (green) | personal (blue)

TIME LOG TABLE:
  Date | Task/Project | Track | Hours | Description | Actions
  Sorted by date desc
  Click row → opens the linked task

EXPORT:
  "Export time log" → CSV with all entries in date range
  Useful for invoicing (show client "here are the hours I logged")

QUICK LOG:
  Floating "+ Log time" button (bottom right)
  Modal: select task from dropdown, date, hours, description
  Works without going to a specific task
```

---

## SECTION 8 — API ROUTES (complete)

### GET /api/works — fetch all works with filters

```typescript
// Query params: track, status, priority, due_before, due_after, search, limit, offset
// Returns works with computed fields from works_with_time view
// Sorted by: priority (urgent first) then due_date asc then created_at desc

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabase
    .from('works_with_time')
    .select('*, clients(name, company)')
    .eq('user_id', user.id)

  // Apply filters
  if (searchParams.get('track')) query = query.eq('track', searchParams.get('track')!)
  if (searchParams.get('status')) query = query.eq('status', searchParams.get('status')!)
  if (searchParams.get('priority')) query = query.eq('priority', searchParams.get('priority')!)
  if (searchParams.get('search')) query = query.ilike('title', `%${searchParams.get('search')}%`)
  if (searchParams.get('due_before')) query = query.lte('due_date', searchParams.get('due_before')!)

  // Smart sort: urgent first, then by due date, then newest
  query = query.order('priority', { ascending: false })
               .order('due_date', { ascending: true, nullsLast: true })

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ works: data })
}
```

### POST /api/works — create new work

```typescript
export async function POST(request: Request) {
  const body = await request.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Required: title, track
  // Optional: everything else
  const { data, error } = await supabase
    .from('works')
    .insert({
      user_id: user.id,
      title: body.title,
      track: body.track ?? 'company',
      status: body.status ?? 'backlog',
      priority: body.priority ?? 'medium',
      description: body.description ?? '',
      due_date: body.due_date ?? null,
      estimated_hours: body.estimated_hours ?? null,
      client_id: body.client_id ?? null,
      tags: body.tags ?? [],
      icon: body.icon ?? '📋',
      color: body.color ?? '#7F77DD',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })

  // Add initial update entry
  if (body.description) {
    await supabase.from('work_updates').insert({
      work_id: data.id,
      content: `Task created: ${body.title}`,
    })
  }

  return NextResponse.json({ work: data }, { status: 201 })
}
```

### PUT /api/works/[id] — update work

```typescript
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: existing } = await supabase
    .from('works').select('user_id, status').eq('id', params.id).single()

  if (!existing || existing.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Auto-set timestamps on status change
  const updates: any = { ...body, updated_at: new Date().toISOString() }

  if (body.status === 'done' && existing.status !== 'done') {
    updates.completed_at = new Date().toISOString()
  }
  if (body.status === 'in_progress' && existing.status === 'backlog') {
    updates.started_at = updates.started_at ?? new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('works')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })

  // Auto-log status change in updates
  if (body.status && body.status !== existing.status) {
    const statusLabels: Record<string, string> = {
      backlog: 'Backlog', this_week: 'This week', in_progress: 'In progress',
      blocked: 'Blocked', in_review: 'In review', done: 'Done',
      cancelled: 'Cancelled', on_hold: 'On hold'
    }
    await supabase.from('work_updates').insert({
      work_id: params.id,
      content: `Status changed to ${statusLabels[body.status]}${body.blocked_reason ? ': ' + body.blocked_reason : ''}`,
    })
  }

  return NextResponse.json({ work: data })
}
```

### POST /api/works/[id]/time — log time

```typescript
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { date, hours, description } = await request.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hours || hours <= 0) return NextResponse.json({ error: 'Invalid hours' }, { status: 400 })

  const { data, error } = await supabase
    .from('work_time_logs')
    .insert({
      work_id: params.id,
      user_id: user.id,
      date: date ?? new Date().toISOString().split('T')[0],
      hours,
      description: description ?? '',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })

  // Log the time entry in work updates
  await supabase.from('work_updates').insert({
    work_id: params.id,
    content: `Logged ${hours}h${description ? ': ' + description : ''}`,
  })

  return NextResponse.json({ log: data }, { status: 201 })
}
```

### POST /api/works/[id]/subtasks — add subtask

```typescript
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { title } = await request.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get current max sort_order
  const { data: existing } = await supabase
    .from('work_subtasks')
    .select('sort_order')
    .eq('work_id', params.id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing?.[0] ? existing[0].sort_order + 1 : 0

  const { data, error } = await supabase
    .from('work_subtasks')
    .insert({ work_id: params.id, title, sort_order: nextOrder })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ subtask: data }, { status: 201 })
}
```

### GET /api/works/stats — analytics data

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') ?? 'week'    // week | month | quarter | all
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Date range calculation
  const now = new Date()
  let fromDate: string
  if (range === 'week') fromDate = new Date(now.setDate(now.getDate() - 7)).toISOString()
  else if (range === 'month') fromDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString()
  else if (range === 'quarter') fromDate = new Date(now.setMonth(now.getMonth() - 3)).toISOString()
  else fromDate = '2020-01-01'

  const [
    { data: byStatus },
    { data: byTrack },
    { data: byPriority },
    { data: timeLogs },
    { data: completed },
  ] = await Promise.all([
    // Count by status
    supabase.rpc('count_works_by_status', { uid: user.id }),
    // Count by track
    supabase.from('works').select('track').eq('user_id', user.id),
    // Count by priority
    supabase.from('works').select('priority').eq('user_id', user.id).neq('status', 'done'),
    // Hours by day
    supabase.from('work_time_logs').select('date, hours, work_id').eq('user_id', user.id).gte('date', fromDate),
    // Completed in range
    supabase.from('works').select('completed_at, track').eq('user_id', user.id).eq('status', 'done').gte('completed_at', fromDate),
  ])

  return NextResponse.json({
    byStatus,
    byTrack: byTrack?.reduce((acc, w) => { acc[w.track] = (acc[w.track] || 0) + 1; return acc }, {} as Record<string, number>),
    totalHours: timeLogs?.reduce((sum, l) => sum + l.hours, 0) ?? 0,
    hoursByDay: timeLogs,
    completedCount: completed?.length ?? 0,
  })
}
```

---

## SECTION 9 — WORKS DASHBOARD OVERVIEW UPDATE

Update /dashboard/page.tsx to include enhanced work stats:

```typescript
// Add to existing dashboard overview:

// WORKS SECTION additions:
// 1. Show blocked tasks prominently — these need attention first
//    If any task has status='blocked', show a red alert banner at top:
//    "⚠️ 2 tasks are blocked — [View blocked tasks]"

// 2. Upcoming deadlines timeline:
//    Visual list of next 5 deadlines across all tracks:
//    Today   ●  Fix auth bug (Company) — URGENT
//    Jan 15  ●  Client call with TechCo (Freelance)
//    Jan 17  ●  Code review PR (Company) — high
//    Jan 20  ○  Milestone 3 delivery (Freelance)
//    Jan 25  ○  Three.js practice (Personal)

// 3. Time today widget:
//    "0h logged today"
//    Quick log: [task dropdown] [hours] [+ Log]
//    This makes time tracking frictionless

// 4. Freelance revenue widget:
//    This month: 600 OMR received / 1,200 OMR total
//    ████████░░  50% collected
//    [1 invoice overdue — send reminder]
```

---

## SECTION 10 — SMART FEATURES & AUTOMATIONS

### Auto-status detection (Edge Function)

```typescript
// Supabase Edge Function: check-overdue-works
// Runs daily at 8am via pg_cron
// Logic:
// 1. Find works where due_date < today and status NOT IN ('done','cancelled','on_hold')
//    → Mark these as needing attention (don't auto-change status, just flag them)
//    → Send Hamid an email: "You have 3 overdue tasks today"
//
// 2. Find works where status = 'this_week' but week has ended (it's Monday)
//    → Auto-move to 'backlog' unless they have hours logged
//    → Include in Monday morning email: "5 tasks carried over from last week"
//
// 3. Find freelance projects with invoice due_date = today
//    → Send Hamid: "Invoice for TechCo is due today — mark paid if received"
//    → Also send client a payment reminder email if configured
```

### Quick-add keyboard shortcut

```typescript
// Global keyboard shortcut: press 'N' anywhere in dashboard
// Opens a floating command-palette style quick-add modal:
//
// [What are you working on?                    ]
//  Company task  /  Freelance project  /  Personal
//
// Minimal fields: title, track (auto-detected from context), priority
// Creates task and goes back to wherever Hamid was
// The task lands in 'backlog' by default
```

### Recurring tasks

```typescript
// When a work has is_recurring = true:
// On completion (status → done):
//   Create a new copy of the task with:
//   - status = 'backlog'
//   - due_date = old due_date + recur_interval
//   - completed_at = null
//   - progress = 0
//   - subtasks all reset to unchecked
//   - Original task stays as done (history)
// Examples: "Weekly team standup notes", "Monthly client report"
```

---

## SESSION PROMPTS — PASTE ONE AT A TIME

---

### Works Update Session 1 — Database upgrade

```
Works Update Session 1: Upgrade the database schema.

Run the SQL from the DATABASE SCHEMA UPDATE section of
the work management master prompt in our Supabase project.

This adds:
- New columns to the existing works table
  (progress, blocked_reason, started_at, completed_at,
   is_recurring, recur_interval, track 'personal' option,
   updated status check with 8 statuses)
- work_time_logs table
- work_subtasks table
- work_attachments table
- weekly_plans table
- work_labels table
- works_with_time view
- this_week_works view

After running the SQL, create placeholder files for all
new routes and components listed in the FOLDER STRUCTURE section.

Confirm each table was created successfully.
```

---

### Works Update Session 2 — API routes

```
Works Update Session 2: Build all API routes.

Build every route listed in SECTION 8 of the work
management master prompt:

1. GET /api/works — with all filter params
2. POST /api/works — create work
3. PUT /api/works/[id] — update work with auto-timestamp logic
4. DELETE /api/works/[id] — delete work
5. POST /api/works/[id]/updates — add activity log entry
6. GET /api/works/[id]/updates — get all updates for a work
7. POST /api/works/[id]/subtasks — add subtask
8. PUT /api/works/[id]/subtasks/[sid] — toggle complete, edit title
9. DELETE /api/works/[id]/subtasks/[sid] — remove subtask
10. GET /api/works/[id]/time — get time logs
11. POST /api/works/[id]/time — log time
12. DELETE /api/works/[id]/time/[tid] — delete time log
13. GET /api/works/stats — analytics data

For PUT /api/works/[id]:
- Auto-set completed_at when status changes to 'done'
- Auto-set started_at when status moves from backlog to active
- Auto-log status change in work_updates table
- Verify user owns the work before allowing update

Test each route with a REST client or browser.
```

---

### Works Update Session 3 — Task Drawer component

```
Works Update Session 3: Build the TaskDrawer component.

This is the most important component in the works system.
Build components/dashboard/works/TaskDrawer.tsx exactly
as described in SECTION 2 under "Task Drawer — the heart
of the system" in the work management master prompt.

Requirements:
- Slides in from right, 480px wide on desktop, full screen on mobile
- Closes on ESC key or clicking the backdrop
- All fields auto-save on change (no Save button needed)
- 5 tabs: Details, Subtasks, Time, Updates, Attachments

DETAILS TAB:
- Title: large input, click to edit, saves on blur
- Status selector: custom dropdown using the 8 statuses with icons and colors
- Priority selector: dropdown with colored icons
- Due date: date picker input
- Estimated hours: number input
- Tags: type to add chip, click × to remove
- Blocked reason: text field (only shows when status = 'blocked')
- Description: textarea with markdown preview toggle

SUBTASKS TAB:
- Build SubtaskList component
- Each subtask: checkbox + title (editable) + drag handle + delete
- Checking a subtask calls PUT /api/works/[id]/subtasks/[sid]
- Adding subtask calls POST /api/works/[id]/subtasks
- Progress bar auto-updates based on subtask completion

TIME TAB:
- Quick log form at top: date + hours + description + Log button
- Calls POST /api/works/[id]/time on submit
- List of all time entries below with delete buttons
- Running total at bottom: "X.Xh logged / X.Xh estimated"

UPDATES TAB:
- Build ActivityFeed component
- Textarea at top with placeholder "Add an update..."
- Ctrl+Enter to submit, calls POST /api/works/[id]/updates
- List of all updates below, newest first
- Format: date+time header + update text
- No edit or delete (intentional — it is a log)

ATTACHMENTS TAB:
- Build AttachmentsList component
- "+ Add link" button: URL input + title, auto-detects type
  (github link → GitHub icon, figma → Figma icon, etc.)
- "+ Upload file" button: file picker → upload to Supabase Storage
- List of attachments: icon + title + link + delete button
```

---

### Works Update Session 4 — Company Kanban board

```
Works Update Session 4: Rebuild the company Kanban board.

Build app/(dashboard)/works/company/page.tsx and all
related components as described in SECTION 2 of the
work management master prompt.

Requirements:

1. Three views: Kanban (default), List, Table
   Toggled by buttons in the header

2. KANBAN VIEW:
   Use @dnd-kit/core and @dnd-kit/sortable
   8 columns: Backlog, This Week, In Progress, Blocked,
   In Review, Done, Cancelled, On Hold
   Only show Blocked column if there are blocked tasks
   Done column: collapses after 10 items with "Show more"
   Dragging a task between columns calls
   PUT /api/works/[id] with { status: newStatus }

3. TASK CARD exactly as described in SECTION 2:
   Priority dot + priority label + tags
   Title (2 lines max)
   Progress bar (from subtasks or manual %)
   Due date + hours logged + update count
   Hover state shows quick actions
   Right-click context menu

4. FILTERS:
   Build WorkFilters component
   [ All ] [ Today ] [ This week ] [ Overdue ] [ Blocked ]
   [ High priority ] — each is a toggle button
   Filters apply to the current view instantly
   Filters are additive (can combine)

5. SEARCH:
   Build WorkSearch component
   Live filter as Hamid types
   Searches: title, description, tags
   No API call — filters the already-loaded works array

6. QUICK ADD:
   Click "+ Add task" → opens AddTaskModal with:
   Title (required), priority (default medium),
   due date, tags, description (optional)
   On save: calls POST /api/works, adds to Kanban board
   at top of correct status column instantly

7. TASK DRAWER:
   Clicking a task card opens TaskDrawer (built in Session 3)
   Drawer overlays the Kanban board (does not navigate away)
   Updates to task are reflected in the card immediately
```

---

### Works Update Session 5 — Freelance project system

```
Works Update Session 5: Rebuild the freelance project system.

Build app/(dashboard)/works/freelance/page.tsx and
app/(dashboard)/works/freelance/[id]/page.tsx as described
in SECTION 3 of the work management master prompt.

LIST PAGE requirements:
1. Three views: Pipeline (default), Cards, Table
2. Pipeline view: 5 columns for the 5 freelance statuses
   (Lead, Proposal, Active, Complete, On Hold)
   Revenue total shown at bottom of each column
3. Project card as described (client initials, progress bar,
   budget, deadline, invoice warning)
4. "+ New project" → modal with: title, client selector,
   budget, currency, deadline, initial status, description

DETAIL PAGE requirements:
Build ALL 7 tabs: Overview, Milestones, Time log,
Invoices, Updates, Client, Attachments

MILESTONES TAB:
- Visual timeline as described
- Drag to reorder milestones
- Each milestone: checkbox, title, due date, optional notes
- Progress bar calculates from milestone completion
- Adding milestone calls POST to milestones table

INVOICES TAB:
- Invoice list with status badges
- "Create invoice" modal: amount, currency, due date, notes
- "Mark paid" button → updates status + sets paid_at
- "Send payment reminder" → sends email to client via Resend
  with invoice details and polite reminder text
- Revenue summary: total / paid / outstanding

SEND REVIEW REQUEST:
Build the send-review flow on the invoice tab or overview:
- Button: "Request client review"
- Creates a review token in reviews table
- Sends email via Resend to client (if email on file):
  Subject: "Quick review of our project together?"
  Body: warm message + link to haaamid.art/review?token=xxx
- Shows "Review requested on [date]" after sending
- If review is submitted and approved, shows it here
```

---

### Works Update Session 6 — Personal projects + Weekly plan

```
Works Update Session 6: Personal projects and weekly planning.

1. Build app/(dashboard)/works/personal/page.tsx
   As described in SECTION 4:
   - Two sections: Active projects + Backlog
   - Card grid for active with emoji icon + progress
   - Simple list for backlog with checkboxes
   - Add personal project modal: title, emoji picker,
     category (Learning/Building/Research/Reading/Other),
     description, optional target date

2. Build app/(dashboard)/works/week/page.tsx
   The weekly planning and review page as described
   in SECTION 6 of the work management master prompt:
   - Week navigation (prev/current/next)
   - This week's 3 goals (editable text inputs)
   - Task list grouped by track (company/freelance/personal)
   - Each task: track badge, priority dot, title, due date
   - Hours breakdown chart (Mon-Sun bar chart using recharts)
   - Quick time log widget on the right side
   - End of week review section (appears on Sunday or past weeks)
   - Save to weekly_plans table in Supabase

3. Build app/(dashboard)/works/time/page.tsx
   As described in SECTION 7:
   - Date range selector
   - Summary stat cards
   - Stacked bar chart (recharts) showing daily hours by track
   - Time log table with all entries
   - Export to CSV button
   - Quick log floating button
```

---

### Works Update Session 7 — All works table + analytics

```
Works Update Session 7: All works table and analytics.

1. Build app/(dashboard)/works/all/page.tsx
   As described in SECTION 5:
   - Searchable, filterable table view of ALL works
   - Filter bar: track, status, priority, date range, search
   - Sortable columns: click column header to sort
   - Bulk select: checkboxes + bulk action toolbar
   - Export to CSV: downloads filtered works
   - Row click → opens TaskDrawer

2. Update app/(dashboard)/dashboard/page.tsx
   Add the improvements from SECTION 9:
   - Blocked tasks alert banner (red, dismissable)
   - Upcoming deadlines timeline (next 5 across all tracks)
   - Time today widget with quick log
   - Freelance revenue widget (this month collected vs total)

3. Add global keyboard shortcut 'N' for quick add
   As described in SECTION 10:
   - Listen for keydown 'n' (not in input/textarea)
   - Open quick-add modal
   - Minimal fields: title + track
   - Creates task, returns to current page

4. Update sidebar navigation:
   Add "All works" and "This week" and "Time log" links
   under the Works section so all views are accessible:

   Works
   ├── Overview        → /dashboard/works
   ├── Company         → /dashboard/works/company
   ├── Freelance       → /dashboard/works/freelance
   ├── Personal        → /dashboard/works/personal
   ├── All works       → /dashboard/works/all
   ├── This week       → /dashboard/works/week
   └── Time log        → /dashboard/works/time
```

---

### Works Update Session 8 — Automations + polish

```
Works Update Session 8: Automations and final polish.

1. Build the deadline reminder Edge Function:
   Supabase Edge Function at supabase/functions/works-reminder/
   Triggered by pg_cron daily at 8am Muscat time
   Does:
   a. Find overdue tasks → email Hamid a list
   b. Find tasks due today → email "Due today" summary
   c. Find tasks due in 2 days → email "Due soon" warning
   d. Find freelance invoices overdue → email payment chase reminder
   e. On Mondays: "carry over" tasks from last week's plan email

2. Build recurring task automation:
   In PUT /api/works/[id], when status changes to 'done'
   AND the work has is_recurring = true:
   - Create a copy of the task with status='backlog'
   - Set due_date based on recur_interval:
     daily: tomorrow, weekly: +7 days, monthly: +1 month
   - Reset subtasks (copy structure but mark all unchecked)
   - Add update: "Recurring task reset for next cycle"

3. Polish the TaskDrawer:
   - Add keyboard shortcut: pressing Tab moves between
     the 5 tabs (Details → Subtasks → Time → Updates → Attachments)
   - Add "Duplicate task" in the ⋮ More menu
   - Add "Copy task link" — copies haaamid.art/dashboard/works/[id]
     to clipboard (deep link to the task)
   - Add "Move to track" submenu — move task between
     company / freelance / personal tracks

4. Mobile responsiveness check:
   - TaskDrawer: full screen on mobile (no 480px panel)
   - Kanban: horizontal scroll on mobile (columns don't wrap)
   - Weekly plan: stack left and right sections vertically
   - All filter bars: wrap to 2 rows on mobile
   - Time log: hide description column on small screens

5. Add works count badge to sidebar nav items:
   Company (3) — shows count of in_progress tasks
   Freelance (2) — shows count of active projects
   Personal (1) — shows count of active projects
   The badge updates every time works are fetched
```

---

## DONE WHEN — FULL CHECKLIST

```
Database:
  [ ] All new tables created (time_logs, subtasks, attachments, weekly_plans, labels)
  [ ] New columns added to works table
  [ ] Views created (works_with_time, this_week_works)
  [ ] All RLS policies active

Company works:
  [ ] Kanban board loads tasks from Supabase
  [ ] Drag between columns updates status
  [ ] 8 status columns shown correctly
  [ ] Task cards show priority, title, progress, due date
  [ ] Filter bar works (all filters)
  [ ] Search filters live
  [ ] TaskDrawer opens on click
  [ ] All 5 tabs in TaskDrawer work
  [ ] Subtasks: add, complete, delete, reorder
  [ ] Time logging: add entry, delete, see total
  [ ] Activity log: add update, cannot delete
  [ ] Attachments: add link, upload file
  [ ] Quick add modal works

Freelance:
  [ ] Pipeline view shows 5 status columns
  [ ] Project cards show budget, deadline, progress
  [ ] Project detail page loads all 7 tabs
  [ ] Milestones: add, complete, delete, reorder
  [ ] Invoice: create, mark paid, send reminder email
  [ ] Send review request works

Personal:
  [ ] Active projects grid renders
  [ ] Backlog list renders
  [ ] Add personal project modal works

Weekly plan:
  [ ] Week navigation works
  [ ] Goals save to Supabase
  [ ] Tasks load for current week
  [ ] Hours chart shows daily breakdown
  [ ] Quick time log from this page works
  [ ] Review section saves notes

Time tracking:
  [ ] Date range filter works
  [ ] Bar chart shows hours by day by track
  [ ] Time log table shows all entries
  [ ] Export CSV downloads file

All works:
  [ ] Table shows all tracks combined
  [ ] All filters work simultaneously
  [ ] Bulk select + bulk action
  [ ] CSV export

Dashboard:
  [ ] Blocked tasks alert shows when relevant
  [ ] Upcoming deadline timeline shows
  [ ] Time today widget works
  [ ] Revenue widget shows correct figures

Automations:
  [ ] Deadline reminder Edge Function deployed
  [ ] Recurring task creates copy on completion
  [ ] Monday morning email sends

Mobile:
  [ ] TaskDrawer is full screen on mobile
  [ ] Kanban scrolls horizontally on mobile
  [ ] All tap targets are large enough
```

---

*Work management system complete — Hamid has a full professional work OS.*
*Company tasks, freelance projects, personal goals, time tracking, weekly planning,*
*automated reminders, and revenue tracking — all in one place at haaamid.art/dashboard*