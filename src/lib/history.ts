import type { DecodeResult } from './decode';

// Saved history, stored on the device with localStorage. Sensitive documents
// never leave the user's device, which is both a privacy guarantee and the
// simplest reliable store. Capped so it cannot grow without bound.

export interface HistoryItem {
  id: string;
  savedAt: number;
  documentType: string;
  language: string;
  readingLevel: string;
  preview: string;
  inputKind: 'text' | 'image';
  result: DecodeResult;
}

const KEY = 'decoded.history.v1';
const MAX = 20;

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(result: DecodeResult, inputKind: 'text' | 'image'): HistoryItem {
  const item: HistoryItem = {
    id: `${Date.now()}`,
    savedAt: Date.now(),
    documentType: result.document_type,
    language: result.language,
    readingLevel: result.reading_level,
    preview: (result.summary || '').slice(0, 110),
    inputKind,
    result,
  };
  const existing = loadHistory().filter((h) => h.preview !== item.preview);
  const list = [item, ...existing].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage is full or unavailable; history is best-effort.
  }
  return item;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
