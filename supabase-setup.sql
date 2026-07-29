-- Table des appels reçus par l'assistant IA
create table if not exists brynix_calls (
  id bigint generated always as identity primary key,
  nom text not null,
  tel text,
  resultat text not null, -- 'Qualifié + RDV' | 'Qualifié sans RDV' | 'Non qualifié' | 'Hors sujet'
  resume text,
  date timestamptz not null default now(),
  retell_call_id text unique -- évite les doublons si Retell renvoie le même événement plusieurs fois
);

-- Table des FAQ gérées par le client depuis le dashboard
create table if not exists brynix_faqs (
  id bigint primary key,
  q text not null,
  a text
);

-- Sécurité : active la Row Level Security sur les deux tables
alter table brynix_calls enable row level security;
alter table brynix_faqs enable row level security;

-- Seuls les utilisateurs connectés (authentifiés) peuvent lire/écrire
-- Important : ne créer un compte QUE pour le client concerné (inscriptions publiques désactivées)
drop policy if exists "Authenticated read/write brynix_calls" on brynix_calls;
create policy "Authenticated read/write brynix_calls" on brynix_calls
  for all using (auth.role() = 'authenticated');

drop policy if exists "Authenticated read/write brynix_faqs" on brynix_faqs;
create policy "Authenticated read/write brynix_faqs" on brynix_faqs
  for all using (auth.role() = 'authenticated');
