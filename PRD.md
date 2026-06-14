# Decoded - Product Requirements Document

Version 1.0. Owner: founding team. Status: build in progress for STEMINATE Hacks 2026.

This document specifies WHAT Decoded is and WHAT it must do. It deliberately contains no visual design criteria (no colors, typography, spacing, or layout aesthetics). The visual design system is a separate deliverable. Where this document references screens, states, components, and content, it defines their function, content, and behavior only, so the design system can be built against a complete functional blueprint.

Hard rule for all copy, code, and assets: never use em-dashes. Use commas, colons, parentheses, or hyphens.

---

## 1. Summary

Decoded is a web app that turns any confusing official document into instant understanding and action for the people the system fails. A user pastes the text of a document or takes a photo of it, and Decoded returns a structured, plain-language breakdown: what the document is, what it means for the reader, the deadlines, the actions to take, the reader's rights, any predatory or scam warning signs, a drafted reply, and where to get real human help. Everything is delivered at the reader's chosen reading level, in the reader's language, and can be read aloud.

One line: Decoded explains scary official documents in plain language and tells you what it means, your deadlines, your rights, and what to do, in your language, read aloud.

Decoded explains documents. It does not give legal or medical advice. It routes users to real human help.

---

## 2. The problem

Tens of millions of low-income, immigrant, elderly, disabled, and low-literacy people are handed legally and financially consequential documents written above their reading level and often not in their language. Misreading these documents costs people their homes, their money, and their benefits.

Evidence (use in pitch, video, and writeup):
- 28% of US adults score at the lowest literacy level (NCES PIAAC 2023), up from 19% in 2017.
- Only 12% of US adults have proficient health literacy; about 36% cannot reliably understand medical and insurance information (NCES NAAL, AHRQ).
- About 29.6 million people in the US have Limited English Proficiency; roughly 68 million speak a language other than English at home (Migration Policy Institute).
- Over half of eviction judgments in Oregon are default judgments because the tenant missed the hearing, a deadline failure, not a decision on the merits (Evicted in Oregon).
- Tenants have lawyers in about 3% of US eviction cases, versus about 80% for landlords (Tenant Right to Counsel).
- 20 million Americans owe at least $220 billion in medical debt, on bills that are hard to decode and often wrong (Peterson-KFF).
- ACA marketplace insurers denied about 20% of in-network claims in 2023, yet consumers appealed fewer than 1% of denials (KFF 2023).
- About 1 in 5 EITC-eligible workers fail to claim it, roughly 5 million people leaving about $7 billion unclaimed each year (IRS, TIGTA).
- A randomized trial found plain-language versions raised correct comprehension from 33% to 59%, with the largest gains among lower-education and limited-English readers (Schunemann et al.).
- The H&R Block FAFSA experiment found that walking families through a simplified application made seniors 25 to 30% more likely to enroll in college, while information without hands-on guidance had no effect (Bettinger et al., NBER w15361).

The proven intervention (plain language plus concrete next-step guidance) was labor-intensive and rationed by human caseworkers. Decoded makes it instant, multilingual, free at the point of need, and available to anyone with a phone.

---

## 3. Target users and personas

Primary users:
- P1, the renter in crisis. Receives an eviction or pay-or-quit notice. Limited English or low literacy. Needs to know the deadline and what to do, fast, without a lawyer.
- P2, the patient with a bill. Receives a medical bill or an insurance denial. Cannot tell what is owed, whether it is correct, or that a denial can be appealed.
- P3, the benefits applicant. Receives a benefits determination (SNAP, Medicaid, unemployment) that is denied or requires action. Does not know about hearing rights or deadlines.
- P4, the older adult. Receives debt collection or a scam notice. Vulnerable to predatory and fraudulent demands.

Secondary users (helpers):
- P5, the caseworker, librarian, community-org volunteer, or family member who helps several of the above and needs a fast, trustworthy tool to explain documents to the people they serve.

