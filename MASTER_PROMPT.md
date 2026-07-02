# MASTER BUILD PROMPT — haaamid.art
## Hamid U V · Personal Portfolio OS
### Full-stack Next.js + Supabase system — complete feature specification

---

> **How to use this prompt:** Paste the entire document (or each section) into Claude, Cursor, or your AI coding assistant. Each section is self-contained and ordered by build priority. Start from Section 1 and work forward. Every feature described here is buildable with the free tier of the tools specified.

---

## OVERVIEW & PHILOSOPHY

Build **haaamid.art** — a personal portfolio OS for Hamid U V, a web and software developer based in Muscat, Oman. This is not a static portfolio. It is a living, automated system with two faces:

1. **Public face** — a stunning, SEO-optimised landing page and content hub that attracts visitors, converts clients, and builds an audience.
2. **Private face** — a clean, minimal authenticated dashboard that is Hamid's daily work OS: managing company tasks, freelance projects, clients, meetings, and Supabase projects.

**Design philosophy:**
- Landing page: bold, 3D, animated, immersive. "Vibe + web" energy. Make people stop scrolling.
- Dashboard: ultra-minimal, clean, fast. No clutter. Data-dense but breathable.
- Every feature must earn its place — either it saves Hamid time, makes him money, or builds his audience.

**Strategic priority order:**
1. Landing page (public face, SEO, first impression)
2. Authentication (gate for everything private)
3. Work management dashboard (daily utility — what Hamid opens every day)
4. Blog system (compounding SEO asset)
5. Automations (run while Hamid sleeps)
6. Visitor tracking + engagement systems
7. Gamification + unique features

---

## TECH STACK

```
Framework:      Next.js 15 (App Router, TypeScript)
Database:       Supabase (Postgres + Realtime + Storage + Edge Functions)
Auth:           Supabase Auth (Google OAuth + Magic Link)
Styling:        Tailwind CSS v4
Animations:     Framer Motion + Three.js (landing page only)
3D:             React Three Fiber + Drei
Email:          Resend (free — 3,000 emails/month)
Scheduling:     Cal.com (free tier, embedded)
Hosting:        Vercel (free tier — hobby plan)
Domain:         haaamid.art (via Cloudflare DNS)
Analytics:      Vercel Analytics (built-in, zero config)
Comments:       Giscus (GitHub Discussions, free)
PDF gen:        @react-pdf/renderer
Fingerprint:    FingerprintJS (free tier)
Geo:            ipapi.co (free tier — 1,000 req/day)
CI/CD/Cron:     GitHub Actions (free — 2,000 min/month)
AI features:    Anthropic Claude API (claude-sonnet-4-6)
Content:        next-mdx-remote (blog rendering)
Payments:       Lemon Squeezy (future digital products)
```

**All free to start. Zero cost until serious scale.**

---

## SECTION 1 — PROJECT STRUCTURE

```
haaamid.art/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # Landing page (SEO, 3D, animations)
│   │   ├── work/
│   │   │   ├── page.tsx                # All case studies
│   │   │   └── [slug]/page.tsx         # Individual project page
│   │   ├── blog/
│   │   │   ├── page.tsx                # Blog index
│   │   │   └── [slug]/page.tsx         # Individual post (MDX)
│   │   ├── news/page.tsx               # Automated tech news digest
│   │   ├── now/page.tsx                # /now page — what Hamid is doing
│   │   ├── stats/page.tsx              # Public open dashboard
│   │   ├── tools/
│   │   │   ├── page.tsx                # Free dev tools index
│   │   │   └── [tool]/page.tsx         # Individual tool
│   │   ├── snippets/page.tsx           # Code snippet library
│   │   ├── review/page.tsx             # Client review submission (token-gated)
│   │   ├── contact/page.tsx            # Contact page
│   │   └── challenge/page.tsx          # Weekly dev challenge
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Dashboard shell (sidebar, auth guard)
│   │   ├── dashboard/page.tsx          # Overview / home
│   │   ├── works/
│   │   │   ├── page.tsx                # All works (company + freelance)
│   │   │   ├── company/page.tsx        # Company task tracker
│   │   │   └── freelance/page.tsx      # Freelance project tracker
│   │   ├── clients/page.tsx            # Client directory
│   │   ├── meetings/page.tsx           # Meeting scheduler
│   │   ├── blog/
│   │   │   ├── page.tsx                # Blog post list (manage)
│   │   │   └── [id]/page.tsx           # Post editor (MDX + AI assist)
│   │   ├── supabase/page.tsx           # Supabase project manager
│   │   ├── visitors/page.tsx           # Visitor analytics
│   │   ├── reviews/page.tsx            # Review moderation
│   │   └── settings/page.tsx           # Profile, now page, availability
│   ├── api/
│   │   ├── contact/route.ts            # Contact form handler
│   │   ├── review/route.ts             # Review submission
│   │   ├── track/route.ts              # Visitor tracking
│   │   ├── ask-hamid/route.ts          # AI chat widget
│   │   ├── news/route.ts               # News digest endpoint
│   │   └── og/route.tsx                # Dynamic OG image generation
│   └── layout.tsx                      # Root layout (metadata, fonts)
├── components/
│   ├── landing/                        # All landing page components
│   ├── dashboard/                      # Dashboard UI components
│   ├── blog/                           # Blog-specific components
│   └── shared/                         # Shared across public + dashboard
├── lib/
│   ├── supabase/                       # Client, server, middleware helpers
│   ├── resend.ts                       # Email helpers
│   ├── claude.ts                       # Claude API helpers
│   └── fingerprint.ts                  # Visitor fingerprinting
└── .github/workflows/                  # GitHub Actions automations
```

---

## SECTION 2 — DATABASE SCHEMA (Supabase)

Run this SQL in your Supabase SQL editor to set up all tables:

