/* =========================================================================
   Decoded - "Why not just ask a chatbot?" comparison band.

   A self-contained landing section that runs the SAME scary debt letter
   through two readers side by side: a generic chatbot that summarizes and
   quietly sides with the sender, and Decoded, which flags the illegal arrest
   threat (FDCPA 15 U.S.C. 1692e), the missing validation notice (1692g), the
   scam, and the right to demand written verification, each grounded with a
   real "cited" chip.

   On-brand by construction: it borrows the warm tokens, mono eyebrow, big
   Space Grotesk heading, and calm cream cards from the rest of the landing,
   and reuses the U.Cite citation chip so every legal point opens the real
   statute. New elements use inline styles that reference the same var(--dc-*)
   / var(--d-*) / var(--brand) tokens, so nothing drifts off-palette. No
   existing file is touched. No em-dashes.
   ========================================================================= */
import React from 'react';
import { DecodedIcons as I } from '../icons.jsx';
import { DecodedUI as U } from '../components.jsx';
const h = React.createElement;

/* The one letter both readers are handed. Kept terse so the contrast below is
   about interpretation, not length. */
const LETTER = [
  'FINAL NOTICE. Our records show you owe $4,200 on account #88231.',
  'Pay in full within 48 hours by prepaid card or a warrant will be issued',
  'for your arrest. This is your last chance to avoid law enforcement action.',
];

/* The two legal failures Decoded names, each grounded in a real statute so the
   U.Cite chip opens the law itself. */
const LEGAL = [
  {
    issue: 'The arrest threat is illegal',
    body: 'You cannot be arrested over a private debt. A collector threatening jail or a warrant to scare you into paying is a prohibited false threat.',
    citation: '15 U.S.C. 1692e',
    url: 'https://www.law.cornell.edu/uscode/text/15/1692e',
  },
  {
    issue: 'No validation notice was given',
    body: 'A real collector must send written notice of the amount and your right to dispute it within five days. This letter skips that, which is a red flag on its own.',
    citation: '15 U.S.C. 1692g',
    url: 'https://www.law.cornell.edu/uscode/text/15/1692g',
  },
];

/* Plain text the chatbot card "produces". Deliberately compliant and a little
   too trusting, so the contrast with Decoded is unmistakable. */
const CHATBOT_REPLY =
  'You owe $4,200 on this account. To avoid further action you should pay the balance soon, ideally before the deadline in the letter. Paying promptly is usually the safest way to resolve a collection notice like this.';

/* ---- the shared letter, rendered as a small paper block ---------------- */
function LetterStrip() {
  return h('div', {
    style: {
      maxWidth: '760px', margin: '0 auto clamp(26px, 4vh, 40px)',
      borderRadius: 'var(--radius-xl)', overflow: 'hidden',
      background: 'var(--d-panel)', border: '1px solid var(--d-line-2)',
      boxShadow: 'var(--shadow-card)',
    },
  },
    h('div', {
      style: {
        display: 'flex', alignItems: 'center', gap: '7px', height: '38px',
        padding: '0 15px', borderBottom: '1px solid var(--d-line)',
        background: 'linear-gradient(180deg, #fffdf9, #f7f0e4)',
      },
    },
      h('i', { style: { width: '9px', height: '9px', borderRadius: '50%', background: 'var(--d-red)' } }),
      h('i', { style: { width: '9px', height: '9px', borderRadius: '50%', background: 'var(--d-amber)' } }),
      h('i', { style: { width: '9px', height: '9px', borderRadius: '50%', background: 'var(--d-grn)' } }),
      h('span', {
        style: {
          marginLeft: '9px', fontFamily: 'var(--d-mono)', fontSize: '10px',
          letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--d-faint)',
        },
      }, 'The same debt letter')
    ),
    h('div', { style: { padding: 'clamp(16px, 2.4vw, 22px)' } },
      h('div', {
        style: {
          display: 'inline-flex', alignItems: 'center', gap: '7px', marginBottom: '12px',
          fontFamily: 'var(--d-mono)', fontSize: '10px', letterSpacing: 'var(--tracking-label)',
          textTransform: 'uppercase', color: 'var(--d-faint)',
        },
      }, h(I.FileText, { size: 13 }), 'What it says'),
      h('p', {
        style: {
          margin: 0, fontFamily: 'var(--d-mono)', fontSize: '0.84rem', lineHeight: 1.7,
          color: 'var(--d-dim)',
        },
      }, LETTER.map((line, i) => h(React.Fragment, { key: i }, line, i < LETTER.length - 1 ? h('br', null) : null)))
    )
  );
}

