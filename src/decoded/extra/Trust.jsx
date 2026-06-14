/* =========================================================================
   Decoded - "Built to be trusted" section. A calm, confident statement of the
   three promises that make Decoded safe to lean on: it cites real law, it
   explains rather than advises, and your document stays private. Self
   contained: it reuses the warm landing tokens and the .dc-feat card language
   so it sits seamlessly between the existing sections. No em-dashes.
   ========================================================================= */
import React from 'react';
import { DecodedIcons as I } from '../icons.jsx';
const h = React.createElement;

  /* Three promises. Each maps to one card, in the same .dc-feat-card language
     as the feature ribbon, with a quiet grounding line underneath the body
     that names the mechanism that makes the promise true. */
  const POINTS = [
    {
      c: 'var(--d-grn)',
      ico: I.Scale,
      h: 'It cites real law, and never makes it up',
      p: 'Every legal claim is copied from a curated corpus of actual statutes, so each one carries a citation you can open and verify.',
      ground: 'A fabricated citation is structurally impossible.',
      groundIco: I.ShieldCheck,
    },
    {
      c: 'var(--d-live)',
      ico: I.Quote,
      h: 'It explains, it does not advise',
      p: 'Decoded translates a document into plain language and lays out your options. It is not legal or medical advice, and it routes you to real human help.',
      ground: 'Always confirm important steps with a qualified professional.',
      groundIco: I.HelpingHand,
    },
    {
      c: 'var(--d-mag)',
      ico: I.Lock,
      h: 'Your document stays private',
      p: 'There is no account, analyses are stored on your device, and nothing is kept on a server.',
      ground: 'It never leaves your hands.',
      groundIco: I.ShieldCheck,
    },
  ];

  function Trust() {
    return h('section', { className: 'dc-feat', 'aria-label': 'Built to be trusted' },
      h('div', { className: 'dc-wide' },
        h('div', { 'data-reveal': '', className: 'dc-feat-head' },
          h('span', { className: 'dc-band-label' }, h(I.ShieldCheck, { size: 13 }), 'Trust and safety'),
          h('h2', { className: 'dc-band-h' }, 'Built to be trusted'),
          h('p', { className: 'dc-band-sub' },
            'A document like this is too important to guess at. Decoded is built so you can rely on every line it gives back, and verify it for yourself.'
          )
        ),
        h('div', { 'data-reveal': '' },
          h('div', { className: 'dc-feat-grid' },
            POINTS.map((pt, i) => h('div', { className: 'dc-feat-card', key: i, style: { '--c': pt.c } },
              h('span', { className: 'dc-feat-ico' }, h(pt.ico, { size: 20 })),
              h('h4', null, pt.h),
              h('p', null, pt.p),
              h('div', {
                style: {
                  display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '14px',
                  paddingTop: '14px', borderTop: '1px solid var(--d-line)',
                },
              },
                h('span', {
                  style: { color: 'var(--c)', display: 'inline-flex', flex: 'none', marginTop: '1px' },
                }, h(pt.groundIco, { size: 15 })),
                h('span', {
                  style: {
                    fontFamily: 'var(--d-mono)', fontSize: '11.5px', lineHeight: 1.5,
                    letterSpacing: '0.01em', color: 'var(--d-faint)',
                  },
                }, pt.ground)
              )
            ))
          )
        )
      )
    );
  }

export { Trust };
