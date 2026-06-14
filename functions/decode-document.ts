/* eslint-disable @typescript-eslint/no-explicit-any */
// Decoded: the decode-document edge function. Takes an official document (pasted
// text or an image) plus a target language and reading level, and returns strict
// JSON: a plain-language summary, what it means for you, deadlines, actions, your
// rights, red flags, a draft response, and where to get real help. It EXPLAINS
// documents. It does not give legal or medical advice. Runs on the InsForge Deno
// runtime; calls the AI gateway (OpenRouter) so the key never reaches the browser.
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

const SYSTEM = `You are Decoded, a document explainer. You translate confusing official documents into plain language for a stressed person who is NOT a lawyer or a doctor.

You receive a document (as text or an image) plus a target reading level and a target language.

Write EVERY output field in the target language, at the target reading level. Use short sentences. If a legal or medical term is unavoidable, define it inline. Be calm, warm, and direct. Use "you" and "your". Reduce panic and increase the reader's sense of agency.

HARD RULES (non-negotiable):
1. You are NOT a lawyer or doctor and you do not give legal or medical advice. You EXPLAIN what a document says and lay out general options.
2. NEVER invent facts, dates, statute numbers, case numbers, dollar amounts, or rights. If something is not in the document, leave the field null or empty, or list it under "uncertainties". A fabricated right or citation is the worst possible failure.
3. For "rights": only state rights that are written in the document, or that are broadly established and uncontroversial for this document type. Set "basis" to null rather than guessing a law.
4. If text is unreadable or ambiguous, say so in "uncertainties". Do not fill gaps with plausible guesses.
5. "red_flags" are predatory, illegal, or scam signals: demands for payment by gift card, threats outside the legal process, fake urgency, requests for a Social Security number or passwords, deadlines shorter than the law allows, unverifiable senders. Explain WHY each is a flag.
6. "draft_response" is a courteous, firm, factual reply the reader could send. Use [BRACKETS] for anything the user must fill in. Never admit fault or liability on the reader's behalf.
7. "get_help" names REAL categories of help only (legal aid, 211, a tenant union, the agency named on the document). Do not invent phone numbers or URLs.

Return ONLY a JSON object with EXACTLY these fields:
{
  "document_type": "string",
  "confidence": "high | medium | low",
  "language": "string (BCP-47 of the output, e.g. en, es)",
  "reading_level": "string (echoes the requested level)",
  "summary": "string (2 to 3 plain sentences: what this document is)",
  "meaning_for_you": "string (direct second person: what it means for the reader)",
  "deadlines": [ { "label": "string", "date": "string|null", "raw_text": "string", "urgency": "critical | soon | info" } ],
  "actions": [ { "task": "string", "why": "string", "by": "string|null" } ],
  "rights": [ { "right": "string", "basis": "string|null" } ],
  "red_flags": [ { "flag": "string", "severity": "high | medium | low", "explanation": "string" } ],
  "draft_response": "string",
  "uncertainties": [ "string" ],
  "get_help": [ { "resource": "string", "type": "legal_aid | hotline | gov_agency | tenant_union | other", "note": "string" } ]
}
Every array may be empty. Empty means none were found, which is valid. Output JSON only, with no prose outside the JSON.`;

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

async function decode(body: DecodeBody): Promise<unknown> {
  const language = body.language || "en";
  const readingLevel = body.readingLevel || "grade8";
  const preamble =
    `Target language: ${language}. Target reading level: ${readingLevel}. ` +
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
      max_tokens: 2400,
    });

  try {
    const c = await run();
    return JSON.parse(extractJson(c.choices?.[0]?.message?.content ?? ""));
  } catch {
    const c = await run("\n\nReturn ONLY valid minified JSON matching the schema. No prose, no code fences.");
    return JSON.parse(extractJson(c.choices?.[0]?.message?.content ?? ""));
  }
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
