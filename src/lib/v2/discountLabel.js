// "40% OFF" / "৳200 OFF" (bn: "৪০% ছাড়" / "৳২০০ ছাড়"). Pure, shared by the admin form preview and the storefront banners.
const BN = "০১২৩৪৫৬৭৮৯";
export function discountLabel(type, value, lang = "en") {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  const percentage = String(type || "percentage") !== "fixed";
  const num = String(percentage ? Math.min(n, 100) : n);
  if (lang === "bn") return `${percentage ? "" : "৳"}${num.replace(/\d/g, (d) => BN[d])}${percentage ? "%" : ""} ছাড়`;
  return `${percentage ? "" : "৳"}${num}${percentage ? "%" : ""} OFF`;
}
