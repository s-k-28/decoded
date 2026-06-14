// Calls the Decoded edge function (public, runs on InsForge, holds the AI key
// server-side). Plain fetch, no auth needed.

const FN_URL = 'https://dgsx9pmv.functions.insforge.app/decode-document';

export interface Deadline { label: string; date: string | null; raw_text: string; urgency: 'critical' | 'soon' | 'info'; }
export interface Action { task: string; why: string; by: string | null; }
export interface Right { right: string; basis: string | null; }
export interface RedFlag { flag: string; severity: 'high' | 'medium' | 'low'; explanation: string; }
export interface GetHelp { resource: string; type: string; note: string; }

export interface DecodeResult {
  document_type: string;
  confidence: 'high' | 'medium' | 'low';
  language: string;
  reading_level: string;
  summary: string;
  meaning_for_you: string;
  deadlines: Deadline[];
  actions: Action[];
  rights: Right[];
  red_flags: RedFlag[];
  draft_response: string;
  uncertainties: string[];
  get_help: GetHelp[];
}

export interface DecodeInput {
  text?: string;
  imageUrl?: string;
  readingLevel: string;
  language: string;
}

export async function decode(input: DecodeInput): Promise<DecodeResult> {
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `Could not read the document (status ${res.status}). Please try again.`);
  }
  return data.result as DecodeResult;
}
