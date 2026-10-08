// Banglish / phonetic search.
// "panjabi", "punjabi", "ponjabi", "lal shirt", "jamdani" ... -> the words our (English + Bangla) catalogue text really uses.
//
// How it works:
//  1. Every word the shopper types is turned into a "group" of alternatives (the raw word + dictionary terms).
//  2. A product matches when EVERY group has at least one alternative inside product.haystack (see catalog.js).
//  3. A word is looked up in SYNONYMS three ways: exact spelling, a consonant "skeleton" (panjabi == punjabi),
//     and a skeleton with one typo allowed.
//
// To teach the search a new word: add its spellings to `say` and what it means to `terms`.
// Terms may be English (matched at a word start, so "red" does not hit "embroidered") or Bangla (plain substring).

export const SYNONYMS = [
  // ---- garments / categories ----
  { say: ["panjabi", "punjabi", "ponjabi", "panjabee", "panjabir", "পাঞ্জাবি", "পাঞ্জাবী", "পাঞ্জাবিও"], terms: ["panjabi", "kurta", "পাঞ্জাবি", "কুর্তা"] },
  { say: ["kurta", "kurtha", "kurti", "kurtaa", "কুর্তা", "কুর্তি", "কুর্তী"], terms: ["kurta", "panjabi", "কুর্তা", "পাঞ্জাবি"] },
  { say: ["shirt", "sart", "shart", "sirt", "shaart", "শার্ট"], terms: ["shirt", "শার্ট"] },
  { say: ["tshirt", "t-shirt", "tisart", "tisirt", "tishart", "tishirt", "tee", "টিশার্ট", "টি-শার্ট"], terms: ["t-shirt", "tee", "টি-শার্ট", "টি"] },
  { say: ["polo", "poloshirt", "পোলো"], terms: ["polo", "পোলো"] },
  { say: ["jeans", "jins", "jinse", "jinsh", "জিন্স"], terms: ["jeans", "জিন্স"] },
  { say: ["denim", "ডেনিম"], terms: ["denim", "jeans", "ডেনিম", "জিন্স"] },
  { say: ["pant", "pent", "pants", "trouser", "trousers", "প্যান্ট"], terms: ["jeans", "জিন্স"] },
  { say: ["jacket", "jaket", "jakat", "জ্যাকেট"], terms: ["jacket", "জ্যাকেট"] },
  { say: ["blazer", "blejar", "ব্লেজার", "coat", "কোট"], terms: ["blazer", "ব্লেজার"] },
  { say: ["dress", "dres", "frock", "frok", "ফ্রক", "ড্রেস", "gown", "midi"], terms: ["dress", "ড্রেস"] },
  { say: ["scarf", "skarf", "orna", "orna", "urna", "ওড়না", "স্কার্ফ"], terms: ["scarf", "স্কার্ফ"] },
  { say: ["bag", "byag", "beg", "tote", "thola", "ব্যাগ", "থলে"], terms: ["bag", "tote", "ব্যাগ"] },
  { say: ["watch", "ghori", "ghoree", "ghodi", "ঘড়ি"], terms: ["watch", "ঘড়ি"] },
  { say: ["accessories", "accessory", "axesori", "অ্যাক্সেসরিজ"], terms: ["accessories", "অ্যাক্সেসরিজ"] },
  // Not in stock today: these words still resolve, so the day a saree/jamdani product is added (or given an
  // `aliases` entry in data/v2.js) the search already finds it.
  { say: ["jamdani", "jamdanee", "jamdaani", "jamdany", "জামদানি", "জামদানী"], terms: ["jamdani", "জামদানি", "saree", "শাড়ি"] },
  { say: ["saree", "sari", "sharee", "shari", "shaari", "শাড়ি", "শাড়ী"], terms: ["saree", "sari", "শাড়ি"] },
  { say: ["lungi", "lungee", "লুঙ্গি"], terms: ["lungi", "লুঙ্গি"] },
  { say: ["salwar", "shalwar", "kamiz", "kameez", "shalwarkameez", "সালোয়ার", "কামিজ"], terms: ["salwar", "kameez", "সালোয়ার", "কামিজ"] },

  // ---- people ----
  { say: ["men", "man", "mens", "purush", "purusher", "chele", "cheler", "gents", "gent", "পুরুষ", "ছেলে"], terms: ["men", "পুরুষ"] },
  { say: ["women", "woman", "womens", "nari", "naree", "meye", "meyeder", "mohila", "ladies", "lady", "female", "নারী", "মেয়ে", "মহিলা"], terms: ["women", "নারী"] },
  { say: ["kids", "kid", "baccha", "bacha", "bachcha", "bachchar", "shishu", "shishur", "child", "children", "বাচ্চা", "শিশু"], terms: ["kids", "শিশু", "কিডস"] },

  // ---- festival ----
  { say: ["eid", "eed", "id", "ঈদ"], terms: ["festive", "kurta", "panjabi", "উৎসব", "পাঞ্জাবি"] },
  { say: ["puja", "pujo", "pujor", "pujar", "sharodiya", "sarodiya", "sharod", "durga", "পূজা", "পুজো", "শারদীয়া"], terms: ["festive", "dress", "scarf", "উৎসব", "ড্রেস"] },
  { say: ["festive", "utsob", "utshob", "uthsob", "utsab", "উৎসব", "উৎসবের"], terms: ["festive", "উৎসব"] },
  { say: ["boishakh", "baishakh", "boisakh", "poila", "pohela", "pahela", "বৈশাখ", "পহেলা"], terms: ["red", "white", "festive", "kurta", "panjabi", "লাল", "সাদা"] },

  // ---- colours (colour names are English in product data) ----
  { say: ["lal", "laal", "lall", "লাল"], terms: ["red", "maroon", "লাল"] },
  { say: ["nil", "neel", "nill", "নীল"], terms: ["blue", "navy", "নীল"] },
  { say: ["sobuj", "shobuj", "sabuj", "sobuz", "সবুজ"], terms: ["green", "olive", "সবুজ"] },
  { say: ["holud", "holod", "halud", "হলুদ"], terms: ["yellow", "mustard", "gold", "হলুদ"] },
  { say: ["kalo", "kalu", "kala", "কালো"], terms: ["black", "কালো"] },
  { say: ["sada", "shada", "shaada", "white", "সাদা"], terms: ["white", "cream", "সাদা"] },
  { say: ["golapi", "golaapi", "gulabi", "গোলাপি"], terms: ["pink", "peach", "rose", "গোলাপি"] },
  { say: ["dhushor", "dhusor", "ধূসর", "grey", "gray"], terms: ["grey", "ধূসর"] },
  { say: ["khoyeri", "koyeri", "bhuri", "buri", "খয়েরি", "বাদামি", "badami"], terms: ["brown", "beige", "খয়েরি"] },
  { say: ["sonali", "shonali", "সোনালি"], terms: ["gold", "সোনালি"] },
  { say: ["komola", "kamola", "কমলা"], terms: ["orange", "peach", "কমলা"] },
];

