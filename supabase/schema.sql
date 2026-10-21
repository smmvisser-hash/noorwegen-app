-- Noorwegen 2027: gedeelde gegevens van de app (uitgaven, paklijsten, park4night-codes, ...)
-- Eenmalig uitvoeren in Supabase: SQL Editor -> New query -> plakken -> Run.
create table if not exists public.items (
  id uuid primary key,
  soort text not null,
  data jsonb not null default '{}'::jsonb,
  verwijderd boolean not null default false,
  gewijzigd_op timestamptz not null default now(),
  gewijzigd_door uuid default auth.uid() references auth.users(id)
);
create index if not exists items_gewijzigd_op on public.items (gewijzigd_op);

-- De server zet zelf het tijdstip en wie de wijziging deed.
create or replace function public.zet_gewijzigd() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.gewijzigd_op := now();
  new.gewijzigd_door := auth.uid();
  return new;
end $$;
drop trigger if exists items_gewijzigd on public.items;
create trigger items_gewijzigd before insert or update on public.items
  for each row execute function public.zet_gewijzigd();

-- Beveiliging: alleen ingelogde gebruikers (jullie twee) mogen lezen en schrijven.
alter table public.items enable row level security;
drop policy if exists "lezen" on public.items;
drop policy if exists "toevoegen" on public.items;
drop policy if exists "wijzigen" on public.items;
create policy "lezen" on public.items for select to authenticated using (true);
create policy "toevoegen" on public.items for insert to authenticated with check (true);
create policy "wijzigen" on public.items for update to authenticated using (true) with check (true);
revoke all on public.items from anon;
grant select, insert, update on public.items to authenticated;
