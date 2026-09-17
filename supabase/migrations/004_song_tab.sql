-- A second link per song, for the tab or sheet. Run once in Supabase → SQL editor.
alter table public.songs add column if not exists tab text;
