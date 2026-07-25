import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si les variables d'environnement ne sont pas encore configurées,
// l'app tourne quand même avec des données de démo (voir App.jsx).
export const supabase = url && key ? createClient(url, key) : null;
