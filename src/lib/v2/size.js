// Size passport: pure helpers (no React). The profile lives in the store (V2StoreProvider) and localStorage.
// To move to the backend later: keep recommendSize() and swap load/save in the provider for API calls.
export const SIZE_KEY = "avenor:v2:size-passport";
export const EMPTY_PASSPORT = { height: "", weight: "", chest: "", waist: "" };
export const PASSPORT_RANGES = { height: [100, 230], weight: [25, 250], chest: [60, 160], waist: [50, 150] };

const LADDER = ["XS", "S", "M", "L", "XL", "XXL"];
const CHEST_CUTS = [86, 94, 102, 110, 118];   // cm: < 86 XS, < 94 S, < 102 M, < 110 L, < 118 XL, else XXL
const WEIGHT_CUTS = [50, 60, 72, 85, 100];    // kg, same idea (used when chest is missing)
const TALL_CM = 183;                          // tall people move one letter size up

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const band = (value, cuts) => { const i = cuts.findIndex((c) => value < c); return i === -1 ? cuts.length : i; };

// Keep only numbers inside a realistic range, as strings (so inputs stay controlled).
export function cleanPassport(raw = {}) {
  const out = { ...EMPTY_PASSPORT };
  for (const k of Object.keys(PASSPORT_RANGES)) {
    const n = num(raw[k]); const [lo, hi] = PASSPORT_RANGES[k];
    if (n >= lo && n <= hi) out[k] = String(Math.round(n * 10) / 10);
  }
  return out;
}
export const hasPassport = (p) => !!(p && (num(p.chest) || num(p.weight) || num(p.waist)));
export const passportError = (raw = {}) =>
  Object.keys(PASSPORT_RANGES).some((k) => String(raw[k] ?? "").trim() !== "" && !cleanPassport(raw)[k]);

// "letters" (S–XL) | "waist" (28–34) | null (kids sizes like 4Y, one size)
export function sizeKind(product) {
  const s = product?.sizes || [];
  if (!s.length) return null;
  if (s.every((x) => LADDER.includes(x))) return "letters";
  if (s.every((x) => /^\d{2}$/.test(x))) return "waist";
  return null;
}

const nearest = (targets, want) => targets.reduce((best, t) => {
  const d = Math.abs(t.v - want), bd = Math.abs(best.v - want);
  return d < bd || (d === bd && t.v > best.v) ? t : best;
}).s;

// Returns one of product.sizes, or null when we can't say (no measurements, kids, one size).
export function recommendSize(passport, product) {
  const kind = sizeKind(product);
  if (!kind || !hasPassport(passport)) return null;
  const chest = num(passport.chest), weight = num(passport.weight), height = num(passport.height), waist = num(passport.waist);

  if (kind === "letters") {
    const a = chest ? band(chest, CHEST_CUTS) : null;
    const b = weight ? band(weight, WEIGHT_CUTS) : null;
    if (a === null && b === null) return null;
    let idx = a !== null && b !== null ? Math.ceil((a + b) / 2) : (a ?? b); // between two sizes -> size up
    if (height >= TALL_CM) idx += 1;
    idx = Math.min(idx, LADDER.length - 1);
    return nearest(product.sizes.map((s) => ({ s, v: LADDER.indexOf(s) })), idx);
  }

  const inches = waist ? waist / 2.54 : weight ? 28 + (weight - 55) * 0.2 : 0; // waist in cm -> inches, else estimate from weight
  if (!inches) return null;
  return nearest(product.sizes.map((s) => ({ s, v: Number(s) })), inches);
}

// Size guide table. `fill` is what "Use this size" puts in the form (mid-points of each range; they map back to the same size).
export const SIZE_CHART = {
  tops: [
    { size: "S", chest: "86–93", weight: "50–59", height: "160–167", fill: { height: "165", weight: "55", chest: "90" } },
    { size: "M", chest: "94–101", weight: "60–71", height: "168–174", fill: { height: "171", weight: "66", chest: "98" } },
    { size: "L", chest: "102–109", weight: "72–84", height: "175–180", fill: { height: "178", weight: "78", chest: "106" } },
    { size: "XL", chest: "110–117", weight: "85–99", height: "175–185", fill: { height: "180", weight: "92", chest: "114" } },
  ],
  jeans: [
    { size: "28", waist: "69–73", fill: { waist: "71" } },
    { size: "30", waist: "74–78", fill: { waist: "76" } },
    { size: "32", waist: "79–83", fill: { waist: "81" } },
    { size: "34", waist: "84–88", fill: { waist: "86" } },
  ],
};

