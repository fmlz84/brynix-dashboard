import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function verifyRetellSignature(rawBody, signature, apiKey) {
  if (!signature) return false;
  const match = signature.match(/v=(\d+),d=(.*)/);
  if (!match) return false;
  const [, timestamp, digest] = match;
  if (Math.abs(Date.now() - Number(timestamp)) > 5 * 60 * 1000) return false;
  const expected = crypto.createHmac('sha256', apiKey).update(rawBody + timestamp).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(digest));
}

function mapResultat(payload) {
  const analysis = payload?.call_analysis || {};
  const bookedMeeting = analysis.booked_meeting || payload?.metadata?.booked_meeting;
  const successful = analysis.call_successful;
  if (bookedMeeting) return 'Qualifié + RDV';
  if (successful === false) return 'Hors sujet';
  if (successful === true) return 'Qualifié sans RDV';
  return 'Non qualifié';
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf-8');

  const valid = verifyRetellSignature(rawBody, req.headers['x-retell-signature'], process.env.RETELL_API_KEY);
  if (!valid) return res.status(401).json({ error: 'Signature invalide' });

  try {
    const payload = JSON.parse(rawBody);
    if (payload?.event && payload.event !== 'call_ended' && payload.event !== 'call_analyzed') {
      return res.status(200).json({ ok: true, skipped: true });
    }
    const call = payload?.call || payload;
    const row = {
      nom: call?.metadata?.nom_prospect || call?.from_number || 'Inconnu',
      tel: call?.from_number || call?.to_number || null,
      resultat: mapResultat(payload),
      resume: call?.call_analysis?.call_summary || call?.transcript_summary || 'Résumé non disponible',
      date: call?.start_timestamp ? new Date(call.start_timestamp).toISOString() : new Date().toISOString(),
      retell_call_id: call?.call_id || null,
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
