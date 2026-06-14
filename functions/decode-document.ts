/* eslint-disable @typescript-eslint/no-explicit-any */
// Decoded: the decode-document edge function. Takes an official document (pasted
// text or an image) plus a target language and reading level, and returns strict
// JSON in plain language: what it means, deadlines, your rights, problems with the
// document, a scam check, a draft reply, and where to get real help.
//
// For the two flagship verticals it does more than explain. It classifies the
// document, runs a deterministic rules pass over it, and grounds the model on a
// curated, cited corpus of the actual law:
//   - debt-collection letters    -> Fair Debt Collection Practices Act + Reg F
//   - medical bills and denials  -> No Surprises Act + ACA appeal rights
// The model may only cite by copying from the corpus it is given, so every right
// and violation on screen carries a real citation a person can open and check.
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

// ----- The cited ground truth ---------------------------------------------
// Every citation the model is allowed to use comes from one of these corpora.
// The model may not invent a citation that is not here, so anything that reaches
// the screen with a citation is real and checkable.
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
    id: "contact_at_work",
    topic: "Contact at your workplace",
    kind: "prohibited_practice",
    rule: "A collector may not contact you at work if it knows your employer does not allow such calls.",
    citation: "FDCPA 15 U.S.C. 1692c(a)(3)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692c",
  },
  {
    id: "represented_by_attorney",
    topic: "If you have a lawyer",
    kind: "consumer_right",
    rule: "If a collector knows you are represented by a lawyer for this debt, it must contact your lawyer, not you.",
    citation: "FDCPA 15 U.S.C. 1692c(a)(2)",
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
      "A collector must identify itself and tell you the communication is from a debt collector trying to collect a debt, and that any information will be used for that purpose.",
    citation: "FDCPA 15 U.S.C. 1692e(11)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692e",
  },
];

const MEDICAL_CORPUS: Rule[] = [
  {
    id: "nsa_emergency",
    topic: "Surprise bills for emergency care",
    kind: "consumer_right",
    rule:
      "For emergency care you cannot be billed more than your in-network cost-sharing, even if the hospital or provider is out of network. Balance billing for emergency services is banned.",
    citation: "No Surprises Act, 42 U.S.C. 300gg-111",
    source_url: "https://www.cms.gov/newsroom/fact-sheets/no-surprises-understand-your-rights-against-surprise-medical-bills",
  },
  {
    id: "nsa_in_network_facility",
    topic: "Out-of-network providers at an in-network hospital",
    kind: "consumer_right",
    rule:
      "If you are treated at an in-network hospital or facility, out-of-network providers there, such as an anesthesiologist or radiologist, generally cannot bill you beyond your in-network cost-sharing.",
    citation: "No Surprises Act, 42 U.S.C. 300gg-111",
    source_url: "https://www.cms.gov/newsroom/fact-sheets/no-surprises-understand-your-rights-against-surprise-medical-bills",
  },
  {
    id: "nsa_air_ambulance",
    topic: "Air ambulance bills",
    kind: "consumer_right",
    rule:
      "An out-of-network air ambulance cannot bill you beyond your in-network cost-sharing. Note this protection does not cover ground ambulances.",
    citation: "No Surprises Act, 42 U.S.C. 300gg-112",
    source_url: "https://www.cms.gov/newsroom/fact-sheets/no-surprises-understand-your-rights-against-surprise-medical-bills",
  },
  {
    id: "aca_internal_appeal",
    topic: "Right to appeal a denial",
    kind: "timeline",
    rule:
      "If your health plan denies a claim, you have at least 180 days from the date of the denial notice to file an internal appeal with the insurer.",
    citation: "ACA appeal rights, 45 CFR 147.136",
    source_url: "https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/",
  },
  {
    id: "aca_external_review",
    topic: "Independent external review",
    kind: "consumer_right",
    rule:
      "If the insurer still denies after your internal appeal, you can ask for an independent external review, generally within four months, and that decision is binding on the insurer.",
    citation: "ACA external review, 45 CFR 147.136",
    source_url: "https://www.healthcare.gov/appeal-insurance-company-decision/external-review/",
  },
  {
    id: "aca_notice_content",
    topic: "What a denial must tell you",
    kind: "required_disclosure",
    rule:
      "A denial notice must give the specific reason for the denial and describe how to appeal it, including your right to an external review.",
    citation: "ACA claims and appeals rule, 45 CFR 147.136(b)",
    source_url: "https://www.ecfr.gov/current/title-45/section-147.136",
  },
];

