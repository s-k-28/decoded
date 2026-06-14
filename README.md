# Decoded

Decoded explains confusing official documents in plain language and tells you what they mean, your deadlines, your rights, and what to do next. In your language, read aloud.

Paste or photograph an eviction notice, a medical bill, a benefits letter, or a debt collection letter, and Decoded returns a structured, plain-language breakdown at your chosen reading level and language: what the document is, what it means for you, the deadlines, the actions to take, your rights, any predatory or scam warning signs, a drafted reply, and where to get real human help.

Decoded explains documents. It is not legal or medical advice. It routes people to real help.

## The problem

Tens of millions of low-income, immigrant, elderly, disabled, and low-literacy people are handed legally and financially consequential documents written above their reading level and often not in their language. Misreading them costs people their homes, their money, and their benefits.

- 28% of US adults score at the lowest literacy level (NCES PIAAC 2023).
- About 29.6 million people in the US have Limited English Proficiency.
- Over half of eviction judgments in some states are defaults entered because the tenant missed a deadline they did not understand.
- Insurers denied about 20% of in-network ACA claims in 2023, yet fewer than 1% of denials were appealed.

The proven intervention, plain language plus concrete next-step guidance, was rationed by human caseworkers. Decoded makes it instant, multilingual, and free at the point of need.

## How it works

A single vision-capable language model call, behind a server-side function, reads the document (pasted text or a photo) and returns strict JSON: summary, meaning for you, deadlines, actions, rights, red flags, a draft response, uncertainties, and get-help resources. The frontend renders it, reads it aloud, and can re-run it in any supported language or reading level.

## Architecture

- Frontend: Vite, React, TypeScript. No account required to use the core flow.
- Backend: an InsForge edge function, `decode-document`, that holds the AI provider key server-side, builds the multimodal request, enforces strict JSON, and returns the result.
- AI: a vision-capable model through the InsForge AI gateway. One call performs OCR, reading, extraction, multilingual generation, and reading-level control.
- Accessibility: browser speech synthesis for read-aloud, reading-level and language controls, a larger-text mode, keyboard operation, and screen-reader support.

## Responsible AI

Decoded explains and never advises. It never fabricates facts, dates, statutes, amounts, or rights, it surfaces what it is unsure about, it shows a persistent disclaimer, and it routes users to real human help (legal aid, 211, the agency named on the document).

## Run locally

```
npm install
npm run dev
```

The frontend calls the deployed `decode-document` function. To run the function against your own InsForge project, deploy `functions/decode-document.ts` and set the function URL in `src/lib/decode.ts`.

## Project structure

```
functions/decode-document.ts   the analysis function (vision model, strict JSON)
src/lib/decode.ts              the typed client and the Decode Result schema
src/lib/tts.ts                 read-aloud
src/App.tsx                    the application
PRD.md                         the product requirements document
```

Built for STEMINATE Hacks 2026.
