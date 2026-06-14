/* =========================================================================
   Decoded - extra: ResultActions.
   A calm, on-brand row of three useful actions for the result screen:
   Copy summary, Print or save as PDF, and Share. Self-contained: it reads
   the decode result and renders plain-text export + share affordances that
   match the existing dc-ghostbtn secondary button look (terracotta on hover,
   sage "Copied" confirmation), built with the same h() and design tokens as
   the rest of the app. No CSS file is touched; the button look is rebuilt
   inline against the same var(--d-*) / var(--brand) / var(--radius-*) tokens,
   with hover and pressed states driven from local state. No em-dashes.
   ========================================================================= */
import React from 'react';
import { DecodedIcons as I } from '../icons.jsx';
const h = React.createElement;
const { useState, useRef, useCallback } = React;

/* ---- Plain-text summary builder -------------------------------------- */
/* Turns the structured decode result into a clean, readable plain-text block:
   the document type and what it means, the deadlines, the problems/violations,
   and the rights. Skips any section that is empty so the output never invents
   content the model did not return. */
function buildSummary(r) {
  if (!r) return '';
  const lines = [];
  const rule = '----------------------------------------';

  if (r.document_type) lines.push('DECODED: ' + r.document_type);
  lines.push(rule);

  if (r.summary) { lines.push('WHAT THIS IS'); lines.push(r.summary); lines.push(''); }
  if (r.meaning_for_you) { lines.push('WHAT IT MEANS FOR YOU'); lines.push(r.meaning_for_you); lines.push(''); }

  const deadlines = Array.isArray(r.deadlines) ? r.deadlines : [];
  if (deadlines.length) {
    lines.push('DEADLINES');
    deadlines.forEach((d) => {
      const when = d && d.date ? ' (by ' + d.date + ')' : '';
      lines.push('- ' + ((d && d.label) || '') + when);
    });
    lines.push('');
  }

  const violations = Array.isArray(r.violations) ? r.violations : [];
  if (violations.length) {
    lines.push('PROBLEMS WITH THIS LETTER');
    violations.forEach((v) => {
      lines.push('- ' + ((v && v.issue) || ''));
      if (v && v.explanation) lines.push('  ' + v.explanation);
      if (v && v.citation) lines.push('  Checked against: ' + v.citation);
    });
    lines.push('');
  }

  const rights = Array.isArray(r.rights) ? r.rights : [];
  if (rights.length) {
    lines.push('YOUR RIGHTS');
    rights.forEach((x) => {
      lines.push('- ' + ((x && x.right) || ''));
      if (x && x.citation) lines.push('  Checked against: ' + x.citation);
    });
    lines.push('');
  }

  lines.push(rule);
  lines.push('Decoded explains documents in plain language. It is not legal or medical advice.');

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* ---- Clipboard with a hidden-textarea fallback ----------------------- */
async function copyText(text, fallbackEl) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* fall through to the textarea path */ }
  try {
    const el = fallbackEl;
    if (!el) return false;
    el.value = text;
    el.removeAttribute('aria-hidden');
    el.focus();
    el.select();
    el.setSelectionRange(0, text.length);
    const ok = document.execCommand && document.execCommand('copy');
    el.setAttribute('aria-hidden', 'true');
    el.blur();
    return !!ok;
  } catch (e) { return false; }
}

/* ---- One action button, styled to match dc-ghostbtn ------------------ */
/* Rebuilds the secondary-button look inline (same tokens as the CSS class)
   because this file may not touch the stylesheet. Hover and pressed states
   come from local state; the "done" variant goes sage to echo dc-draft-copy
   [data-done='true']. */
