// Mix & match outfit builder: slots, saved looks (localStorage) and share links. Pure helpers, no React.
export const LOOKS_KEY = "avenor:v2:looks";
export const MAX_SAVED = 6;
export const SLOTS = ["top", "bottom", "layer"];
const SLOT_OF = { shirts: "top", tshirts: "top", kurtas: "top", jeans: "bottom", jackets: "layer" };
export const slotOf = (category) => SLOT_OF[category] || null;
export const GENDERS = ["men", "women", "kids"];

export function loadLooks() {
  try {
    const list = JSON.parse(localStorage.getItem(LOOKS_KEY) || "[]");
    return Array.isArray(list) ? list.filter((l) => l && l.picks && GENDERS.includes(l.gender)) : [];
  } catch { return []; }
}
export function storeLooks(list) {
  try { localStorage.setItem(LOOKS_KEY, JSON.stringify(list.slice(0, MAX_SAVED))); } catch { /* private mode */ }
}
// Backend hook: when the API exists, POST /looks here and return { id, shareUrl }. Until then looks stay on this device.
export async function postLook(/* look */) { return null; }

export function shareUrl(origin, gender, picks) {
  const q = new URLSearchParams({ g: gender });
  SLOTS.forEach((s) => { if (picks[s]) q.set(s, String(picks[s])); });
  return `${origin}/outfit?${q.toString()}`;
}
export function parseShare(search, catalog) {
  const q = new URLSearchParams(search);
  const gender = GENDERS.includes(q.get("g")) ? q.get("g") : null;
  const picks = {};
  SLOTS.forEach((s) => {
    const p = catalog.find((x) => String(x.id) === q.get(s));
    if (p && slotOf(p.category) === s) picks[s] = p.id;
  });
  return Object.keys(picks).length ? { gender, picks } : null;
}

export const LOOK_COPY = {
  en: {
    title: "Build a Look", lead: "Pick a top, bottoms and a layer, then add the whole outfit to your cart in one click.",
    forWho: "Building for", genders: { men: "Men", women: "Women", kids: "Kids" },
    slots: { top: "Top", bottom: "Bottoms", layer: "Layer" }, choose: "Choose a {slot}", none: "Nothing here for this group yet.",
    yourLook: "Your look", size: "Size", color: "Color", pickSize: "Choose a size", yourSize: "Your size", outOfStock: "Out of stock",
    total: "Outfit total", pieces: "{n} pieces", add: "Add outfit to cart", added: "Outfit added to cart ({n} items)", sizeError: "Choose a size for each piece.",
    shuffle: "Surprise me", save: "Save look", saved: "Look saved on this device", share: "Copy share link", copied: "Link copied", remove: "Remove",
    savedTitle: "Saved looks", load: "Load", delete: "Delete", empty: "Pick at least one piece to start.", limit: "You can keep up to {n} looks. Delete one to save another.",
  },
  bn: {
    title: "লুক বানান", lead: "একটি টপ, বটম আর লেয়ার বেছে নিন, তারপর এক ক্লিকে পুরো আউটফিট কার্টে যোগ করুন।",
    forWho: "কার জন্য", genders: { men: "পুরুষ", women: "নারী", kids: "বাচ্চা" },
    slots: { top: "টপ", bottom: "বটম", layer: "লেয়ার" }, choose: "{slot} বেছে নিন", none: "এই ক্যাটাগরিতে এখনো কিছু নেই।",
    yourLook: "আপনার লুক", size: "সাইজ", color: "রঙ", pickSize: "সাইজ বেছে নিন", yourSize: "আপনার সাইজ", outOfStock: "স্টক নেই",
    total: "আউটফিটের মোট দাম", pieces: "{n} টি পণ্য", add: "আউটফিট কার্টে যোগ করুন", added: "আউটফিট কার্টে যোগ হয়েছে ({n} টি পণ্য)", sizeError: "প্রতিটি পণ্যের সাইজ বেছে নিন।",
    shuffle: "এলোমেলো বাছাই", save: "লুক সেভ করুন", saved: "লুক এই ডিভাইসে সেভ হয়েছে", share: "শেয়ার লিংক কপি করুন", copied: "লিংক কপি হয়েছে", remove: "বাদ দিন",
    savedTitle: "সেভ করা লুক", load: "খুলুন", delete: "মুছুন", empty: "শুরু করতে অন্তত একটি পণ্য বেছে নিন।", limit: "সর্বোচ্চ {n} টি লুক রাখা যায়। নতুন সেভ করতে একটি মুছুন।",
  },
};