type Vertical = "debt" | "medical" | "other";

function classify(text: string): Vertical {
  const t = (text || "").toLowerCase();
  const count = (terms: string[]) => terms.reduce((n, w) => (t.includes(w) ? n + 1 : n), 0);
  const debt = count([
    "debt collector",
    "collect a debt",
    "collection agency",
    "this is an attempt to collect",
    "creditor",
    "validation",
    "past due",
    "amount owed",
    "outstanding balance",
    "this communication is from a debt collector",
  ]);
  const medical = count([
    "explanation of benefits",
    "eob",
    "deductible",
    "coinsurance",
    "copay",
    "in-network",
    "out-of-network",
    "insurer",
    "health plan",
    "date of service",
    "prior authorization",
    "medically necessary",
    "patient responsibility",
    "your claim",
    "claim was denied",
    "denied",
  ]);
  if (debt > 0 && debt >= medical) return "debt";
  if (medical > 0) return "medical";
  return "other";
}

function corpusFor(v: Vertical): Rule[] {
  if (v === "debt") return FDCPA_CORPUS;
  if (v === "medical") return MEDICAL_CORPUS;
  return [];
}

function corpusForPrompt(rules: Rule[]): string {
  return rules
    .map((r) => `- [${r.id}] ${r.topic} (${r.kind}). ${r.rule} CITATION: "${r.citation}" SOURCE_URL: "${r.source_url}"`)
    .join("\n");
}

// ----- Deterministic pre-scan ---------------------------------------------
// High precision on purpose: only flag what is clearly present. Universal scam
// signals run on any letter; FDCPA-specific checks run only on debt letters
// (the validation-notice duty applies to third-party collectors, not to a
// hospital billing you directly).
interface Signal {
  id: string;
  label: string;
  severity: "high" | "medium" | "low";
  detail: string;
}

function scanUniversal(text: string): Signal[] {
  const t = (text || "").toLowerCase();
  const out: Signal[] = [];
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  if (has("arrest", "warrant", "jail", "prison", "criminal charges", "have you arrested", "police"))
    out.push({
      id: "arrest_threat",
      label: "Threat of arrest or jail",
      severity: "high",
      detail:
        "The letter appears to threaten arrest, jail, or criminal charges over a bill or debt. This cannot happen over a private debt, and it is a common scam signal.",
    });

  if (has("gift card", "google play", "itunes", "wire transfer", "moneygram", "prepaid card", "bitcoin", "crypto", "cash app", "venmo", "zelle"))
    out.push({
      id: "scam_payment",
      label: "Demand for an untraceable payment method",
      severity: "high",
      detail:
        "The letter asks for payment by gift card, wire, prepaid card, or crypto. Legitimate billers and collectors do not demand these. This is a strong scam signal.",
    });

  if (has("social security number", "ssn", "your password", "bank login", "pin number", "mother's maiden"))
    out.push({
      id: "identity_request",
      label: "Request for sensitive personal information",
      severity: "high",
      detail:
        "The letter asks for a Social Security number, password, or bank login. A real biller does not need these by reply, and this is a phishing signal.",
    });

  if (has("24 hours", "48 hours", "72 hours", "immediately or", "final notice", "act now", "within the hour"))
    out.push({
      id: "false_urgency",
      label: "Artificial urgency",
      severity: "medium",
      detail: "The letter uses a very short deadline to pressure a fast payment. Real rights and timelines are usually longer.",
    });

  return out;
}