```sql
-- USERS (extended profile beyond Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  name text default 'Hamid U V',
  bio text,
  role text default 'Web & Software Developer',
  location text default 'Muscat, Oman',
  available boolean default true,
  now_text text,                        -- for /now page
  github_username text,
  linkedin_url text,
  twitter_url text,
  avatar_url text,
  updated_at timestamptz default now()
);

-- PROJECTS (portfolio case studies)
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  title text not null,
  slug text unique not null,
  description text,
  content text,                         -- MDX content
  type text check (type in ('web', 'mobile', 'api', 'design', 'other')),
  status text default 'published' check (status in ('draft', 'published')),
  client_name text,
  tech_stack text[],                    -- ['Next.js', 'Supabase', ...]
  live_url text,
  github_url text,
  cover_image text,
  featured boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- WORKS (company + freelance task management)
create table works (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  title text not null,
  description text,
  track text not null check (track in ('company', 'freelance')),
  status text not null default 'backlog' check (
    status in ('backlog', 'in_progress', 'review', 'done', 'on_hold')
  ),
  priority text default 'medium' check (
    priority in ('low', 'medium', 'high', 'urgent')
  ),
  client_id uuid references clients(id),
  due_date date,
  estimated_hours numeric(5,1),
  actual_hours numeric(5,1),
  tags text[],
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- WORK UPDATES (append-only activity log per task)
create table work_updates (
  id uuid primary key default gen_random_uuid(),
  work_id uuid references works(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- CLIENTS
create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  name text not null,
  company text,
  email text,
  phone text,
  country text,
  notes text,
  next_action text,
  created_at timestamptz default now()
);

-- MEETINGS
create table meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  client_id uuid references clients(id),
  work_id uuid references works(id),
  title text not null,
  type text check (type in ('client_call', 'standup', 'review', 'personal', 'other')),
  scheduled_at timestamptz not null,
  duration_mins int default 30,
  location text,
  notes text,
  agenda text,
  status text default 'upcoming' check (status in ('upcoming', 'done', 'cancelled')),
  created_at timestamptz default now()
);

-- INVOICES
create table invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  work_id uuid references works(id),
  client_id uuid references clients(id),
  amount numeric(10,2),
  currency text default 'OMR',
  status text default 'unpaid' check (status in ('unpaid', 'paid', 'overdue')),
  due_date date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- BLOG POSTS
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,                         -- MDX
  cover_image text,
  category text check (
    category in ('build_log', 'tutorial', 'opinion', 'devlog', 'news')
  ),
  tags text[],
  status text default 'draft' check (status in ('draft', 'published')),
  views int default 0,
  likes int default 0,
  read_time int,                        -- minutes
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- POST REACTIONS
create table post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  visitor_id text not null,             -- fingerprint hash
  reaction text check (reaction in ('like', 'fire', 'mind_blown', 'useful', 'saved')),
  created_at timestamptz default now(),
  unique(post_id, visitor_id, reaction)
);

-- SUPABASE PROJECTS (manager)
create table supabase_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  name text not null,
  org text,
  project_ref text,                     -- Supabase project ref for API calls
  status text default 'active' check (status in ('active', 'paused')),
  last_active_at timestamptz default now(),
  created_at timestamptz default now()
);

-- REVIEWS
create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  client_id uuid references clients(id),
  work_id uuid references works(id),
  reviewer_name text not null,
  reviewer_company text,
  reviewer_role text,
  rating int check (rating between 1 and 5),
  content text not null,
  project_type text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  token text unique default gen_random_uuid()::text,
  created_at timestamptz default now()
);

-- VISITORS
create table visitors (
  id uuid primary key default gen_random_uuid(),
  fingerprint text unique not null,
  country text,
  city text,
  referrer text,
  utm_source text,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  visit_count int default 1,
  pages_viewed text[],
  posts_read text[],
  xp int default 0,
  level text default 'Explorer',
  is_subscriber boolean default false,
  email text,
  segment text default 'lurker' check (segment in ('lead', 'reader', 'lurker', 'subscriber'))
);

-- VISITOR ACHIEVEMENTS
create table visitor_achievements (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid references visitors(id),
  achievement text not null,
  unlocked_at timestamptz default now(),
  unique(visitor_id, achievement)
);

-- TECH NEWS (automated digest)
create table news_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  source text,
  summary text,                         -- AI-generated summary
  tags text[],
  score int default 0,
  published_at timestamptz,
  digest_date date default current_date,
  created_at timestamptz default now()
);

-- SUBSCRIBERS (newsletter)
create table subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  confirmed boolean default false,
  created_at timestamptz default now()
);

-- SNIPPETS
create table snippets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  code text not null,
  language text,
  tags text[],
  views int default 0,
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY
-- Enable RLS on all tables
alter table profiles enable row level security;
alter table works enable row level security;
alter table clients enable row level security;
alter table meetings enable row level security;
alter table invoices enable row level security;
alter table supabase_projects enable row level security;
alter table reviews enable row level security;

-- Only Hamid can read/write his own data
create policy "owner only" on works for all using (auth.uid() = user_id);
create policy "owner only" on clients for all using (auth.uid() = user_id);
create policy "owner only" on meetings for all using (auth.uid() = user_id);
create policy "owner only" on invoices for all using (auth.uid() = user_id);
create policy "owner only" on supabase_projects for all using (auth.uid() = user_id);

-- Public can read approved reviews and published posts
create policy "public reviews" on reviews for select using (status = 'approved');
create policy "public posts" on posts for select using (status = 'published');
create policy "public projects" on projects for select using (status = 'published');
```

---

## SECTION 3 — LANDING PAGE (haaamid.art)

**Goal:** Make someone stop scrolling within 2 seconds. 3D, animated, bold. Feels alive.

### 3D Hero Section

