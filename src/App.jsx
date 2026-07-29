import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from './supabaseClient.js';

/* ---------- Design tokens (thème "chantier BTP") ---------- */
const RESULT_STYLES = {
  'Qualifié + RDV': { color: '#2ECC71', label: 'RDV pris' },
  'Qualifié sans RDV': { color: '#FF6B35', label: 'À relancer' },
  'Non qualifié': { color: '#4A5D52', label: 'Non qualifié' },
  'Hors sujet': { color: '#5E6B63', label: 'Hors sujet' },
};

const DEMO_CALLS = [
  { id: 1, nom: 'Test Test', tel: '+33 6 12 34 56 78', resultat: 'Qualifié + RDV', resume: "Rénovation d'allée à Lyon, propriétaire, projet urgent (2 semaines), budget non défini. RDV réservé lundi 27 juillet 11h.", date: '2026-07-25T17:02:00Z' },
  { id: 2, nom: 'Karim Belhadj', tel: '+33 6 22 33 44 55', resultat: 'Qualifié sans RDV', resume: "Extension de maison, réflexion en cours, pas de timing précis. Documentation envoyée par email.", date: '2026-07-24T14:30:00Z' },
  { id: 3, nom: 'Amel Trabelsi', tel: '+33 6 33 44 55 66', resultat: 'Non qualifié', resume: "Demande de devis peinture, hors périmètre des services proposés.", date: '2026-07-24T09:15:00Z' },
  { id: 4, nom: 'Numéro inconnu', tel: '+33 6 44 55 66 77', resultat: 'Hors sujet', resume: "Faux numéro, l'appelant cherchait un autre service.", date: '2026-07-23T16:45:00Z' },
  { id: 5, nom: 'Sophie Marchand', tel: '+33 6 55 66 77 88', resultat: 'Qualifié + RDV', resume: "Toiture à refaire suite à une fuite, propriétaire, urgent. RDV réservé mercredi 29 juillet 9h.", date: '2026-07-23T11:20:00Z' },
];