function ActionButton({ icon, label, onClick, done, ariaLabel }) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);

  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    height: '44px', padding: '0 18px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--d-line-2)',
    background: 'var(--raise)',
    color: 'var(--d-dim)',
    fontFamily: 'var(--d-sans)', fontSize: '0.92rem', fontWeight: 'var(--weight-semibold)',
    letterSpacing: '0.01em', cursor: 'pointer',
    transition: 'color var(--dur-base) ease, border-color var(--dur-base) ease, transform var(--dur-fast) ease, background var(--dur-base) ease',
    transform: press ? 'translateY(1px)' : 'none',
    WebkitTapHighlightColor: 'transparent',
  };
  const hovered = hover ? {
    color: 'var(--d-text)',
    borderColor: 'color-mix(in srgb, var(--d-amber) 32%, var(--d-line-2))',
  } : null;
  const confirmed = done ? {
    color: 'var(--d-grn)',
    borderColor: 'color-mix(in srgb, var(--d-grn) 40%, transparent)',
    background: 'color-mix(in srgb, var(--d-grn) 8%, var(--raise))',
  } : null;

  return h('button', {
    type: 'button',
    style: Object.assign({}, base, hovered, confirmed),
    onClick,
    'aria-label': ariaLabel || label,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => { setHover(false); setPress(false); },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    onBlur: () => setPress(false),
  }, icon, h('span', null, label));
}

/* ===================================================================== */
/* Props:
     result    the decode result object (the same `r` the result screen renders)
     onShared  optional callback fired after a successful share or share-copy */
function ResultActions({ result, onShared }) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const taRef = useRef(null);
  const timers = useRef({});

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const flash = useCallback((set, key) => {
    set(true);
    if (timers.current[key]) window.clearTimeout(timers.current[key]);
    timers.current[key] = window.setTimeout(() => set(false), 1500);
  }, []);

  const onCopy = useCallback(async () => {
    const text = buildSummary(result);
    if (!text) return;
    const ok = await copyText(text, taRef.current);
    if (ok) flash(setCopied, 'copy');
  }, [result, flash]);

  const onPrint = useCallback(() => {
    try { window.print(); } catch (e) { /* no-op: print dialog unavailable */ }
  }, []);

  const onShare = useCallback(async () => {
    const text = buildSummary(result);
    if (!text) return;
    if (canShare) {
      try {
        await navigator.share({
          title: 'Decoded' + (result && result.document_type ? ': ' + result.document_type : ''),
          text,
        });
        if (typeof onShared === 'function') onShared();
        return;
      } catch (e) { /* user dismissed, or share failed: fall back to copy */ }
    }
    const ok = await copyText(text, taRef.current);
    if (ok) {
      flash(setShared, 'share');
      if (typeof onShared === 'function') onShared();
    }
  }, [result, canShare, onShared, flash]);

  return h('div', {
    className: 'dc-result-extra-actions',
    role: 'group',
    'aria-label': 'Save and share this explanation',
    style: {
      marginTop: '20px',
      paddingTop: '20px',
      borderTop: '1px solid var(--d-line)',
      display: 'flex', flexWrap: 'wrap',
      alignItems: 'center', justifyContent: 'center',
      gap: '10px',
    },
  },
    h(ActionButton, {
      icon: copied ? h(I.Check, { size: 16 }) : h(I.Copy, { size: 16 }),
      label: copied ? 'Copied' : 'Copy summary',
      ariaLabel: 'Copy a plain-text summary of this explanation',
      onClick: onCopy,
      done: copied,
    }),
    h(ActionButton, {
      icon: h(I.Printer, { size: 16 }),
      label: 'Print or save as PDF',
      ariaLabel: 'Open the print dialog to print or save as PDF',
      onClick: onPrint,
    }),
    h(ActionButton, {
      icon: shared
        ? h(I.Check, { size: 16 })
        : h(canShare ? I.ExternalLink : I.Copy, { size: 16 }),
      label: shared ? 'Copied' : (canShare ? 'Share' : 'Copy to share'),
      ariaLabel: canShare ? 'Share this explanation' : 'Copy this explanation to share',
      onClick: onShare,
      done: shared,
    }),
    /* hidden textarea: the clipboard fallback when navigator.clipboard is
       unavailable (older or insecure-context browsers). */
    h('textarea', {
      ref: taRef,
      readOnly: true,
      tabIndex: -1,
      'aria-hidden': 'true',
      style: {
        position: 'absolute', width: '1px', height: '1px',
        padding: 0, margin: '-1px', border: 0,
        clip: 'rect(0 0 0 0)', overflow: 'hidden',
        opacity: 0, pointerEvents: 'none',
      },
    })
  );
}

export { ResultActions };
export default ResultActions;