function scanDebt(text: string): Signal[] {
  const t = (text || "").toLowerCase();
  const out: Signal[] = [];
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  if (has("garnish", "lawsuit", "sue you", "seize", "lien") && has("24 hours", "48 hours", "72 hours", "today", "immediately"))
    out.push({
      id: "process_threat",
      label: "Threat of legal action on an impossible timeline",
      severity: "medium",
      detail:
        "The letter threatens garnishment or a lawsuit on a timeline too short to be real. A collector may not threaten action it cannot or does not intend to take.",
    });

  const mentionsValidation = has("30 days", "thirty days", "dispute", "validation", "verify", "verification");
  if (!mentionsValidation)
    out.push({
      id: "missing_validation",
      label: "No mention of your right to dispute",
      severity: "medium",
      detail:
        "This letter demands payment but does not mention your 30-day right to dispute or to ask for verification. A collector must give you that notice within five days.",
    });

  return out;
}

function scanLetter(text: string, v: Vertical): Signal[] {
  const sig = scanUniversal(text);
  if (v === "debt") sig.push(...scanDebt(text));
  return sig;
}

const SYSTEM = `You are Decoded, a document explainer and checker. You translate confusing official documents into plain language for a stressed person who is NOT a lawyer or a doctor, and when you are given a RIGHTS CORPUS you also check the document against that law.

You receive a document (as text or an image), a target reading level, a target language, and sometimes a RIGHTS CORPUS and DETECTED SIGNALS. A document may be a debt-collection letter, a medical bill or insurance denial, or something else.

Write EVERY output field in the target language, at the target reading level. Use short sentences. If a legal or medical term is unavoidable, define it inline. Be calm, warm, and direct. Use "you" and "your". Reduce panic and increase the reader's sense of agency.

HARD RULES (non-negotiable):
1. You are NOT a lawyer or doctor and you do not give legal or medical advice. You EXPLAIN what a document says, CHECK it against any rules you are given, and lay out general options.
2. NEVER invent facts, dates, statute numbers, case numbers, dollar amounts, or rights. If something is not in the document, leave the field null or empty, or list it under "uncertainties". A fabricated right or citation is the worst possible failure.
3. CITATIONS: you may ONLY use a "citation" and "source_url" by copying them VERBATIM from a RIGHTS CORPUS entry you were given. If no corpus entry supports a statement, set citation and source_url to null. Never write a citation that is not in the corpus.
4. If text is unreadable or ambiguous, say so in "uncertainties". Do not fill gaps with plausible guesses.
5. "violations" are concrete problems with THIS document measured against the corpus: a missing required disclosure, a prohibited practice, an unlawful threat, or a bill the law says you should not owe. Each must map to a corpus citation. Do not list a violation you cannot ground in the corpus; describe softer concerns in "red_flags" instead.
6. "scam_risk" judges whether this looks like a scam or predatory letter. Weigh the DETECTED SIGNALS and the document. Untraceable payment demands, arrest threats, and requests for sensitive personal information all raise it. A normal bill from a real provider is usually low or none.
7. "draft_response" is a courteous, firm, factual reply the reader could send. For a debt letter, default to a written request to verify the debt. For a denied medical claim, default to a request to start an internal appeal. Use [BRACKETS] for anything the user must fill in. Never admit fault or liability.
8. "get_help" names REAL categories of help only (legal aid, the CFPB, a state attorney general, a state insurance regulator, 211). Do not invent phone numbers or URLs.

Return ONLY a JSON object with EXACTLY these fields:
{
  "document_type": "string",
  "is_debt_collection": true,
  "confidence": "high | medium | low",
  "language": "string (BCP-47 of the output, e.g. en, es)",
  "reading_level": "string (echoes the requested level)",
  "summary": "string (2 to 3 plain sentences: what this document is)",
  "meaning_for_you": "string (direct second person: what it means for the reader)",
  "law_checked": [ "string (name a body of law from the corpus you actually used, e.g. Fair Debt Collection Practices Act (15 U.S.C. 1692), or No Surprises Act)" ],
  "deadlines": [ { "label": "string", "date": "string|null", "raw_text": "string", "urgency": "critical | soon | info" } ],
  "actions": [ { "task": "string", "why": "string", "by": "string|null" } ],
  "rights": [ { "right": "string", "basis": "string|null", "citation": "string|null", "source_url": "string|null" } ],
  "violations": [ { "issue": "string", "citation": "string|null", "source_url": "string|null", "severity": "high | medium | low", "explanation": "string" } ],
  "scam_risk": { "level": "high | medium | low | none", "signals": [ "string" ], "summary": "string" },
  "red_flags": [ { "flag": "string", "severity": "high | medium | low", "explanation": "string" } ],
  "draft_response": "string",
  "uncertainties": [ "string" ],
  "get_help": [ { "resource": "string", "type": "legal_aid | hotline | gov_agency | tenant_union | cfpb | insurance_regulator | other", "note": "string" } ]
}
Set "is_debt_collection" to true only for a debt-collection letter; otherwise false. When you were given no corpus, "law_checked" and "violations" may be empty and "rights" carry null citations. Every array may be empty. Empty means none were found, which is valid. Output JSON only, with no prose outside the JSON.`;

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

