/* eslint-disable @typescript-eslint/no-explicit-any */
// Decoded: the decode-document edge function. Takes an official document (pasted
// text or an image) plus a target language and reading level, and returns strict
// JSON in plain language: what it means, deadlines, your rights, problems with the
// document, a scam check, a draft reply, and where to get real help.
//
// For debt-collection letters it does more than explain. It runs a deterministic
// rules pass over the letter and grounds the model on a curated, cited corpus of
// the Fair Debt Collection Practices Act and Regulation F, so every right and
// every violation it reports carries a real citation a person can open and check.
// It EXPLAINS and CHECKS documents. It does not give legal or medical advice.
//
// Runs on the InsForge Deno runtime; calls the AI gateway (OpenRouter) so the key
// never reaches the browser.
import OpenAI from "npm:openai";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ai(): OpenAI {
  return new OpenAI({
    baseURL: Deno.env.get("AI_BASE_URL") || "https://openrouter.ai/api/v1",
    apiKey: Deno.env.get("OPENROUTER_API_KEY"),
    defaultHeaders: { "HTTP-Referer": "https://decoded.insforge.app", "X-Title": "Decoded" },
  });
}

const MODEL = (): string => Deno.env.get("DECODE_MODEL") || "openai/gpt-4o";

// The cited ground truth. Every citation the model is allowed to use for a debt
// letter comes from this corpus. The model may not invent a citation that is not
// here, so anything that reaches the screen with a citation is real and checkable.
interface Rule {
  id: string;
  topic: string;
  kind: "required_disclosure" | "prohibited_practice" | "consumer_right" | "timeline";
  rule: string;
  citation: string;
  source_url: string;
}

const FDCPA_CORPUS: Rule[] = [
  {
    id: "validation_notice",
    topic: "Validation notice",
    kind: "required_disclosure",
    rule:
      "Within five days of first contacting you, a collector must send a written notice stating the amount of the debt, the name of the creditor you owe, and that you have 30 days to dispute it.",
    citation: "FDCPA 15 U.S.C. 1692g(a); Reg F 12 CFR 1006.34",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692g",
  },
  {
    id: "dispute_pause",
    topic: "Right to dispute and pause collection",
    kind: "consumer_right",
    rule:
      "If you dispute the debt in writing within 30 days, the collector must stop collecting until it mails you written verification of the debt.",
    citation: "FDCPA 15 U.S.C. 1692g(b)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692g",
  },
  {
    id: "call_hours",
    topic: "Calls at inconvenient times",
    kind: "prohibited_practice",
    rule:
      "A collector may not contact you at a time it knows is inconvenient, which is presumed to be before 8 a.m. or after 9 p.m. your local time.",
    citation: "FDCPA 15 U.S.C. 1692c(a)(1)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692c",
  },
  {
    id: "call_frequency",
    topic: "Repeated calls",
    kind: "prohibited_practice",
    rule:
      "A collector is presumed to be harassing you if it calls more than seven times in seven days, or calls again within seven days after speaking with you about the debt.",
    citation: "Reg F 12 CFR 1006.14(b)(2)(i)",
    source_url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1006/subpart-B/section-1006.14",
  },
  {
    id: "cease_communication",
    topic: "Right to stop contact",
    kind: "consumer_right",
    rule:
      "If you tell a collector in writing to stop contacting you, it must stop, except to confirm there will be no more contact or to tell you about a specific legal action.",
    citation: "FDCPA 15 U.S.C. 1692c(c)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692c",
  },
  {
    id: "harassment",
    topic: "Harassment or abuse",
    kind: "prohibited_practice",
    rule:
      "A collector may not harass, oppress, or abuse you, including threats of violence, obscene language, or repeated calls meant to annoy.",
    citation: "FDCPA 15 U.S.C. 1692d",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692d",
  },
  {
    id: "false_threats",
    topic: "False or deceptive threats",
    kind: "prohibited_practice",
    rule:
      "A collector may not use false or misleading statements. It may not falsely threaten arrest, falsely claim to be a lawyer or a government agency, or threaten an action it cannot legally take or does not intend to take.",
    citation: "FDCPA 15 U.S.C. 1692e",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692e",
  },
  {
    id: "unfair_practices",
    topic: "Unfair practices",
    kind: "prohibited_practice",
    rule:
      "A collector may not use unfair means to collect, such as adding amounts the contract or law does not allow, or threatening to deposit a postdated check early to pressure you.",
    citation: "FDCPA 15 U.S.C. 1692f",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692f",
  },
  {
    id: "identify_self",
    topic: "Who the collector is",
    kind: "required_disclosure",
    rule:
      "A collector must identify itself and tell you the communication is from a debt collector trying to collect a debt, and that information will be used for that purpose.",
    citation: "FDCPA 15 U.S.C. 1692e(11)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692e",
  },
];

// A compact, model-facing rendering of the corpus.
function corpusForPrompt(): string {
  return FDCPA_CORPUS.map(
    (r) => `- [${r.id}] ${r.topic} (${r.kind}). ${r.rule} CITATION: "${r.citation}" SOURCE_URL: "${r.source_url}"`,
  ).join("\n");
}