const DEFAULT_FAQ = [
  { id: 1, q: 'Horaires d\u2019ouverture', a: 'Du lundi au vendredi, 8h \u2013 18h.' },
  { id: 2, q: 'Zone d\u2019intervention', a: 'Lyon et un rayon de 40 km autour.' },
  { id: 3, q: 'Devis gratuit ?', a: 'Oui, premier devis toujours gratuit et sans engagement.' },
];

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' · ' +
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!supabase) {
      // Pas de Supabase configuré -> mode démo, on laisse entrer
      onLogin();
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('Email ou mot de passe incorrect.');
    else onLogin();
  }

  return (
    <div style={s.loginWrap}>
      <div style={s.loginCard}>
        <div style={s.brand}>BRYNIX</div>
        <h1 style={s.loginTitle}>Suivi du standard</h1>
        <p style={s.loginSub}>Connectez-vous pour voir l\u2019activité de votre assistant.</p>
        <label style={s.label}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={s.input} placeholder="vous@entreprise.com" />
        <label style={s.label}>Mot de passe</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={s.input} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" />
        {error && <p style={s.errorText}>{error}</p>}
        <button onClick={handleLogin} style={s.submitBtn}>Se connecter</button>
        {!supabase && <p style={s.demoNote}>Supabase non configuré \u2014 mode démo actif.</p>}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statBar, background: accent }} />
      <div style={s.statBody}>
        <div style={s.statValue}>{value}</div>
        <div style={s.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function CallRow({ call }) {
  const style = RESULT_STYLES[call.resultat] || RESULT_STYLES['Non qualifié'];
  return (
    <div style={s.callRow}>
      <div style={{ ...s.callTag, background: style.color }} />
      <div style={s.callMain}>
        <div style={s.callTop}>
          <span style={s.callName}>{call.nom}</span>
          <span style={{ ...s.callBadge, color: style.color, borderColor: style.color }}>{style.label}</span>
        </div>
        <div style={s.callSummary}>{call.resume}</div>
        <div style={s.callMeta}>
          <span>{call.tel}</span>
          <span>{fmtDate(call.date)}</span>
        </div>
      </div>
    </div>
  );
}

function FaqPanel({ faqs, setFaqs, saveFaq, deleteFaq }) {
  const [editing, setEditing] = useState(null);
  const [draftQ, setDraftQ] = useState('');
  const [draftA, setDraftA] = useState('');

  function startAdd() { setEditing('new'); setDraftQ(''); setDraftA(''); }
  function startEdit(item) { setEditing(item.id); setDraftQ(item.q); setDraftA(item.a); }

  async function save() {
    if (!draftQ.trim()) return;
    if (editing === 'new') {
      const newItem = { id: Date.now(), q: draftQ, a: draftA };
      setFaqs([...faqs, newItem]);
      await saveFaq(newItem);
    } else {
      const updated = faqs.map((f) => (f.id === editing ? { ...f, q: draftQ, a: draftA } : f));
      setFaqs(updated);
      await saveFaq(updated.find((f) => f.id === editing));
    }
    setEditing(null);
  }

  async function remove(id) {
    setFaqs(faqs.filter((f) => f.id !== id));
    await deleteFaq(id);
  }

  return (
    <div style={s.panel}>
      <div style={s.panelHeader}>
        <p style={s.panelTitle}>FAQ gérées par vous</p>
        <button style={s.smallBtn} onClick={startAdd}>+ Ajouter</button>
      </div>

      {editing !== null && (
        <div style={s.faqEditBox}>
          <input style={s.input} placeholder="Question" value={draftQ} onChange={(e) => setDraftQ(e.target.value)} />
          <textarea style={{ ...s.input, ...s.textarea }} placeholder="Réponse que l'assistant doit donner" value={draftA} onChange={(e) => setDraftA(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button style={s.submitBtnSmall} onClick={save}>Enregistrer</button>
            <button style={s.ghostBtn} onClick={() => setEditing(null)}>Annuler</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {faqs.map((f) => (
          <div key={f.id} style={s.faqRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={s.faqQ}>{f.q}</p>
              <p style={s.faqA}>{f.a}</p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button style={s.iconBtn} onClick={() => startEdit(f)} aria-label={`Modifier ${f.q}`}>✎</button>
              <button style={s.iconBtn} onClick={() => remove(f.id)} aria-label={`Supprimer ${f.q}`}>✕</button>
            </div>
          </div>
        ))}
        {faqs.length === 0 && <p style={s.emptyText}>Aucune question configurée pour l'instant.</p>}
      </div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState('Tous');
  const [calls, setCalls] = useState(DEMO_CALLS);
  const [faqs, setFaqs] = useState(DEFAULT_FAQ);
  const [loading, setLoading] = useState(false);

  // Charge les vraies données depuis Supabase si configuré, sinon garde la démo
  useEffect(() => {
    if (!loggedIn || !supabase) return;
    setLoading(true);
    (async () => {
      const { data: callsData } = await supabase
        .from('brynix_calls')
        .select('*')
        .order('date', { ascending: false });
      if (callsData) setCalls(callsData);

      if (faqData) setFaqs(faqData);

      setLoading(false);
    })();
  }, [loggedIn]);

  async function saveFaq(item) {
    if (!supabase) return;
    await supabase.from('brynix_faqs').upsert(item);
  }
  async function deleteFaq(id) {
    if (!supabase) return;
    await supabase.from('brynix_faqs').delete().eq('id', id);
  }

  const total = calls.length;
  const rdv = calls.filter((c) => c.resultat === 'Qualifié + RDV').length;
  const aRelancer = calls.filter((c) => c.resultat === 'Qualifié sans RDV').length;
  const manques = calls.filter((c) => c.resultat === 'Hors sujet' || c.resultat === 'Non qualifié').length;

  const filtered = useMemo(() => {
    if (filter === 'Tous') return calls;
    return calls.filter((c) => c.resultat === filter);
  }, [filter, calls]);

  function exportCsv() {
    const header = 'Nom,Téléphone,Résultat,Date,Résumé\n';
    const rows = calls
      .map((c) => `"${c.nom}","${c.tel}","${c.resultat}","${fmtDate(c.date)}","${(c.resume || '').replace(/"/g, "'")}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brynix-historique-appels.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.brand}>BRYNIX</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button style={paused ? s.pausedBtn : s.pauseBtn} onClick={() => setPaused(!paused)}>
            {paused ? '⏸ En pause' : '⏸ Mettre en pause'}
          </button>
          <button style={s.logoutBtn} onClick={() => setLoggedIn(false)}>Se déconnecter</button>
        </div>
      </header>

      <main style={s.main}>
        <h1 style={s.pageTitle}>Activité du standard</h1>
        <p style={s.pageSub}>
          {paused
            ? "Votre assistant est en pause \u2014 les appels ne sont plus pris en charge."
            : "30 derniers jours \u2014 chaque appel reçu par votre assistant, en direct."}
        </p>

        {loading && <p style={s.emptyText}>Chargement...</p>}

        <div style={s.statsRow}>
          <StatCard label="Appels reçus" value={total} accent="#4A5D52" />
          <StatCard label="RDV pris" value={rdv} accent="#2ECC71" />
          <StatCard label="À relancer" value={aRelancer} accent="#FF6B35" />
          <StatCard label="Auraient été manqués" value={manques} accent="#5E6B63" />
        </div>

        <div style={s.grid}>
          <div style={s.panel}>
            <div style={s.panelHeader}>
              <p style={s.panelTitle}>Historique des appels</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} style={s.select} aria-label="Filtrer les appels par résultat">
                  <option>Tous</option>
                  {Object.keys(RESULT_STYLES).map((k) => <option key={k}>{k}</option>)}
                </select>
                <button style={s.smallBtn} onClick={exportCsv}>Exporter CSV</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((c) => <CallRow key={c.id} call={c} />)}
              {filtered.length === 0 && <p style={s.emptyText}>Aucun appel pour ce filtre.</p>}
            </div>
          </div>

          <FaqPanel faqs={faqs} setFaqs={setFaqs} saveFaq={saveFaq} deleteFaq={deleteFaq} />
        </div>
      </main>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#0F1512', fontFamily: "'Inter', -apple-system, sans-serif", color: '#F5F1E8' },
  loginWrap: { minHeight: '100vh', background: '#0F1512', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', -apple-system, sans-serif", padding: 20 },
  loginCard: { background: '#161D19', border: '1px solid #263029', borderRadius: 12, padding: 40, maxWidth: 380, width: '100%' },
  brand: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: '0.12em', color: '#FF6B35' },
  loginTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, margin: '16px 0 6px', color: '#F5F1E8' },
  loginSub: { fontSize: 14, color: '#8A9A90', margin: 0 },
  label: { display: 'block', fontSize: 12, color: '#8A9A90', marginBottom: 6, marginTop: 16, letterSpacing: '0.03em' },
  input: { width: '100%', background: '#0F1512', border: '1px solid #2C3830', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: '#F5F1E8', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  textarea: { minHeight: 60, resize: 'vertical', marginTop: 8 },
  submitBtn: { width: '100%', marginTop: 22, background: '#FF6B35', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, color: '#0F1512', cursor: 'pointer' },
  submitBtnSmall: { background: '#FF6B35', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#0F1512', cursor: 'pointer' },
  ghostBtn: { background: 'transparent', border: '1px solid #2C3830', borderRadius: 6, padding: '8px 14px', fontSize: 13, color: '#8A9A90', cursor: 'pointer' },
  errorText: { color: '#FF6B35', fontSize: 12, marginTop: 10 },
  demoNote: { color: '#5E6B63', fontSize: 11, marginTop: 14, textAlign: 'center' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 28px', borderBottom: '1px solid #1D2620', flexWrap: 'wrap', gap: 10 },
  pauseBtn: { background: 'transparent', border: '1px solid #2C3830', borderRadius: 6, padding: '7px 12px', color: '#8A9A90', fontSize: 12, cursor: 'pointer' },
  pausedBtn: { background: '#2A1D14', border: '1px solid #FF6B35', borderRadius: 6, padding: '7px 12px', color: '#FF6B35', fontSize: 12, cursor: 'pointer' },
  logoutBtn: { background: 'transparent', border: '1px solid #2C3830', borderRadius: 6, padding: '7px 12px', color: '#8A9A90', fontSize: 12, cursor: 'pointer' },
  main: { maxWidth: 980, margin: '0 auto', padding: '32px 20px 80px' },
  pageTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, margin: '0 0 4px' },
  pageSub: { color: '#8A9A90', fontSize: 14, margin: '0 0 28px' },
  statsRow: { display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' },
  statCard: { flex: '1 1 150px', background: '#161D19', border: '1px solid #263029', borderRadius: 10, display: 'flex', overflow: 'hidden' },
  statBar: { width: 4 },
  statBody: { padding: '14px 16px' },
  statValue: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700 },
  statLabel: { fontSize: 12, color: '#8A9A90', marginTop: 2 },
  grid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 },
  panel: { background: '#161D19', border: '1px solid #263029', borderRadius: 12, padding: '16px 18px', height: 'fit-content' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  panelTitle: { fontWeight: 600, fontSize: 14, margin: 0 },
  smallBtn: { background: 'transparent', border: '1px solid #FF6B35', borderRadius: 6, padding: '5px 10px', color: '#FF6B35', fontSize: 12, cursor: 'pointer' },
  select: { background: '#0F1512', border: '1px solid #2C3830', borderRadius: 6, padding: '5px 8px', color: '#F5F1E8', fontSize: 12 },
  callRow: { display: 'flex', background: '#0F1512', border: '1px solid #1D2620', borderRadius: 10, overflow: 'hidden' },
  callTag: { width: 4, flexShrink: 0 },
  callMain: { padding: '12px 16px', flex: 1, minWidth: 0 },
  callTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8, flexWrap: 'wrap' },
  callName: { fontWeight: 600, fontSize: 14 },
  callBadge: { fontSize: 11, fontWeight: 600, border: '1px solid', borderRadius: 20, padding: '2px 9px', letterSpacing: '0.02em', whiteSpace: 'nowrap' },
  callSummary: { fontSize: 13, color: '#B8C4BC', lineHeight: 1.5, marginBottom: 8 },
  callMeta: { display: 'flex', gap: 14, fontSize: 12, color: '#5E6B63', flexWrap: 'wrap' },
  faqRow: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 0', borderTop: '1px solid #1D2620' },
  faqQ: { fontSize: 13, fontWeight: 600, margin: '0 0 2px' },
  faqA: { fontSize: 12, color: '#8A9A90', margin: 0 },
  iconBtn: { background: 'transparent', border: '1px solid #2C3830', borderRadius: 6, width: 26, height: 26, color: '#8A9A90', cursor: 'pointer', fontSize: 12 },
  faqEditBox: { background: '#0F1512', border: '1px solid #263029', borderRadius: 8, padding: 12, marginBottom: 12 },
  emptyText: { fontSize: 13, color: '#5E6B63', padding: '8px 0' },
};
