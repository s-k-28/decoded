// Text to speech. Primary path is Puter.js — a free, no-key, client-side service
// that returns natural neural (Amazon Polly) voices, so every listener gets the
// same non-robotic voice with nothing to deploy. If Puter is unavailable or the
// language isn't supported there, we fall back to the browser's built-in
// SpeechSynthesis so read-aloud always works.

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { puter?: any }
}

// The one thing currently playing, so stopSpeaking() can halt it regardless of
// which path produced it.
let currentAudio: HTMLAudioElement | null = null;

export function supportsTTS(): boolean {
  return typeof window !== "undefined" && (typeof Audio !== "undefined" || "speechSynthesis" in window);
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// ----- Cloud path (Puter / neural Polly) -----------------------------------

// Map our short codes to a calm, natural neural voice per language. "Brian" is a
// steady British male — reassuring for stressful documents. Languages Polly does
// not cover (Vietnamese, Haitian Creole) are left out and fall back to the
// browser voice.
const PUTER_VOICE: Record<string, { language: string; voice: string; engine: string }> = {
  en: { language: "en-GB", voice: "Brian", engine: "neural" },
  es: { language: "es-US", voice: "Lupe", engine: "neural" },
  fr: { language: "fr-FR", voice: "Lea", engine: "neural" },
  zh: { language: "cmn-CN", voice: "Zhiyu", engine: "neural" },
  ar: { language: "arb", voice: "Zeina", engine: "standard" }, // Arabic has no neural voice
};

// Returns true if a cloud voice started playing, false if we should fall back.
async function speakCloud(text: string, lang: string, onEnd?: () => void): Promise<boolean> {
  const puter = window.puter;
  const cfg = PUTER_VOICE[lang.toLowerCase().split("-")[0]];
  if (!puter?.ai?.txt2speech || !cfg) return false;

  // Polly caps a single request at ~3000 characters.
  const audio: HTMLAudioElement = await puter.ai.txt2speech(text.slice(0, 2900), cfg);
  if (!audio || typeof audio.play !== "function") return false;

  currentAudio = audio;
  audio.onended = () => { if (currentAudio === audio) currentAudio = null; onEnd?.(); };
  audio.onerror = () => { if (currentAudio === audio) currentAudio = null; };
  await audio.play();
  return true;
}

// ----- Browser fallback ----------------------------------------------------

let cached: SpeechSynthesisVoice[] = [];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const now = window.speechSynthesis.getVoices();
    if (now.length) { cached = now; resolve(now); return; }
    const handler = () => { cached = window.speechSynthesis.getVoices(); resolve(cached); };
    window.speechSynthesis.addEventListener("voiceschanged", handler, { once: true });
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });
}

const PREMIUM_NAMES = [
  "siri", "ava", "samantha", "allison", "tom", "nicky", "aaron", "evan", "joelle",
  "zoe", "nathan", "noelle", "serena", "isha", "jamie", "helena",
  "natural", "neural", "online", "wavenet", "journey", "studio",
];
const ROBOTIC_MARKERS = ["compact", "espeak", "eloquence", "pico", "fallback"];

function score(v: SpeechSynthesisVoice, lang: string): number {
  const name = (v.name || "").toLowerCase();
  const vlang = (v.lang || "").toLowerCase();
  const want = lang.toLowerCase();
  let s = 0;
  if (vlang === want) s += 100;
  else if (vlang.startsWith(want.split("-")[0])) s += 60;
  else if (vlang.startsWith("en")) s += 5;
  if (name.includes("siri")) s += 50;
  if (name.includes("enhanced") || name.includes("premium")) s += 30;
  if (PREMIUM_NAMES.some((n) => name.includes(n))) s += 20;
  if (ROBOTIC_MARKERS.some((m) => name.includes(m))) s -= 40;
  if (v.default) s += 2;
  return s;
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (!cached.length) return undefined;
  return cached.map((v) => ({ v, s: score(v, lang) })).sort((a, b) => b.s - a.s)[0]?.v;
}

// Chrome silently truncates utterances longer than ~15s, which makes long
// readings sound "chopped"; queueing sentence-sized chunks avoids that.
function chunk(text: string, max = 180): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const out: string[] = [];
  let buf = "";
  for (const piece of sentences) {
    if ((buf + piece).length > max && buf) { out.push(buf.trim()); buf = ""; }
    buf += piece;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

async function speakBrowser(text: string, lang: string, onEnd?: () => void): Promise<void> {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  await loadVoices();
  const voice = pickVoice(lang);
  const pieces = chunk(text);
  pieces.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = lang;
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.pitch = 1.02;
    if (i === pieces.length - 1 && onEnd) u.onend = onEnd;
    window.speechSynthesis.speak(u);
  });
}

// ----- Public entry point --------------------------------------------------

export async function speak(text: string, lang = "en", onEnd?: () => void): Promise<void> {
  if (typeof window === "undefined") return;
  const clean = text.trim();
  if (!clean) return;
  stopSpeaking();
  try {
    if (await speakCloud(clean, lang, onEnd)) return;
  } catch {
    // Puter not loaded, rate-limited, autoplay blocked, etc. — fall back below.
  }
  await speakBrowser(clean, lang, onEnd);
}