// Deterministic pre-scan. High precision on purpose: only flag what is clearly
// present in the text. These signals are passed to the model and a couple of the
// most serious ones are also guaranteed in the output so the rules engine can
// never be talked out of them by a cautious model.
interface Signal {
  id: string;
  label: string;
  severity: "high" | "medium" | "low";
  detail: string;
}

function scanLetter(text: string): Signal[] {
  const t = (text || "").toLowerCase();
  const out: Signal[] = [];
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  if (has("arrest", "warrant", "jail", "prison", "criminal charges", "have you arrested", "police"))
    out.push({
      id: "arrest_threat",
      label: "Threat of arrest or jail",
      severity: "high",
      detail:
        "The letter appears to threaten arrest, jail, or criminal charges over a debt. Debt collectors cannot do this, and it is a common scam signal.",
    });

  if (has("gift card", "google play", "itunes", "wire transfer", "moneygram", "prepaid card", "bitcoin", "crypto", "cash app", "venmo", "zelle"))
    out.push({
      id: "scam_payment",
      label: "Demand for an untraceable payment method",
      severity: "high",
      detail:
        "The letter asks for payment by gift card, wire, prepaid card, or crypto. Legitimate collectors do not demand these. This is a strong scam signal.",
    });

  if (has("24 hours", "48 hours", "72 hours", "immediately or", "final notice", "act now", "within the hour"))
    out.push({
      id: "false_urgency",
      label: "Artificial urgency",
      severity: "medium",
      detail: "The letter uses a very short deadline to pressure a fast payment. Real rights and timelines are usually longer.",
    });

  if (has("garnish", "lawsuit", "sue you", "seize", "lien") && has("24 hours", "48 hours", "72 hours", "today", "immediately"))
    out.push({
      id: "process_threat",
      label: "Threat of legal action on an impossible timeline",
      severity: "medium",
      detail:
        "The letter threatens garnishment or a lawsuit on a timeline too short to be real. A collector may not threaten action it cannot or does not intend to take.",
    });

  // Possible missing validation notice: a letter that demands money but never
  // mentions the 30-day dispute right or verification.
  const mentionsDebt = has("debt", "balance", "amount due", "owe", "past due", "collection", "outstanding");
  const mentionsValidation = has("30 days", "thirty days", "dispute", "validation", "verify", "verification");
  if (mentionsDebt && !mentionsValidation)
    out.push({
      id: "missing_validation",
      label: "No mention of your right to dispute",
      severity: "medium",
      detail:
        "This letter demands payment but does not mention your 30-day right to dispute or ask for verification. A collector must give you that notice within five days.",
    });

  return out;
}

const SYSTEM = `You are Decoded, a document explainer and checker. You translate confusing official documents into plain language for a stressed person who is NOT a lawyer or a doctor, and when the document is a debt-collection letter you also check it against the law you are given.

You receive a document (as text or an image), a target reading level, a target language, and sometimes a RIGHTS CORPUS and DETECTED SIGNALS.

Write EVERY output field in the target language, at the target reading level. Use short sentences. If a legal term is unavoidable, define it inline. Be calm, warm, and direct. Use "you" and "your". Reduce panic and increase the reader's sense of agency.

HARD RULES (non-negotiable):
1. You are NOT a lawyer or doctor and you do not give legal or medical advice. You EXPLAIN what a document says, CHECK it against any rules you are given, and lay out general options.
2. NEVER invent facts, dates, statute numbers, case numbers, dollar amounts, or rights. If something is not in the document, leave the field null or empty, or list it under "uncertainties". A fabricated right or citation is the worst possible failure.
3. CITATIONS: you may ONLY use a "citation" and "source_url" by copying them VERBATIM from a RIGHTS CORPUS entry you were given. If no corpus entry supports a statement, set citation and source_url to null. Never write a citation that is not in the corpus.
4. If text is unreadable or ambiguous, say so in "uncertainties". Do not fill gaps with plausible guesses.
5. "violations" are concrete problems with THIS document measured against the corpus: a missing required disclosure, a prohibited practice, or an unlawful threat. Each must map to a corpus citation. Do not list a violation you cannot ground in the corpus; describe softer concerns in "red_flags" instead.
6. "scam_risk" judges whether this looks like a scam or predatory letter. Weigh the DETECTED SIGNALS and the document. Untraceable payment demands, arrest threats, and no way to verify the debt all raise it.
7. "draft_response" is a courteous, firm, factual reply the reader could send. For a debt letter, default to a written request to verify the debt and to communicate only in writing. Use [BRACKETS] for anything the user must fill in. Never admit fault or liability.
8. "get_help" names REAL categories of help only (legal aid, the CFPB, a state attorney general, 211). Do not invent phone numbers or URLs.

Return ONLY a JSON object with EXACTLY these fields:
{
  "document_type": "string",
  "is_debt_collection": true,
  "confidence": "high | medium | low",
  "language": "string (BCP-47 of the output, e.g. en, es)",
  "reading_level": "string (echoes the requested level)",
  "summary": "string (2 to 3 plain sentences: what this document is)",
  "meaning_for_you": "string (direct second person: what it means for the reader)",
  "law_checked": [ "string (name a body of law from the corpus you actually used, e.g. Fair Debt Collection Practices Act (15 U.S.C. 1692))" ],
  "deadlines": [ { "label": "string", "date": "string|null", "raw_text": "string", "urgency": "critical | soon | info" } ],
  "actions": [ { "task": "string", "why": "string", "by": "string|null" } ],
  "rights": [ { "right": "string", "basis": "string|null", "citation": "string|null", "source_url": "string|null" } ],
  "violations": [ { "issue": "string", "citation": "string|null", "source_url": "string|null", "severity": "high | medium | low", "explanation": "string" } ],
  "scam_risk": { "level": "high | medium | low | none", "signals": [ "string" ], "summary": "string" },
  "red_flags": [ { "flag": "string", "severity": "high | medium | low", "explanation": "string" } ],
  "draft_response": "string",
  "uncertainties": [ "string" ],
  "get_help": [ { "resource": "string", "type": "legal_aid | hotline | gov_agency | tenant_union | cfpb | other", "note": "string" } ]
}
Set "is_debt_collection" to false when the document is not a debt-collection letter; in that case "law_checked" and "violations" may be empty and "rights" carry null citations. Every array may be empty. Empty means none were found, which is valid. Output JSON only, with no prose outside the JSON.`;