```
Build using React Three Fiber + Drei + Framer Motion.

Scene setup:
- Dark background (#0a0a0a)
- Floating 3D text "HAMID" rendered with drei/Text3D
  - Font: bold geometric (Geist or Inter bold)
  - Material: MeshStandardMaterial with metalness:0.8, roughness:0.2
  - Subtle rotation animation (useFrame) — rotates slowly on Y axis
  - On hover: accelerates, emits glow (bloom post-processing)
- Floating orbs / particles in background
  - 200 small spheres with random positions
  - Drift slowly using perlin noise
  - Color: gradient from #7F77DD (purple) to #3ECF8E (Supabase green)
- Ambient light + point lights for depth
- OrbitControls disabled — camera is fixed but smooth parallax on mouse move

Below the 3D scene (scroll-triggered with Framer Motion):
- "Web & Software Developer"  — types out with cursor blink effect
- "Based in Muscat, Oman · Available for freelance"
- Two CTA buttons:
  - "See my work" → scrolls to #work
  - "Let's talk" → /contact
- Subtle scroll indicator (bouncing arrow)
```

### Sections (in order, all scroll-animated with Framer Motion)

```
1. HERO (3D scene above)

2. AVAILABILITY BADGE
   - Live pill: green dot + "Available for new projects"
   - Or red dot + "Currently fully booked" (toggled from dashboard)
   - Animated pulse on the dot

3. ABOUT
   - Split layout: left = text, right = floating 3D card (tilt on hover)
   - Short bio: who Hamid is, what he builds, his philosophy
   - "Vibe + web" — creative developer who codes with intention
   - Skills grid with icons (rendered as text too for SEO)

4. SELECTED WORK (pulled from Supabase projects table)
   - 3-4 featured projects
   - Card hover: 3D tilt effect (react-tilt or CSS transform)
   - Each card: project name, description, tech stack pills, live link
   - "View all work" → /work

5. STATS (live, pulled from Supabase)
   - Animated number counters on scroll into view
   - Projects shipped, years experience, GitHub commits (via API), happy clients

6. REVIEWS (approved ones from Supabase)
   - Horizontal scroll carousel
   - Each card: star rating, quote, reviewer name + company
   - Auto-plays, pauses on hover

7. BLOG PREVIEW (3 latest published posts)
   - Card grid, hover lift animation
   - Category badge, title, read time, date
   - "Read the blog" → /blog

8. ASK HAMID (AI chat widget)
   - Collapsible chat bubble in bottom-right corner (always visible)
   - On open: "Hi! I'm an AI trained on Hamid's work. Ask me anything."
   - Powered by /api/ask-hamid route (Claude API)
   - System prompt includes: Hamid's bio, projects, skills, availability, contact info
   - Logs each question to Supabase (visitors table) for Hamid to review

9. CONTACT SECTION
   - Simple form: name, email, message, type (hire/collab/other)
   - Submits to /api/contact → saves to Supabase → Resend email to Hamid → auto-reply to visitor
   - Below form: calendar embed (Cal.com) for direct meeting booking

10. FOOTER
    - Links: Work, Blog, Now, Stats, Tools, Snippets, Contact
    - Social icons: GitHub, LinkedIn, Twitter
    - "Built by Hamid with Next.js + Supabase"
    - Live visitor count: "142 developers visited this month"
```

### Landing Page Performance Rules
```
- Hero 3D scene: lazy-load with Suspense, show skeleton while loading
- All images: next/image with priority on hero
- Static generation: use generateStaticParams + revalidate: 3600
- Target: 95+ PageSpeed score on mobile
- Preconnect to: fonts.googleapis.com, api.supabase.co
```

---

## SECTION 4 — SEO IMPLEMENTATION

### Root layout metadata (app/layout.tsx)

```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://haaamid.art'),
  title: {
    default: 'Hamid U V · Web & Software Developer',
    template: '%s · Hamid U V'
  },
  description: 'Hamid U V — web & software developer crafting fast, beautiful digital products. Based in Muscat, Oman. Available for freelance.',
  keywords: [
    'Hamid U V', 'haaamid', 'haaamid.art',
    'web developer Oman', 'software developer Muscat',
    'freelance developer Oman', 'Next.js developer',
    'React developer', 'Supabase developer',
    'full stack developer portfolio', 'vibe coding developer'
  ],
  authors: [{ name: 'Hamid U V', url: 'https://haaamid.art' }],
  creator: 'Hamid U V',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://haaamid.art',
    siteName: 'Hamid U V',
    title: 'Hamid U V · Web & Software Developer',
    description: 'Building fast, beautiful web products. Based in Muscat, Oman.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Hamid U V — Web & Software Developer' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hamid U V · Web & Software Developer',
    description: 'Building fast, beautiful web products. Based in Oman.',
    images: ['/og-image.png'],
    creator: '@yourtwitterhandle'
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://haaamid.art' }
}
```

### JSON-LD Person Schema (add to landing page)

```typescript
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Hamid U V",
  "alternateName": "Hamid",
  "url": "https://haaamid.art",
  "jobTitle": "Web & Software Developer",
  "description": "Full-stack developer specialising in Next.js, React, and Supabase. Based in Muscat, Oman.",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Muscat",
    "addressCountry": "OM"
  },
  "sameAs": ["https://github.com/...", "https://linkedin.com/in/..."],
  "knowsAbout": ["Next.js", "React", "TypeScript", "Supabase", "Tailwind CSS", "Node.js"]
}
// Inject as: <script type="application/ld+json">{JSON.stringify(personSchema)}</script>
```

### Dynamic OG Images (app/api/og/route.tsx)

```typescript
// Uses @vercel/og (free, built-in on Vercel)
// Called for each blog post: /api/og?title=Post+Title&category=tutorial
// Returns a 1200x630 image with:
//   - Dark background
//   - Hamid's name + haaamid.art branding
//   - Post title in large text
//   - Category badge
//   - Tech stack icons
// This makes every shared blog post look professional on LinkedIn/Twitter
```

