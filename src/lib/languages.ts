// The languages Decoded can translate a document into. Ordered roughly by number
// of speakers so the most common choices sit near the top of the list.
//
// Each entry carries three things, because they serve different jobs:
//   - code:    a BCP-47 tag used to pick a text-to-speech voice and to round-trip
//              the user's choice through saved history.
//   - native:  what the user sees in the dropdown, written in its own script.
//   - english: the unambiguous English name sent to the model as the target
//              language. A bare code like "ceb" can confuse the model; the name
//              "Cebuano" cannot. This is what guarantees the output language.
export interface Language {
  code: string;
  native: string;
  english: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'zh', native: '中文（简体）', english: 'Chinese (Simplified)' },
  { code: 'es', native: 'Español', english: 'Spanish' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { code: 'ar', native: 'العربية', english: 'Arabic' },
  { code: 'fr', native: 'Français', english: 'French' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali' },
  { code: 'pt', native: 'Português', english: 'Portuguese' },
  { code: 'ru', native: 'Русский', english: 'Russian' },
  { code: 'ur', native: 'اردو', english: 'Urdu' },
  { code: 'id', native: 'Bahasa Indonesia', english: 'Indonesian' },
  { code: 'de', native: 'Deutsch', english: 'German' },
  { code: 'ja', native: '日本語', english: 'Japanese' },
  { code: 'sw', native: 'Kiswahili', english: 'Swahili' },
  { code: 'mr', native: 'मराठी', english: 'Marathi' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu' },
  { code: 'tr', native: 'Türkçe', english: 'Turkish' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil' },
  { code: 'vi', native: 'Tiếng Việt', english: 'Vietnamese' },
  { code: 'ko', native: '한국어', english: 'Korean' },
  { code: 'it', native: 'Italiano', english: 'Italian' },
  { code: 'th', native: 'ไทย', english: 'Thai' },
  { code: 'gu', native: 'ગુજરાતી', english: 'Gujarati' },
  { code: 'fa', native: 'فارسی', english: 'Persian (Farsi)' },
  { code: 'pl', native: 'Polski', english: 'Polish' },
  { code: 'uk', native: 'Українська', english: 'Ukrainian' },
  { code: 'ha', native: 'Hausa', english: 'Hausa' },
  { code: 'kn', native: 'ಕನ್ನಡ', english: 'Kannada' },
  { code: 'ml', native: 'മലയാളം', english: 'Malayalam' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
  { code: 'ps', native: 'پښتو', english: 'Pashto' },
  { code: 'ro', native: 'Română', english: 'Romanian' },
  { code: 'nl', native: 'Nederlands', english: 'Dutch' },
  { code: 'fil', native: 'Filipino', english: 'Filipino (Tagalog)' },
  { code: 'ms', native: 'Bahasa Melayu', english: 'Malay' },
  { code: 'my', native: 'မြန်မာ', english: 'Burmese' },
  { code: 'or', native: 'ଓଡ଼ିଆ', english: 'Odia (Oriya)' },
  { code: 'yo', native: 'Yorùbá', english: 'Yoruba' },
  { code: 'ig', native: 'Igbo', english: 'Igbo' },
  { code: 'su', native: 'Basa Sunda', english: 'Sundanese' },
  { code: 'am', native: 'አማርኛ', english: 'Amharic' },
  { code: 'uz', native: 'Oʻzbekcha', english: 'Uzbek' },
  { code: 'sd', native: 'سنڌي', english: 'Sindhi' },
  { code: 'ne', native: 'नेपाली', english: 'Nepali' },
  { code: 'ceb', native: 'Cebuano', english: 'Cebuano' },
  { code: 'as', native: 'অসমীয়া', english: 'Assamese' },
  { code: 'hu', native: 'Magyar', english: 'Hungarian' },
  { code: 'el', native: 'Ελληνικά', english: 'Greek' },
  { code: 'cs', native: 'Čeština', english: 'Czech' },
  { code: 'zu', native: 'isiZulu', english: 'Zulu' },
  { code: 'sn', native: 'chiShona', english: 'Shona' },
  { code: 'so', native: 'Soomaali', english: 'Somali' },
  { code: 'si', native: 'සිංහල', english: 'Sinhala' },
  { code: 'km', native: 'ខ្មែរ', english: 'Khmer' },
  { code: 'rw', native: 'Ikinyarwanda', english: 'Kinyarwanda' },
  { code: 'kk', native: 'Қазақ', english: 'Kazakh' },
  { code: 'he', native: 'עברית', english: 'Hebrew' },
  { code: 'sv', native: 'Svenska', english: 'Swedish' },
  { code: 'ny', native: 'Chichewa', english: 'Chichewa (Nyanja)' },
  { code: 'xh', native: 'isiXhosa', english: 'Xhosa' },
  { code: 'ht', native: 'Kreyòl Ayisyen', english: 'Haitian Creole' },
  { code: 'be', native: 'Беларуская', english: 'Belarusian' },
  { code: 'bg', native: 'Български', english: 'Bulgarian' },
  { code: 'ca', native: 'Català', english: 'Catalan' },
  { code: 'az', native: 'Azərbaycanca', english: 'Azerbaijani' },
  { code: 'ak', native: 'Akan', english: 'Akan (Twi)' },
  { code: 'sr', native: 'Српски', english: 'Serbian' },
  { code: 'tg', native: 'Тоҷикӣ', english: 'Tajik' },
  { code: 'hr', native: 'Hrvatski', english: 'Croatian' },
  { code: 'da', native: 'Dansk', english: 'Danish' },
  { code: 'fi', native: 'Suomi', english: 'Finnish' },
  { code: 'sk', native: 'Slovenčina', english: 'Slovak' },
  { code: 'no', native: 'Norsk', english: 'Norwegian' },
  { code: 'lo', native: 'ລາວ', english: 'Lao' },
  { code: 'tk', native: 'Türkmençe', english: 'Turkmen' },
  { code: 'ku', native: 'Kurdî', english: 'Kurdish (Kurmanji)' },
  { code: 'mn', native: 'Монгол', english: 'Mongolian' },
  { code: 'ka', native: 'ქართული', english: 'Georgian' },
  { code: 'hy', native: 'Հայերեն', english: 'Armenian' },
  { code: 'sq', native: 'Shqip', english: 'Albanian' },
  { code: 'bho', native: 'भोजपुरी', english: 'Bhojpuri' },
  { code: 'ff', native: 'Fulfulde', english: 'Fula (Fulani)' },
  { code: 'wo', native: 'Wolof', english: 'Wolof' },
  { code: 'ti', native: 'ትግርኛ', english: 'Tigrinya' },
  { code: 'lt', native: 'Lietuvių', english: 'Lithuanian' },
  { code: 'sl', native: 'Slovenščina', english: 'Slovenian' },
  { code: 'bm', native: 'Bamanankan', english: 'Bambara' },
  { code: 'gl', native: 'Galego', english: 'Galician' },
  { code: 'lv', native: 'Latviešu', english: 'Latvian' },
  { code: 'et', native: 'Eesti', english: 'Estonian' },
  { code: 'mai', native: 'मैथिली', english: 'Maithili' },
  { code: 'tn', native: 'Setswana', english: 'Tswana' },
  { code: 'st', native: 'Sesotho', english: 'Sesotho' },
  { code: 'ky', native: 'Кыргызча', english: 'Kyrgyz' },
  { code: 'mk', native: 'Македонски', english: 'Macedonian' },
  { code: 'mg', native: 'Malagasy', english: 'Malagasy' },
  { code: 'tt', native: 'Татарча', english: 'Tatar' },
  { code: 'yi', native: 'ייִדיש', english: 'Yiddish' },
  { code: 'af', native: 'Afrikaans', english: 'Afrikaans' },
  { code: 'zh-TW', native: '中文（繁體）', english: 'Chinese (Traditional)' },
];

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));

// The English name the model should translate into; falls back to the code.
export function modelLanguage(code: string): string {
  return BY_CODE.get(code)?.english ?? code;
}

// How an entry reads in the dropdown: native script, plus the English name when
// it differs, so it is findable both by the reader and by an English speaker.
export function languageLabel(l: Language): string {
  return l.native === l.english ? l.native : `${l.native} — ${l.english}`;
}

// Right-to-left scripts, so the translated output can be laid out correctly.
const RTL = new Set(['ar', 'ur', 'fa', 'ps', 'sd', 'he', 'yi']);

export function isRtl(code: string): boolean {
  return RTL.has(code);
}
