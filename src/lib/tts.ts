// Text to speech via the browser's built-in SpeechSynthesis. Free, no key, works
// in many languages. Voices populate asynchronously, so we wait for them and pick
// the best match for the requested language.

let cached: SpeechSynthesisVoice[] = [];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const now = window.speechSynthesis.getVoices();
    if (now.length) { cached = now; resolve(now); return; }
    const handler = () => { cached = window.speechSynthesis.getVoices(); resolve(cached); };
    window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true });
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });
}

export function supportsTTS(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking(): void {
  if (supportsTTS()) window.speechSynthesis.cancel();
}

export async function speak(text: string, lang = 'en', onEnd?: () => void): Promise<void> {
  if (!supportsTTS()) return;
  window.speechSynthesis.cancel();
  await loadVoices();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  const match =
    cached.find((v) => v.lang?.toLowerCase().startsWith(lang.toLowerCase())) ||
    cached.find((v) => v.lang?.toLowerCase().startsWith('en'));
  if (match) u.voice = match;
  u.rate = 0.98;
  u.pitch = 1;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}