Accessibility needs that cut across personas: low literacy, limited English proficiency, low vision or blindness, older age, high stress and time pressure.

---

## 4. Goals and non-goals

Goals:
- Let any person understand any official document in under one minute, with zero account or cost.
- Surface the time-critical facts (deadlines, required actions) immediately and unmissably.
- Tell the reader their rights and options in plain language, grounded in the document, never fabricated.
- Detect predatory, illegal, or scam signals and warn the reader.
- Give the reader a concrete next step (a drafted reply) and a path to real human help.
- Work in the reader's language and at the reader's reading level, and be usable by someone who cannot read the screen (voice).

Non-goals:
- Decoded does not give licensed legal or medical advice and does not represent the user.
- Decoded does not file documents, send messages, pay bills, or take actions on the user's behalf.
- Decoded does not store sensitive documents long-term or sell data.
- Decoded does not promise legal accuracy or outcomes. It is an explainer and a router to real help.

---

## 5. Success metrics

Hackathon (STEMINATE) judging criteria and the targets Decoded must hit:
- Innovation and Creativity (20): a unique combination no competitor offers (comprehension plus rights plus actions plus scam detection plus multilingual plus voice, for any document type). Target 17 to 19.
- Impact and Relevance (20): a large, cited, real social problem; broad and scalable scope. Target 18 to 20.
- Technical Implementation (20): a working, reliable end-to-end product with sophisticated AI use and no demo-breaking bugs. Target 16 to 18.
- Use of AI and Technology (15): AI is the core of the product and is genuinely helpful, not a thin wrapper. Target 13 to 15.
- Feasibility and Scalability (10): realistic, shippable, scales to any document and language at near-zero marginal cost. Target 9 to 10.
- Presentation and Communication (10): one emotional, clear demo and a tight video. Target 9 to 10.
- Design and User Experience (5): accessibility-first, usable by all the personas. Target 5.

Product KPIs (post-hackathon, for the writeup and roadmap):
- Time from document input to a complete explanation (target under 15 seconds).
- Comprehension lift (self-reported "I understand this now" before vs after).
- Share of analyses where the user takes a next action (copies the draft, opens a help resource, sets a reminder).
- Languages used and reading levels used (proves the accessibility value).

---

## 6. Core user journeys

Journey A, paste and understand (primary):
1. User lands on the app and sees a one-line explanation of what Decoded does and a single input.
2. User pastes the text of their document (or taps an example) and presses Decode.
3. A clear loading state appears.
4. The structured result appears: what it is, what it means, deadlines, actions, rights, warnings, a draft reply, and where to get help.
5. User changes reading level or language and the result updates.
6. User presses Listen and the explanation is read aloud.
7. User copies the draft reply or opens a help resource, then optionally decodes another document.

Journey B, snap a photo (primary, mobile):
1. User taps Upload a photo and takes or selects a photo of the physical document.
2. A preview of the image is shown.
3. User presses Decode; the same structured result appears.

Journey C, helper (secondary):
1. A caseworker pastes or photographs a client's document, decodes it, switches to the client's language, and reads or shows the plain-language result and the get-help resources to the client.

---

## 7. Functional requirements

Priority key: P0 is required for the winning MVP and the demo. P1 is a high-value standout feature to add as time allows. P2 is a stretch goal.

### 7.1 Document input
- FR-1 (P0): The user can input a document by pasting plain text into a text field.
- FR-2 (P0): The user can input a document by uploading or capturing an image (jpg, png, heic, webp). On mobile this opens the camera or gallery.
- FR-3 (P0): After an image is selected, a preview of the image is shown before and after decoding.
- FR-4 (P0): The input area provides at least three one-tap example documents (an eviction or pay-or-quit notice, a medical bill, and a benefits denial) that populate the input for instant demonstration and trial.
- FR-5 (P0): The Decode action is disabled until there is valid input (non-empty text or a selected image).
- FR-6 (P1): The user can input a PDF; the first page is processed. If PDF handling fails, the app instructs the user to upload a photo instead.
- FR-7 (P2): The user can paste a document URL or forward an email; out of MVP scope.

