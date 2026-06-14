# Decoded

Understand any official document. Decoded explains a confusing letter, bill, or notice in plain language and tells you what it means, your deadlines, your rights, and exactly what to do, in your language, read aloud.

Live: https://dgsx9pmv.insforge.site

Decoded explains documents. It is not legal or medical advice, and it routes people to real help.

## What it does

Paste the text or take a photo of an official document (an eviction notice, a medical bill, an insurance denial, a benefits letter, or a debt-collection letter). Decoded returns a structured, plain-language breakdown at the reading level and in the language you choose:

- A summary of what the document is, and what it means for you.
- The deadlines, sorted by urgency, each with the exact phrase from the document, plus a one-tap calendar reminder.
- A checklist of what to do.
- Your rights and options, grounded in the document.
- Warnings about predatory, illegal, or scam signals.
- A drafted reply you can edit, copy, and send.
- A path to real human help.

You can switch the language and the whole analysis re-renders in it. You can press Listen to have it read aloud. Saved analyses stay on your device.

## The problem

Tens of millions of people are handed legally and financially consequential documents written above their reading level and often not in their language. Misreading one costs a home, a wrongful debt, a denied claim, or thousands in forfeited benefits.

- 28 percent of US adults read at the lowest literacy level (NCES PIAAC 2023).
- About 29.6 million people in the US have limited English proficiency (Migration Policy Institute).
- Insurers denied about 20 percent of in-network ACA claims in 2023, and fewer than 1 percent of denials were appealed (KFF).

The intervention that works, plain language paired with concrete next steps, was rationed by the small number of caseworkers and legal-aid lawyers who could give it. Decoded makes it instant, multilingual, and free.

## How it works

The core is one server-side function. The frontend sends the document, as text or an image, plus a target language and reading level, to an InsForge edge function. That function holds the AI key, builds a multimodal request, and calls a vision-capable model through the InsForge AI gateway. One model call reads the document (including from a phone photo), extracts the structure, and writes the result natively at the requested reading level and language. It returns strict JSON, which the frontend renders. Read-aloud uses the browser speech synthesis API. Saved history is stored locally with localStorage, so documents never leave the device.

A single vision call replaces a separate OCR step, extraction step, and translation step. It is faster, more robust to real-world photos, and simpler to keep reliable.

## Project structure

```
functions/
  decode-document.ts     Edge function: vision model call, strict JSON, defensive retry
src/
  App.tsx                Hash router (landing or decoder)
  Landing.tsx            Marketing landing page
  Decoder.tsx            The application
  index.css              Styles
  main.tsx               Entry
  lib/
    decode.ts            Typed client and the Decode Result schema
    tts.ts               Read-aloud
    ics.ts               Calendar reminder generation
    history.ts           On-device saved history
PRD.md                   Product requirements
```

## Responsible AI

Decoded explains and never advises. It never fabricates facts, dates, statutes, amounts, or rights, it only states rights that are in the document or broadly established, it surfaces what it is unsure about, it shows a persistent disclaimer, and it routes users to real human help such as legal aid and 211. The AI key stays server-side in the edge function and never reaches the browser.

## Privacy

There is no account, and saved analyses are stored on the device with localStorage, not on a server. Sensitive documents stay with the person who holds them.

## Run locally

```
npm install
npm run dev
```

The frontend calls the deployed `decode-document` function. To run the function against your own InsForge project, deploy `functions/decode-document.ts`, set `OPENROUTER_API_KEY` as a function secret, and update the function URL in `src/lib/decode.ts`.

## Tech stack

React, TypeScript, Vite, InsForge (edge functions, AI gateway), a vision-capable large language model, the Web Speech API.

Built for STEMINATE Hacks 2026.