// Filler words people type in Banglish ("lal shirt dao", "panjabi er dam") that no product contains.
const STOPWORDS = new Set([
  "er", "ta", "ti", "gulo", "ke", "dao", "daw", "den", "dekhao", "dekhan", "chai", "chaai", "lagbe", "ache", "achhe", "kinbo", "kine",
  "amar", "amake", "jonno", "jonyo", "for", "the", "and", "o", "ar", "please", "plz", "pls", "show", "me", "product", "products", "dam", "price",
]);

const BANGLA = /[\u0980-\u09FF]/;
const isBangla = (s) => BANGLA.test(s);
const lower = (s) => String(s || "").toLowerCase().trim();

// Plain spelling key: lowercase letters and digits only (Bangla words are kept as typed).
function plain(word) {
  const s = lower(word).normalize("NFC");
  return isBangla(s) ? s.replace(/[^\u0980-\u09FF]/g, "") : s.replace(/[^a-z0-9]/g, "");
}

// Consonant skeleton: panjabi / punjabi / ponjabi -> "pnjb"; shirt / shart / sart -> "srt".
export function skeleton(word) {
  const s = plain(word);
  if (!s || isBangla(s)) return s;
  const t = s
    .replace(/ph/g, "f").replace(/sh/g, "s").replace(/kh/g, "k").replace(/gh/g, "g")
    .replace(/bh/g, "b").replace(/dh/g, "d").replace(/th/g, "t")
    .replace(/z/g, "j").replace(/v/g, "b").replace(/q/g, "k").replace(/w/g, "o")
    .replace(/(.)\1+/g, "$1");
  const first = /^[aeiouy]/.test(t) ? "a" : t[0];
  return first + t.slice(1).replace(/[aeiouy]/g, "");
}

function editDistance(a, b) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 1) return 2;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

// Built once, when the module loads.
const BY_SPELLING = new Map();
const BY_SKELETON = new Map();
for (const { say, terms } of SYNONYMS) {
  for (const w of say) {
    const p = plain(w);
    if (!BY_SPELLING.has(p)) BY_SPELLING.set(p, new Set());
    terms.forEach((t) => BY_SPELLING.get(p).add(t));
    const k = skeleton(w);
    if (k.length >= 3 || isBangla(k)) {
      if (!BY_SKELETON.has(k)) BY_SKELETON.set(k, new Set());
      terms.forEach((t) => BY_SKELETON.get(k).add(t));
    }
  }
}

// All dictionary terms a typed word could mean (empty array when the word is not in the dictionary).
export function expandWord(word) {
  const p = plain(word);
  if (!p) return [];
  const out = new Set(BY_SPELLING.get(p) || []);
  if (isBangla(p)) return [...out];
  const k = skeleton(p);
  if (k.length >= 3) {
    BY_SKELETON.get(k)?.forEach((t) => out.add(t));
    if (!out.size) for (const [key, terms] of BY_SKELETON) if (editDistance(k, key) <= 1) terms.forEach((t) => out.add(t));
  }
  return [...out];
}

// "lal shirt dao" -> [{ raw: "lal", alts: [...] }, { raw: "shirt", alts: [...] }]
export function parseQuery(q) {
  const words = lower(q).split(/\s+/).filter(Boolean);
  const useful = words.filter((w) => !STOPWORDS.has(plain(w)));
  return (useful.length ? useful : words).map((raw) => ({ raw, alts: expandWord(raw) }));
}

const termRegex = new Map();
function termMatches(haystack, term) {
  if (isBangla(term) || /^\s*$/.test(term)) return haystack.includes(term);
  const t = lower(term);
  if (!termRegex.has(t)) termRegex.set(t, new RegExp(`(?:^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&")}`));
  return termRegex.get(t).test(haystack);
}

// haystack must already be lowercase (catalog.js does that).
export function matchesQuery(haystack, groups) {
  // Short words ("men", "tee", "bag") must start a word, otherwise "men" would also hit "women".
  const rawHit = (raw) => (raw.length <= 3 ? termMatches(haystack, raw) : haystack.includes(raw));
  return groups.every(({ raw, alts }) => rawHit(raw) || alts.some((t) => termMatches(haystack, t)));
}