/* ---- a small mono label that tops each column -------------------------- */
function ColLabel({ icon, text, color }) {
  return h('div', {
    style: {
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      fontFamily: 'var(--d-mono)', fontSize: '10.5px', letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase', color: color || 'var(--d-faint)',
    },
  }, h(icon, { size: 14 }), text);
}

/* ---- left: a regular chatbot ------------------------------------------- */
function ChatbotCard() {
  return h('div', {
    style: {
      display: 'flex', flexDirection: 'column',
      padding: 'clamp(20px, 2.6vw, 28px)', borderRadius: 'var(--radius-xl)',
      background: 'var(--d-panel-2)', border: '1px solid var(--d-line)',
      boxShadow: 'var(--shadow-card)',
    },
  },
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' } },
      h(ColLabel, { icon: I.Boxes, text: 'A regular chatbot', color: 'var(--d-faint)' }),
      h('span', {
        style: {
          fontFamily: 'var(--d-mono)', fontSize: '9px', letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--d-ghost)',
          padding: '3px 9px', borderRadius: 'var(--radius-pill)',
          background: 'var(--raise-2)', border: '1px solid var(--d-line)',
        },
      }, 'Summary only')
    ),
    h('h3', {
      style: {
        marginTop: '16px', fontSize: '1.2rem', fontWeight: 'var(--weight-semibold)',
        letterSpacing: '-0.01em', color: 'var(--d-text)',
      },
    }, 'It just tells you to pay'),
    /* the chatbot's actual answer, in a quiet quote well */
    h('div', {
      style: {
        marginTop: '14px', padding: '14px 16px', borderRadius: 'var(--radius-lg)',
        background: 'var(--d-panel)', border: '1px solid var(--d-line)',
      },
    },
      h('div', {
        style: {
          display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px',
          fontFamily: 'var(--d-mono)', fontSize: '9.5px', letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--d-ghost)',
        },
      }, h(I.Quote, { size: 12 }), 'Its reply'),
      h('p', { style: { margin: 0, fontSize: '0.96rem', lineHeight: 1.6, color: 'var(--d-dim)' } }, CHATBOT_REPLY)
    ),
    /* the subtle warning: it quietly sides with the sender */
    h('div', {
      style: {
        marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start',
        padding: '12px 14px', borderRadius: 'var(--radius-lg)',
        background: 'color-mix(in srgb, var(--d-amber) 9%, var(--d-panel))',
        border: '1px solid color-mix(in srgb, var(--d-amber) 30%, transparent)',
      },
    },
      h(I.TriangleAlert, { size: 16, style: { color: 'var(--d-amber-deep)', flex: 'none', marginTop: '2px' } }),
      h('p', { style: { margin: 0, fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--d-dim)' } },
        h('b', { style: { color: 'var(--d-text)', fontWeight: 'var(--weight-semibold)' } }, 'It takes the letter at its word. '),
        'It never questions the arrest threat, so it quietly sides with the sender and would steer you straight into a scam.'
      )
    )
  );
}

