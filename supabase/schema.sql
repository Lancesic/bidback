create extension if not exists pgcrypto;

create table if not exists public.bidback_testers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  email_normalized text not null unique,
  phone text not null,
  app_data jsonb,
  app_summary jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bidback_feedback (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid references public.bidback_testers(id) on delete set null,
  comments text not null default '',
  feedback_package jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.bidback_testers enable row level security;
alter table public.bidback_feedback enable row level security;

create index if not exists bidback_testers_last_seen_idx
  on public.bidback_testers (last_seen_at desc);

create index if not exists bidback_feedback_created_idx
  on public.bidback_feedback (created_at desc);