### Sitemap (app/sitemap.ts)

```typescript
// Auto-generates sitemap including:
// - Static routes: /, /work, /blog, /now, /stats, /tools, /snippets, /contact
// - Dynamic: /work/[slug] for each published project
// - Dynamic: /blog/[slug] for each published post
// Revalidates every hour
```

### robots.txt (app/robots.ts)

```typescript
// Allow: /, /work, /blog, /news, /now, /stats, /tools, /snippets, /contact, /review
// Disallow: /dashboard, /works, /clients, /meetings, /supabase, /visitors, /reviews (dashboard)
// Sitemap: https://haaamid.art/sitemap.xml
```

---

## SECTION 5 — AUTHENTICATION

```typescript
// Supabase Auth — Google OAuth + Magic Link only
// No passwords. Cleaner, more secure.

// middleware.ts — protect all /dashboard routes
// If no session → redirect to /login
// If session + not Hamid's email → redirect to / (only one user allowed)

// IMPORTANT: hardcode Hamid's email in env var NEXT_PUBLIC_OWNER_EMAIL
// Even if someone creates a Supabase account, they can't access the dashboard

// Login page (/login):
// - Minimal, centered
// - "Welcome back, Hamid" heading
// - Google sign-in button
// - Magic link email input
// - Background: subtle animated gradient (not the full 3D scene)
```

---

## SECTION 6 — DASHBOARD

**Design:** Ultra-minimal. Left sidebar, content area. Like Linear or Notion but simpler.

### Dashboard layout (app/(dashboard)/layout.tsx)

```
Sidebar (fixed, 220px wide, collapsible on mobile):
  - Logo: small "H" mark + "haaamid.art"
  - Navigation:
    - Overview (icon: grid)
    - Works → Company / Freelance (icon: briefcase)
    - Clients (icon: users)
    - Meetings (icon: calendar)
    - Blog (icon: pencil)
    - Supabase (icon: database)
    - Visitors (icon: chart-bar)
    - Reviews (icon: star)
    - Settings (icon: settings)
  - Bottom: Hamid's avatar, name, sign out button

Top bar:
  - Page title (dynamic)
  - Quick-add button (opens command palette / modal)
  - Notification bell (unread count)
  - "Available" toggle (updates profiles table → reflects on landing page live)

Color scheme for dashboard:
  - Background: #fafafa (light) or #0d0d0d (dark)
  - Surface: white / #141414
  - Border: #e5e5e5 / #262626
  - Text: #0a0a0a / #f5f5f5
  - Accent: #7F77DD (purple — consistent with landing page)
  - No harsh colors. Subtle, readable, fast-feeling.
```

### Dashboard home (/dashboard)

```
Today at a glance:
  - Row of 4 stats: Tasks due today, Upcoming meetings, Active freelance projects, Pending invoices
  
Sections:
  - Today's meetings (time, client, type, notes link)
  - Overdue tasks (company + freelance, sorted by priority)
  - Supabase projects about to pause (days until pause, resume button)
  - Latest visitor (who visited, from where, what they read)
  - Unpaid invoices total (OMR)
  - Quick-add shortcuts: + Task, + Meeting, + Note

Weekly summary card:
  - Tasks completed this week vs last week
  - Hours logged
  - Blog posts published
  - New visitors
```

### Works — Company track (/dashboard/works/company)

```
Two-column layout: task list (left) + task detail (right, drawer-style)

Task list:
  - Grouped by status: Backlog / In Progress / Review / Done
  - Each row: title, priority badge (color-coded), due date, tags
  - Drag to reorder within status group
  - Click status badge to cycle through statuses
  - Right-click → context menu: edit, duplicate, delete, move to freelance

Task detail (right panel, opens on click):
  - Title (editable inline)
  - Status selector
  - Priority selector
  - Due date picker
  - Estimated vs actual hours (input fields)
  - Tags (multi-select, type to add)
  - Description (textarea with markdown preview)
  - Activity log (append-only, timestamped updates)
  - Notes field

Quick filters bar:
  - All / Overdue / This week / High priority / Done
  - Search box (filters live as you type)

Add task: inline at bottom of any column, or global + button
```

### Works — Freelance track (/dashboard/works/freelance)

```
Card-based view (not list) — each card is a full project

Project card shows:
  - Project name + client name
  - Status pipeline: Lead → Proposal → Active → Complete → On Hold
  - Budget (OMR) + currency
  - Deadline
  - Progress bar (milestones completed / total)
  - Quick action buttons: Add milestone, Log hours, Create invoice

Project detail page (click card):
  - All fields from works table
  - Milestones section (checklist, each with due date)
  - Time log (date, hours, note per entry)
  - Invoice history (amount, status, due date)
  - Client info card (linked from clients table)
  - Send review request button (generates token, sends email via Resend)
```

### Clients (/dashboard/clients)

```
Table view with search + filter by country

Columns: Name, Company, Email, Active projects count, Last contact, Next action

Click row → client detail sheet:
  - Contact info (all fields editable inline)
  - Linked projects (list of works)
  - Meeting history
  - Review (if submitted)
  - Notes (rich text)
  - Next action field (what to do next with this client)
```

### Meetings (/dashboard/meetings)

```
Two views: Calendar view (monthly) + List view (upcoming)

List view columns: Date/time, Title, Type, Client, Duration, Status, Notes

Calendar view:
  - Month grid with meeting dots
  - Click day → shows meetings for that day
  - Click meeting → opens detail sheet

Meeting detail:
  - All fields from meetings table
  - Link to project / client
  - Agenda (checklist)
  - Notes (after meeting)
  - Mark as done button
  - Reschedule (opens date picker)

Add meeting:
  - Modal: title, type, client selector, date/time, duration, agenda
  - Or embed Cal.com for external bookings (visitors can book from /contact)
```