### 7.2 Analysis and output
- FR-8 (P0): On Decode, the app sends the input plus the chosen reading level and language to the backend, which calls a vision-capable language model and returns a single strict JSON object (the Decode Result, section 10).
- FR-9 (P0): The result identifies the document type and a confidence level (high, medium, low).
- FR-10 (P0): The result includes a plain-language Summary (what this document is) and a Meaning For You statement written in direct second person.
- FR-11 (P0): The result includes a Deadlines list. Each deadline has a label, an optional explicit date, the verbatim source phrase from the document, and an urgency level (critical, soon, info). Deadlines are presented sorted by urgency, with critical first and visually unmissable in the design system.
- FR-12 (P0): The result includes an Actions checklist. Each action has a task, a short why, and an optional by-when.
- FR-13 (P0): The result includes a Rights list. Each right has a plain-language statement and an optional basis. When the basis is null, the item must be clearly marked as general guidance to verify, never asserted as a specific law.
- FR-14 (P0): The result includes a Red Flags list of predatory, illegal, or scam signals (for example: demands for payment by gift card, threats outside the legal process, fake urgency, requests for a Social Security number or passwords, deadlines shorter than the law allows, unverifiable senders). Each has the flag, a severity, and an explanation of why it is a concern. When the list is empty, the app affirmatively states that no predatory or scam signals were found.
- FR-15 (P0): The result includes a Draft Response: a courteous, firm, factual reply the user could send, with bracketed placeholders for anything the user must fill in. The draft is editable and copyable. It is labeled as a draft to review before sending.
- FR-16 (P0): The result includes an Uncertainties list of anything the model could not read or was unsure about. When present, the app instructs the user to double-check the original.
- FR-17 (P0): The result includes a Get Help list of real categories of human help (legal aid, 211, a tenant union, the specific agency named on the document), each with a short note. The app must not invent phone numbers or URLs; where a real, well-known resource exists (for example 211.org or a legal-aid finder), the app may link to it.

### 7.3 Reading level
- FR-18 (P0): The user can select a reading level among at least three options (for example simplest, standard, plain). The model writes the output natively at the selected level.
- FR-19 (P0): Changing the reading level after a result exists re-runs the analysis at the new level and updates the result.

### 7.4 Language and translation
- FR-20 (P0): The user can select an output language from a list of at least seven languages chosen for the target populations (for example English, Spanish, Chinese, Vietnamese, French, Arabic, Haitian Creole). The model writes all output fields natively in the selected language.
- FR-21 (P0): Changing the language after a result exists re-runs the analysis in the new language and updates the entire result.
- FR-22 (P1): The selected language is remembered for the session.

### 7.5 Read aloud (text to speech)
- FR-23 (P0): The user can play an audio reading of the explanation (at minimum the summary, meaning, deadlines, and actions) using the browser's built-in speech synthesis, in the selected output language where a voice is available.
- FR-24 (P0): The user can stop playback. Playback state is reflected in the control.
- FR-25 (P1): The user can play audio for any individual section.

### 7.6 Accessibility (functional, not visual)
- FR-26 (P0): A larger-text mode is available that increases the readable text scale across the app.
- FR-27 (P0): All interactive elements are reachable and operable by keyboard, with a visible focus state, and have accessible names.
- FR-28 (P0): The app uses semantic structure and ARIA so that a screen reader announces the document type, sections, deadlines, and warnings meaningfully.
- FR-29 (P0): All non-text controls (icons, the listen control, the camera control) have text labels.
- FR-30 (P1): The app respects the user's reduced-motion preference.

