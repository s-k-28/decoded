/* =========================================================================
   Decoded - "The actual law we check" landing band.
   A self-contained section that names the real statutes behind every check
   Decoded runs, one card per category, citations set in the mono face so they
   read like code and feel authoritative. Built with h() exactly like app.jsx,
   reusing the dc-feat band + dc-band-* head + dc-feat-grid/card language and
   the warm --d-* / --brand tokens. No existing file is touched. No em-dashes.
   ========================================================================= */
import React from 'react';
import { DecodedIcons as I } from '../icons.jsx';
const h = React.createElement;

  /* A single statute citation, rendered in the mono face so it reads like
     code. Mirrors the look of the .dc-cite / .dc-lawchecked-chip code chips,
     using inline styles over the same warm brand tokens. */
  function Statute(props) {
    return h('span', {
      style: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '4px 10px', borderRadius: '8px',
        fontFamily: 'var(--d-mono)', fontSize: '11.5px', fontWeight: 600,
        letterSpacing: '0.01em', lineHeight: 1.2, whiteSpace: 'nowrap',
        background: 'var(--brand-soft)', color: 'var(--brand-deep)',
        border: '1px solid color-mix(in srgb, var(--brand) 28%, transparent)',
      },
    },
      h(I.Scale, { size: 12 }),
      h('span', null, props.code)
    );
  }

  /* The body of one category card: a short plain-language line naming the law,
     then the real citations as mono chips. */
  function Cards() {
    const CATEGORIES = [
      {
        c: 'var(--d-red)', ico: I.Landmark, title: 'Debt collection',
        line: 'The Fair Debt Collection Practices Act and Regulation F, plus the federal cap on how much of a paycheck can be garnished.',
        statutes: ['15 U.S.C. 1692', '12 CFR 1006', '15 U.S.C. 1673'],
      },
      {
        c: 'var(--d-live)', ico: I.HelpingHand, title: 'Medical',
        line: 'The No Surprises Act, which limits surprise bills, and your right to appeal a denial under the Affordable Care Act.',
        statutes: ['42 U.S.C. 300gg-111', '45 CFR 147.136'],
      },
      {
        c: 'var(--d-amber)', ico: I.Scale, title: 'Housing and eviction',
        line: 'Your state notice law, which sets how much time a landlord must give, together with the federal CARES Act.',
        statutes: ['Tex. Prop. Code 24.005', 'Cal. Civ. Proc. 1161', 'CARES Act'],
      },
      {
        c: 'var(--d-grn)', ico: I.ShieldCheck, title: 'Public benefits',
        line: 'The fair-hearing rules that protect your SNAP and Medicaid benefits before they can be cut or denied.',
        statutes: ['7 CFR 273.15', '42 CFR 431.220'],
      },
    ];

    return h('div', { className: 'dc-feat-grid' },
      CATEGORIES.map((cat, i) => h('div', { className: 'dc-feat-card', key: i, style: { '--c': cat.c } },
        h('span', { className: 'dc-feat-ico' }, h(cat.ico, { size: 20 })),
        h('h4', null, cat.title),
        h('p', null, cat.line),
        h('div', {
          style: { marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '6px' },
        }, cat.statutes.map((s, j) => h(Statute, { key: j, code: s })))
      ))
    );
  }

  /* The band. Same shell as the feature ribbon: a full-bleed section with a
     centered dc-band-* head, then the four-card grid. data-reveal markers let
     the landing's existing scroll-reveal observer lift it in like the other
     bands. */
  function LawWeCheck() {
    return h('section', { className: 'dc-feat', 'aria-label': 'The actual law we check' },
      h('div', { className: 'dc-wide' },
        h('div', { className: 'dc-feat-head', 'data-reveal': '' },
          h('span', { className: 'dc-band-label' }, h(I.Scale, { size: 13 }), 'Grounded in real statutes'),
          h('h2', { className: 'dc-band-h' }, 'The actual law we check'),
          h('p', { className: 'dc-band-sub' }, 'Every right and problem Decoded reports links to one of these, so you can open it and check.')
        ),
        h('div', { 'data-reveal': '' }, h(Cards, null))
      )
    );
  }

export { LawWeCheck };