### Blog editor (/dashboard/blog/[id])

```
Split view: editor (left) + live preview (right)

Editor:
  - Title input (large, plain text)
  - Slug (auto-generated from title, editable)
  - Excerpt (2-3 sentences for SEO meta)
  - Category selector
  - Tags (multi-select)
  - Cover image upload (to Supabase Storage)
  - MDX content editor with:
    - Toolbar: bold, italic, heading, code block, link, image
    - Syntax highlighting for code blocks
    - Drag to upload images (saves to Supabase Storage, inserts URL)

AI Writing Assistant (right side of toolbar):
  - "Improve this paragraph" (select text → AI rewrites)
  - "Make shorter" / "Add example" / "Fix grammar"
  - "Generate excerpt" (from full content)
  - "Suggest tags" (from content)
  - All powered by Claude API (claude-sonnet-4-6)

Publish flow:
  - Save draft (auto-save every 30s to Supabase)
  - Preview in new tab
  - Publish → sets status to published, published_at to now()
  - Auto cross-post to Hashnode via API (optional toggle)
  - Auto cross-post to Dev.to via API (optional toggle)
```

### Supabase Manager (/dashboard/supabase)

```
Grid of project cards (the system built earlier in this conversation)

Each card:
  - Project name + org
  - Status badge: Active / Paused / Expiring soon
  - Days idle counter
  - Expiry countdown (colour-coded: green > 4d, amber 2-4d, red < 2d)
  - Resume button (calls Supabase Management API POST /v1/projects/{ref}/restore)
  - Delete card button

Top stats: Total / Active / Paused / Expiring

Add project modal: name, org, project ref (from Supabase URL), status, days since active

Auto-resume setup instructions:
  - Button: "Set up auto-resume" → shows GitHub Actions YAML to copy
  - Cron runs every 5 days, resumes all projects with project_ref set
```

### Visitors (/dashboard/visitors)

```
Stats row: Total visitors / This month / Returning / Subscribers / Leads

World map (simple SVG or react-simple-maps) showing visitor countries

Visitor table:
  Columns: Fingerprint/name, Country, Segment (Lead/Reader/Lurker), Pages viewed, Last seen, XP

Segment filter tabs: All / Leads / Readers / Subscribers / Lurkers

Click visitor → detail sheet:
  - All pages visited (with timestamps)
  - Posts read
  - Referrer (Google / LinkedIn / GitHub / direct)
  - Achievements unlocked
  - XP level
  - If they left an email: shown here, quick reply button

Top pages (which pages get most visits)
Top referrers (where visitors come from)
```

### Reviews (/dashboard/reviews)

```
Tabs: Pending (badge count) / Approved / Rejected

Each review card:
  - Reviewer name, company, rating stars
  - Review text
  - Project linked
  - Submitted date
  - Approve / Reject buttons (pending tab)
  - Copy as LinkedIn recommendation text
  - Share as image (generates card PNG for social)

Stats: Average rating, Total approved, Response rate
```

---

## SECTION 7 — BLOG SYSTEM

### Blog index (/blog)

```
Header: "Thoughts, build logs, and dev insights"
Filter tabs: All / Build logs / Tutorials / Opinions / Devlog
Search bar (live filter, no API call — filters already-loaded posts)

Post card grid (2 cols desktop, 1 col mobile):
  - Cover image
  - Category badge (colour-coded)
  - Title
  - Excerpt (2 lines)
  - Read time + published date
  - View count + like count
  - Tags

Sidebar (desktop):
  - Newsletter subscribe form
  - "Most read this month" (top 3 by views)
  - Tags cloud
```

### Individual post (/blog/[slug])

```
Layout: centered, max-width 680px (readable line length)

Top:
  - Category + tags
  - Title (large, ~2.5rem)
  - Excerpt / subtitle
  - Author: Hamid's avatar, name, date, read time
  - Cover image (full width, rounded)

Content:
  - MDX rendered with custom components:
    - Code blocks: Shiki syntax highlighting
    - Callout boxes: tip/warning/note
    - Image with caption
    - Inline code styling
  - Auto-generated table of contents (sticky on desktop)

Post reactions bar (below content):
  - 5 reaction buttons: like ❤️ fire 🔥 mind-blown 🤯 useful 💡 saved 🔖
  - Live count for each
  - One reaction per visitor (fingerprint)
  - Click to toggle (remove reaction)

Share section:
  - "Found this useful? Share it."
  - Copy link, share on Twitter, share on LinkedIn
  - Pre-filled tweet: "'{title}' by @hamid haaamid.art/blog/{slug}"

Comments (Giscus):
  - Embedded GitHub Discussions
  - Login with GitHub
  - Auto-moderated by GitHub

Related posts (3 posts, same category or tags):
  - Simple card row below comments

Post metadata for SEO:
  - Per-post metadata with title, description (excerpt), OG image (dynamic from /api/og)
  - Article schema JSON-LD
  - Canonical URL
```

---

## SECTION 8 — TECH NEWS AUTOMATION

### GitHub Actions workflow (.github/workflows/news-digest.yml)

```yaml
name: Daily Tech News Digest
on:
  schedule:
    - cron: '0 6 * * *'   # 9:00 AM Muscat time (UTC+4 = 06:00 UTC)
  workflow_dispatch:        # Manual trigger for testing

jobs:
  fetch-and-digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install deps
        run: npm install node-fetch @anthropic-ai/sdk
      - name: Fetch + summarise news
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
        run: node scripts/news-digest.js
```

### News digest script (scripts/news-digest.js)