### 7.7 Responsible AI and safety (behavioral)
- FR-31 (P0): A disclaimer that Decoded explains documents and is not legal or medical advice is visible at all times, not buried.
- FR-32 (P0): The model must never fabricate facts, dates, statute numbers, case numbers, dollar amounts, or rights. Missing information is left empty or surfaced as an uncertainty.
- FR-33 (P0): The draft response must never admit fault or liability on the user's behalf.
- FR-34 (P0): The app routes users to real human help and frames itself as the front door to the safety net, not a replacement for professionals.
- FR-35 (P1): When confidence is low, the app shows a prominent prompt to double-check the original document and consider getting help.

### 7.8 Persistence and history (optional depth)
- FR-36 (P1): A decoded result can be saved to a backend store so that a session shows a list of recently decoded documents the user can reopen.
- FR-37 (P1): The app pre-seeds two to three known-good demo analyses so the demo always works even if live inference is slow or unavailable.
- FR-38 (P2): Saved documents are scoped to an anonymous or signed-in session.

### 7.9 Action and follow-through (standout)
- FR-39 (P1): For each critical deadline, the user can generate a calendar reminder (an .ics download) so the deadline is not missed.
- FR-40 (P1): The user can copy the draft response and can copy or print a plain-language version of the whole explanation.
- FR-41 (P2): The user can ask a follow-up question about the document by voice or text and get a grounded answer.

### 7.10 Reset and re-run
- FR-42 (P0): The user can clear the current result and decode a new document.
- FR-43 (P0): The app never shows a blank or broken screen on error; every error returns a clear, plain-language message and a retry path.

---

## 8. Screens and states (functional inventory for the designer)

The design system must cover the following screens and states. Visual treatment is intentionally unspecified.

Screen 1, Home and Input (default).
- Contains: a brief product explanation, the input control with two modes (paste text, upload or capture a photo), the example documents, the reading-level control, the language control, and the always-visible disclaimer.
- States: empty (no input yet, Decode disabled), filled (input present, Decode enabled), image-selected (preview shown).

Screen or region 2, Loading.
- Contains: a clear progress indicator and reassuring status text in plain language while the document is being read.

Screen or region 3, Result.
- Contains, in priority order of attention: document type and confidence, a listen control, then the sections Summary and Meaning For You, Deadlines, Actions, Rights, Red Flags (or an all-clear statement), Draft Response, Uncertainties (conditional), Get Help, and a control to decode another document. The reading-level and language controls remain available to re-run.
- States: full result, result with no deadlines or no red flags (the corresponding section shows its empty or all-clear content), low-confidence result (prominent double-check prompt).

Screen or region 4, Error.
- Contains: a plain-language error message and a retry control.

Persistent elements (all screens).
- A header with the product name and the larger-text control.
- The always-visible not-advice disclaimer.
- A footer restating the product purpose and the not-advice disclaimer.

Conditional elements.
- History or recent documents list (P1).
- Calendar-reminder control on critical deadlines (P1).

---

## 9. Component inventory (functional)

The design system must provide these components. Each is described by content and behavior only.

- Brand header: product name, optional mark, and the larger-text toggle (a two-state control).
- Disclaimer banner: persistent, contains the not-advice statement.
- Input switcher: two modes, paste text and upload or capture photo.
- Text input: multi-line, accepts pasted document text.
- Image dropzone and capture: accepts an image by tap, drag, or camera; shows a preview; shows guidance for a good photo.
- Example chips: one-tap controls that load sample documents.
- Primary action button: Decode; disabled until valid input.
- Reading-level selector: a single-choice control over the reading levels.
- Language selector: a single-choice control over the supported languages.
- Loading indicator with status text.
- Result header: document type, confidence indicator, and the listen control.
- Listen control: two-state play and stop, reflects speaking state.
- Section container: a labeled group used for each result section, with a section title and an optional per-section listen control.
- Summary block: a lead statement and a meaning-for-you statement.
- Deadline item: label, optional date, verbatim source phrase, urgency indicator. The design must make critical urgency unmissable.
- Action item: a checkable task with a why and an optional by-when.
- Right item: a statement plus an optional basis or a general-guidance marker when the basis is absent.
- Red-flag item: a flag, a severity indicator, and an explanation. Plus an all-clear state when none are found.
- Draft-response editor: an editable multi-line field prefilled with the draft, a copy control, and a draft-to-review label.
- Uncertainty notice: conditional, lists what the model was unsure about.
- Get-help item: a resource name, type, and note; may link to a real well-known resource.
- Error message with retry.
- Optional: history list item; calendar-reminder control.

