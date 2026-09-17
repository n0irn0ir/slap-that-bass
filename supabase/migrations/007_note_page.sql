-- A sticky note belongs to the page it was stuck on. Run once in Supabase → SQL editor.
alter table public.notes add column if not exists page text not null default '/';
