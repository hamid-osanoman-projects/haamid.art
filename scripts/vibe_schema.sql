-- ============================================
-- VIBE SYSTEM — NEW TABLES
-- ============================================

-- CONTACTS (family, friends, relatives — each gets a unique code)
create table if not exists public.vibe_contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,                        -- "Mama", "Bro Ahmed", "Uncle Salim"
  relation text default 'friend'             -- 'family', 'friend', 'relative', 'other'
    check (relation in ('family', 'friend', 'relative', 'other')),
  code text not null unique,                 -- "mama-7f2k" — what they type to enter
  avatar_emoji text default '👤',            -- pick an emoji for them, shows on call
  avatar_color text default '#7F77DD',       -- background color for their avatar
  push_subscription jsonb,                  -- stores Web Push subscription object
  last_seen_at timestamptz,
  is_online boolean default false,
  created_at timestamptz not null default now()
);

-- ROOMS (each call session)
create table if not exists public.vibe_rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  room_name text not null unique,            -- LiveKit room name (random slug)
  display_name text default 'Hamid\'s room',
  type text not null default 'call'
    check (type in ('call', 'watch_party')),
  status text not null default 'waiting'
    check (status in ('waiting', 'active', 'ended')),
  watch_url text default '',                 -- football stream URL (for watch party)
  watch_sync jsonb default '{}',            -- { playing: bool, currentTime: float, updatedAt: timestamp }
  invited_contact_ids uuid[] default '{}',  -- which contacts are invited
  livekit_token text default '',            -- cached LiveKit token for room
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

-- CALL LOG (history)
create table if not exists public.vibe_call_log (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.vibe_rooms(id) on delete cascade,
  contact_id uuid references public.vibe_contacts(id) on delete set null,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  duration_seconds int
);

-- PUSH SUBSCRIPTIONS (for call notifications)
create table if not exists public.vibe_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.vibe_contacts(id) on delete cascade,
  subscription jsonb not null,              -- Web Push subscription object
  user_agent text default '',
  created_at timestamptz not null default now(),
  unique(contact_id)
);

-- ============================================
-- INDEXES
-- ============================================

create index if not exists idx_vibe_contacts_code on public.vibe_contacts(code);
create index if not exists idx_vibe_contacts_owner on public.vibe_contacts(owner_id);
create index if not exists idx_vibe_rooms_status on public.vibe_rooms(status);
create index if not exists idx_vibe_rooms_name on public.vibe_rooms(room_name);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.vibe_contacts enable row level security;
alter table public.vibe_rooms enable row level security;
alter table public.vibe_call_log enable row level security;
alter table public.vibe_push_subscriptions enable row level security;

-- Hamid manages all contacts
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'vibe_contacts: owner all' and tablename = 'vibe_contacts'
  ) then
    create policy "vibe_contacts: owner all" on public.vibe_contacts
      for all using (auth.uid() = owner_id);
  end if;
end $$;

-- Anyone can look up a contact by code (for the login flow)
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'vibe_contacts: public code lookup' and tablename = 'vibe_contacts'
  ) then
    create policy "vibe_contacts: public code lookup" on public.vibe_contacts
      for select using (true);
  end if;
end $$;

-- Hamid manages rooms
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'vibe_rooms: owner all' and tablename = 'vibe_rooms'
  ) then
    create policy "vibe_rooms: owner all" on public.vibe_rooms
      for all using (auth.uid() = owner_id);
  end if;
end $$;

-- Anyone can read active rooms (to join a call)
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'vibe_rooms: public read active' and tablename = 'vibe_rooms'
  ) then
    create policy "vibe_rooms: public read active" on public.vibe_rooms
      for select using (status in ('waiting', 'active'));
  end if;
end $$;

-- Call log: owner reads
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'vibe_call_log: owner read' and tablename = 'vibe_call_log'
  ) then
    create policy "vibe_call_log: owner read" on public.vibe_call_log
      for select using (
        exists (select 1 from public.vibe_rooms r where r.id = room_id and r.owner_id = auth.uid())
      );
  end if;
end $$;

-- Push subs: anyone can insert their own, service role manages
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'vibe_push_subs: anyone insert' and tablename = 'vibe_push_subscriptions'
  ) then
    create policy "vibe_push_subs: anyone insert" on public.vibe_push_subscriptions
      for insert with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'vibe_push_subs: service all' and tablename = 'vibe_push_subscriptions'
  ) then
    create policy "vibe_push_subs: service all" on public.vibe_push_subscriptions
      for all using (true);
  end if;
end $$;
