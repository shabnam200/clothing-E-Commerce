export const fmtNum = (n, lang, opts) => n.toLocaleString(lang === "en" ? "en-US" : "bn-BD", opts);
export const fmtPrice = (n, lang) => `৳${fmtNum(n, lang)}`;
export const fmtRating = (n, lang) => fmtNum(n, lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const cx = (...c) => c.filter(Boolean).join(" ");