// Reconcile the model output with the deterministic findings: force the most
// serious signals to survive, keep a real bill from reading as a scam, and drop
// any violation the model failed to ground in a citation.
function reconcile(result: any, signals: Signal[], vertical: Vertical): any {
  const r = result ?? {};
  const order: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3 };
  const highSignal = signals.some((s) => s.severity === "high");
  r.scam_risk = r.scam_risk ?? { level: "none", signals: [], summary: "" };

  if (highSignal) {
    if ((order[r.scam_risk.level] ?? 0) < order["high"]) r.scam_risk.level = "high";
    const have = new Set((r.scam_risk.signals ?? []).map((x: string) => String(x).toLowerCase()));
    for (const s of signals.filter((x) => x.severity === "high")) {
      if (![...have].some((h) => h.includes(s.label.toLowerCase().slice(0, 12)))) {
        r.scam_risk.signals = [...(r.scam_risk.signals ?? []), s.label];
      }
    }
    if (!r.scam_risk.summary) r.scam_risk.summary = "Several strong scam signals are present in this letter. Be very careful.";
  } else if (vertical === "medical") {
    // A bill from a real provider is rarely a scam. An unlawful charge is a
    // violation (cited to the law), not a scam banner.
    if ((order[r.scam_risk.level] ?? 0) > order["low"]) {
      r.scam_risk.level = "low";
      r.scam_risk.signals = [];
    }
  }

  // No citation, no claim: a violation that is not grounded in the corpus does
  // not belong in the violations list.
  if (Array.isArray(r.violations)) r.violations = r.violations.filter((v: any) => v && v.citation);
  return r;
}

async function decode(body: DecodeBody): Promise<unknown> {
  const language = body.language || "en";
  const readingLevel = body.readingLevel || "grade8";

  // Classification needs the text; for an image we let the model classify and
  // pass both corpora so it can pick. Text path is precise.
  const vertical = body.text ? classify(body.text) : "other";
  const rules = body.imageUrl ? [...FDCPA_CORPUS, ...MEDICAL_CORPUS] : corpusFor(vertical);
  const signals = body.text ? scanLetter(body.text, vertical) : [];

  const corpusBlock = rules.length
    ? `RIGHTS CORPUS (the only citations you may use; copy citation and source_url verbatim, and pick the entries that fit this document):\n${corpusForPrompt(rules)}\n\n`
    : "";
  const signalBlock = signals.length
    ? `DETECTED SIGNALS (a deterministic pre-scan found these; verify each against the document and incorporate the real ones):\n` +
      signals.map((s) => `- ${s.label} [${s.severity}]: ${s.detail}`).join("\n") +
      `\n\n`
    : "";

  const preamble =
    `Target language: ${language}. Target reading level: ${readingLevel}.\n\n` +
    corpusBlock +
    signalBlock +
    `Read the document carefully and return the JSON object.`;

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
  return reconcile(parsed, signals, vertical);
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
