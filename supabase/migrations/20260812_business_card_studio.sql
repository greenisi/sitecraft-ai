-- Sitecraft Business Card Studio
create table if not exists public.business_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  name text not null default 'My business card',
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published')),
  full_name text not null default '',
  job_title text not null default '',
  company text not null default '',
  bio text not null default '',
  email text not null default '',
  phone text not null default '',
  website text not null default '',
  location text not null default '',
  booking_url text not null default '',
  social_links jsonb not null default '[]'::jsonb,
  design jsonb not null default '{}'::jsonb,
  view_count integer not null default 0,
  save_count integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_card_leads (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.business_cards(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_business_cards_user_updated
  on public.business_cards(user_id, updated_at desc);
create index if not exists idx_business_cards_project
  on public.business_cards(project_id) where project_id is not null;
create unique index if not exists idx_business_cards_public_slug
  on public.business_cards(slug);
create index if not exists idx_business_card_leads_owner_created
  on public.business_card_leads(owner_user_id, created_at desc);
create index if not exists idx_business_card_leads_card_created
  on public.business_card_leads(card_id, created_at desc);

alter table public.business_cards enable row level security;
alter table public.business_card_leads enable row level security;

drop policy if exists "Owners manage business cards" on public.business_cards;
create policy "Owners manage business cards"
  on public.business_cards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Published business cards are public" on public.business_cards;
create policy "Published business cards are public"
  on public.business_cards for select
  using (status = 'published');

drop policy if exists "Owners read card leads" on public.business_card_leads;
create policy "Owners read card leads"
  on public.business_card_leads for select
  using (auth.uid() = owner_user_id);

drop policy if exists "Visitors submit card leads" on public.business_card_leads;
create policy "Visitors submit card leads"
  on public.business_card_leads for insert
  with check (
    exists (
      select 1 from public.business_cards
      where business_cards.id = card_id
        and business_cards.user_id = owner_user_id
        and business_cards.status = 'published'
    )
  );

comment on table public.business_cards is 'User-designed digital, print, and Wallet business cards.';
comment on table public.business_card_leads is 'Contacts exchanged through published business cards.';

