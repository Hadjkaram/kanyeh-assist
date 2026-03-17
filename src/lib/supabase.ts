import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Il manque les clés Supabase dans le fichier .env.local");
}

// On initialise la connexion à ta base de données
export const supabase = createClient(supabaseUrl, supabaseAnonKey);