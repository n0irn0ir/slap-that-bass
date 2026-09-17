-- Two more sticky note colours. Run once in Supabase → SQL editor.
alter table public.notes drop constraint if exists notes_color_check;
alter table public.notes add constraint notes_color_check check (color in ('yellow','pink','cyan','lime','orange','violet'));