Iconography requirement (functional, not visual): all icons must be vector (SVG) and never emoji, and every icon must be paired with or backed by a text label.

---

## 10. Data model and output schema (the contract)

The backend returns a single JSON object, the Decode Result. Every array may be empty, and empty is valid signal.

```
{
  "document_type": string,                 // e.g. "Eviction Notice", "Medical Bill", "Benefit Letter", "Unknown"
  "confidence": "high" | "medium" | "low",
  "language": string,                      // BCP-47 of the output, e.g. "en", "es"
  "reading_level": string,                 // echoes the requested level
  "summary": string,                       // 2 to 3 plain sentences: what this document is
  "meaning_for_you": string,               // direct second person: what it means for the reader
  "deadlines": [
    { "label": string, "date": string|null, "raw_text": string, "urgency": "critical"|"soon"|"info" }
  ],
  "actions": [ { "task": string, "why": string, "by": string|null } ],
  "rights": [ { "right": string, "basis": string|null } ],
  "red_flags": [ { "flag": string, "severity": "high"|"medium"|"low", "explanation": string } ],
  "draft_response": string,
  "uncertainties": [ string ],
  "get_help": [ { "resource": string, "type": "legal_aid"|"hotline"|"gov_agency"|"tenant_union"|"other", "note": string } ]
}
```

Persisted analysis record (P1), stored server-side:
```
id, created_at, input_kind ("text"|"image"), source_reference (storage key or null),
language, reading_level, document_type, confidence, result (the JSON above)
```

The request to the backend:
```
{ "text": string?, "imageUrl": string?, "readingLevel": string, "language": string }
```
Exactly one of text or imageUrl is required.

---

## 11. AI behavior specification

- The model receives the document (as text or an image) plus the target reading level and target language.
- The model writes every output field in the target language at the target reading level, in short sentences, defining any unavoidable term inline, in a calm, warm, direct, second-person voice.
- Hard rules the model must follow: it is not a lawyer or doctor and does not give advice; it never invents facts, dates, statutes, amounts, or rights; rights are stated only when written in the document or broadly established, with the basis set to null rather than guessing a law; unreadable or ambiguous content is surfaced as an uncertainty, never guessed; red flags name concrete predatory, illegal, or scam signals with a reason; the draft never admits fault and uses bracketed placeholders; get-help names only real categories of help.
- Output is strict JSON matching the schema, with no prose outside the JSON.
- Reliability: the backend requests strict JSON, defensively parses the response, and on a parse failure retries once with a stricter instruction. The model identifier is configurable so it can be swapped quickly if a provider is slow or unavailable.

---

## 12. Edge cases and error handling

- Not a document or unreadable image: document_type is Unknown, confidence is low, and the app prompts the user to paste the text or retake the photo.
- Partially legible document: the model fills what it can and lists the rest under uncertainties; the app shows the double-check prompt.
- Very long document: the input is bounded; the app explains it analyzed the provided portion.
- Mixed languages in the document: the model still outputs in the user's selected language.
- Empty result arrays: each section shows its empty or all-clear content; the result is never blank.
- Model or network failure: the app shows a plain-language error and a retry control, and (P1) can fall back to a pre-seeded analysis for the demo documents.
- No speech voice for a language: the listen control still functions with the best available voice and does not error.

---

## 13. Technical architecture

