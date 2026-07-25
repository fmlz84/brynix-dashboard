# Brynix Dashboard

Dashboard client pour le réceptionniste IA (thème "chantier BTP"). Fonctionne
en mode démo par défaut ; se connecte à Supabase dès que les variables
d'environnement sont configurées.

## 1. Tester en local (optionnel)

```bash
npm install
npm run dev
```

Ouvre l'URL affichée dans le terminal. Sans configuration Supabase, l'app
tourne avec des données de démo — connexion possible avec n'importe quel
email/mot de passe.

## 2. Pousser sur GitHub

```bash
git init
git add .
git commit -m "Premier commit — dashboard Brynix"
```

Crée un dépôt (privé de préférence) sur github.com, puis :

```bash
git remote add origin https://github.com/TON-COMPTE/brynix-dashboard.git
git branch -M main
git push -u origin main
```

## 3. Créer le projet Supabase

1. Va sur supabase.com → New project (choisis une région UE pour la conformité RGPD)
2. Une fois le projet créé : Project Settings → API → copie l'**URL** et la clé **anon public**
3. Va dans SQL Editor → New query → colle le contenu de `supabase-setup.sql` → Run
4. Active l'authentification par email dans Authentication → Providers (activé par défaut normalement)
5. Crée ton propre compte de connexion dans Authentication → Users → Add user (c'est toi qui te connectes pour l'instant, un compte par client viendra plus tard)

## 4. Déployer sur Vercel

1. Va sur vercel.com → New Project → importe ton dépôt GitHub `brynix-dashboard`
2. Vercel détecte automatiquement Vite — ne change rien aux paramètres de build
3. Avant de cliquer sur "Deploy", ouvre "Environment Variables" et ajoute :
   - `VITE_SUPABASE_URL` → l'URL copiée à l'étape 3
   - `VITE_SUPABASE_ANON_KEY` → la clé anon copiée à l'étape 3
4. Clique sur Deploy

Ton dashboard est en ligne, connecté à Supabase, avec la vraie authentification.

## 5. Brancher les vraies données (Retell + n8n)

Le dashboard lit deux tables :
- `brynix_calls` : une ligne par appel (nom, tel, resultat, resume, date)
- `brynix_faqs` : les questions/réponses gérées par le client

Ton workflow n8n doit, à la fin de chaque appel Retell, insérer une ligne
dans `brynix_calls` via l'API Supabase (endpoint REST auto-généré, clé
`service_role` à utiliser côté n8n — jamais côté frontend). Le dashboard
affichera la ligne automatiquement au prochain chargement de page.

## Notes RGPD

- Choisis bien une région Supabase dans l'UE à la création du projet
- Le fichier `supabase-setup.sql` active déjà une sécurité de base (RLS) —
  à affiner pour isoler les données par client dès que tu as plusieurs clients
  (ajouter une colonne `client_id` et une policy par client)
