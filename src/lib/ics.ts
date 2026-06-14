import type { Deadline } from './decode';

// Generate a calendar reminder (.ics) for a deadline so the user does not miss
// it. Prefer an explicit date, otherwise compute one from a relative phrase like
// "3 days" or "30 days" in the document, otherwise fall back to a few days out so
// the reminder is never empty. A one-day-before alarm is included.

function reminderDate(d: Deadline): { date: Date; estimated: boolean } {
  if (d.date) {
    const parsed = new Date(d.date);
    if (!Number.isNaN(parsed.getTime())) return { date: parsed, estimated: false };
  }
  const text = `${d.label} ${d.raw_text}`.toLowerCase();
  const match = text.match(/(\d+)\s*(business day|day|week|month)/);
  const date = new Date();
  if (match) {
    const n = parseInt(match[1], 10);
    const unit = match[2];
    const days = unit.includes('week') ? n * 7 : unit.includes('month') ? n * 30 : n;
    date.setDate(date.getDate() + days);
    return { date, estimated: true };
  }
  date.setDate(date.getDate() + 3);
  return { date, estimated: true };
}

function asDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function downloadReminder(d: Deadline, documentType: string): void {
  const { date, estimated } = reminderDate(d);
  const start = asDate(date);
  const end = asDate(new Date(date.getTime() + 86400000));
  const stamp = `${asDate(new Date())}T090000Z`;
  const title = `Reminder: ${d.label}`;
  const description =
    `From your ${documentType}. The document said: "${d.raw_text}".` +
    (estimated ? ' This date is an estimate, so please check the original document.' : '') +
    ' Created by Decoded.';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Decoded//Reminder//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:decoded-${Date.now()}@decoded.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'decoded-reminder.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
