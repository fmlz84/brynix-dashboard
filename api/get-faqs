import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  const { data, error } = await supabaseAdmin.from('brynix_faqs').select('q, a');
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ faqs: data });
}
