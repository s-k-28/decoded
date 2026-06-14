/* Decoded - presentational components: brand lockup + every result section.
   Pure view layer; state lives in app.jsx. */
import React from 'react';
import { DecodedIcons as I } from './icons.jsx';
const h = React.createElement;

  /* ---- Brand lockup: Decoded mark (open envelope + magnifier reading the
     letter in plain language) + DECODED wordmark. A crisp vector cut of the
     brand emblem so it stays sharp and recolourable at every size. -------- */
  function DecodedMark({ size = 22 }) {
    const w = Math.round((size * 64) / 56);
    return h('span', { className: 'hv-brand-hex', 'aria-hidden': 'true',
        style: { color: 'var(--brand)', display: 'inline-flex', lineHeight: 0 } },
      h('svg', { width: w, height: size, viewBox: '0 0 64 56', fill: 'none', role: 'img' },
        h('g', { fill: 'none', stroke: 'currentColor', strokeWidth: '3.6', strokeLinecap: 'round', strokeLinejoin: 'round' },
          h('path', { d: 'M9 25 L32 8 L55 25' }),
          h('path', { d: 'M9 25 L9 47' }),
          h('path', { d: 'M55 25 L55 40' }),
          h('path', { d: 'M9 47 L55 47' }),
          h('path', { d: 'M9 25 L24 33' }),
          h('path', { d: 'M55 25 L46 30' })
        ),
        h('circle', { cx: '38', cy: '27', r: '13.2', fill: 'var(--d-panel)' }),
        h('g', { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' },
          h('path', { d: 'M31.5 23 L45 23', strokeWidth: '2.3' }),
          h('path', { d: 'M31.5 27.3 L45.5 27.3', strokeWidth: '2.3' }),
          h('path', { d: 'M31.5 31.6 L41 31.6', strokeWidth: '2.3' }),
          h('circle', { cx: '38', cy: '27', r: '13.2', strokeWidth: '3.6' }),
          h('path', { d: 'M47.4 36.4 L56 45.5', strokeWidth: '5' })
        )
      )
    );
  }

  function Brand({ size = 'md', onClick }) {
    const cls = 'hv-brand hv-brand--' + size + (onClick ? ' hv-brand--link' : '');
    return h('span', { className: cls, role: onClick ? 'button' : undefined, tabIndex: onClick ? 0 : undefined,
      onClick, onKeyDown: onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined },
      h(DecodedMark, { size: size === 'lg' ? 28 : size === 'sm' ? 18 : 22 }),
      h('span', { className: 'hv-brand-word' }, 'DECODED')
    );
  }

  /* ---- Date formatting (locale aware, never invents) ------------------- */
  function fmtDate(iso, locale) {
    if (!iso) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return iso;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    try {
      return d.toLocaleDateString(locale || 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return iso;
    }
  }

  /* ---- Section wrapper ------------------------------------------------- */
  function Section({ num, title, heading, icon, accent, listenable, onListen, listening, children }) {
    return h('section', { className: 'dc-section', style: accent ? { '--accent': accent } : undefined, 'aria-label': heading || title },
      h('div', { className: 'dc-section-head' },
        h('span', { className: 'dc-section-num' }, num),
        h('span', { className: 'dc-section-ico' }, icon),
        h('div', null,
          h('div', { className: 'dc-section-title' }, title),
          heading ? h('div', { className: 'dc-section-h' }, heading) : null
        ),
        listenable ? h('button', {
          className: 'dc-section-listen', 'data-on': listening ? 'true' : 'false',
          onClick: onListen, 'aria-pressed': listening,
          'aria-label': listening ? 'Stop reading this section' : 'Read this section aloud',
        }, listening ? h(I.Square, { size: 15 }) : h(I.Volume2, { size: 16 })) : null
      ),
      h('div', { className: 'dc-section-body' }, children)
    );
  }

  /* ---- Summary + meaning ----------------------------------------------- */
  function SummaryBlock({ summary, meaning, t }) {
    return h(React.Fragment, null,
      h('p', { className: 'dc-summary-lead' }, summary),
      meaning ? h('div', { className: 'dc-meaning' },
        h('div', { className: 'dc-meaning-label' }, h(I.Quote, { size: 13 }), t.meaning),
        h('p', null, meaning)
      ) : null
    );
  }

  /* ---- Deadline -------------------------------------------------------- */
  function DeadlineItem({ d, locale, urgencyLabel, sourceLabel, icsLabel, onIcs }) {
    const date = fmtDate(d.date, locale);
    return h('div', { className: 'dc-dl', 'data-u': d.urgency },
      h('span', { className: 'dc-dl-stripe' }),
      h('div', { className: 'dc-dl-main' },
        h('div', { className: 'dc-dl-top' },
          h('span', { className: 'dc-dl-urg' }, urgencyLabel[d.urgency] || d.urgency),
          h('span', { className: 'dc-dl-label' }, d.label),
          date ? h('span', { className: 'dc-dl-date' }, date) : null
        ),
        d.raw_text ? h('div', { className: 'dc-dl-raw' }, h(I.Quote, { size: 13 }), h('span', null, d.raw_text)) : null,
        d.urgency === 'critical' && d.date ? h('button', { className: 'dc-dl-ics', onClick: () => onIcs(d) },
          h(I.CalendarPlus, { size: 14 }), icsLabel) : null
      )
    );
  }

  /* ---- Action ---------------------------------------------------------- */
  function ActionItem({ a, done, onToggle, locale, byLabel }) {
    const date = fmtDate(a.by, locale);
    return h('div', { className: 'dc-action', 'data-done': done ? 'true' : 'false' },
      h('button', { className: 'dc-check', 'aria-pressed': done, onClick: onToggle,
        'aria-label': done ? 'Mark not done: ' + a.task : 'Mark done: ' + a.task },
        h(I.Check, { size: 15 })
      ),
      h('div', { className: 'dc-action-body' },
        h('div', { className: 'dc-action-task' }, a.task),
        a.why ? h('div', { className: 'dc-action-why' }, a.why) : null,
        date ? h('div', { className: 'dc-action-by' }, h(I.Clock, { size: 12 }), byLabel, ' ', date) : null
      )
    );
  }

  /* ---- Citation chip: opens the real statute. Only ever shows a citation
     the backend grounded in its corpus, so it is always real and checkable. - */
  function Cite({ citation, url }) {
    if (!citation) return null;
    const inner = h(React.Fragment, null,
      h(I.Scale, { size: 12 }), h('span', { className: 'dc-cite-txt' }, citation),
      url ? h(I.ExternalLink, { size: 12 }) : null
    );
    return url
      ? h('a', { className: 'dc-cite', href: url, target: '_blank', rel: 'noreferrer' }, inner)
      : h('span', { className: 'dc-cite dc-cite--static' }, inner);
  }

  /* ---- Right ----------------------------------------------------------- */
  function RightItem({ r, guidanceLabel }) {
    return h('div', { className: 'dc-right' },
      h('span', { className: 'dc-right-ico' }, h(I.ShieldCheck, { size: 19 })),
      h('div', { className: 'dc-right-body' },
        h('div', { className: 'dc-right-statement' }, r.right),
        r.citation
          ? h(Cite, { citation: r.citation, url: r.source_url })
          : (r.basis
              ? h('div', { className: 'dc-right-basis' }, r.basis)
              : h('span', { className: 'dc-right-guidance' }, h(I.Info, { size: 11 }), guidanceLabel))
      )
    );
  }

  /* ---- Scam verdict banner: the headline read on a checked document ----- */
  function ScamVerdict({ scam, labels }) {
    if (!scam || !scam.level) return null;
    const meta = {
      high: { ico: I.ShieldAlert }, medium: { ico: I.TriangleAlert },
      low: { ico: I.ShieldCheck }, none: { ico: I.ShieldCheck },
    }[scam.level] || { ico: I.ShieldCheck };
    const signals = Array.isArray(scam.signals) ? scam.signals : [];
    return h('div', { className: 'dc-verdict', 'data-level': scam.level, role: scam.level === 'high' ? 'alert' : 'note' },
      h('span', { className: 'dc-verdict-ico' }, h(meta.ico, { size: 22 })),
      h('div', { className: 'dc-verdict-body' },
        h('div', { className: 'dc-verdict-head' },
          h('span', { className: 'dc-verdict-label' }, labels[scam.level] || scam.level),
          signals.length ? h('span', { className: 'dc-verdict-signals' },
            signals.map((s, i) => h('span', { key: i, className: 'dc-verdict-sig' }, s))) : null
        ),
        scam.summary ? h('p', { className: 'dc-verdict-summary' }, scam.summary) : null
      )
    );
  }

  /* ---- Law-checked chips: the bodies of law actually used --------------- */
  function LawChecked({ items, label }) {
    if (!items || !items.length) return null;
    return h('div', { className: 'dc-lawchecked' },
      h('span', { className: 'dc-lawchecked-label' }, h(I.Scale, { size: 13 }), label),
      h('div', { className: 'dc-lawchecked-chips' },
        items.map((x, i) => h('span', { key: i, className: 'dc-lawchecked-chip' }, x)))
    );
  }

  /* ---- Violation: a problem with THIS document, grounded in a citation -- */
  function ViolationItem({ v, sevLabel }) {
    return h('div', { className: 'dc-violation', 'data-s': v.severity },
      h('span', { className: 'dc-violation-ico' }, h(I.Gavel, { size: 18 })),
      h('div', { className: 'dc-violation-body' },
        h('div', { className: 'dc-violation-top' },
          h('span', { className: 'dc-violation-name' }, v.issue),
          h('span', { className: 'dc-violation-sev' }, sevLabel[v.severity] || v.severity)
        ),
        v.explanation ? h('div', { className: 'dc-violation-exp' }, v.explanation) : null,
        v.citation ? h(Cite, { citation: v.citation, url: v.source_url }) : null
      )
    );
  }

  /* ---- What happens next: the grounded legal-procedure timeline --------- */
  function ProcedureList({ steps, whatIf, whatIfLabel }) {
    return h(React.Fragment, null,
      h('ol', { className: 'dc-procedure' },
        (steps || []).map((p, i) => h('li', { key: i, className: 'dc-proc-step' },
          h('span', { className: 'dc-proc-num' }, String(i + 1)),
          h('div', { className: 'dc-proc-body' },
            h('div', { className: 'dc-proc-step-title' }, p.step),
            p.detail ? h('div', { className: 'dc-proc-detail' }, p.detail) : null
          )
        ))
      ),
      whatIf ? h('div', { className: 'dc-whatif' },
        h(I.TriangleAlert, { size: 16 }),
        h('div', null, h('b', null, whatIfLabel), ' ', h('span', null, whatIf))
      ) : null
    );
  }

  /* ---- Red flag + all clear -------------------------------------------- */
  function RedFlagItem({ f, sevLabel }) {
    return h('div', { className: 'dc-flag', 'data-s': f.severity },
      h('span', { className: 'dc-flag-ico' }, h(I.TriangleAlert, { size: 17 })),
      h('div', { className: 'dc-flag-body' },
        h('div', { className: 'dc-flag-top' },
          h('span', { className: 'dc-flag-name' }, f.flag),
          h('span', { className: 'dc-flag-sev' }, sevLabel[f.severity] || f.severity)
        ),
        h('div', { className: 'dc-flag-exp' }, f.explanation)
      )
    );
  }

  function AllClear({ title, body }) {
    return h('div', { className: 'dc-allclear' },
      h('span', { className: 'dc-allclear-ico' }, h(I.ShieldCheck, { size: 22 })),
      h('div', null, h('b', null, title), h('p', null, body))
    );
  }

  /* ---- Draft response -------------------------------------------------- */
  function DraftEditor({ value, onChange, tag, copyLabel, copiedLabel }) {
    const [copied, setCopied] = React.useState(false);
    const copy = () => {
      try { navigator.clipboard.writeText(value); } catch (e) {}
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    };
    return h(React.Fragment, null,
      h('div', { className: 'dc-draft-bar' },
        h('span', { className: 'dc-draft-tag' }, tag),
        h('button', { className: 'dc-draft-copy', 'data-done': copied ? 'true' : 'false', onClick: copy },
          copied ? h(I.Check, { size: 14 }) : h(I.Copy, { size: 14 }),
          copied ? copiedLabel : copyLabel
        )
      ),
      h('textarea', { className: 'dc-draft-ta', value: value, onChange: (e) => onChange(e.target.value),
        spellCheck: false, 'aria-label': 'Draft response, editable' })
    );
  }

  /* ---- Uncertainty ----------------------------------------------------- */
  function Uncertainty({ text }) {
    return h('div', { className: 'dc-unc' }, h(I.CircleHelp, { size: 16 }), h('span', null, text));
  }

  /* ---- Get help -------------------------------------------------------- */
  const HELP_ICON = {
    legal_aid: I.Scale, hotline: I.Phone, gov_agency: I.Landmark,
    tenant_union: I.Users, other: I.HelpingHand,
  };
  function linkify(note) {
    const parts = String(note).split(/(\b(?:211\.org|LawHelp\.org)\b)/g);
    return parts.map((p, i) => {
      if (p === '211.org') return h('a', { key: i, href: 'https://www.211.org', target: '_blank', rel: 'noreferrer' }, p);
      if (p === 'LawHelp.org') return h('a', { key: i, href: 'https://www.lawhelp.org', target: '_blank', rel: 'noreferrer' }, p);
      return p;
    });
  }
  function HelpItem({ g, typeLabel }) {
    const Ico = HELP_ICON[g.type] || I.HelpingHand;
    return h('div', { className: 'dc-help' },
      h('span', { className: 'dc-help-ico' }, h(Ico, { size: 18 })),
      h('div', { className: 'dc-help-body' },
        h('div', null,
          h('span', { className: 'dc-help-name' }, g.resource),
          h('span', { className: 'dc-help-type' }, typeLabel[g.type] || g.type)
        ),
        h('div', { className: 'dc-help-note' }, linkify(g.note))
      )
    );
  }

export const DecodedUI = {
  Brand, DecodedMark, Section, SummaryBlock, DeadlineItem, ActionItem,
  RightItem, RedFlagItem, AllClear, DraftEditor, Uncertainty, HelpItem, fmtDate,
  Cite, ScamVerdict, LawChecked, ViolationItem, ProcedureList,
};
