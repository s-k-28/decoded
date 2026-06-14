/* =========================================================================
   Decoded - application. State machine across home / loading / result /
   error, the live AI decode (InsForge decode-document edge function) with a
   demo-safe seeded fallback, read-aloud, language + reading-level re-runs, ICS,
   history, larger-text mode. Mounts into #root.
   ========================================================================= */
import React from 'react';
import { decode as insforgeDecode } from '../lib/decode';
import { DECODED as D } from './demoData.js';
import { DecodedIcons as I } from './icons.jsx';
import { DecodedUI as U } from './components.jsx';
import { DecodedLanding as L } from './landing.jsx';
import { Comparison } from './extra/Comparison.jsx';
import { LawWeCheck } from './extra/LawWeCheck.jsx';
import { WhoItHelps } from './extra/WhoItHelps.jsx';
import { Trust } from './extra/Trust.jsx';
import { Faq } from './extra/Faq.jsx';
import { ResultActions } from './extra/ResultActions.jsx';
const { useState, useEffect, useRef, useCallback } = React;
const h = React.createElement;

  /* ---- UI chrome strings (content fields come localized from the model) - */
  const EN = {
    tagline: 'Plain language for any official document',
    heroLead: 'Understand any', heroVerb: 'scary letter',
    heroRest: 'in under a minute',
    sub: 'Paste a confusing notice or photograph it. Decoded tells you what it means, your deadlines, your rights, what to do next, and where to get real help. In your language, read aloud.',
    paste: 'Paste text', photo: 'Upload a photo',
    placeholder: 'Paste the text of your letter, bill, or notice here. Decoded reads it and explains it in plain language.',
    dropTitle: 'Take or choose a photo of your document',
    dropHint: 'Lay it flat, fill the frame, keep it in focus. JPG, PNG, HEIC, or WEBP.',
    examplesLabel: 'Or try a real example',
    readingLevel: 'Reading level', language: 'Language',
    decode: 'Decode this', decoding: 'Decoding',
    decodeNote: 'No account, no cost. Your document is not stored.',
    trust1: 'Not legal or medical advice', trust2: 'Never stored or sold', trust3: 'Routes you to real human help',
    disclaimer: 'Decoded explains documents in plain language. It is not legal or medical advice. It points you to real human help.',
    loadingTitle: 'Reading your document',
    docType: 'Document', confidence: 'confidence',
    confHigh: 'High confidence', confMedium: 'Medium confidence', confLow: 'Low confidence',
    listen: 'Listen', stop: 'Stop',
    rerunLevel: 'Level', rerunLang: 'Language',
    lowConfTitle: 'Read this one carefully.', lowConfBody: 'Some of this document was hard to read, so double-check the original and consider getting human help before you act.',
    sSummary: 'What this is', sMeaning: 'What it means for you', meaning: 'What it means for you',
    sDeadlines: 'Deadlines', sActions: 'What to do', sRights: 'Your rights',
    sFlags: 'Warning signs', sDraft: 'A reply you can send', sUnc: 'Double-check these', sHelp: 'Get real help',
    sViolations: 'Problems with this letter', sProcedure: 'What happens next',
    scamHigh: 'High scam risk', scamMedium: 'Possible scam signals', scamLow: 'Looks like a real document', scamNone: 'No scam signals found',
    whatIfLabel: 'If you do nothing:', lawChecked: 'Checked against',
    summaryTitle: 'Summary', deadlinesEmpty: 'No dated deadlines were found in this document.',
    urgency: { critical: 'Critical', soon: 'Soon', info: 'Good to know' },
    addReminder: 'Add calendar reminder', byLabel: 'By',
    guidance: 'General guidance, verify it', sev: { high: 'High', medium: 'Medium', low: 'Low' },
    allClearTitle: 'No scam or predatory signals found.', allClearBody: 'Nothing in this document looks like a known scam. Stay alert anyway and verify the sender.',
    draftTag: 'Draft, review before sending', copy: 'Copy', copied: 'Copied',
    helpType: { legal_aid: 'Legal aid', hotline: 'Hotline', gov_agency: 'Agency', tenant_union: 'Tenant union', other: 'Resource' },
    decodeAnother: 'Decode another', print: 'Print summary',
    errorTitle: 'That did not go through', errorBody: 'We could not read that document. Check your connection and try again, or paste the text instead.',
    retry: 'Try again', back: 'Start over',
    recent: 'Recently decoded',
    footTag: 'Decoded turns a panic attack into a plan. Paste a confusing official document and get plain language, your deadlines, your rights, and a real next step.',
    footNote: 'Decoded explains documents and is not legal or medical advice. It does not represent you or store your documents. Always confirm important details with a qualified professional.',
  };
  const ES = {
    tagline: 'Lenguaje claro para cualquier documento oficial',
    heroLead: 'Entienda cualquier', heroVerb: 'carta que asusta', heroRest: 'en menos de un minuto',
    sub: 'Pegue un aviso confuso o tomele una foto. Decoded le dice que significa, sus plazos, sus derechos, que hacer y donde conseguir ayuda real. En su idioma, leido en voz alta.',
    paste: 'Pegar texto', photo: 'Subir una foto',
    placeholder: 'Pegue aqui el texto de su carta, factura o aviso. Decoded lo lee y lo explica en lenguaje claro.',
    dropTitle: 'Tome o elija una foto de su documento',
    dropHint: 'Pongalo plano, llene el cuadro, manteng el enfoque. JPG, PNG, HEIC o WEBP.',
    examplesLabel: 'O pruebe un ejemplo real',
    readingLevel: 'Nivel de lectura', language: 'Idioma',
    decode: 'Decodificar', decoding: 'Decodificando',
    decodeNote: 'Sin cuenta, sin costo. Su documento no se guarda.',
    trust1: 'No es consejo legal ni medico', trust2: 'Nunca se guarda ni se vende', trust3: 'Lo conecta con ayuda humana real',
    disclaimer: 'Decoded explica documentos en lenguaje claro. No es consejo legal ni medico. Lo dirige a ayuda humana real.',
    loadingTitle: 'Leyendo su documento',
    docType: 'Documento', confidence: 'confianza',
    confHigh: 'Confianza alta', confMedium: 'Confianza media', confLow: 'Confianza baja',
    listen: 'Escuchar', stop: 'Detener',
    rerunLevel: 'Nivel', rerunLang: 'Idioma',
    lowConfTitle: 'Lea este con cuidado.', lowConfBody: 'Parte de este documento fue dificil de leer, asi que revise el original y considere conseguir ayuda humana antes de actuar.',
    sSummary: 'Que es esto', sMeaning: 'Que significa para usted', meaning: 'Que significa para usted',
    sDeadlines: 'Plazos', sActions: 'Que hacer', sRights: 'Sus derechos',
    sFlags: 'Senales de alerta', sDraft: 'Una respuesta que puede enviar', sUnc: 'Verifique esto', sHelp: 'Consiga ayuda real',
    sViolations: 'Problemas con esta carta', sProcedure: 'Que pasa despues',
    scamHigh: 'Alto riesgo de estafa', scamMedium: 'Posibles senales de estafa', scamLow: 'Parece un documento real', scamNone: 'No se encontraron senales de estafa',
    whatIfLabel: 'Si no hace nada:', lawChecked: 'Verificado contra',
    summaryTitle: 'Resumen', deadlinesEmpty: 'No se encontraron plazos con fecha en este documento.',
    urgency: { critical: 'Critico', soon: 'Pronto', info: 'Bueno saber' },
    addReminder: 'Agregar recordatorio', byLabel: 'Antes del',
    guidance: 'Guia general, verifiquela', sev: { high: 'Alta', medium: 'Media', low: 'Baja' },
    allClearTitle: 'No se encontraron senales de estafa.', allClearBody: 'Nada en este documento parece una estafa conocida. Aun asi, manteng se alerta y verifique al remitente.',
    draftTag: 'Borrador, revise antes de enviar', copy: 'Copiar', copied: 'Copiado',
    helpType: { legal_aid: 'Ayuda legal', hotline: 'Linea de ayuda', gov_agency: 'Agencia', tenant_union: 'Union de inquilinos', other: 'Recurso' },
    decodeAnother: 'Decodificar otro', print: 'Imprimir resumen',
    errorTitle: 'Eso no funciono', errorBody: 'No pudimos leer ese documento. Revise su conexion e intente de nuevo, o pegue el texto.',
    retry: 'Intentar de nuevo', back: 'Empezar de nuevo',
    recent: 'Decodificados recientemente',
    footTag: 'Decoded convierte el panico en un plan. Pegue un documento oficial confuso y reciba lenguaje claro, sus plazos, sus derechos y un paso real.',
    footNote: 'Decoded explica documentos y no es consejo legal ni medico. No lo representa ni guarda sus documentos. Confirme siempre los detalles importantes con un profesional calificado.',
  };
  const STRINGS = { en: EN, es: ES };
  const tFor = (lang) => STRINGS[lang] || EN;

  /* ---- Speech synthesis helper ---------------------------------------- */
  function useSpeech() {
    const [channel, setChannel] = useState(null);
    const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const pickVoice = (bcp) => {
      if (!supported) return null;
      const voices = window.speechSynthesis.getVoices() || [];
      const base = bcp.split('-')[0];
      return voices.find((v) => v.lang === bcp) ||
        voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(base)) || null;
    };
    const stop = useCallback(() => {
      if (supported) window.speechSynthesis.cancel();
      setChannel(null);
    }, [supported]);
    const speak = useCallback((id, text, bcp) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = bcp || 'en-US';
      const v = pickVoice(bcp || 'en-US');
      if (v) u.voice = v;
      u.rate = 0.96; u.pitch = 1;
      u.onend = () => setChannel((c) => (c === id ? null : c));
      u.onerror = () => setChannel((c) => (c === id ? null : c));
      setChannel(id);
      window.speechSynthesis.speak(u);
    }, [supported]);
    useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported]);
    return { channel, speak, stop, supported };
  }

  /* ---- ICS download ---------------------------------------------------- */
  function downloadIcs(deadline, docType) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(deadline.date || '');
    if (!m) return;
    const dt = m[1] + m[2] + m[3];
    const next = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + 1);
    const pad = (n) => String(n).padStart(2, '0');
    const dtEnd = next.getFullYear() + pad(next.getMonth() + 1) + pad(next.getDate());
    const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const esc = (s) => String(s).replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Decoded//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', 'UID:' + Date.now() + '@decoded', 'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + dt, 'DTEND;VALUE=DATE:' + dtEnd,
      'SUMMARY:' + esc('Decoded: ' + deadline.label),
      'DESCRIPTION:' + esc((docType ? docType + '. ' : '') + (deadline.raw_text || '')),
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(deadline.label), 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'decoded-deadline.ics';
    document.body.appendChild(a); a.click();
    window.setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 200);
  }

  /* ---- model call: the InsForge decode-document edge function ----------
     The backend does the deterministic rules scan, classification, cited
     corpus grounding, and reconciliation, and returns the full result
     (including scam_risk, violations with citations, law_checked, procedure,
     and what_if_ignored). It writes every field in the requested language at
     the requested reading level, so a level/language change is a fresh decode. */
  async function liveDecode({ text, imageUrl, level, lang }) {
    try {
      const res = await insforgeDecode({
        text: text || undefined,
        imageUrl: imageUrl || undefined,
        readingLevel: level,
        language: lang,
      });
      return res || null;
    } catch (e) { return null; }
  }

  /* ---- history --------------------------------------------------------- */
  const HKEY = 'decoded_history_v1';
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HKEY) || '[]'); } catch (e) { return []; }
  }
  function saveHistory(list) {
    try { localStorage.setItem(HKEY, JSON.stringify(list.slice(0, 6))); } catch (e) {}
  }

  /* ===================================================================== */
  function App() {
    const [screen, setScreen] = useState('home'); // home | loading | result | error
    const [mode, setMode] = useState('text');
    const [text, setText] = useState('');
    const [image, setImage] = useState(null); // {url, name}
    const [exampleId, setExampleId] = useState(null);
    const [level, setLevel] = useState('plain');
    const [lang, setLang] = useState(() => {
      try { return localStorage.getItem('decoded_lang') || 'en'; } catch (e) { return 'en'; }
    });
    const [result, setResult] = useState(null);
    const [draft, setDraft] = useState('');
    const [doneActions, setDoneActions] = useState({});
    const [large, setLarge] = useState(() => {
      try { return localStorage.getItem('decoded_large') === '1'; } catch (e) { return false; }
    });
    const [loadStep, setLoadStep] = useState(0);
    const [langOpen, setLangOpen] = useState(false);
    const [history, setHistory] = useState(loadHistory);
    const speech = useSpeech();
    const t = tFor(lang);
    const langMeta = D.LANGUAGES.find((l) => l.code === lang) || D.LANGUAGES[0];

    useEffect(() => {
      document.documentElement.setAttribute('data-large', large ? 'true' : 'false');
      if (!large) document.documentElement.removeAttribute('data-large');
      try { localStorage.setItem('decoded_large', large ? '1' : '0'); } catch (e) {}
    }, [large]);
    useEffect(() => { try { localStorage.setItem('decoded_lang', lang); } catch (e) {} }, [lang]);
    useEffect(() => {
      document.documentElement.lang = lang;
      document.documentElement.dir = langMeta.rtl ? 'rtl' : 'ltr';
    }, [lang, langMeta]);
    // warm up voices
    useEffect(() => { if ('speechSynthesis' in window) window.speechSynthesis.getVoices(); }, []);

    // scroll-reveal for the cinematic landing (capture-safe: hide only once
    // armed, reveal in-view content synchronously, reveal more on scroll)
    useEffect(() => {
      if (screen !== 'home') return undefined;
      const root = document.querySelector('.dc-app');
      const els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
      if (root) root.classList.add('dc-revealing');
      let raf = 0;
      const revealNow = () => {
        const vh = window.innerHeight || 800;
        els.forEach((e) => { if (!e.classList.contains('in') && e.getBoundingClientRect().top < vh * 0.92) e.classList.add('in'); });
      };
      const onScroll = () => { if (raf) return; raf = window.requestAnimationFrame(() => { raf = 0; revealNow(); }); };
      revealNow();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      const fb = window.setTimeout(() => els.forEach((e) => e.classList.add('in')), 1700);
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        if (raf) window.cancelAnimationFrame(raf);
        window.clearTimeout(fb);
        if (root) root.classList.remove('dc-revealing');
      };
    }, [screen]);

    // safety net: force entrance end-state shortly after mount / screen change
    const [shown, setShown] = useState(false);
    useEffect(() => {
      setShown(false);
      const id = window.setTimeout(() => setShown(true), 1100);
      return () => window.clearTimeout(id);
    }, [screen]);

    const hasInput = (mode === 'text' && text.trim().length > 0) || (mode === 'photo' && !!image);

    const pushHistory = useCallback((res, exId, inputText) => {
      const entry = { id: Date.now(), ts: Date.now(), document_type: res.document_type,
        confidence: res.confidence, exampleId: exId, lang: res.language, level: res.reading_level,
        result: res, text: inputText };
      setHistory((prev) => {
        const next = [entry].concat(prev.filter((p) => !(p.exampleId && p.exampleId === exId))).slice(0, 6);
        saveHistory(next);
        return next;
      });
    }, []);

    const settle = useCallback((res, exId, record) => {
      setResult(res);
      setDraft(res.draft_response || '');
      setDoneActions({});
      setScreen('result');
      if (record) pushHistory(res, exId, mode === 'text' ? text : '[image]');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [pushHistory, text, mode]);

    // resolve a decode result. The built-in examples have a curated, verified
    // seed (a full cited result): serve it instantly so the demo is fast and
    // reliable and never waits on a slow model. Pasted text and photos go to the
    // live analyzer, with the example seed as a safety net if the model fails.
    const resolve = useCallback(async ({ text: src, imageUrl, exId, lv, lg }) => {
      if (exId && D.hasSeed(exId, lg)) return D.getSeed(exId, lg, lv);
      const live = await liveDecode({ text: src, imageUrl, level: lv, lang: lg });
      if (live) return live;
      if (exId) return Object.assign({}, D.getSeed(exId, 'en', lv) || {}, { language: lg, reading_level: lv });
      return null;
    }, []);

    const runDecode = useCallback(async (input, record) => {
      speech.stop();
      setScreen('loading');
      setLoadStep(0);
      const started = Date.now();
      const stepTimer = window.setInterval(() => {
        setLoadStep((s) => Math.min(s + 1, D.LOADING_STEPS.length - 1));
      }, 360);
      let res = null;
      try { res = await resolve(input); } catch (e) { res = null; }
      const elapsed = Date.now() - started;
      const minWait = 1500;
      window.setTimeout(() => {
        window.clearInterval(stepTimer);
        setLoadStep(D.LOADING_STEPS.length - 1);
        if (res) settle(res, input.exId, record);
        else setScreen('error');
      }, Math.max(0, minWait - elapsed));
    }, [resolve, settle, speech]);

    // build the decode input from the current composer state
    const inputFor = (lv, lg) => (mode === 'photo' && image)
      ? { imageUrl: image.dataUrl, exId: null, lv, lg }
      : { text: text, exId: exampleId, lv, lg };

    const onDecode = () => { runDecode(inputFor(level, lang), true); };

    // re-run when level/language changes while a result is showing
    const changeLevel = (lv) => {
      setLevel(lv);
      if (screen === 'result') runDecode(inputFor(lv, lang), false);
    };
    const changeLang = (lg) => {
      setLang(lg);
      setLangOpen(false);
      if (screen === 'result') runDecode(inputFor(level, lg), false);
    };

    const loadExample = (ex) => {
      speech.stop();
      setMode('text'); setText(ex.raw); setImage(null); setExampleId(ex.id);
      window.requestAnimationFrame(() => {
        const ta = document.getElementById('dc-textarea');
        if (ta) ta.scrollIntoView ? null : null;
      });
    };

    const onFile = (file) => {
      if (!file) return;
      const url = URL.createObjectURL(file);
      // Read a data URL too: the edge function needs an inlined image it can
      // fetch server-side (a blob: object URL only works in this browser tab).
      const reader = new FileReader();
      reader.onload = () => setImage({ url, dataUrl: reader.result, name: file.name });
      reader.onerror = () => setImage({ url, dataUrl: null, name: file.name });
      reader.readAsDataURL(file);
      setExampleId(null);
    };

    const reset = () => {
      speech.stop();
      setScreen('home'); setResult(null); setText(''); setImage(null);
      setExampleId(null); setMode('text');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openHistory = (entry) => {
      speech.stop();
      setExampleId(entry.exampleId || null);
      setLang(entry.lang || 'en'); setLevel(entry.level || 'plain');
      settle(entry.result, entry.exampleId, false);
    };

    const jumpToConsole = () => {
      setMode('text');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => { const ta = document.getElementById('dc-textarea'); if (ta) ta.focus(); }, 460);
    };
    const decodeExampleNow = (ex) => {
      speech.stop();
      setMode('text'); setText(ex.raw); setImage(null); setExampleId(ex.id);
      runDecode({ text: ex.raw, exId: ex.id, lv: level, lg: lang }, true);
    };

    // build the read-aloud text for the whole explanation
    const mainSpeech = (res) => {
      if (!res) return '';
      const parts = [res.summary, res.meaning_for_you];
      if (res.deadlines && res.deadlines.length) {
        parts.push(t.sDeadlines + '.');
        res.deadlines.forEach((d) => parts.push(d.label + (d.date ? ', ' + U.fmtDate(d.date, langMeta.tts) : '') + '.'));
      }
      if (res.actions && res.actions.length) {
        parts.push(t.sActions + '.');
        res.actions.forEach((a) => parts.push(a.task + '. ' + (a.why || '')));
      }
      return parts.filter(Boolean).join(' ');
    };
    const sectionSpeech = (title, items) => [title].concat(items).filter(Boolean).join('. ');

    /* ---- render helpers ---- */
    const Header = h('header', { className: 'dc-header' },
      h('div', { className: 'dc-header-row' },
        h(U.Brand, { onClick: screen !== 'home' ? reset : undefined }),
        h('span', { className: 'dc-header-spacer' }),
        h('div', { className: 'dc-header-tools' },
          h('button', {
            className: 'dc-textbtn', 'aria-pressed': large,
            onClick: () => setLarge((v) => !v),
            'aria-label': large ? 'Use normal text size' : 'Use larger text size',
          }, h(I.Type, { size: 14 }), large ? 'Large text on' : 'Larger text')
        )
      ),
      h('div', { className: 'dc-disclaimer', role: 'note' },
        h(I.ShieldAlert, { size: 13 }), h('span', null, t.disclaimer)
      )
    );

    const LangSelect = (cls) => h('div', { className: 'dc-select ' + (cls || '') },
      h('button', {
        className: 'dc-select-btn', 'aria-expanded': langOpen, 'aria-haspopup': 'listbox',
        onClick: () => setLangOpen((v) => !v),
      },
        h(I.Languages, { size: 16, style: { color: 'var(--d-faint)' } }),
        h('span', null, langMeta.name),
        langMeta.native && langMeta.native !== langMeta.name ? h('span', { className: 'dc-sel-native' }, langMeta.native) : null,
        h('span', { className: 'dc-sel-chev' }, h(I.ChevronDown, { size: 15 }))
      ),
      langOpen ? h('div', { className: 'dc-select-menu', role: 'listbox' },
        D.LANGUAGES.map((l) => h('button', {
          key: l.code, className: 'dc-select-opt', role: 'option', 'aria-selected': l.code === lang,
          onClick: () => changeLang(l.code),
        }, h('span', null, l.name), l.native && l.native !== l.name ? h('span', { className: 'dc-sel-native' }, l.native) : null))
      ) : null
    );

    return h('div', { className: 'dc-app', 'data-shown': shown ? 'true' : undefined },
      h('div', { className: 'dc-field', 'aria-hidden': 'true' },
        h('span', { className: 'dc-bloom dc-bloom--a' }), h('span', { className: 'dc-bloom dc-bloom--b' }),
        h('span', { className: 'dc-bloom dc-bloom--c' }), h('span', { className: 'dc-bloom dc-bloom--d' })
      ),
      Header,
      h('main', { className: 'dc-main' },
        screen === 'home' ? h(HomeScreen, {
          t, mode, setMode, text, setText, image, onFile, setImage, exampleId,
          level, changeLevel, LangSelect, hasInput, onDecode, loadExample,
          history, openHistory, langMeta, jumpToConsole, decodeExampleNow,
        }) : null,
        screen === 'loading' ? h(LoadingScreen, { t, step: loadStep }) : null,
        screen === 'result' && result ? h(ResultScreen, {
          t, result, draft, setDraft, doneActions, setDoneActions, level, changeLevel,
          LangSelect, langMeta, speech, mainSpeech, sectionSpeech, reset,
        }) : null,
        screen === 'error' ? h(ErrorScreen, { t, onRetry: onDecode, onBack: reset }) : null
      ),
      h(Footer, { t })
    );
  }

  /* ===================== Home ========================================== */
  function HomeScreen(props) {
    const { t, mode, setMode, text, setText, image, onFile, setImage, exampleId,
      level, changeLevel, LangSelect, hasInput, onDecode, loadExample, history, openHistory, langMeta,
      jumpToConsole, decodeExampleNow } = props;
    const [over, setOver] = useState(false);
    const fileRef = useRef(null);
    const exMeta = { eviction: I.FileText, medical: I.FileText, benefits: I.FileText };

    return h(React.Fragment, null,
      h('div', { className: 'dc-rail' },
      h('section', { className: 'dc-hero' },
        h('span', { className: 'dc-badge dc-rise dc-rise-1' }, h(I.ScanLine, { size: 13 }), t.tagline),
        h('h1', { className: 'dc-h1 dc-rise dc-rise-2' },
          t.heroLead, ' ', h('span', { className: 'dc-verb' }, t.heroVerb), ' ', t.heroRest
        ),
        h('p', { className: 'dc-sub dc-rise dc-rise-3' }, t.sub)
      ),
      h('div', { className: 'dc-console dc-rise dc-rise-4', 'data-mode': mode },
        h('div', { className: 'dc-composer-top' },
          h('div', { className: 'dc-switch', role: 'tablist' },
            h('button', { role: 'tab', 'aria-selected': mode === 'text', onClick: () => setMode('text') },
              h(I.Clipboard, { size: 15 }), t.paste),
            h('button', { role: 'tab', 'aria-selected': mode === 'photo', onClick: () => setMode('photo') },
              h(I.Camera, { size: 15 }), t.photo)
          )
        ),
        h('div', { className: 'dc-composer-input' },
          mode === 'text'
            ? h('textarea', {
                id: 'dc-textarea', className: 'dc-textarea', value: text,
                onChange: (e) => { setText(e.target.value); }, placeholder: t.placeholder,
                'aria-label': t.paste, spellCheck: false,
              })
            : (image
                ? h('div', { className: 'dc-preview' },
                    h('img', { src: image.url, alt: 'Your uploaded document' }),
                    h('button', { className: 'dc-preview-clear', onClick: () => setImage(null), 'aria-label': 'Remove photo' }, h(I.X, { size: 16 }))
                  )
                : h('div', {
                    className: 'dc-drop', 'data-over': over, role: 'button', tabIndex: 0,
                    onClick: () => fileRef.current && fileRef.current.click(),
                    onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current && fileRef.current.click(); } },
                    onDragOver: (e) => { e.preventDefault(); setOver(true); },
                    onDragLeave: () => setOver(false),
                    onDrop: (e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files[0]); },
                  },
                    h('span', { className: 'dc-drop-icon' }, h(I.Camera, { size: 24 })),
                    h('div', { className: 'dc-drop-title' }, t.dropTitle),
                    h('div', { className: 'dc-drop-hint' }, t.dropHint),
                    h('input', { ref: fileRef, type: 'file', accept: 'image/*', capture: 'environment',
                      style: { display: 'none' }, onChange: (e) => onFile(e.target.files[0]) })
                  )
              )
        ),
        h('div', { className: 'dc-composer-foot' },
          h('div', { className: 'dc-composer-tools' },
            h('div', { className: 'dc-tool' },
              h(I.Gauge, { size: 14, className: 'dc-tool-ico' }),
              h('div', { className: 'dc-seg', role: 'group', 'aria-label': t.readingLevel },
                D.READING_LEVELS.map((r) => h('button', {
                  key: r.id, 'aria-pressed': level === r.id, onClick: () => changeLevel(r.id), title: r.note,
                }, r.label))
              )
            ),
            LangSelect('dc-select-sm')
          ),
          h('button', { className: 'dc-decode', disabled: !hasInput, onClick: onDecode },
            h(I.Sparkles, { size: 17 }), t.decode, h(I.ArrowRight, { size: 17 })
          )
        )
      ),
      h('div', { className: 'dc-examples' },
        h('div', { className: 'dc-examples-label' }, t.examplesLabel),
        h('div', { className: 'dc-chips' },
          D.EXAMPLES.map((ex) => h('button', {
            key: ex.id, className: 'dc-chip', onClick: () => loadExample(ex),
            'aria-pressed': exampleId === ex.id,
          },
            h('span', { className: 'dc-chip-ico' }, h(exMeta[ex.id] || I.FileText, { size: 16 })),
            h('span', { className: 'dc-chip-txt' }, h('b', null, ex.label), h('span', null, ex.kind))
          ))
        )
      ),
      h('div', { className: 'dc-decode-note' }, h(I.Lock, { size: 12 }), t.decodeNote),
      h('div', { className: 'dc-trust' },
        h('span', { className: 'dc-trust-item' }, h(I.ShieldCheck, { size: 14 }), t.trust1),
        h('span', { className: 'dc-trust-item' }, h(I.Lock, { size: 14 }), t.trust2),
        h('span', { className: 'dc-trust-item' }, h(I.HelpingHand, { size: 14 }), t.trust3)
      ),
      history && history.length ? h('div', { className: 'dc-history' },
        h('div', { className: 'dc-history-head' }, h(I.History, { size: 15, style: { color: 'var(--d-faint)' } }),
          h('span', null, t.recent)),
        h('div', { className: 'dc-history-grid' },
          history.map((entry) => h('button', { key: entry.id, className: 'dc-hist', onClick: () => openHistory(entry) },
            h('div', { className: 'dc-hist-type' }, entry.result.document_type),
            h('div', { className: 'dc-hist-meta' },
              h('span', null, (D.LANGUAGES.find((l) => l.code === entry.lang) || {}).name || entry.lang),
              h('span', null, '\u00b7'), h('span', null, entry.level)
            )
          ))
        )
      ) : null
      ),
      L.ProductPeek ? h(L.ProductPeek, null) : null,
      h(Comparison, null),
      L.HowItWorks ? h(L.HowItWorks, null) : null,
      h(LawWeCheck, null),
      L.FeatureRibbon ? h(L.FeatureRibbon, null) : null,
      h(WhoItHelps, null),
      h(Trust, null),
      L.Proof ? h(L.Proof, null) : null,
      h(Faq, null),
      L.ClosingCTA ? h(L.ClosingCTA, { onJump: jumpToConsole, onExample: () => decodeExampleNow(D.EXAMPLES[0]) }) : null
    );
  }

  function EvidenceBand() {
    const stats = [
      { n: '28%', t: 'of US adults score at the lowest literacy level', s: 'NCES PIAAC 2023' },
      { n: '1 in 5', t: 'eviction defaults are missed deadlines, not lost cases', s: 'Evicted in Oregon' },
      { n: '68M', t: 'people speak a language other than English at home', s: 'Migration Policy Institute' },
      { n: '33 to 59%', t: 'comprehension lift from plain-language versions', s: 'Schunemann et al.' },
    ];
    return h('section', { className: 'dc-evidence', 'aria-label': 'Why this matters' },
      h('div', { className: 'dc-evidence-grid', 'data-stagger': true },
        stats.map((s, i) => h('div', { className: 'dc-stat', key: i },
          h('div', { className: 'dc-stat-num' }, h('em', null, s.n)),
          h('div', { className: 'dc-stat-txt' }, s.t),
          h('div', { className: 'dc-stat-src' }, s.s)
        ))
      )
    );
  }

  /* ===================== Loading ======================================= */
  function LoadingScreen({ t, step }) {
    return h('div', { className: 'dc-rail' },
      h('div', { className: 'dc-loading' },
        h('div', { className: 'dc-scan' }, h(I.ScanLine, { size: 46 })),
        h('h2', null, t.loadingTitle),
        h('div', { className: 'dc-steps', 'aria-live': 'polite' },
          D.LOADING_STEPS.map((label, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'todo';
            return h('div', { className: 'dc-step', 'data-state': state, key: i },
              h('span', { className: 'dc-step-dot' }, state === 'done' ? h(I.Check, { size: 11 }) : null),
              h('span', null, label)
            );
          })
        )
      )
    );
  }

  /* ===================== Result ======================================== */
  function ResultScreen(props) {
    const { t, result, draft, setDraft, doneActions, setDoneActions, level, changeLevel,
      LangSelect, langMeta, speech, mainSpeech, sectionSpeech, reset } = props;
    const r = result;
    const locale = langMeta.tts;
    const isLow = r.confidence === 'low';
    const confText = r.confidence === 'high' ? t.confHigh : r.confidence === 'medium' ? t.confMedium : t.confLow;

    const sortedDeadlines = (r.deadlines || []).slice().sort((a, b) => {
      const o = { critical: 0, soon: 1, info: 2 };
      return (o[a.urgency] ?? 3) - (o[b.urgency] ?? 3);
    });

    const toggleListen = (id, text) => {
      if (speech.channel === id) speech.stop();
      else speech.speak(id, text, locale);
    };

    let n = 0;
    const num = () => String(++n).padStart(2, '0');

    return h('div', { className: 'dc-rail' },
      h('div', { className: 'dc-result' },
        h('div', { className: 'dc-result-top' },
          h('div', { className: 'dc-result-id' },
            h('div', { className: 'dc-eyebrow' }, h(I.FileText, { size: 13 }), t.docType),
            h('div', { className: 'dc-result-kind' },
              h('h1', null, r.document_type)
            ),
            h('div', { className: 'dc-result-meta' },
              h('span', { className: 'dc-conf', 'data-c': r.confidence }, h('span', { className: 'dc-conf-dot' }), confText)
            )
          ),
          h('div', { className: 'dc-result-actions' },
            h('button', {
              className: 'dc-listen', 'data-on': speech.channel === 'main' ? 'true' : 'false',
              onClick: () => toggleListen('main', mainSpeech(r)),
              'aria-pressed': speech.channel === 'main',
            }, speech.channel === 'main' ? h(I.Square, { size: 15 }) : h(I.Volume2, { size: 17 }),
               speech.channel === 'main' ? t.stop : t.listen)
          )
        ),

        h('div', { className: 'dc-rerun', role: 'group', 'aria-label': 'Re-run controls' },
          h('div', { className: 'dc-rerun-group' },
            h('span', null, t.rerunLevel),
            h('div', { className: 'dc-mini-seg' },
              D.READING_LEVELS.map((lv) => h('button', {
                key: lv.id, 'aria-pressed': level === lv.id, onClick: () => changeLevel(lv.id),
              }, lv.label))
            )
          ),
          LangSelect()
        ),

        h(U.ScamVerdict, { scam: r.scam_risk, labels: { high: t.scamHigh, medium: t.scamMedium, low: t.scamLow, none: t.scamNone } }),
        (r.law_checked && r.law_checked.length) ? h(U.LawChecked, { items: r.law_checked, label: t.lawChecked }) : null,

        isLow ? h('div', { className: 'dc-lowconf', role: 'alert' },
          h(I.TriangleAlert, { size: 18 }),
          h('div', null, h('b', null, t.lowConfTitle), ' ', h('span', { style: { color: 'var(--d-dim)' } }, t.lowConfBody))
        ) : null,

        // Summary + meaning
        h(U.Section, {
          num: num(), title: t.summaryTitle, heading: null, accent: 'var(--d-amber)',
          icon: h(I.FileText, { size: 17 }), listenable: speech.supported,
          listening: speech.channel === 'summary',
          onListen: () => toggleListen('summary', sectionSpeech(t.sSummary, [r.summary, r.meaning_for_you])),
        }, h(U.SummaryBlock, { summary: r.summary, meaning: r.meaning_for_you, t })),

        // Problems with the document, each grounded in a real citation
        (r.violations && r.violations.length) ? h(U.Section, {
          num: num(), title: t.sViolations, accent: 'var(--d-red)', icon: h(I.Gavel, { size: 17 }),
          listenable: false,
        }, (r.violations || []).map((v, i) => h(U.ViolationItem, { key: i, v, sevLabel: t.sev }))) : null,

        // Deadlines
        h(U.Section, {
          num: num(), title: t.sDeadlines, accent: 'var(--d-red)', icon: h(I.AlarmClock, { size: 17 }),
          listenable: speech.supported && sortedDeadlines.length > 0,
          listening: speech.channel === 'deadlines',
          onListen: () => toggleListen('deadlines', sectionSpeech(t.sDeadlines, sortedDeadlines.map((d) => d.label))),
        }, sortedDeadlines.length
            ? sortedDeadlines.map((d, i) => h(U.DeadlineItem, {
                key: i, d, locale, urgencyLabel: t.urgency, icsLabel: t.addReminder,
                onIcs: (dl) => downloadIcs(dl, r.document_type),
              }))
            : h('p', { style: { color: 'var(--d-dim)' } }, t.deadlinesEmpty)),

        // Actions
        h(U.Section, {
          num: num(), title: t.sActions, accent: 'var(--d-live)', icon: h(I.ListChecks, { size: 17 }),
          listenable: speech.supported && (r.actions || []).length > 0,
          listening: speech.channel === 'actions',
          onListen: () => toggleListen('actions', sectionSpeech(t.sActions, (r.actions || []).map((a) => a.task))),
        }, (r.actions || []).map((a, i) => h(U.ActionItem, {
            key: i, a, locale, byLabel: t.byLabel, done: !!doneActions[i],
            onToggle: () => setDoneActions((p) => Object.assign({}, p, { [i]: !p[i] })),
          }))),

        // Rights
        h(U.Section, {
          num: num(), title: t.sRights, accent: 'var(--d-grn)', icon: h(I.Scale, { size: 17 }),
          listenable: speech.supported && (r.rights || []).length > 0,
          listening: speech.channel === 'rights',
          onListen: () => toggleListen('rights', sectionSpeech(t.sRights, (r.rights || []).map((x) => x.right))),
        }, (r.rights || []).map((x, i) => h(U.RightItem, { key: i, r: x, guidanceLabel: t.guidance }))),

        // What happens next: grounded legal-procedure timeline + cost of inaction
        ((r.procedure && r.procedure.length) || r.what_if_ignored) ? h(U.Section, {
          num: num(), title: t.sProcedure, accent: 'var(--d-live)', icon: h(I.Milestone, { size: 17 }),
          listenable: false,
        }, h(U.ProcedureList, { steps: r.procedure || [], whatIf: r.what_if_ignored, whatIfLabel: t.whatIfLabel })) : null,

        // Red flags
        h(U.Section, {
          num: num(), title: t.sFlags, accent: (r.red_flags || []).length ? 'var(--d-red)' : 'var(--d-grn)',
          icon: (r.red_flags || []).length ? h(I.ShieldAlert, { size: 17 }) : h(I.ShieldCheck, { size: 17 }),
          listenable: false,
        }, (r.red_flags || []).length
            ? (r.red_flags || []).map((f, i) => h(U.RedFlagItem, { key: i, f, sevLabel: t.sev }))
            : h(U.AllClear, { title: t.allClearTitle, body: t.allClearBody })),

        // Draft
        h(U.Section, {
          num: num(), title: t.sDraft, accent: 'var(--d-amber)', icon: h(I.PenLine, { size: 17 }),
          listenable: false,
        }, h(U.DraftEditor, { value: draft, onChange: setDraft, tag: t.draftTag, copyLabel: t.copy, copiedLabel: t.copied })),

        h(ResultActions, { result: r }),

        // Uncertainties (conditional)
        (r.uncertainties || []).length ? h(U.Section, {
          num: num(), title: t.sUnc, accent: 'var(--d-amber)', icon: h(I.CircleHelp, { size: 17 }),
          listenable: false,
        }, (r.uncertainties || []).map((u, i) => h(U.Uncertainty, { key: i, text: u }))) : null,

        // Get help
        h(U.Section, {
          num: num(), title: t.sHelp, accent: 'var(--d-grn)', icon: h(I.HelpingHand, { size: 17 }),
          listenable: false,
        }, (r.get_help || []).map((g, i) => h(U.HelpItem, { key: i, g, typeLabel: t.helpType }))),

        h('div', { className: 'dc-footer-actions' },
          h('button', { className: 'dc-decode', onClick: reset },
            h(I.RotateCcw, { size: 16 }), t.decodeAnother),
          h('button', { className: 'dc-ghostbtn', onClick: () => window.print() },
            h(I.Printer, { size: 16 }), t.print)
        )
      )
    );
  }

  /* ===================== Error ========================================= */
  function ErrorScreen({ t, onRetry, onBack }) {
    return h('div', { className: 'dc-rail' },
      h('div', { className: 'dc-error', role: 'alert' },
        h('div', { className: 'dc-error-ico' }, h(I.CircleAlert, { size: 30 })),
        h('h2', null, t.errorTitle),
        h('p', null, t.errorBody),
        h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' } },
          h('button', { className: 'dc-decode', onClick: onRetry }, h(I.RotateCcw, { size: 16 }), t.retry),
          h('button', { className: 'dc-ghostbtn', onClick: onBack }, t.back)
        )
      )
    );
  }

  /* ===================== Footer ======================================== */
  function Footer({ t }) {
    return h('footer', { className: 'dc-foot' },
      h('div', { className: 'dc-foot-row' },
        h('div', { className: 'dc-foot-left' },
          h(U.Brand, { size: 'sm' }),
          h('p', { className: 'dc-foot-tagline' }, t.footTag)
        ),
        h('p', { className: 'dc-foot-note' }, h(I.ShieldAlert, { size: 12, style: { verticalAlign: '-1px', marginRight: '6px', color: 'var(--d-amber)' } }), t.footNote)
      )
    );
  }

export const DecodedApp = App;
