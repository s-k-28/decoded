import { useRef, useState } from 'react';
import { decode, type DecodeResult } from './lib/decode';
import { speak, stopSpeaking, supportsTTS } from './lib/tts';

const EXAMPLES: { label: string; text: string }[] = [
  {
    label: 'Eviction notice',
    text:
      'NOTICE TO PAY RENT OR QUIT. You owe 1450 dollars in rent for the month of May 2026. You must pay this amount in full or move out and surrender the premises within THREE (3) DAYS after you receive this notice, not counting weekends or legal holidays. If you fail to pay or move out, we will begin a court case to evict you and to recover possession, unpaid rent, damages, and costs. Payment must be made by certified check or money order to the landlord at the address above. Dated June 12, 2026.',
  },
  {
    label: 'Medical bill',
    text:
      'STATEMENT OF ACCOUNT. Date of service: 04/18/2026. Provider: Regional Medical Center. Emergency room visit 2,840.00. Laboratory 612.00. Radiology 1,150.00. Adjustments -1,900.00. Insurance paid -1,402.00. PATIENT BALANCE DUE: 1,300.00. Payment is due within 30 days. Accounts not paid may be referred to a collection agency. Please remit payment to the address on the reverse of this statement.',
  },
  {
    label: 'Benefits letter',
    text:
      'NOTICE OF ACTION. Your application for SNAP food benefits has been DENIED. Reason: failure to provide requested verification of income by the due date. You have the right to request a fair hearing within 90 days of the date of this notice if you disagree with this decision. To request a hearing, contact your local office. You may reapply at any time.',
  },
];

const LANGS = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Espanol' },
  { code: 'zh', name: 'Chinese' },
  { code: 'vi', name: 'Tieng Viet' },
  { code: 'fr', name: 'Francais' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ht', name: 'Kreyol Ayisyen' },
];

const LEVELS = [
  { id: 'grade5', label: 'Simplest' },
  { id: 'grade8', label: 'Standard' },
  { id: 'plain', label: 'Plain' },
];

