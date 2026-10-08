// Season-aware copy for the regular promo slide ("Refresh Your Wardrobe"), so it never says "autumn" in summer.
// The season comes from the month in Dhaka time; change MONTH_TO_SEASON if you want different boundaries
// (e.g. to follow Bangladesh's six seasons instead of the four fashion seasons).
// Optional: a photo per season in data/banners.js -> BANNERS.v2PromoSeason = { spring: "...", summer: "...", ... }.

export const MONTH_TO_SEASON = {
  1: "winter", 2: "winter", 3: "spring", 4: "spring", 5: "spring", 6: "summer",
  7: "summer", 8: "summer", 9: "autumn", 10: "autumn", 11: "autumn", 12: "winter",
};

export const SEASON_COPY = {
  spring: {
    en: { title: "Spring, Freshly Dressed", text: "Light layers, soft colours and easy cottons for the first warm days." },
    bn: { title: "বসন্তের নতুন সাজ", text: "হালকা লেয়ার, নরম রং আর আরামদায়ক সুতির পোশাক — উষ্ণ দিনের শুরুর জন্য।" },
  },
  summer: {
    en: { title: "Cool, Light, Summer-Ready", text: "Breathable linens, airy cottons and bright colours to beat the heat." },
    bn: { title: "গ্রীষ্মের হালকা সাজ", text: "গরমের দিনে আরাম — হালকা লিনেন, বাতাস চলাচলের সুতি আর উজ্জ্বল রং।" },
  },
  autumn: {
    en: { title: "Refresh Your Wardrobe", text: "Explore the autumn edit — layers, knits and quiet neutrals for cooler days." },
    bn: { title: "শরতের নতুন সাজ", text: "শরতের নতুন কালেকশন দেখুন। লেয়ার, নিট আর শান্ত রঙের পোশাক।" },
  },
  winter: {
    en: { title: "Warm, Cosy, Winter-Ready", text: "Wool blends, chunky knits and warm layers for the cold mornings." },
    bn: { title: "শীতের উষ্ণ সাজ", text: "উলের মিশ্রণ, মোটা নিট আর গরম লেয়ার — ঠান্ডা সকালের জন্য।" },
  },
};

export function currentSeason(now = Date.now()) {
  const month = Number(new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone: "Asia/Dhaka" }).format(now));
  return MONTH_TO_SEASON[month] || "autumn";
}