- Frontend: a single-page web app (Vite, React, TypeScript). No account required to use the core flow.
- Backend: an InsForge edge function (decode-document) that holds the AI provider key server-side and is the only network dependency. It builds the multimodal request, calls the AI gateway, enforces strict JSON, and returns the Decode Result. It is publicly invokable so the frontend calls it directly.
- AI: a vision-capable language model via the InsForge AI gateway, doing OCR, reading, extraction, multilingual generation, and reading-level control in one call. No separate OCR or translation service.
- Storage and database (P1): InsForge storage for uploaded images and a Postgres table for saved analyses and pre-seeded demo records.
- Text to speech: the browser's built-in speech synthesis, no external service.
- All code is new and written within the hackathon window. The repository is public.

---

## 14. Scope: MVP versus stretch

Winning MVP (must ship and demo): FR-1 through FR-5, FR-8 through FR-35, FR-42, FR-43. This is the complete decode flow with all result sections, reading levels, languages, voice, accessibility, and the responsible-AI behavior. This is already a standout, defensible product.

High-value standout adds (ship as time allows, in this order): FR-37 (pre-seeded demo safety net), FR-36 (history), FR-39 (calendar reminders), FR-40 (copy and print), FR-35 (low-confidence prompt), FR-6 (PDF).

Stretch: FR-41 (follow-up Q and A), FR-38 (scoped accounts), FR-7 (URL or email input).

---

## 15. Why this wins (standout positioning)

- It solves a concrete, cited, human problem at large scope, which lands the Impact criterion.
- It does something no competitor does: one tool that reads any document and returns comprehension plus rights plus actions plus scam detection plus a drafted reply, multilingual and read aloud. Single-purpose tools exist (one screens SNAP, one negotiates a hospital bill, one generates a tenant letter, generic chat-with-PDF just answers questions); none combine these, and none are accessibility-first.
- It is responsible by design (explains, does not advise; never fabricates; routes to real help), which directly impresses the senior and AI-governance judges and is a credibility moat.
- It is accessibility-first (voice, reading level, language, large text), which almost no beginner project does and which the design and impact criteria reward.
- It works live on a real document in seconds, which wins the feasibility and presentation criteria.

---

## 16. Demo requirements

The demo (90 seconds of the video) must show:
1. The problem framed in one sentence, and the always-visible not-advice disclaimer.
2. A real document decoded live (the eviction notice is the most emotionally effective): the plain summary, the critical deadline called out, the actions, the rights, and any red flag.
3. The accessibility hook: press Listen to hear it read aloud, then switch the language to Spanish and watch the entire result re-render and speak in Spanish.
4. The agency moment: the drafted reply and the get-help resources.
5. A closing line that captures the value (for example: Decoded turns a panic attack into a plan).

A pre-seeded demo document must be available so the demo never depends on live inference holding up.

---

## 17. Submission requirements (STEMINATE)

- A new public GitHub repository with all code written in the event window.
- A working deployed app, with the link in the submission.
- A 2 to 3 minute video covering the problem, the demo, the accessibility hook, and the close.
- A Devpost writeup: the problem and evidence, what it does, how it works, the responsible-AI stance, and what is next.
- Confirm eligibility (ages 13 to 22, student) and that the project fits the announced topic.
- No cross-submission of this project to any other hackathon.

---

## 18. Risks and mitigations

- Announced topic mismatch: confirm the June 7 topic from the organizer's Discord and reframe the hero example and copy if it is narrow.
- Model returns malformed JSON or is slow during the demo: strict JSON plus a retry plus a configurable model plus pre-seeded demo analyses.
- Time pressure: build the brain and the core result flow first; treat history, PDF, and reminders as additive; never cut the demo rehearsal.
- Responsible-AI scrutiny: never fabricate rights or citations; keep the disclaimer visible; route to real help.

---

## 19. Open questions

- What is STEMINATE's announced topic from June 7, and does it constrain the framing?
- Which exact languages should ship in the MVP language list for the target community?
- Should the MVP include the calendar-reminder and history features, or defer them to keep the core flow flawless for the demo?