/* ---- right: Decoded ---------------------------------------------------- */
function DecodedCard() {
  return h('div', {
    style: {
      display: 'flex', flexDirection: 'column',
      padding: 'clamp(20px, 2.6vw, 28px)', borderRadius: 'var(--radius-xl)',
      background: 'var(--d-panel)',
      border: '1px solid color-mix(in srgb, var(--brand) 40%, var(--d-line-2))',
      boxShadow: 'var(--shadow-card-hover), 0 24px 60px -40px rgba(196,86,53,0.45)',
      position: 'relative',
    },
  },
    /* a thin brand accent rail along the top edge */
    h('span', {
      'aria-hidden': 'true',
      style: {
        position: 'absolute', left: '18px', right: '18px', top: 0, height: '3px',
        borderRadius: '0 0 3px 3px', background: 'var(--grad-spectrum)',
      },
    }),
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' } },
      h(ColLabel, { icon: I.ScanLine, text: 'Decoded', color: 'var(--brand)' }),
      h('span', {
        style: {
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          fontFamily: 'var(--d-mono)', fontSize: '9px', letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--brand-deep)',
          padding: '3px 9px 3px 8px', borderRadius: 'var(--radius-pill)',
          background: 'var(--brand-soft)',
          border: '1px solid color-mix(in srgb, var(--brand) 28%, transparent)',
        },
      }, h(I.ShieldCheck, { size: 11 }), 'Reads your side')
    ),
    h('h3', {
      style: {
        marginTop: '16px', fontSize: '1.2rem', fontWeight: 'var(--weight-semibold)',
        letterSpacing: '-0.01em', color: 'var(--d-text)',
      },
    }, 'It catches what is illegal'),
    /* the scam verdict, in the brand-serious clay-red register */
    h('div', {
      style: {
        marginTop: '14px', display: 'flex', gap: '11px', alignItems: 'flex-start',
        padding: '13px 15px', borderRadius: 'var(--radius-lg)',
        background: 'color-mix(in srgb, var(--d-red) 11%, var(--d-panel))',
        border: '1px solid color-mix(in srgb, var(--d-red) 40%, transparent)',
      },
    },
      h(I.ShieldAlert, { size: 18, style: { color: 'var(--d-red)', flex: 'none', marginTop: '1px' } }),
      h('div', null,
        h('div', {
          style: {
            fontWeight: 'var(--weight-bold)', fontSize: '0.92rem', color: 'var(--d-red)',
            letterSpacing: '0.01em',
          },
        }, 'This is a scam'),
        h('p', { style: { margin: '4px 0 0', fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--d-dim)' } },
          'A demand for prepaid cards in 48 hours under threat of arrest is a classic collection scam. Do not pay.')
      )
    ),
    /* the grounded legal points, each with a real cited chip */
    h('div', { style: { marginTop: '16px', display: 'flex', flexDirection: 'column' } },
      LEGAL.map((v, i) => h('div', {
        key: i,
        style: {
          display: 'flex', gap: '11px', padding: '13px 0',
          borderTop: i === 0 ? 'none' : '1px solid var(--d-line)',
        },
      },
        h('span', { style: { color: 'var(--brand)', display: 'inline-flex', flex: 'none', marginTop: '1px' } },
          h(I.Gavel, { size: 17 })),
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', {
            style: { fontWeight: 'var(--weight-semibold)', fontSize: '0.96rem', color: 'var(--d-text)' },
          }, v.issue),
          h('p', { style: { margin: '4px 0 0', fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--d-dim)' } }, v.body),
          /* reuse the real citation chip so it opens the actual statute */
          h(U.Cite, { citation: v.citation, url: v.url })
        )
      ))
    ),
    /* the confident next move */
    h('div', {
      style: {
        marginTop: '4px', paddingTop: '14px', borderTop: '1px solid var(--d-line)',
        display: 'flex', gap: '10px', alignItems: 'flex-start',
      },
    },
      h(I.ShieldCheck, { size: 17, style: { color: 'var(--d-grn)', flex: 'none', marginTop: '2px' } }),
      h('p', { style: { margin: 0, fontSize: '0.9rem', lineHeight: 1.55, color: 'var(--d-text)' } },
        h('b', { style: { fontWeight: 'var(--weight-semibold)' } }, 'You hold the cards. '),
        'You can demand written verification of the debt in writing, and the collector has to stop until it proves the amount is real.')
    )
  );
}

/* ---- the section ------------------------------------------------------- */
function Comparison() {
  return h('section', {
    className: 'dc-compare',
    'aria-label': 'Why not just ask a chatbot',
    style: { padding: 'clamp(44px, 7vh, 84px) 0' },
  },
    h('div', { className: 'dc-wide' },
      /* head: mono eyebrow + big Space Grotesk heading + calm sub, centered
         exactly like the other landing bands */
      h('div', {
        style: { textAlign: 'center', maxWidth: '720px', margin: '0 auto clamp(30px, 4vh, 50px)' },
      },
        h('span', {
          className: 'dc-band-label',
          style: { justifyContent: 'center' },
        }, h(I.Boxes, { size: 13 }), 'Chatbot vs Decoded'),
        h('h2', { className: 'dc-band-h' }, 'Why not just ask a chatbot?'),
        h('p', {
          className: 'dc-band-sub',
          style: { marginLeft: 'auto', marginRight: 'auto' },
        }, 'Hand the same threatening debt letter to both. A general chatbot summarizes it and tells you to pay. Decoded reads it as your advocate, names what is against the law, and shows you the way out.')
      ),

      LetterStrip(),

      /* the side by side. Two columns on desktop, stacked on small screens. */
      h('div', {
        style: {
          display: 'grid', gap: 'clamp(16px, 2.4vw, 22px)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          alignItems: 'stretch',
        },
      },
        h(ChatbotCard, null),
        h(DecodedCard, null)
      )
    )
  );
}

export { Comparison };
export default Comparison;