```javascript
// This script:
// 1. Fetches top stories from Hacker News API (free, no key needed)
//    GET https://hacker-news.firebaseio.com/v0/topstories.json (returns IDs)
//    Then fetch each: https://hacker-news.firebaseio.com/v0/item/{id}.json
//
// 2. Fetches RSS feeds using a simple XML parser:
//    - https://nextjs.org/feed.xml
//    - https://supabase.com/rss.xml
//    - https://vercel.com/atom
//    - https://dev.to/feed/tag/webdev (RSS)
//    - https://dev.to/feed/tag/nextjs
//
// 3. Filters by keyword relevance:
//    Keywords: ['next.js', 'react', 'supabase', 'typescript', 'tailwind',
//              'vercel', 'ai', 'web dev', 'javascript', 'node']
//    Score each item: +2 per keyword match in title, +1 per match in description
//
// 4. Picks top 5 by score
//
// 5. For each item, calls Claude API:
//    Prompt: "Summarise this tech article in exactly 2 sentences for a developer audience.
//             Be specific, avoid hype. Article: {title} {description}"
//    Model: claude-haiku-4-5 (cheapest, fast enough for summaries)
//
// 6. Upserts to Supabase news_items table (today's digest_date)
//
// 7. Sends weekly newsletter (every Monday only):
//    Gets subscribers from Supabase
//    Sends digest email via Resend with top 5 stories
//    Template: clean HTML email with Hamid's branding
```

### News page (/news)

```
Header: "Today in dev — curated by Hamid"
Date shown: today's date

Story cards (5 per day):
  - Source badge (Hacker News, Next.js Blog, Dev.to, etc.)
  - Title (links to original)
  - AI summary (2 sentences)
  - Tags
  - HN score / engagement metric
  - Bookmark button (saved to Supabase by visitor fingerprint)

Past digests:
  - "Archive" section — browse by week
  - Calendar picker to jump to any past digest date

Subscribe box:
  - "Get this digest in your inbox every Monday"
  - Email input → saves to subscribers table
  - Confirmation email via Resend
```

---

## SECTION 9 — VISITOR TRACKING + GAMIFICATION

### Tracking (app/api/track/route.ts)

```typescript
// Called on every page load from a client component
// Payload: { fingerprint, page, referrer, utm_source }
// Process:
//   1. Get country/city from IP via ipapi.co (free tier)
//   2. Upsert to visitors table (update last_seen, increment visit_count, add page to pages_viewed)
//   3. Award XP based on action:
//      - New visit: +5 XP
//      - New page view: +2 XP
//      - Read a blog post (stayed > 60s): +10 XP
//      - Sent contact message: +25 XP
//      - Subscribed to newsletter: +15 XP
//      - Shared a post: +20 XP
//   4. Check and unlock achievements
//   5. Return: { xp, level, newAchievements }

// Achievement unlock logic:
const achievements = {
  'first_look': (v) => v.visit_count >= 1,
  'deep_diver': (v) => v.posts_read.length >= 3,
  'early_adopter': (v) => new Date(v.first_seen_at) < LAUNCH_DATE + 30_DAYS,
  'collaborator': (v) => v.segment === 'lead',
  'superfan': (v) => v.visit_count >= 5,
  'scholar': (v) => v.posts_read.length >= 10,
  'subscriber': (v) => v.is_subscriber,
}
```

### XP levels

```
0-99:     Explorer     🗺️
100-299:  Reader       📖
300-599:  Enthusiast   🔥
600-999:  Collaborator 🤝
1000+:    Superfan     ⭐
```

### Gamification UI (shown to visitors)

```
Subtle XP widget (bottom-left corner, appears after 10 seconds):
  - Small card: "You're a [level] · [XP] XP"
  - Progress bar to next level
  - Click → expands to show achievement badges (locked ones greyed out)
  - Dismiss button (persists in localStorage)

Achievement notification (toast, top-right):
  - Pops up when achievement unlocked: "🏆 Achievement unlocked: Deep Diver"
  - Auto-dismisses after 4 seconds

On /blog/[slug] after reading (scroll to 80% = "read"):
  - Small toast: "+10 XP for reading this post"
```

---

## SECTION 10 — AUTOMATIONS

### 1. Supabase auto-resume (GitHub Actions)

```yaml
name: Supabase Auto-Resume
on:
  schedule:
    - cron: '0 5 */5 * *'   # Every 5 days at 5am UTC
  workflow_dispatch:

jobs:
  resume:
    runs-on: ubuntu-latest
    steps:
      - name: Resume all Supabase projects
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: |
          node -e "
            // Fetch project refs from Supabase projects table
            // For each with status='paused' or last_active > 4 days:
            //   POST https://api.supabase.com/v1/projects/{ref}/restore
            //   Authorization: Bearer SUPABASE_ACCESS_TOKEN
            // Update last_active_at in Supabase
            // Send summary email to Hamid via Resend
          "
```

### 2. Contact form automation (Supabase Edge Function)

```typescript
// Trigger: new row in visitors table where segment = 'lead'
// (i.e., contact form submitted)
// Actions:
//   1. Send email to Hamid (Resend):
//      Subject: "New contact from {name} via haaamid.art"
//      Body: name, email, message, type, visitor country/city
//   2. Send auto-reply to visitor (Resend):
//      Subject: "Got your message, Hamid will reply shortly"
//      Body: warm, professional. Include haaamid.art link.
//   3. If type = 'hire': priority tag in email subject
```

### 3. Work deadline reminder (Supabase Edge Function scheduled daily)

```typescript
// Runs daily at 8am Muscat time via Supabase pg_cron
// SELECT * FROM works WHERE due_date = CURRENT_DATE + 2 AND status != 'done'
// For each: send email reminder to Hamid
// Subject: "⏰ Due in 2 days: {task title}"
```

### 4. Review request automation

