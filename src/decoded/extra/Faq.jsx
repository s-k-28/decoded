/* Decoded - "Questions people ask" section. A calm, readable FAQ that matches
   the cinematic landing bands (same dc-wide container, dc-band-label eyebrow,
   dc-band-h heading, and data-reveal scroll-in). Each question expands to a
   plain-language answer. Self-contained: local state only, inline styles that
   reference the same warm theme tokens (var(--d-*), var(--brand)). No
   em-dashes. h(Component, props, children) is React.createElement, exactly as
   in app.jsx. */
import React from 'react';
import { DecodedIcons as I } from '../icons.jsx';
const { useState } = React;
const h = React.createElement;

const QA = [
  {
    q: 'Is this legal advice?',
    a: 'No. Decoded explains a document in plain language and points you to real human help. It is not a lawyer or a doctor.',
  },
  {
    q: 'Is my document private?',
    a: 'Yes. There is no account, and saved analyses stay on your device, not on a server.',
  },
  {
    q: 'How much does it cost?',
    a: 'It is free for individuals.',
  },
  {
    q: 'How does it know the law?',
    a: 'It checks your document against a curated corpus of real statutes and shows a citation for every legal claim, so you can verify it yourself.',
  },
  {
    q: 'What documents can it read?',
    a: 'Debt-collection letters, medical bills and insurance denials, eviction and housing notices, and benefits notices, in plain text or a photo.',
  },
  {
    q: 'Can it be wrong?',
    a: 'It can. It shows what it is unsure about, never invents a law, and always routes you to real help for anything important.',
  },
];

function FaqRow({ item, open, onToggle, panelId, btnId }) {
  return h('div', {
    style: {
      borderTop: '1px solid var(--d-line)',
    },
  },
    h('button', {
      id: btnId,
      type: 'button',
      onClick: onToggle,
      'aria-expanded': open,
      'aria-controls': panelId,
      style: {
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        padding: '20px 4px',
        background: 'none',
        border: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        color: 'var(--d-text)',
      },
    },
      h('span', {
        'aria-hidden': 'true',
        style: {
          flex: 'none',
          marginTop: '2px',
          display: 'inline-flex',
          color: open ? 'var(--brand)' : 'var(--d-faint)',
          transition: 'transform 220ms var(--ease-out, ease), color 160ms ease',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        },
      }, h(I.ChevronDown, { size: 18 })),
      h('span', {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: '1.12rem',
          lineHeight: 1.4,
          fontWeight: 'var(--weight-semibold, 600)',
          letterSpacing: '-0.01em',
          color: 'var(--d-text)',
        },
      }, item.q)
    ),
    h('div', {
      id: panelId,
      role: 'region',
      'aria-labelledby': btnId,
      hidden: open ? undefined : true,
      style: open ? {
        padding: '0 4px 22px 50px',
      } : undefined,
    },
      open ? h('p', {
        style: {
          margin: 0,
          fontSize: '1.02rem',
          lineHeight: 1.62,
          color: 'var(--d-dim)',
          maxWidth: '60ch',
        },
      }, item.a) : null
    )
  );
}

function Faq() {
  const [openIdx, setOpenIdx] = useState(0);
  return h('section', {
    className: 'dc-faq',
    'aria-label': 'Questions people ask',
    style: { padding: 'clamp(44px, 7vh, 84px) 0' },
  },
    h('div', { className: 'dc-wide' },
      h('div', {
        'data-reveal': '',
        style: {
          textAlign: 'center',
          maxWidth: '680px',
          margin: '0 auto clamp(30px, 4vh, 50px)',
        },
      },
        h('span', {
          className: 'dc-band-label',
          style: { justifyContent: 'center' },
        }, h(I.CircleHelp, { size: 13 }), 'Questions'),
        h('h2', { className: 'dc-band-h' }, 'Questions people ask'),
        h('p', {
          className: 'dc-band-sub',
          style: { marginLeft: 'auto', marginRight: 'auto' },
        }, 'Straight answers about what Decoded does, what it does not do, and how to trust it.')
      ),
      h('div', { 'data-reveal': '' },
        h('div', {
          style: {
            maxWidth: '760px',
            margin: '0 auto',
            borderBottom: '1px solid var(--d-line)',
            background: 'var(--d-panel)',
            border: '1px solid var(--d-line)',
            borderRadius: 'var(--radius-xl, 18px)',
            boxShadow: 'var(--shadow-card)',
            padding: '4px clamp(16px, 3vw, 26px)',
          },
        },
          QA.map((item, i) => h(FaqRow, {
            key: i,
            item,
            open: openIdx === i,
            onToggle: () => setOpenIdx((cur) => (cur === i ? -1 : i)),
            panelId: 'dc-faq-panel-' + i,
            btnId: 'dc-faq-btn-' + i,
          }))
        )
      )
    )
  );
}

export { Faq };
