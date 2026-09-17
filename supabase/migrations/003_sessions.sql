-- Sessions: a diary entry that groups several log lines. Run once in Supabase → SQL editor.
-- Existing log_entries are left alone; the app links each of them to a one-line session on first load.

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  title text,
  note text,
  rating smallint check (rating between 1 and 5),
  minutes integer not null check (minutes > 0),
  created_at timestamptz not null default now()
);

alter table public.sessions enable row level security;
create policy "own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists sessions_user_date on public.sessions (user_id, date desc);

alter table public.log_entries
  add column if not exists session_id uuid references public.sessions(id) on delete cascade,
  add column if not exists song_id uuid references public.songs(id) on delete set null,
  add column if not exists fixed boolean not null default false;

-- a line may end up with 0 minutes when the typed-in lines use up the whole session
alter table public.log_entries drop constraint if exists log_entries_minutes_check;
alter table public.log_entries add constraint log_entries_minutes_check check (minutes >= 0);

create index if not exists log_entries_session on public.log_entries (session_id);
