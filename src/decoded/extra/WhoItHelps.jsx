/* =========================================================================
   Decoded - "Who it helps" section. Four calm cards, each a real person and
   the document they face. Self-contained: built on the same warm tokens and
   the existing feature-grid card language (dc-feat-card / dc-feat-ico) used by
   the landing FeatureRibbon, so it slots into HomeScreen with no new CSS.

   Uses h(Component, props, children) === React.createElement, exactly like
   app.jsx. Reuses the dc-* classes where they fit; any element without an
   existing class is styled with an inline `style` object that references the
   same Decoded design tokens (--d-*, --brand, --radius-*, --weight-*, --d-mono).
   No em-dashes. Calm and premium.
   ========================================================================= */
import React from 'react';
import { DecodedIcons as I } from '../icons.jsx';
const h = React.createElement;

/* Each card is a person and the document in front of them. The colour is the
   same role palette the rest of Decoded uses, so the section reads as one
   family with the feature ribbon and the result screen. */
const PEOPLE = [
  {
    c: 'var(--d-red)',
    ico: I.AlarmClock,
    who: 'Renters',
    doc: 'Eviction or pay-or-quit notice',
    line: 'See the deadline buried in an eviction or pay-or-quit notice and answer it in time, before a missed date becomes a default judgment.',
  },
  {
    c: 'var(--d-live)',
    ico: I.FileText,
    who: 'Patients',
    doc: 'Medical bill or insurance denial',
    line: 'Make sense of a surprise medical bill or an insurance denial, and learn that a denial is not the end: it can be appealed.',
  },
  {
    c: 'var(--d-grn)',
    ico: I.Scale,
    who: 'Families on benefits',
    doc: 'SNAP, Medicaid, or unemployment letter',
    line: 'Read a SNAP, Medicaid, or unemployment letter clearly, including the fair-hearing rights and the deadlines to use them that are written inside.',
  },
  {
    c: 'var(--d-mag)',
    ico: I.ShieldAlert,
    who: 'Older adults',
    doc: 'Debt-collection and scam demands',
    line: 'Tell real debt-collection notices from scam pressure, and catch demands that never come from a real agency, like a request to pay by gift card.',
  },
];

function WhoItHelps() {
  return h('section', { className: 'dc-feat', 'aria-label': 'Who it helps' },
    h('div', { className: 'dc-wide' },
      h('div', { className: 'dc-feat-head' },
        h('span', { className: 'dc-band-label' }, h(I.Users, { size: 13 }), 'Who it helps'),
        h('h2', { className: 'dc-band-h' }, 'Built for the moment a letter lands'),
        h('p', { className: 'dc-band-sub' }, 'Decoded is for the people an official document can frighten most: a real person on one side, a confusing page on the other, and a clear next step in between.')
      ),
      /* A clean 4-up that folds to 2x2 then a single column, reusing the
         feature-card language. dc-proof-grid carries the responsive columns
         (4 -> 2 -> 1); dc-feat-card carries the card surface, hover, and the
         --c accent. No inline media queries, no new CSS. */
      h('div', { className: 'dc-proof-grid' },
        PEOPLE.map((p, i) => h('div', {
          key: i,
          className: 'dc-feat-card',
          style: { '--c': p.c, textAlign: 'left', alignItems: 'stretch' },
        },
          h('span', { className: 'dc-feat-ico' }, h(p.ico, { size: 20 })),
          h('div', {
            style: {
              marginTop: '16px',
              fontFamily: 'var(--d-mono)',
              fontSize: '10px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--d-faint)',
            },
          }, p.doc),
          h('h4', { style: { marginTop: '6px' } }, p.who),
          h('p', null, p.line)
        ))
      )
    )
  );
}

export const DecodedExtra = { WhoItHelps };
export { WhoItHelps };
