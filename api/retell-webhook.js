import { createClient } from '@supabase/supabase-js';

// Ces deux variables sont côté SERVEUR uniquement (jamais VITE_..., donc jamais
// exposées au navigateur). À ajouter dans Vercel > Settings > Environment Variables.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fait correspondre le statut renvoyé par Retell à nos catégories du dashboard.
// À ajuster une fois qu'on voit le format exact des vrais appels reçus.
function mapResultat(payload) {
  const analysis = payload?.call_analysis || {};
  const bookedMeeting = analysis.booked_meeting || payload?.metadata?.booked_meeting;
  const successful = analysis.call_successful;

  if (bookedMeeting) return 'Qualifié + RDV';
  if (successful === false) return 'Hors sujet';
  if (successful === true) return 'Qualifié sans RDV';
  return 'Non qualifié';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Vérification simple : Retell peut envoyer un secret dans les headers.
  // Ajoute RETELL_WEBHOOK_SECRET dans Vercel et configure la même valeur côté Retell
  // (Settings > Webhooks) pour éviter que n'importe qui puisse appeler cette route.
  const secret = req.headers['x-retell-secret'];
  if (process.env.RETELL_WEBHOOK_SECRET && secret !== process.env.RETELL_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const payload = req.body;

    // Ne traite que l'événement de fin d'appel (à ajuster si Retell envoie
    // un nom d'événement différent — vérifier dans les logs du premier vrai appel).
    if (payload?.event && payload.event !== 'call_ended' && payload.event !== 'call_analyzed') {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const call = payload?.call || payload;

    const row = {
      nom: call?.metadata?.nom_prospect || call?.from_number || 'Inconnu',
      tel: call?.from_number || call?.to_number || null,
      resultat: mapResultat(payload),
      resume: call?.call_analysis?.call_summary || call?.transcript_summary || 'Résumé non disponible',
      date: call?.start_timestamp
        ? new Date(call.start_timestamp).toISOString()
        : new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('brynix_calls').insert(row);

    if (error) {
      console.error('Erreur insertion Supabase:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erreur webhook Retell:', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
}