function extractJson(text: string): string {
  const t = (text ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  return s !== -1 && e > s ? t.slice(s, e + 1) : t;
}

interface DecodeBody {
  text?: string;
  imageUrl?: string; // a data: URL or https URL of the document image
  readingLevel?: string; // "grade5" | "grade8" | "plain"
  language?: string; // BCP-47, default "en"
}

// Guarantee the most serious deterministic findings survive into the output, even
// if the model was too cautious to include them.
function reconcile(result: any, signals: Signal[]): any {
  const r = result ?? {};
  const sev = (r.scam_risk?.level ?? "none") as string;
  const order: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3 };
  const highSignal = signals.some((s) => s.severity === "high");
  if (highSignal) {
    r.scam_risk = r.scam_risk ?? { level: "none", signals: [], summary: "" };
    if ((order[r.scam_risk.level] ?? 0) < order["high"]) r.scam_risk.level = "high";
    const have = new Set((r.scam_risk.signals ?? []).map((x: string) => x.toLowerCase()));
    for (const s of signals.filter((x) => x.severity === "high")) {
      if (![...have].some((h) => h.includes(s.label.toLowerCase().slice(0, 12)))) {
        r.scam_risk.signals = [...(r.scam_risk.signals ?? []), s.label];
      }
    }
    if (!r.scam_risk.summary) r.scam_risk.summary = "Several strong scam signals are present in this letter. Be very careful.";
  } else if (sev === undefined) {
    r.scam_risk = { level: "none", signals: [], summary: "" };
  }
  return r;
}

async function decode(body: DecodeBody): Promise<unknown> {
  const language = body.language || "en";
  const readingLevel = body.readingLevel || "grade8";
  const signals = scanLetter(body.text || "");
  const signalBlock = signals.length
    ? `\n\nDETECTED SIGNALS (a deterministic pre-scan found these in the letter; verify each against the document and incorporate the real ones):\n` +
      signals.map((s) => `- ${s.label} [${s.severity}]: ${s.detail}`).join("\n")
    : "";

  const preamble =
    `Target language: ${language}. Target reading level: ${readingLevel}.\n\n` +
    `RIGHTS CORPUS (the only citations you may use; copy citation and source_url verbatim):\n${corpusForPrompt()}` +
    signalBlock +
    `\n\nRead the document carefully and return the JSON object.`;

  let content: any;
  if (body.imageUrl) {
    content = [
      { type: "text", text: preamble },
      { type: "image_url", image_url: { url: body.imageUrl } },
    ];
  } else {
    content = `${preamble}\n\nDOCUMENT:\n${(body.text || "").slice(0, 16000)}`;
  }

  const client = ai();
  const run = (extra = "") =>
    client.chat.completions.create({
      model: MODEL(),
      messages: [
        { role: "system", content: SYSTEM + extra },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 3000,
    });

  let parsed: any;
  try {
    const c = await run();
    parsed = JSON.parse(extractJson(c.choices?.[0]?.message?.content ?? ""));
  } catch {
    const c = await run("\n\nReturn ONLY valid minified JSON matching the schema. No prose, no code fences.");
    parsed = JSON.parse(extractJson(c.choices?.[0]?.message?.content ?? ""));
  }
  return reconcile(parsed, signals);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  try {
    const body = (await req.json()) as DecodeBody;
    if (!body.text && !body.imageUrl) return json({ ok: false, error: "Provide text or imageUrl" }, 400);
    const result = await decode(body);
    return json({ ok: true, result });
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message ?? e) }, 500);
  }
}
