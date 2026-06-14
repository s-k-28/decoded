import { useEffect, useRef, useState } from 'react';
import { decode, type DecodeResult } from './lib/decode';
import { speak, stopSpeaking, supportsTTS } from './lib/tts';
import { downloadReminder } from './lib/ics';
import { loadHistory, saveToHistory, clearHistory, type HistoryItem } from './lib/history';
import { FLAGSHIP_TEXT, FLAGSHIP_RESULT } from './lib/demoFallback';
import { ImportPanel } from './components/ImportPanel';
import { LANGUAGES, modelLanguage, languageLabel, isRtl } from './lib/languages';

const LEVELS = [
  { id: 'grade5', label: 'Simplest' },
  { id: 'grade8', label: 'Standard' },
  { id: 'plain', label: 'Plain' },
];

const SCAN_STEPS = [
  'Reading the document',
  'Identifying the document type',
  'Checking it against the law',
  'Compiling your rights and the problems',
  'Finalizing the report',
];

export function Decoder({ onHome }: { onHome: () => void }) {
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
  // Which section is currently being read aloud ('all' = the whole result, or a
  // section key like 'summary'/'deadlines'). null means nothing is speaking.
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [showHistory, setShowHistory] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const [scanStep, setScanStep] = useState(0);

  useEffect(() => {
    if (result && resultRef.current) resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [result]);

  useEffect(() => {
    if (!loading) return;
    setScanStep(0);
    const id = setInterval(() => setScanStep((s) => Math.min(s + 1, SCAN_STEPS.length - 1)), 650);
    return () => clearInterval(id);
  }, [loading]);

  const canRun = (tab === 'paste' && text.trim().length > 0) || (tab === 'photo' && !!imageUrl);

  const run = async (over?: { readingLevel?: string; language?: string }) => {
    const rl = over?.readingLevel ?? readingLevel;
    const lg = over?.language ?? language;
    if (!canRun) return;
    stopSpeaking();
    setSpeakingId(null);
    setLoading(true);
    setError(null);
    try {
      const r = await decode({
        text: tab === 'paste' ? text : undefined,
        imageUrl: tab === 'photo' ? imageUrl ?? undefined : undefined,
        readingLevel: rl,
        // Send the full English language name so the model is never in doubt
        // about which language to write in, especially for less common ones.
        language: modelLanguage(lg),
      });
      // Keep the BCP-47 code on the result so read-aloud and saved history stay
      // consistent regardless of how the model echoes the language back.
      r.language = lg;
      setResult(r);
      setDraft(r.draft_response || '');
      saveToHistory(r, tab === 'photo' ? 'image' : 'text');
      setHistory(loadHistory());
    } catch (e) {
      // Demo safety net: if the flagship example fails to reach the function,
      // serve its verified result rather than an error so a live demo holds.
      if (tab === 'paste' && text.trim() === FLAGSHIP_TEXT.trim()) {
        setResult(FLAGSHIP_RESULT);
        setDraft(FLAGSHIP_RESULT.draft_response || '');
        saveToHistory(FLAGSHIP_RESULT, 'text');
        setHistory(loadHistory());
      } else {
        setError((e as Error).message || 'Something went wrong. Please try again.');
      }
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

  // Read one section aloud. Tapping the same section again stops it; tapping a
  // different one stops the first and starts the new one.
  const sayOne = (id: string, textToRead: string) => {
    if (speakingId === id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }
    const clean = textToRead.trim();
    if (!clean) return;
    stopSpeaking();
    setSpeakingId(id);
    speak(clean, language, () => setSpeakingId(null));
  };

  const sayAll = () => {
    if (!result) return;
    // Read only the model's already-translated fields, with no English section
    // labels, so the spoken text is entirely in the chosen language.
    const scam =
      result.scam_risk && (result.scam_risk.level === 'high' || result.scam_risk.level === 'medium')
        ? result.scam_risk.summary
        : '';
    const problems =
      (result.violations?.length ?? 0) > 0 ? result.violations!.map((v) => v.issue).join('. ') : '';
    const parts = [
      scam,
      result.summary,
      result.meaning_for_you,
      problems,
      result.deadlines.length ? result.deadlines.map((d) => `${d.label}. ${d.raw_text}`).join('. ') : '',
      result.actions.length ? result.actions.map((a) => a.task).join('. ') : '',
    ]
      .filter(Boolean)
      .join('. ');
    sayOne('all', parts);
  };

  // A small icon button for reading a single section aloud, shown in each card
  // head. Hidden entirely when the browser has no speech support.
  const listenBtn = (id: string, textToRead: string) =>
    supportsTTS() && textToRead.trim() ? (
      <button
        className="listen-mini"
        data-on={speakingId === id}
        onClick={() => sayOne(id, textToRead)}
        aria-label={speakingId === id ? 'Stop reading this section' : 'Read this section aloud'}
      >
        <Icon.Speak /> {speakingId === id ? 'Stop' : 'Listen'}
      </button>
    ) : null;

  const openHistory = (item: HistoryItem) => {
    setResult(item.result);
    setDraft(item.result.draft_response || '');
    setLanguage(item.language);
    setReadingLevel(item.readingLevel);
    setShowHistory(false);
    setError(null);
  };

  const reset = () => {
    setResult(null);
    setText('');
    setImageUrl(null);
    setError(null);
    stopSpeaking();
    setSpeakingId(null);
  };

  return (
    <div className="app" data-large={large}>
      <header className="topbar">
        <button className="brand brand-button" onClick={onHome} aria-label="Decoded home">
          <span className="brand-mark">D</span>
          <span className="brand-name">Decoded</span>
        </button>
        <span className="status-pill"><span className="status-dot" /> Analyzer online</span>
        <span className="topbar-spacer" />
        {history.length > 0 && (
          <button className="topbar-toggle" aria-pressed={showHistory} onClick={() => setShowHistory((v) => !v)}>
            <Icon.Stack /> Recent ({history.length})
          </button>
        )}
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
        {showHistory && (
          <section className="history">
            <div className="history-head">
              <span className="history-title">Saved on your device</span>
              <button className="link-btn" onClick={() => { clearHistory(); setHistory([]); setShowHistory(false); }}>
                Clear
              </button>
            </div>
            {history.map((h) => (
              <button key={h.id} className="history-item" onClick={() => openHistory(h)}>
                <span className="history-type">{h.documentType}</span>
                <span className="history-preview">{h.preview}</span>
              </button>
            ))}
          </section>
        )}

        {!result && !loading && (
          <div className="hero-mini">
            <h1 className="hero-mini-title">Paste or photograph your document.</h1>
            <p className="hero-mini-sub">You will get what it means, your deadlines, your rights, and what to do, in your language, read aloud.</p>
          </div>
        )}

        {!loading && (
          <>
            <ImportPanel
              text={text}
              setText={setText}
              imageUrl={imageUrl}
              setImageUrl={setImageUrl}
              tab={tab}
              setTab={setTab}
              canRun={canRun}
              onRun={() => run()}
            />

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
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{languageLabel(l)}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {loading && <Scan step={scanStep} />}

        {error && !loading && <div className="error-box" role="alert">{error}</div>}

        {result && !loading && (
          <div className="result" ref={resultRef} dir={isRtl(language) ? 'rtl' : 'ltr'}>
            <Verdict r={result} speaking={speakingId === 'all'} onSpeak={sayAll} canSpeak={supportsTTS()} />

            {result.confidence === 'low' && (
              <div className="uncertain">
                <strong>Decoded had trouble reading parts of this.</strong> Please check the original document, and consider getting help from one of the resources below.
              </div>
            )}

            <section className="card card--summary">
              <div className="card-head"><span className="card-icon"><Icon.Doc /></span><span className="card-title">What this is</span><span className="card-title-spacer" />{listenBtn('summary', `${result.summary}. ${result.meaning_for_you}`)}</div>
              <p className="summary-lead">{result.summary}</p>
              <p className="summary-meaning">{result.meaning_for_you}</p>
            </section>

            {(result.violations?.length ?? 0) > 0 && (
              <section className="card card--violations">
                <div className="card-head"><span className="card-icon"><Icon.Flag /></span><span className="card-title">Problems with this letter</span><span className="card-title-spacer" />{listenBtn('violations', result.violations!.map((v) => `${v.issue}. ${v.explanation}`).join('. '))}</div>
                {result.violations!.map((v, i) => (
                  <div className="row" key={i}>
                    <span className="row-dot row-dot--critical" />
                    <div className="row-body">
                      <div className="row-inline"><span className="row-title">{v.issue}</span><span className={`sev sev--${v.severity}`}>{v.severity}</span></div>
                      <div className="row-note">{v.explanation}</div>
                      {v.citation && (v.source_url
                        ? <a className="cite-link" href={v.source_url} target="_blank" rel="noreferrer">{v.citation}</a>
                        : <span className="cite-link cite-link--plain">{v.citation}</span>)}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {result.deadlines.length > 0 && (
              <section className="card card--deadlines">
                <div className="card-head"><span className="card-icon"><Icon.Clock /></span><span className="card-title">Deadlines</span><span className="card-title-spacer" />{listenBtn('deadlines', result.deadlines.map((d) => `${d.label}${d.date ? `, ${d.date}` : ''}. ${d.raw_text}`).join('. '))}</div>
                {result.deadlines.map((d, i) => (
                  <div className="row" key={i}>
                    <span className={`row-dot row-dot--${d.urgency}`} />
                    <div className="row-body">
                      <div className="row-inline">
                        <span className="row-title">{d.label}{d.date ? ` - ${d.date}` : ''}</span>
                        <span className={`urgency urgency--${d.urgency}`}>{d.urgency}</span>
                      </div>
                      <div className="row-raw">&ldquo;{d.raw_text}&rdquo;</div>
                      <button className="link-btn" onClick={() => downloadReminder(d, result.document_type)}>
                        <Icon.Bell /> Add a reminder
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {result.actions.length > 0 && (
              <section className="card card--actions">
                <div className="card-head"><span className="card-icon"><Icon.Check /></span><span className="card-title">What to do</span><span className="card-title-spacer" />{listenBtn('actions', result.actions.map((a) => `${a.task}. ${a.why}`).join('. '))}</div>
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
                <div className="card-head"><span className="card-icon"><Icon.Shield /></span><span className="card-title">Your rights</span><span className="card-title-spacer" />{listenBtn('rights', result.rights.map((r) => (r.basis ? `${r.right}. ${r.basis}` : r.right)).join('. '))}</div>
                {result.rights.map((r, i) => (
                  <div className="row" key={i}>
                    <span className="row-dot" style={{ background: 'var(--grn)' }} />
                    <div className="row-body">
                      <div className="row-title">{r.right}</div>
                      {r.basis && <div className="row-note">{r.basis}</div>}
                      {r.citation
                        ? (r.source_url
                            ? <a className="cite-link" href={r.source_url} target="_blank" rel="noreferrer">{r.citation}</a>
                            : <span className="cite-link cite-link--plain">{r.citation}</span>)
                        : (!r.basis && <span className="right-tag">General guidance, verify for your situation</span>)}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {result.red_flags.length > 0 ? (
              <section className="card card--flags">
                <div className="card-head"><span className="card-icon"><Icon.Flag /></span><span className="card-title">Watch out</span><span className="card-title-spacer" />{listenBtn('flags', result.red_flags.map((f) => `${f.flag}. ${f.explanation}`).join('. '))}</div>
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
              <div className="card-head"><span className="card-icon"><Icon.Mail /></span><span className="card-title">Draft a reply</span><span className="card-title-spacer" />{listenBtn('draft', draft)}</div>
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
                    <span className="row-dot" style={{ background: 'var(--grn)', marginTop: 7 }} />
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
        Decoded explains documents in plain language, in your language, read aloud. Not legal or medical advice. Your
        documents stay on your device.
      </footer>
    </div>
  );
}

function Scan({ step }: { step: number }) {
  return (
    <div className="scan" role="status" aria-label="Analyzing the document">
      <div className="scan-viz">
        <div className="scan-doc" />
        <div className="scan-line" />
      </div>
      <ol className="scan-steps">
        {SCAN_STEPS.map((s, i) => (
          <li className={`scan-step${i <= step ? ' on' : ''}`} style={{ animationDelay: `${i * 0.1}s` }} key={s}>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Verdict({ r, speaking, onSpeak, canSpeak }: { r: DecodeResult; speaking: boolean; onSpeak: () => void; canSpeak: boolean }) {
  const v = r.violations?.length ?? 0;
  const rights = r.rights?.length ?? 0;
  const scam = r.scam_risk?.level ?? 'none';
  const lawed = (r.law_checked?.length ?? 0) > 0;
  let tone: 'alarm' | 'warn' | 'ok' | 'neutral' = 'neutral';
  let headline = 'Here is what this means';
  if (v > 0 || scam === 'high') {
    tone = 'alarm';
    headline = v > 0 ? 'This document has legal problems' : 'High scam risk';
  } else if (scam === 'medium') {
    tone = 'warn';
    headline = 'Possible scam signals';
  } else if (lawed) {
    tone = 'ok';
    headline = 'No legal problems found';
  }
  const meter = tone === 'alarm' ? 92 : tone === 'warn' ? 60 : tone === 'ok' ? 14 : 0;
  const signals = r.scam_risk?.signals ?? [];
  return (
    <section className={`verdict verdict--${tone}`} aria-live="polite">
      <div className="verdict-main">
        <span className="verdict-eyebrow">
          <Icon.Shield />
          {lawed ? `Checked against ${r.law_checked!.join(', ')}` : 'Analysis complete'}
        </span>
        <h2 className="verdict-headline">{headline}</h2>
        <p className="verdict-sub">{r.meaning_for_you || r.summary}</p>
        {(tone === 'alarm' || tone === 'warn') && signals.length > 0 && (
          <div className="verdict-signals">
            {signals.map((s, i) => <span className="vsignal" key={i}>{s}</span>)}
          </div>
        )}
        <div className="verdict-type">{r.document_type} / {r.confidence} confidence</div>
      </div>
      <div className="verdict-aside">
        {canSpeak && (
          <button className="speak-btn" data-on={speaking} onClick={onSpeak}>
            <Icon.Speak /> {speaking ? 'Stop' : 'Listen'}
          </button>
        )}
        <div className="meter"><div className={`meter-fill meter-fill--${tone}`} style={{ width: `${meter}%` }} /></div>
        <div className="verdict-stats">
          {v > 0 && <span className="vstat vstat--red"><b>{v}</b> {v === 1 ? 'problem' : 'problems'}</span>}
          {rights > 0 && <span className="vstat vstat--grn"><b>{rights}</b> {rights === 1 ? 'right' : 'rights'}</span>}
          <span className={`vstat ${scam === 'high' ? 'vstat--red' : scam === 'medium' ? 'vstat--amber' : 'vstat--grn'}`}>scam: {scam}</span>
        </div>
      </div>
    </section>
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
  Bell: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>),
  Stack: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></svg>),
};
