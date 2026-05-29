create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#0f766e',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('expense', 'cash-in')),
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  category text not null,
  transaction_date date not null,
  transaction_time time not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.groups enable row level security;
alter table public.transactions enable row level security;

create policy "Users can read their own groups"
  on public.groups for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own groups"
  on public.groups for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own groups"
  on public.groups for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own groups"
  on public.groups for delete
  using ((select auth.uid()) = user_id);

create policy "Users can read their own transactions"
  on public.transactions for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using ((select auth.uid()) = user_id);
