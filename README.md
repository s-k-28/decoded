# Decoded

Decoded reads a confusing official document and tells you, in plain language, what it means, your deadlines, your rights, and exactly what to do, in your language and read aloud. For debt-collection letters it goes further: it checks the letter against real federal law and shows you, with a citation you can open, where the letter breaks the rules or looks like a scam.

Live: https://dgsx9pmv.insforge.site

Decoded explains and checks documents. It is not legal or medical advice, and it routes people to real help.

## What makes it different

A general chatbot summarizes a scary letter. It will not tell you the letter is illegal. Decoded does.

When a collector writes "pay $4,200 in 48 hours or face arrest," a chatbot says "you owe the money, pay soon," which quietly helps the sender. Decoded flags the arrest threat as a violation of the Fair Debt Collection Practices Act, notes the missing validation notice, calls out the scam signals, and tells you that you can demand written verification and that the collector must stop until it answers. Every legal claim links to the statute so you can check it yourself.

This works because Decoded does not rely on the model's memory of the law. It grounds the model on a curated corpus of the actual statutes and runs a deterministic rules pass over the letter first. The model may only cite from that corpus, so a fabricated citation is not possible. Debt collection is the flagship because its law is federal, uniform, and crisp; the same engine extends to any document type whose rules you can cite.

## What it does

Paste the text or take a photo of an official document (an eviction notice, a medical bill, an insurance denial, a benefits letter, or a debt-collection letter). Decoded returns a structured, plain-language breakdown at the reading level and in the language you choose:

- A summary of what the document is, and what it means for you.
- For a debt-collection letter, a check against federal law: the problems with the letter, each one linked to the statute it breaks.
- A scam check that weighs the warning signs and tells you how risky the letter looks.
- The deadlines, sorted by urgency, each with the exact phrase from the document, plus a one-tap calendar reminder.
- A checklist of what to do.
- Your rights, with a citation when one applies.
- A drafted reply you can edit, copy, and send. For a debt letter it defaults to a written request to verify the debt.
- A path to real human help.

You can switch the language and the whole analysis re-renders in it. You can press Listen to have it read aloud. Saved analyses stay on your device.

## The problem

Tens of millions of people are handed legally and financially consequential documents written above their reading level and often not in their language. Misreading one costs a home, a wrongful debt, a denied claim, or thousands in forfeited benefits.

- 28 percent of US adults read at the lowest literacy level (NCES PIAAC 2023).
- About 29.6 million people in the US have limited English proficiency (Migration Policy Institute).
- Insurers denied about 20 percent of in-network ACA claims in 2023, and fewer than 1 percent of denials were appealed (KFF).

The intervention that works, plain language paired with concrete next steps, was rationed by the small number of caseworkers and legal-aid lawyers who could give it. Decoded makes it instant, multilingual, and free.

## How it works

The frontend sends the document, as text or an image, plus a target language and reading level, to an InsForge edge function. That function holds the AI key, so it never reaches the browser. It does three things:

1. A deterministic rules pass scans the letter for signals it can detect in code: arrest or warrant threats, demands for untraceable payment, artificial urgency, and a missing right-to-dispute notice.
2. It grounds a vision-capable model on a curated, cited corpus of the Fair Debt Collection Practices Act and Regulation F, passing the detected signals alongside. The model reads the document, including from a phone photo, and is instructed that it may only cite by copying a citation from the corpus. A fabricated citation is therefore impossible.
3. It returns strict JSON, and reconciles the model output with the deterministic findings so the most serious signals can never be dropped.

The frontend renders that JSON natively at the requested reading level and language. Read-aloud uses the browser speech synthesis API. Saved history is stored locally with localStorage, so documents never leave the device.

Using one vision-grounded call rather than separate OCR, extraction, and translation steps keeps it fast and robust to real-world photos. Pairing it with a rules engine and a cited corpus is what turns an explainer into a verifier.

## Project structure

```
functions/
  decode-document.ts     Edge function: rules pre-scan, cited FDCPA corpus, grounded model call, strict JSON
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

Decoded explains and checks; it never advises. It never fabricates facts, dates, statutes, amounts, or rights. Citations are not generated from the model's memory: the model may only cite by copying from a curated corpus of real law, so every citation on screen is one a person can open and verify. It surfaces what it is unsure about, shows a persistent disclaimer, and routes users to real human help such as legal aid, the CFPB, and 211. The AI key stays server-side in the edge function and never reaches the browser.

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
