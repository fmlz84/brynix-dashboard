-- À exécuter dans Supabase : Project > SQL Editor > New query
-- Noms préfixés "brynix_" pour éviter tout conflit avec des tables existantes.

create table if not exists brynix_calls (
  id bigint generated always as identity primary key,
  nom text not null,
  tel text,
  resultat text not null, -- 'Qualifié + RDV' | 'Qualifié sans RDV' | 'Non qualifié' | 'Hors sujet'
  resume text,
  date timestamptz not null default now()
);

create table if not exists brynix_faqs (
  id bigint primary key,
  q text not null,
  a text
);

-- Sécurité de base : active RLS et autorise la lecture/écriture
-- uniquement aux utilisateurs authentifiés (à affiner par client plus tard,
-- ex: une colonne client_id + une policy par client une fois multi-clients).
alter table brynix_calls enable row level security;
alter table brynix_faqs enable row level security;

drop policy if exists "Authenticated read/write brynix_calls" on brynix_calls;
create policy "Authenticated read/write brynix_calls" on brynix_calls
  for all using (auth.role() = 'authenticated');

drop policy if exists "Authenticated read/write brynix_faqs" on brynix_faqs;
create policy "Authenticated read/write brynix_faqs" on brynix_faqs
  for all using (auth.role() = 'authenticated');