// UI copy (kept here so the English / Bangla strings live next to the feature).
export const SIZE_COPY = {
  en: {
    title: "Size passport", intro: "Save your measurements once and we’ll highlight your size on every product.",
    height: "Height (cm)", weight: "Weight (kg)", chest: "Chest (cm)", waist: "Waist (cm, for jeans)", optional: "optional",
    save: "Save size passport", clear: "Clear", saved: "Size passport saved", cleared: "Size passport cleared",
    needOne: "Add your chest or weight so we can suggest a size.", range: "Please use realistic measurements.",
    yourSizes: "Your sizes", tops: "Tops, dresses & jackets", jeans: "Jeans", none: "Add measurements to see your sizes.",
    note: "A guide for adult sizes. Between two sizes? We size up.",
    yourSize: "Your size", select: "Select", selected: "Selected", fromProfile: "From your size passport",
    prompt: "Add your measurements to see your size",
    guide: "Size guide", guideClose: "Hide size guide", guideHint: "Pick a size to fill in the boxes below. You can still edit the numbers, then save.",
    cSize: "Size", cChest: "Chest (cm)", cWeight: "Weight (kg)", cHeight: "Height (cm)", cWaistIn: "Waist (in)", cWaist: "Waist (cm)",
    use: "Use", using: "Selected", filled: "Filled from size {size}. Save to keep it.", kidsNote: "Kids’ sizes (4Y–10Y) are chosen by the child’s age.",
    names: { height: "Height", weight: "Weight", chest: "Chest", waist: "Waist" }, check: "Please check:",
  },
  bn: {
    title: "সাইজ পাসপোর্ট", intro: "একবার মাপ সেভ করুন, প্রতিটি পণ্যে আপনার সাইজ হাইলাইট হয়ে যাবে।",
    height: "উচ্চতা (সেমি)", weight: "ওজন (কেজি)", chest: "বুকের মাপ (সেমি)", waist: "কোমরের মাপ (সেমি, জিন্সের জন্য)", optional: "ঐচ্ছিক",
    save: "সাইজ পাসপোর্ট সেভ করুন", clear: "মুছুন", saved: "সাইজ পাসপোর্ট সেভ হয়েছে", cleared: "সাইজ পাসপোর্ট মোছা হয়েছে",
    needOne: "সাইজ বলতে বুকের মাপ বা ওজন দিন।", range: "বাস্তবসম্মত মাপ দিন।",
    yourSizes: "আপনার সাইজ", tops: "টপ, ড্রেস ও জ্যাকেট", jeans: "জিন্স", none: "সাইজ দেখতে মাপ যোগ করুন।",
    note: "বড়দের সাইজের জন্য একটি ধারণা। দুই সাইজের মাঝামাঝি হলে বড়টি দিই।",
    yourSize: "আপনার সাইজ", select: "বেছে নিন", selected: "বাছাই করা", fromProfile: "আপনার সাইজ পাসপোর্ট থেকে",
    prompt: "সাইজ দেখতে আপনার মাপ যোগ করুন",
    guide: "সাইজ গাইড", guideClose: "সাইজ গাইড লুকান", guideHint: "নিচের ঘরগুলো ভরতে একটি সাইজ বেছে নিন। পরে সংখ্যা বদলাতে পারবেন, তারপর সেভ করুন।",
    cSize: "সাইজ", cChest: "বুক (সেমি)", cWeight: "ওজন (কেজি)", cHeight: "উচ্চতা (সেমি)", cWaistIn: "কোমর (ইঞ্চি)", cWaist: "কোমর (সেমি)",
    use: "বেছে নিন", using: "বাছাই করা", filled: "সাইজ {size} থেকে ভরা হয়েছে। রাখতে সেভ করুন।", kidsNote: "বাচ্চাদের সাইজ (৪Y–১০Y) বয়স দেখে বাছাই হয়।",
    names: { height: "উচ্চতা", weight: "ওজন", chest: "বুক", waist: "কোমর" }, check: "দেখে নিন:",
  },
};