export default function App() {
  const [large, setLarge] = useState(false);
  const [tab, setTab] = useState<'paste' | 'photo'>('paste');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [readingLevel, setReadingLevel] = useState('grade8');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canRun = (tab === 'paste' && text.trim().length > 0) || (tab === 'photo' && !!imageUrl);

  const run = async (over?: { readingLevel?: string; language?: string }) => {
    const rl = over?.readingLevel ?? readingLevel;
    const lg = over?.language ?? language;
    if (!canRun) return;
    stopSpeaking();
    setSpeaking(false);
    setLoading(true);
    setError(null);
    try {
      const r = await decode({
        text: tab === 'paste' ? text : undefined,
        imageUrl: tab === 'photo' ? imageUrl ?? undefined : undefined,
        readingLevel: rl,
        language: lg,
      });
      setResult(r);
      setDraft(r.draft_response || '');
    } catch (e) {
      setError((e as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const changeLevel = (id: string) => {
    setReadingLevel(id);
    if (result) run({ readingLevel: id });
  };
  const changeLang = (code: string) => {
    setLanguage(code);
    if (result) run({ language: code });
  };

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setTab('photo');
    };
    reader.readAsDataURL(f);
  };

  const sayAll = () => {
    if (!result) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const parts = [
      result.summary,
      result.meaning_for_you,
      result.deadlines.length ? 'Deadlines. ' + result.deadlines.map((d) => `${d.label}. ${d.raw_text}`).join('. ') : '',
      result.actions.length ? 'What to do. ' + result.actions.map((a) => a.task).join('. ') : '',
    ]
      .filter(Boolean)
      .join('. ');
    setSpeaking(true);
    speak(parts, language, () => setSpeaking(false));
  };

  const reset = () => {
    setResult(null);
    setText('');
    setImageUrl(null);
    setError(null);
    stopSpeaking();
    setSpeaking(false);
  };

  return (
    <div className="app" data-large={large}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">D</span>
          <span className="brand-name">Decoded</span>
          <span className="brand-tag">understand any official document</span>
        </div>
        <span className="topbar-spacer" />
        <button className="topbar-toggle" aria-pressed={large} onClick={() => setLarge((v) => !v)}>
          <Icon.A /> Larger text
        </button>
      </header>

      <div className="disclaimer">
        <Icon.Shield />
        <span>
          <strong>Decoded explains documents in plain language.</strong> It is not legal or medical advice, and it
          points you to real help.
        </span>
      </div>

      <main className="main">
        {!result && !loading && (
          <div className="hero">
            <span className="hero-eyebrow">AI for social good</span>
            <h1 className="hero-title">That scary letter, explained in plain language.</h1>
            <p className="hero-sub">
              Paste or photograph any official document, an eviction notice, a medical bill, a benefits letter, and
              see what it means, your deadlines, your rights, and what to do next. In your language, read aloud.
            </p>
          </div>
        )}

        {!loading && (
          <>
            <div className="input-card">
              <div className="input-tabs" role="tablist" aria-label="Document input">
                <button className="input-tab" role="tab" aria-selected={tab === 'paste'} onClick={() => setTab('paste')}>
                  Paste text
                </button>
                <button className="input-tab" role="tab" aria-selected={tab === 'photo'} onClick={() => setTab('photo')}>
                  Upload a photo
                </button>
              </div>
              <div className="input-body">
                {tab === 'paste' ? (
                  <textarea
                    className="input-area"
                    placeholder="Paste the words from your letter or bill here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    aria-label="Document text"
                  />
                ) : (
                  <div
                    className="dropzone"
                    role="button"
                    tabIndex={0}
                    onClick={() => fileRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click(); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
                  >
                    {imageUrl ? (
                      <img className="dropzone-preview" src={imageUrl} alt="Your uploaded document" />
                    ) : (
                      <>
                        <span className="dropzone-icon"><Icon.Camera /></span>
                        <span>Tap to take a photo or upload an image</span>
                        <span className="dropzone-hint">A clear photo of the whole page works best</span>
                      </>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
                    />
                  </div>
                )}
                <div className="input-foot">
                  <div className="example-chips">
                    {EXAMPLES.map((ex) => (
                      <button key={ex.label} className="chip" onClick={() => { setText(ex.text); setTab('paste'); }}>
                        {ex.label}
                      </button>
                    ))}
                  </div>
                  <button className="btn" disabled={!canRun} onClick={() => run()}>
                    Decode this
                  </button>
                </div>
              </div>
            </div>

            <div className="controls">
              <div className="control">
                <span className="control-label">Reading level</span>
                <div className="segmented" role="group" aria-label="Reading level">
                  {LEVELS.map((l) => (
                    <button key={l.id} aria-pressed={readingLevel === l.id} onClick={() => changeLevel(l.id)}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="control">
                <span className="control-label">Language</span>
                <select className="select" value={language} onChange={(e) => changeLang(e.target.value)} aria-label="Language">
                  {LANGS.map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {loading && (
          <div className="loading" role="status">
            <div className="spinner" aria-hidden="true" />
            <div className="loading-text">Reading your document...</div>
          </div>
        )}

        {error && !loading && <div className="error-box" role="alert">{error}</div>}

        {result && !loading && (
          <div className="result">
            <div className="result-head">
              <span className="result-type">{result.document_type}</span>
              <span className={`badge badge--conf-${result.confidence}`}>{result.confidence} confidence</span>
              {supportsTTS() && (
                <button className="speak-btn" data-on={speaking} onClick={sayAll}>
                  <Icon.Speak /> {speaking ? 'Stop' : 'Listen'}
                </button>
              )}
            </div>

            <section className="card card--summary">
              <div className="card-head"><span className="card-icon"><Icon.Doc /></span><span className="card-title">What this is</span></div>
              <p className="summary-lead">{result.summary}</p>
              <p className="summary-meaning">{result.meaning_for_you}</p>
            </section>

            {result.deadlines.length > 0 && (
              <section className="card card--deadlines">
                <div className="card-head"><span className="card-icon"><Icon.Clock /></span><span className="card-title">Deadlines</span></div>
                {result.deadlines.map((d, i) => (
                  <div className="row" key={i}>
                    <span className={`row-dot row-dot--${d.urgency}`} />
                    <div className="row-body">
                      <div className="row-inline">
                        <span className="row-title">{d.label}{d.date ? ` - ${d.date}` : ''}</span>
                        <span className={`urgency urgency--${d.urgency}`}>{d.urgency}</span>
                      </div>
                      <div className="row-raw">&ldquo;{d.raw_text}&rdquo;</div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {result.actions.length > 0 && (
              <section className="card card--actions">
                <div className="card-head"><span className="card-icon"><Icon.Check /></span><span className="card-title">What to do</span></div>
                {result.actions.map((a, i) => (
                  <div className="row" key={i}>
                    <span className="check" aria-hidden="true" />
                    <div className="row-body"><div className="row-title">{a.task}{a.by ? ` (by ${a.by})` : ''}</div><div className="row-note">{a.why}</div></div>
                  </div>
                ))}
              </section>
            )}

            {result.rights.length > 0 && (
              <section className="card card--rights">
                <div className="card-head"><span className="card-icon"><Icon.Shield /></span><span className="card-title">Your rights</span></div>
                {result.rights.map((r, i) => (
                  <div className="row" key={i}>
                    <span className="row-dot" style={{ background: 'var(--green)' }} />
                    <div className="row-body"><div className="row-title">{r.right}</div>{r.basis ? <div className="row-note">{r.basis}</div> : <span className="right-tag">General guidance, verify for your situation</span>}</div>
                  </div>
                ))}
              </section>
            )}

            {result.red_flags.length > 0 ? (
              <section className="card card--flags">
                <div className="card-head"><span className="card-icon"><Icon.Flag /></span><span className="card-title">Watch out</span></div>
                {result.red_flags.map((f, i) => (
                  <div className="row" key={i}>
                    <span className="row-dot" style={{ background: 'var(--red)' }} />
                    <div className="row-body"><div className="row-inline"><span className="row-title">{f.flag}</span><span className={`sev sev--${f.severity}`}>{f.severity}</span></div><div className="row-note">{f.explanation}</div></div>
                  </div>
                ))}
              </section>
            ) : (
              <section className="card"><div className="flags-clear"><Icon.Shield /> No predatory or scam signals were found in this document.</div></section>
            )}

            <section className="card card--draft">
              <div className="card-head"><span className="card-icon"><Icon.Mail /></span><span className="card-title">Draft a reply</span></div>
              <textarea className="draft-text" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Draft reply" />
              <div className="draft-foot">
                <button className="btn btn--sm" onClick={() => navigator.clipboard?.writeText(draft)}>Copy</button>
                <span className="right-tag">Draft, review before sending.</span>
              </div>
            </section>

            {result.uncertainties.length > 0 && (
              <div className="uncertain"><strong>Decoded was not sure about: </strong>{result.uncertainties.join('; ')}. Double-check the original.</div>
            )}

            {result.get_help.length > 0 && (
              <section className="card card--help">
                <div className="card-head"><span className="card-icon"><Icon.Help /></span><span className="card-title">Get real help</span></div>
                {result.get_help.map((h, i) => (
                  <div className="help-item" key={i}>
                    <span className="row-dot" style={{ background: 'var(--green)', marginTop: 7 }} />
                    <div className="row-body"><div className="help-name">{h.resource}</div><div className="help-note">{h.note}</div></div>
                  </div>
                ))}
              </section>
            )}

            <button className="btn btn--ghost" onClick={reset}>Decode another document</button>
          </div>
        )}
      </main>

      <footer className="footer">
        Decoded - AI for social good. Explains documents in plain language, in your language, read aloud. Not legal or
        medical advice.
      </footer>
    </div>
  );
}

const Icon = {
  Doc: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>),
  Clock: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  Check: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>),
  Shield: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>),
  Flag: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22v-7" /></svg>),
  Mail: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>),
  Help: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>),
  Camera: () => (<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4z" /><circle cx="12" cy="13" r="3.5" /></svg>),
  Speak: () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></svg>),
  A: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 19 6-14 6 14" /><path d="M8.5 14h7" /></svg>),
};
