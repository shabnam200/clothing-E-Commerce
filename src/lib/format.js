// Numbers follow the active language (Bangla digits for "bn").
export const formatNumber = (n, lang) => n.toLocaleString(lang === "en" ? "en-US" : "bn-BD");
export const formatPrice = (n, lang) => `৳${formatNumber(n, lang)}`;