```typescript
// Trigger: work status changes to 'done' AND track = 'freelance'
// Wait 1 day (using Supabase scheduled function or setTimeout in Edge Function)
// Generate unique review token
// Send email to client (if email on file):
//   "Hi {client_name}, it was great working with you on {project}.
//    Would you mind leaving a quick review? It takes 2 minutes:
//    haaamid.art/review?token={token}"
// Save token to reviews table with status=pending
```

### 5. Weekly self-digest (every Sunday night)

```typescript
// GitHub Actions cron: 0 20 * * 0 (Sunday 8pm UTC)
// Compiles:
//   - Tasks completed this week
//   - Hours logged
//   - Meetings had
//   - New visitors
//   - Blog post performance
//   - Invoices paid/unpaid
//   - Supabase project statuses
// Sends summary email to Hamid
// "Your week in review — haaamid.art"
```

### 6. GitHub stats sync (daily)

```typescript
// GitHub Actions cron: daily
// Calls GitHub GraphQL API (free, public):
//   - Total contributions this year
//   - Current streak
//   - Top languages
//   - Pinned repos (to cross-reference with Supabase projects)
// Saves to Supabase profiles table (github_stats JSONB column)
// Used in: landing page stats section + /stats public page
```

---

## SECTION 11 — UNIQUE FEATURES

### Ask Hamid AI Widget (app/api/ask-hamid/route.ts)

```typescript
// System prompt (customise this):
const systemPrompt = `
You are a helpful assistant representing Hamid U V, a web and software developer 
based in Muscat, Oman. You answer questions about Hamid's work, skills, 
availability, and projects. Be friendly, concise, and professional.

About Hamid:
- Full-stack developer specialising in Next.js, React, TypeScript, Supabase, Tailwind CSS
- Based in Muscat, Oman. Available for remote freelance work globally.
- Also works at a company doing [company work description]
- Portfolio: haaamid.art
- Contact: [Hamid's email]
- Currently available: [dynamic — pull from Supabase profiles.available]

Projects: [list from Supabase projects table — injected at request time]
Skills: Next.js, React, TypeScript, Supabase, Tailwind, Node.js, PostgreSQL, Figma

If asked about pricing: say Hamid will provide a custom quote based on project scope.
If asked if Hamid is available: check the live availability status.
If you don't know something: say "I'm not sure — reach out to Hamid directly at [contact]"
Never make up projects or experience Hamid doesn't have.
`
// Log every question to Supabase: visitors.ask_hamid_questions (JSONB array)
// Rate limit: 10 questions per fingerprint per day (check in Supabase)
```

### /now page

```
Simple, personal page. Updated from dashboard Settings.
Shows:
  - What Hamid is currently building
  - What he's learning right now
  - What he's reading
  - Current focus / goals
  - Last updated timestamp
"This is a /now page — inspired by nownownow.com"
```

### /stats public page

```
Live public stats dashboard (no auth needed):
  - Total portfolio visitors (all time + this month)
  - Blog posts published
  - Projects shipped
  - GitHub commits this year
  - Hours coded (from works table actual_hours sum)
  - Countries visitors came from
  - Newsletter subscribers
  - Most read blog post
  - Coffees had (manually set, Hamid updates this, fun)
  - Current streak: days since last GitHub commit

All data from Supabase. Revalidates every hour.
This page is a trust-builder and gets shared.
```

### Terminal Easter Egg

```javascript
// Add to landing page — detects keypress globally
// When user types 'hamid' or presses backtick (`):
// Opens a full-screen terminal overlay with:

const commands = {
  whoami: "Hamid U V — web & software developer, Muscat, Oman",
  skills: "Next.js · React · TypeScript · Supabase · Tailwind · Node.js · PostgreSQL",
  projects: "[lists 3 recent projects with links]",
  contact: "Email: [email] | Calendar: haaamid.art/contact",
  hire: "haaamid.art/contact — let's build something together",
  blog: "haaamid.art/blog — thoughts on building for the web",
  clear: "[clears terminal]",
  exit: "[closes terminal]",
  help: "[lists all commands]",
  github: "[opens github in new tab]",
  available: "[checks live availability from Supabase]"
}

// Styles: dark background, green text, blinking cursor
// Typewriter effect for responses
// Arrow keys cycle through command history
// Tab completion for commands
```

### /tools page (free dev tools)

```
Start with 3 tools (each takes a weekend):

1. CSS Gradient Generator
   - Visual picker, outputs CSS code
   - Copy with one click

2. Supabase Schema Visualiser
   - Paste your Supabase schema SQL
   - See a visual entity-relationship diagram

3. Tailwind Color Palette Generator
   - Input a hex color
   - Outputs full Tailwind-compatible shade palette (50-950)

Each tool: own URL, own SEO metadata, shareable
Tools get bookmarked and shared by developers → backlinks to haaamid.art
```

### Auto-generated CV (PDF)

```typescript
// Route: /api/cv → returns PDF
// Built with @react-pdf/renderer
// Data pulled live from Supabase:
//   - Profile: name, role, location, bio, skills
//   - Projects: 5 most recent published
//   - Works: current company role
//   - Education (add a table for this)
// PDF design: clean, minimal, matches portfolio aesthetic
// Download button on landing page / contact page
// Always up to date — zero maintenance
```

---

## SECTION 12 — ENVIRONMENT VARIABLES

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
NEXT_PUBLIC_OWNER_EMAIL=hamid@youremail.com   # Only this email can access dashboard

# Resend (email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=hamid@haaamid.art           # Set up via Resend + Cloudflare DNS

# Anthropic (AI features)
ANTHROPIC_API_KEY=

# Supabase Management API (for auto-resume)
SUPABASE_ACCESS_TOKEN=                         # From supabase.com/dashboard/account/tokens

# Cal.com (meeting embed)
NEXT_PUBLIC_CAL_USERNAME=

# GitHub (stats sync)
GITHUB_TOKEN=                                  # Personal access token (public repos only)
GITHUB_USERNAME=

# App
NEXT_PUBLIC_SITE_URL=https://haaamid.art
NEXT_PUBLIC_LAUNCH_DATE=2025-01-01            # For early adopter achievement
```

