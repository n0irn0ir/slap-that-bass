-- Sticky notes. Run once in Supabase → SQL editor.
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null default '',
  color text not null default 'yellow' check (color in ('yellow','pink','cyan','lime')),
  x integer not null default 0,
  y integer not null default 0,
  rotate real not null default 0,
  stuck boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;
create policy "own notes" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
