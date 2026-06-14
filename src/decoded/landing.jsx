/* Decoded - cinematic landing sections. Shows the real product in action:
   a floating decoded result, a stepped narrative, a feature ribbon, proof,
   and a closing call. Exports window.DecodedLanding. */
import React from 'react';
import { DecodedIcons as I } from './icons.jsx';
import { DECODED as D } from './demoData.js';
const h = React.createElement;

  /* a reveal wrapper: adds [data-reveal] so the observer can lift it in */
  function Reveal(props) {
    const dir = props.dir || true;
    return h('div', { 'data-reveal': props.dir || '', className: props.className, style: props.style }, props.children);
  }

  /* ---- Product peek: the real decoded eviction result, framed in depth -- */
  function ProductPeek() {
    const r = D.getSeed('eviction', 'en', 'plain');
    return h('section', { className: 'dc-peek-band' },
      h('div', { className: 'dc-wide' },
        h(Reveal, { className: 'dc-peek-head' },
          h('span', { className: 'dc-band-label' }, h(I.ScanLine, { size: 13 }), 'A real notice, decoded'),
          h('h2', { className: 'dc-band-h' }, 'This is what you get back'),
          h('p', { className: 'dc-band-sub' }, 'One confusing letter becomes a clear picture: what it is, the deadline that matters, and the first move to make. No legalese, no guessing.')
        ),
        h(Reveal, { className: 'dc-peek-stage' },
          h('div', { className: 'dc-peek' },
            h('div', { className: 'dc-peek-bar' },
              h('i', { style: { background: 'var(--d-red)' } }), h('i', { style: { background: 'var(--d-amber)' } }), h('i', { style: { background: 'var(--d-grn)' } }),
              h('span', null, 'Decoded result')
            ),
            h('div', { className: 'dc-peek-body' },
              h('div', { className: 'dc-eyebrow', style: { fontSize: '11px' } }, h(I.FileText, { size: 13 }), 'Document'),
              h('div', { className: 'dc-peek-doc', style: { marginTop: '8px' } },
                h('h3', null, r.document_type)
              ),
              h('div', { style: { marginTop: '10px' } },
                h('span', { className: 'dc-peek-conf' }, h('i', null), 'High confidence')
              ),
              h('p', { className: 'dc-peek-lead' }, r.summary)
            )
          ),
          h('div', { className: 'dc-peek-float dc-peek-float--dl' },
            h('span', { className: 'ico' }, h(I.AlarmClock, { size: 16 })),
            h('div', null, h('b', null, 'Pay by Jun 19'), h('span', null, 'Critical deadline'))
          ),
          h('div', { className: 'dc-peek-float dc-peek-float--right' },
            h('span', { className: 'ico' }, h(I.ShieldCheck, { size: 16 })),
            h('div', null, h('b', null, 'Right to a hearing'), h('span', null, 'Before any eviction'))
          )
        )
      )
    );
  }

  /* ---- Stepped how-it-works -------------------------------------------- */
  function StepVisualPaste() {
    return h('div', { className: 'dc-mock' },
      h('div', { className: 'dc-mock-bar' }, h('i', { style: { background: 'var(--d-red)' } }), h('i', { style: { background: 'var(--d-amber)' } }), h('i', { style: { background: 'var(--d-grn)' } }), h('span', null, 'Notice to pay rent or quit')),
      h('div', { className: 'dc-mock-body' },
        h('div', { className: 'dc-mock-lines' },
          h('span', { className: 'rule w1' }), h('span', { className: 'rule w3' }), h('span', { className: 'rule w2' }),
          h('span', { className: 'rule w1' }), h('span', { className: 'rule w4' })
        ),
        h('span', { className: 'dc-mock-stamp' }, h(I.Clipboard, { size: 12 }), 'Pasted, ready to decode')
      )
    );
  }
  function StepVisualScan() {
    const langs = ['English', 'Espanol', '\u4e2d\u6587', 'Ti\u1ebfng Vi\u1ec7t', 'Krey\u00f2l'];
    return h('div', { className: 'dc-mock' },
      h('div', { className: 'dc-mock-bar' }, h('i', { style: { background: 'var(--d-red)' } }), h('i', { style: { background: 'var(--d-amber)' } }), h('i', { style: { background: 'var(--d-grn)' } }), h('span', null, 'Reading and translating')),
      h('div', { className: 'dc-mock-body' },
        h('div', { className: 'dc-mock-scanrow' },
          h('span', { className: 'dc-mock-scanicon' }, h(I.ScanLine, { size: 24 })),
          h('div', { className: 'dc-mock-prog' },
            h('div', { className: 'dc-mock-progbar' }, h('i', { style: { width: '82%' } })),
            h('div', { className: 'dc-mock-progbar' }, h('i', { style: { width: '58%' } }))
          )
        ),
        h('div', { className: 'dc-mock-langs' },
          langs.map((l, i) => h('span', { key: i, className: 'dc-mock-lang', 'data-on': i === 0 ? 'true' : 'false' }, l))
        )
      )
    );
  }
  function StepVisualResult() {
    return h('div', { className: 'dc-mock' },
      h('div', { className: 'dc-mock-bar' }, h('i', { style: { background: 'var(--d-red)' } }), h('i', { style: { background: 'var(--d-amber)' } }), h('i', { style: { background: 'var(--d-grn)' } }), h('span', null, 'What to do')),
      h('div', { className: 'dc-mock-body' },
        h('div', { className: 'dc-mock-dl' },
          h('span', { className: 'stripe' }),
          h('div', null,
            h('span', { className: 'dc-mock-urg' }, 'Critical'),
            h('b', null, 'Pay $2,140 or respond before Jun 19')
          )
        ),
        h('div', { className: 'dc-mock-act' },
          h('span', { className: 'dc-mock-check' }, h(I.Check, { size: 13 })),
          h('p', null, 'Call free legal aid today. They can answer the notice for you and may stop the eviction.')
        )
      )
    );
  }

  const STEPS = [
    { n: '01', title: 'Paste it or snap a photo', body: 'Drop in the text of any letter, bill, or notice, or take a picture of the paper. Nothing to install, no account, no cost.', visual: StepVisualPaste },
    { n: '02', title: 'Decoded reads every line', body: 'It works out what the document is, pulls out the dates and demands, and rewrites it in plain words, at your reading level, in your language.', visual: StepVisualScan },
    { n: '03', title: 'Know exactly what to do', body: 'You see the deadline that matters, the steps to take, your rights, any scam signals, a reply you can send, and where to find real human help.', visual: StepVisualResult },
  ];

  function HowItWorks() {
    return h('section', { className: 'dc-how' },
      h('div', { className: 'dc-wide' },
        h(Reveal, { className: 'dc-how-head' },
          h('span', { className: 'dc-band-label' }, h(I.Workflow ? I.Workflow : I.ListChecks, { size: 13 }), 'How it works'),
          h('h2', { className: 'dc-band-h' }, 'Three steps from panic to a plan'),
          h('p', { className: 'dc-band-sub' }, 'The same path a caseworker would walk you through, in seconds instead of weeks.')
        ),
        STEPS.map((s, i) => h('div', { className: 'dc-step2', key: i },
          h(Reveal, { className: 'dc-step2-copy', dir: i % 2 === 0 ? 'left' : 'right' },
            h('div', { className: 'dc-step2-num' }, s.n),
            h('h3', { className: 'dc-step2-h' }, s.title),
            h('p', { className: 'dc-step2-p' }, s.body)
          ),
          h(Reveal, { className: 'dc-step2-visual', dir: i % 2 === 0 ? 'right' : 'left' }, h(s.visual, null))
        ))
      )
    );
  }

  /* ---- Feature ribbon -------------------------------------------------- */
  const FEATURES = [
    { c: 'var(--d-red)', ico: I.AlarmClock, h: 'The deadline, front and center', p: 'Every date that matters, sorted by urgency, with the critical one impossible to miss and a reminder you can save.' },
    { c: 'var(--d-grn)', ico: I.Scale, h: 'Your rights, in plain words', p: 'What you are actually entitled to, grounded in the document, never invented, with a clear note when to verify.' },
    { c: 'var(--d-red)', ico: I.ShieldAlert, h: 'Scam and pressure signals', p: 'Decoded flags gift-card demands, fake urgency, and deadlines shorter than the law allows, and tells you why.' },
    { c: 'var(--d-amber)', ico: I.PenLine, h: 'A reply you can send', p: 'A courteous, firm draft with blanks to fill in, that never admits fault. Edit it, copy it, send it.' },
    { c: 'var(--d-live)', ico: I.Volume2, h: 'Read aloud, any reading level', p: 'Listen to the whole thing or any section, simplest to standard, for anyone who cannot or would rather not read.' },
    { c: 'var(--d-mag)', ico: I.Languages, h: 'In your language', p: 'Seven languages chosen for the people the system fails, with every word written natively, not machine-pasted.' },
  ];
  function FeatureRibbon() {
    return h('section', { className: 'dc-feat' },
      h('div', { className: 'dc-wide' },
        h(Reveal, { className: 'dc-feat-head' },
          h('span', { className: 'dc-band-label' }, h(I.Boxes ? I.Boxes : I.ListChecks, { size: 13 }), 'Everything in one place'),
          h('h2', { className: 'dc-band-h' }, 'Not just a summary. A way forward.'),
          h('p', { className: 'dc-band-sub' }, 'Other tools answer one question. Decoded reads the whole document and hands you comprehension, rights, actions, safety, and a real next step.')
        ),
        h(Reveal, null,
          h('div', { className: 'dc-feat-grid' },
            FEATURES.map((f, i) => h('div', { className: 'dc-feat-card', key: i, style: { '--c': f.c } },
              h('span', { className: 'dc-feat-ico' }, h(f.ico, { size: 20 })),
              h('h4', null, f.h),
              h('p', null, f.p)
            ))
          )
        )
      )
    );
  }

  /* ---- Cinematic proof ------------------------------------------------- */
  const STATS = [
    { n: '28%', t: 'of US adults read at the lowest literacy level, and the share is rising', s: 'NCES PIAAC 2023' },
    { n: '68M', t: 'people in the US speak a language other than English at home', s: 'Migration Policy Institute' },
    { n: '1 in 2', t: 'eviction judgments in Oregon are defaults: a missed deadline, not a lost case', s: 'Evicted in Oregon' },
    { n: '33 to 59%', t: 'jump in correct comprehension when documents are written in plain language', s: 'Schunemann et al.' },
  ];
  function Proof() {
    return h('section', { className: 'dc-proof' },
      h('div', { className: 'dc-wide' },
        h(Reveal, { className: 'dc-proof-head' },
          h('span', { className: 'dc-band-label' }, h(I.CircleAlert, { size: 13 }), 'Why it matters'),
          h('h2', { className: 'dc-band-h' }, 'Misreading a letter can cost a home')
        ),
        h(Reveal, null,
          h('div', { className: 'dc-proof-grid' },
            STATS.map((s, i) => h('div', { className: 'dc-proof-item', key: i },
              h('div', { className: 'dc-proof-num' }, s.n),
              h('div', { className: 'dc-proof-txt' }, s.t),
              h('div', { className: 'dc-proof-src' }, s.s)
            ))
          )
        )
      )
    );
  }

  /* ---- Closing CTA ----------------------------------------------------- */
  function ClosingCTA({ onJump, onExample }) {
    return h('section', { className: 'dc-closing' },
      h('div', { className: 'dc-closing-glow', 'aria-hidden': 'true' }),
      h(Reveal, { className: 'dc-closing-inner' },
        h('h2', null, 'Decoded turns a panic attack into ', h('em', null, 'a plan')),
        h('p', null, 'Paste the letter you have been avoiding. In under a minute you will know what it means and what to do next.'),
        h('div', { className: 'dc-closing-cta' },
          h('button', { className: 'dc-decode', onClick: onJump }, h(I.ScanLine, { size: 18 }), 'Decode a document'),
          h('button', { className: 'dc-ghostbtn', onClick: onExample }, h(I.FileText, { size: 16 }), 'Try the eviction example')
        )
      )
    );
  }

export const DecodedLanding = { ProductPeek, HowItWorks, FeatureRibbon, Proof, ClosingCTA };