---

## SECTION 13 — BUILD ORDER (do this exactly)

```
Week 1 — Foundation
  Day 1-2: Next.js setup, Supabase project, schema, env vars, deploy to Vercel
  Day 3-4: Authentication (Supabase Auth + middleware + login page)
  Day 5-7: Landing page (static version first, then add 3D + animations)

Week 2 — Dashboard core
  Day 1-2: Dashboard layout (sidebar, routing, auth guard)
  Day 3-4: Works — company track (full CRUD, drag-drop statuses)
  Day 5-7: Works — freelance track (projects, milestones, invoices)

Week 3 — Content + clients
  Day 1-2: Clients directory
  Day 2-3: Meetings scheduler
  Day 4-5: Blog system (Supabase storage, MDX renderer, public index + post pages)
  Day 6-7: Blog editor in dashboard (with AI writing assistant)

Week 4 — Automations + engagement
  Day 1-2: Contact form → Resend email automation
  Day 2-3: Supabase auto-resume (GitHub Actions)
  Day 3-4: Tech news digest (GitHub Actions + Claude API + news page)
  Day 5-6: Visitor tracking + fingerprinting
  Day 7:   Gamification (XP system, achievements, widget)

Week 5 — Unique features + SEO
  Day 1-2: Ask Hamid AI widget
  Day 2-3: Terminal easter egg
  Day 3-4: /now page, /stats page, review system
  Day 5-6: SEO (metadata, JSON-LD, sitemap, OG images, robots.txt)
  Day 7:   Google Search Console setup, submit sitemap, launch 🚀

After launch (ongoing):
  - Write first blog post (the build story of haaamid.art itself)
  - Add first 3 dev tools to /tools
  - Set up weekly devlog habit
  - Publish to Hashnode + Dev.to
  - Share /stats page publicly
```

---

## SECTION 14 — PROMPTS TO USE WHEN BUILDING

Use these prompts with Claude/Cursor when building each section:

```
LANDING PAGE 3D:
"Build a React Three Fiber 3D hero section for my portfolio. Create a scene with 
floating 3D text reading 'HAMID' using drei/Text3D with metallic material. Add 200 
floating particle orbs that drift slowly. Add mouse parallax on camera. Use Framer 
Motion for the 2D content below the 3D scene — staggered fade-in animations on scroll. 
Background: #0a0a0a. Color accent: #7F77DD purple and #3ECF8E green."

DASHBOARD LAYOUT:
"Build a minimal Next.js dashboard layout with a 220px fixed sidebar and a main 
content area. Sidebar has navigation icons + labels for: Overview, Works, Clients, 
Meetings, Blog, Supabase, Visitors, Reviews, Settings. Use Tailwind CSS. Design like 
Linear — ultra-clean, no shadows, subtle borders. Dark and light mode support."

WORK MANAGEMENT:
"Build a Kanban-style task manager with Supabase. Columns: Backlog, In Progress, 
Review, Done. Tasks can be dragged between columns (use @dnd-kit/core). Each task 
card shows: title, priority badge, due date, tags. Click task → opens right panel 
with full detail and append-only activity log."

BLOG EDITOR:
"Build an MDX blog editor for Next.js with Supabase storage. Left side: rich text 
editor (use @uiw/react-md-editor or similar). Right side: live preview using 
next-mdx-remote. Add an AI toolbar that calls the Anthropic Claude API to improve 
selected text. Auto-save to Supabase every 30 seconds."

NEWS AUTOMATION:
"Write a Node.js script that: 1) Fetches top 20 Hacker News stories from the 
Firebase API, 2) Fetches RSS from nextjs.org/feed.xml and supabase.com/rss.xml, 
3) Scores each by keyword relevance (react, next.js, supabase, typescript), 4) 
Takes top 5, sends each to Claude API for a 2-sentence summary, 5) Upserts to 
Supabase. Include error handling and console logging."

VISITOR TRACKING:
"Build a privacy-safe visitor tracking system for Next.js. Use FingerprintJS to 
generate a visitor ID. On each page load, call /api/track with the fingerprint, 
current page, and referrer. The API route gets the visitor's country from ipapi.co, 
then upserts to a Supabase visitors table, awarding XP based on actions. Return 
new XP total and any unlocked achievements."

ASK HAMID WIDGET:
"Build a chat widget for a portfolio site powered by the Anthropic Claude API. 
Bottom-right corner, collapses to a button. On open: shows chat interface. User 
messages call /api/ask-hamid. The API route calls Claude with a system prompt 
containing the portfolio owner's bio and projects. Show typing indicator while 
waiting. Rate limit by fingerprint (10 messages/day via Supabase)."
```

---

## QUICK REFERENCE — FREE TIER LIMITS

```
Supabase free:     500MB DB, 1GB storage, 50MB file uploads, 500k edge function calls
Vercel hobby:      100GB bandwidth, unlimited deployments, analytics included
Resend free:       3,000 emails/month, 100/day
GitHub Actions:    2,000 minutes/month (cron jobs use ~1 min each = 60 runs/month free)
Anthropic API:     Pay per use — haiku is cheapest (~$0.25/million input tokens)
Cal.com free:      Unlimited event types, unlimited bookings, calendar sync
FingerprintJS free: 20,000 API calls/month
ipapi.co free:     1,000 requests/day
Cloudflare free:   Unlimited DNS, CDN, DDoS protection
Giscus:            Completely free — uses GitHub Discussions
```

---

*Built for Hamid U V · haaamid.art · Web & Software Developer · Muscat, Oman*
*Generated with strategic thinking from conversations about portfolio OS design, SEO, automations, and developer engagement.*