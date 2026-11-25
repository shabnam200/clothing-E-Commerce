"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/ui/AppLink";
import { useRouter } from "next/navigation";
import { FiPlus, FiX, FiTrash2, FiEdit2, FiSave, FiHome, FiPhone, FiToggleRight, FiImage, FiFileText, FiLayout, FiSearch, FiArrowLeft, FiArrowUp, FiArrowDown, FiArrowRight, FiMenu, FiCheck, FiUpload, FiAlertCircle, FiExternalLink } from "react-icons/fi";
import enMessages from "@/messages/v2/en";
import bnMessages from "@/messages/v2/bn";
import { FOOTER_HREFS, V2_SOCIALS } from "@/config/v2";
import { HOMEPAGE_MENU_DEFAULTS, HOMEPAGE_MENU_KEYS, HOMEPAGE_SECTION_ORDER, HOMEPAGE_SECTION_TITLES_DEFAULTS } from "@/config/homepage";
import { discountLabel } from "@/lib/v2/discountLabel";

const emptyCampaign = () => ({ type: "banner", placement: "hero", title_bn: "", title_en: "", content_bn: "", content_en: "", image_url: "", target_url: "/shop", starts_at: "", ends_at: "", order_deadline: "", status: "1", sort_order: "0", product_ids: [], discount_type: "percentage", discount_value: "" });

// ---- campaign link helpers -------------------------------------------------------------------------------------------------------
// A campaign button opens /shop?category=<key>. The key must be the shop's real one ("skin-care"); typing "skincare" by hand used to open an
// empty shop. The Link field now offers the real categories, and fixShopLink() corrects a near-miss when the campaign is saved.
const flatKey = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const shopCategoryOf = (url) => {
  if (!/^\//.test(String(url || ""))) return null; // only this shop's own relative links
  try { const u = new URL(url, "http://x"); return u.pathname.replace(/\/+$/, "") === "/shop" ? (u.searchParams.get("category") || "") : null; } catch { return null; }
};
const shopCategoryHref = (key) => (key ? `/shop?category=${encodeURIComponent(key)}` : "/shop");
function fixShopLink(url, categories) {
  const key = shopCategoryOf(url);
  if (!key || !categories.length || categories.some((item) => item.key === key)) return url;
  const hit = categories.find((item) => flatKey(item.key) === flatKey(key) || flatKey(item.label) === flatKey(key));
  if (!hit) return url;
  const next = new URL(url, "http://x");
  next.searchParams.set("category", hit.key);
  return `${next.pathname}${next.search}${next.hash}`;
}
const CAMPAIGN_IMAGE_MAX_BYTES = 900 * 1024;
async function prepareCampaignImage(file) {
  if (!file || file.size <= CAMPAIGN_IMAGE_MAX_BYTES) return file;
  if (typeof createImageBitmap !== "function") throw new Error("This image is too large to upload. Please choose an image under 900 KB.");
  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(1, 2400 / bitmap.width, 1800 / bitmap.height);
    for (let attempt = 0; attempt < 18; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", Math.max(0.8, 0.94 - attempt * 0.02)));
      if (blob && blob.size <= CAMPAIGN_IMAGE_MAX_BYTES) {
        const name = file.name.replace(/\.[^.]+$/, "") || "campaign-image";
        return new File([blob], `${name}.webp`, { type: "image/webp", lastModified: Date.now() });
      }
      if (attempt % 3 === 2) scale *= 0.9;
    }
    throw new Error("Could not reduce this image enough. Please choose a smaller image.");
  } finally {
    bitmap.close?.();
  }
}
// What kind of thing is being added. One choice sets the stored `type` + `placement`, and decides which fields the form needs.
const FESTIVALS = ["seasonal", "theme", "eid", "puja", "boishakh"];
const KIND_DEFAULTS = { main: { type: "banner", placement: "hero" }, offer: { type: "offer", placement: "promo" }, bar: { type: "offer", placement: "announcement" }, festival: { type: "seasonal", placement: "promo" } };
const placementOf = (c) => c.placement || (c.type === "offer" ? "announcement" : FESTIVALS.includes(c.type) ? "promo" : "hero");
const kindOf = (c) => (FESTIVALS.includes(c.type) ? "festival" : placementOf(c) === "announcement" ? "bar" : placementOf(c) === "promo" ? "offer" : "main");
const fillN = (text, n) => String(text).replace("{n}", n);

// Search + tick products instead of a Ctrl-click list box. Chosen products stay visible as removable chips.
function ProductPicker({ products, value, onChange, t, lang }) {
  const [q, setQ] = useState("");
  const chosen = new Set(value.map(String));
  const needle = q.trim().toLowerCase();
  const shown = needle ? products.filter((p) => String(p.name).toLowerCase().includes(needle)) : products;
  const toggle = (id) => onChange(chosen.has(String(id)) ? value.filter((v) => String(v) !== String(id)) : [...value, String(id)]);
  const chips = value.map((id) => products.find((p) => String(p.id) === String(id))).filter(Boolean);
  return (
    <div className="v2-adm-picker">
      <div className="v2-adm-picker__top">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.pkSearch} aria-label={t.pkSearch} />
        <span className="v2-adm-picker__count" aria-live="polite">{fillN(t.pkSelected, chosen.size)}</span>
      </div>
      {chips.length > 0 && <ul className="v2-adm-picker__chips">{chips.map((p) => <li key={p.id}><span>{p.name}</span><button type="button" aria-label={`${t.remove}: ${p.name}`} onClick={() => toggle(p.id)}><FiX aria-hidden="true" /></button></li>)}</ul>}
      <div className="v2-adm-picker__actions">
        <button type="button" onClick={() => onChange(Array.from(new Set([...value.map(String), ...shown.map((p) => String(p.id))])))} disabled={!shown.length}>{t.pkSelectShown}</button>
        <button type="button" onClick={() => onChange([])} disabled={!value.length}>{t.pkClear}</button>
      </div>
      <ul className="v2-adm-picker__list" role="listbox" aria-multiselectable="true" aria-label={t.pkHeading}>
        {shown.length === 0 && <li className="v2-adm-picker__empty">{t.pkEmpty}</li>}
        {shown.map((p) => (
          <li key={p.id} role="option" aria-selected={chosen.has(String(p.id))}>
            <label><input type="checkbox" checked={chosen.has(String(p.id))} onChange={() => toggle(p.id)} /><span className="v2-adm-picker__name">{p.name}</span><span className="v2-adm-picker__price">BDT {p.shop_price}{p.has_discount ? ` · ${discountLabel(p.discount_type, p.discount_value, lang)}` : ""}</span></label>
          </li>
        ))}
      </ul>
    </div>
  );
}

const footerDefaults = {
  en: { ...enMessages.footer },
  bn: { ...bnMessages.footer },
};
const footerLinkDefaults = { serviceLinks: FOOTER_HREFS.service, aboutLinks: FOOTER_HREFS.about };
const footerLinkKeys = new Set(Object.keys(footerLinkDefaults));
const infoPageSlugs = ["shipping", "returns", "size", "faq", "about", "privacy", "terms"];
const infoPageDefaults = { en: enMessages.info.pages, bn: bnMessages.info.pages };
const clone = (value) => JSON.parse(JSON.stringify(value));
const footerFieldGroups = {
  content: ["tagline", "service", "about", "follow", "rights"],
  serviceLinks: ["serviceLinks"],
  aboutLinks: ["aboutLinks"],
  payments: ["payments"],
};
const normalizeFooter = (language, stored = {}) => {
  const content = { ...footerDefaults[language], ...stored };
  for (const key of ["newsletterTitle", "newsletterText", "newsletterPlaceholder", "newsletterLabel", "newsletterButton", "newsletterOk", "newsletterBad"]) delete content[key];
  for (const key of footerLinkKeys) {
    const links = Array.isArray(stored[key]) ? stored[key] : footerDefaults[language][key] || [];
    content[key] = links.map((link, index) => typeof link === "string"
      ? { label: link, url: footerLinkDefaults[key][index] || "" }
      : { label: link?.label || link?.name || "", url: link?.url || link?.href || footerLinkDefaults[key][index] || "" })
      .filter((link) => key !== "aboutLinks" || !/our story|আমাদের গল্প/i.test(link.label));
  }
  return content;
};
const copy = {
  bn: { title: "Website Management", close: "\u09ac\u09a8\u09cd\u09a7", settings: "\u09b8\u09be\u0987\u099f \u09b8\u09c7\u099f\u09bf\u0982\u09b8", campaigns: "\u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0 \u0993 \u0985\u09ab\u09be\u09b0", loading: "\u09b2\u09cb\u09a1 \u09b9\u099a\u09cd\u099b\u09c7...", save: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3", saved: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09bf\u09a4 \u09b9\u09af\u09bc\u09c7\u099b\u09c7", failed: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3 \u09b9\u09af\u09bc\u09a8\u09bf", delivery: "\u09a1\u09c7\u09b2\u09bf\u09ad\u09be\u09b0\u09bf", fee: "\u09a1\u09c7\u09b2\u09bf\u09ad\u09be\u09b0\u09bf \u099a\u09be\u09b0\u09cd\u099c", freeOver: "\u09ab\u09cd\u09b0\u09bf \u09a1\u09c7\u09b2\u09bf\u09ad\u09be\u09b0\u09bf \u09b8\u09c0\u09ae\u09be", express: "\u098f\u0995\u09cd\u09b8\u09aa\u09cd\u09b0\u09c7\u09b8 \u099a\u09be\u09b0\u09cd\u099c", returns: "\u09b0\u09bf\u099f\u09be\u09b0\u09cd\u09a8 \u09b8\u09ae\u09af\u09bc (\u09a6\u09bf\u09a8)", support: "\u09af\u09cb\u0997\u09be\u09af\u09cb\u0997", phone: "\u09ab\u09cb\u09a8", whatsapp: "WhatsApp", email: "\u0987\u09ae\u0987\u09b2", address: "\u09a0\u09bf\u0995\u09be\u09a8\u09be", footer: "\u09ab\u09c1\u099f\u09be\u09b0 (JSON)", socials: "\u09b8\u09cb\u09b6\u09cd\u09af\u09be\u09b2 \u09b2\u09bf\u0982\u0995 (JSON)", newCampaign: "\u09a8\u09a4\u09c1\u09a8 \u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0 / \u0985\u09ab\u09be\u09b0", type: "\u09a7\u09b0\u09a8", banner: "\u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0", offer: "\u0985\u09ab\u09be\u09b0", titleBn: "\u09b6\u09bf\u09b0\u09cb\u09a8\u09be\u09ae (\u09ac\u09be\u0982\u09b2\u09be)", titleEn: "Title (English)", contentBn: "\u09ac\u09bf\u09ac\u09b0\u09a3 (\u09ac\u09be\u0982\u09b2\u09be)", contentEn: "Description (English)", image: "\u099b\u09ac\u09bf \u0986\u09aa\u09b2\u09cb\u09a1", imageUrl: "\u0985\u09a5\u09ac\u09be \u099b\u09ac\u09bf\u09b0 URL", target: "\u09b2\u09bf\u0982\u0995", active: "\u099a\u09be\u09b2\u09c1", order: "\u0995\u09cd\u09b0\u09ae", start: "\u09b6\u09c1\u09b0\u09c1", end: "\u09b6\u09c7\u09b7", deadline: "\u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u09a1\u09c7\u09a1\u09b2\u09be\u0987\u09a8", saveCampaign: "\u0995\u09cd\u09af\u09be\u09ae\u09cd\u09aa\u09c7\u0987\u09a8 \u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3", edit: "\u098f\u09a1\u09bf\u099f", remove: "\u09ae\u09c1\u099b\u09c1\u09a8", noCampaigns: "\u0995\u09cb\u09a8\u09cb \u0995\u09cd\u09af\u09be\u09ae\u09cd\u09aa\u09c7\u0987\u09a8 \u09a8\u09c7\u0987", cancel: "\u09ac\u09be\u09a4\u09bf\u09b2" },
  en: { title: "Website Management", close: "Close", settings: "Site settings", campaigns: "Banners & offers", loading: "Loading...", save: "Save changes", saved: "Changes saved.", failed: "Could not save changes.", delivery: "Delivery", fee: "Delivery fee", freeOver: "Free delivery from", express: "Express fee", returns: "Return window (days)", support: "Contact details", phone: "Phone", whatsapp: "WhatsApp", email: "Email", address: "Address", footer: "Footer content (JSON)", socials: "Social links (JSON)", newCampaign: "New banner / offer", type: "Type", banner: "Banner", offer: "Offer", titleBn: "Title (Bangla)", titleEn: "Title (English)", contentBn: "Description (Bangla)", contentEn: "Description (English)", image: "Upload image", imageUrl: "Or image URL", target: "Link", active: "Active", order: "Order", start: "Starts at", end: "Ends at", deadline: "Order deadline", saveCampaign: "Save campaign", edit: "Edit", remove: "Delete", noCampaigns: "No banners or offers yet.", cancel: "Cancel" },
};

Object.assign(copy.bn, {
  namesHelp: "আপনার দোকানের নাম, ওয়েব ঠিকানা এবং সাইটে দেখানোর ভাষা এখান থেকে ঠিক করুন।",
  subdomain: "স্টোরের ঠিকানা (সাবডোমেইন)", subdomainHint: "আপনার স্টোরের লিংক:",
  customDomainHint: "নিজের ডোমেইন থাকলে লিখুন (যেমন avenor.com)। সেটআপ না হওয়া পর্যন্ত সাবডোমেইন দিয়েই স্টোর খোলা যাবে।",
  footer: "ফুটার কনটেন্ট", socials: "সোশ্যাল লিংক", addRow: "যোগ করুন", remove: "মুছুন",
  footerEn: "English ফুটার", footerBn: "বাংলা ফুটার", platform: "প্ল্যাটফর্ম", linkName: "লিংকের নাম", url: "লিংক URL", destination: "লিংকের গন্তব্য", linkHelp: "নিজের সাইটের পেজ হলে /info/about-এর মতো path দিন, বাইরের সাইট হলে https:// URL দিন।", brandTab: "ব্র্যান্ড", contactTab: "যোগাযোগ", footerTab: "ফুটার", socialsTab: "সোশ্যাল",
  english: "English", bangla: "বাংলা", copyGroup: "লেখা", serviceGroup: "সার্ভিস লিংক", companyGroup: "কোম্পানি লিংক", paymentsGroup: "পেমেন্ট",
newsletterText: "নিউজলেটার বিবরণ", newsletterLabel: "ইমেইল লেবেল", newsletterPlaceholder: "ইনপুট placeholder", newsletterButton: "সাবস্ক্রাইব বাটন", newsletterOk: "সফল বার্তা", newsletterBad: "ভুল ইমেইলের বার্তা",
  tagline: "ব্র্যান্ড পরিচিতি", quick: "দ্রুত লিংক শিরোনাম", service: "সার্ভিস শিরোনাম", about: "কোম্পানি শিরোনাম", follow: "সোশ্যাল শিরোনাম", rights: "কপিরাইট লেখা",
  quickLinks: "দ্রুত লিংক", serviceLinks: "সার্ভিস লিংক", aboutLinks: "কোম্পানি লিংক", payments: "পেমেন্ট পদ্ধতি",
  brandHeading: "\u09ac\u09cd\u09b0\u09cd\u09af\u09be\u09a8\u09cd\u09a1 \u0993 \u09ad\u09be\u09b7\u09be",
  websiteNameEn: "\u0993\u09af\u09bc\u09c7\u09ac\u09b8\u09be\u0987\u099f\u09c7\u09b0 \u09a8\u09be\u09ae (English, \u09ac\u09be\u09a7\u09cd\u09af\u09a4\u09be\u09ae\u09c2\u09b2\u0995)",
  websiteNameBn: "\u0993\u09af\u09bc\u09c7\u09ac\u09b8\u09be\u0987\u099f\u09c7\u09b0 \u09a8\u09be\u09ae (\u09ac\u09be\u0982\u09b2\u09be, \u0987\u099a\u09cd\u099b\u09be\u09a7\u09c0\u09a8)",
  languageMode: "\u0995\u09cb\u09a8 \u09ad\u09be\u09b7\u09be\u09af\u09bc \u09b8\u09be\u0987\u099f \u09a6\u09c7\u0996\u09be\u09ac\u09c7",
  englishOnly: "\u09b6\u09c1\u09a7\u09c1 English", banglaOnly: "\u09b6\u09c1\u09a7\u09c1 \u09ac\u09be\u0982\u09b2\u09be", bothLanguages: "English \u0993 \u09ac\u09be\u0982\u09b2\u09be",
  nameRequired: "English \u09a8\u09be\u09ae \u09a6\u09c7\u0993\u09af\u09bc\u09be \u09ac\u09be\u09a7\u09cd\u09af\u09a4\u09be\u09ae\u09c2\u09b2\u0995।",
  siteLogo: "\u09b9\u09c7\u09a1\u09be\u09b0 \u09b2\u0997\u09cb", favicon: "Favicon", brandLogo: "\u09ab\u09c1\u099f\u09be\u09b0\u09c7\u09b0 \u09ac\u09cd\u09b0\u09cd\u09af\u09be\u09a8\u09cd\u09a1 \u09b2\u0997\u09cb", chooseImage: "\u099b\u09ac\u09bf \u09ac\u09be\u099b\u09c1\u09a8 (PNG, JPG, WebP; 5 MB \u09aa\u09b0\u09cd\u09af\u09a8\u09cd\u09a4)", imageSaved: "\u09b2\u0997\u09cb \u0986\u09aa\u09b2\u09cb\u09a1 \u09b9\u09af\u09bc\u09c7\u099b\u09c7।",
});
Object.assign(copy.en, {
  namesHelp: "Set your store name, web address, and the language visitors see on your site.",
  subdomain: "Store address (subdomain)", subdomainHint: "Your store link:",
  customDomain: "Your own domain (optional)", customDomainHint: "Enter your own domain (for example avenor.com). Your subdomain remains available until setup is complete.",
  footer: "Footer content", socials: "Social links", addRow: "Add item", remove: "Remove",
  footerEn: "English footer", footerBn: "Bangla footer", platform: "Platform", linkName: "Link name", url: "Link URL", destination: "Destination URL", linkHelp: "For a page on this site, use a path like /info/about. For another site, use its full https:// URL.", brandTab: "Brand", contactTab: "Contact", footerTab: "Footer", socialsTab: "Social links",
  english: "English", bangla: "Bangla", copyGroup: "Footer copy", serviceGroup: "Service links", companyGroup: "Company links", paymentsGroup: "Payment methods",
newsletterText: "Newsletter description", newsletterLabel: "Email label", newsletterPlaceholder: "Input placeholder", newsletterButton: "Subscribe button", newsletterOk: "Success message", newsletterBad: "Invalid email message",
  tagline: "Brand tagline", quick: "Quick links heading", service: "Service heading", about: "Company heading", follow: "Social heading", rights: "Copyright text",
  quickLinks: "Quick links", serviceLinks: "Service links", aboutLinks: "Company links", payments: "Payment methods",
  brandHeading: "Brand & language", websiteNameEn: "Website name (English, required)", websiteNameBn: "Website name (Bangla, optional)",
  languageMode: "Website language", englishOnly: "English (en)", banglaOnly: "Bangla (bn)", bothLanguages: "English and Bangla",
  nameRequired: "Enter the website name in English.", siteLogo: "Header logo", favicon: "Favicon", brandLogo: "Footer brand logo",
  subdomain: "Store subdomain", subdomainHint: "Use lowercase letters, numbers, and hyphens between words.",
  customDomain: "Custom domain (optional)", customDomainHint: "Have your own domain (for example avenor.com)? Enter it here. Leave empty and your subdomain stays the main address.", domainInvalid: "Enter a valid domain such as avenor.com.",
  domainConnected: "Connected: visitors are sent to this domain.", domainPending: "Not connected yet (its DNS does not point to Dokani). Visitors keep using your subdomain until it does.",
  chooseImage: "Choose image (PNG, JPG, WebP; up to 5 MB)", imageSaved: "Image uploaded.",
});
// "https://WWW.Avenor.com/shop" -> "avenor.com" (the backend does the same, so link-style input is fine)
const normalizeDomain = (value) => String(value || "").trim().toLowerCase().replace(/^[a-z][a-z0-9+.-]*:\/\//, "").replace(/[/?#].*$/, "").replace(/\.$/, "").replace(/^www\./, "");
const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
Object.assign(copy.bn, {
  customDomain: "\u0995\u09be\u09b8\u09cd\u099f\u09ae \u09a1\u09cb\u09ae\u09c7\u0987\u09a8 (\u0990\u099a\u09cd\u099b\u09bf\u0995)",
  customDomainHint: "\u09a8\u09bf\u099c\u09c7\u09b0 \u09a1\u09cb\u09ae\u09c7\u0987\u09a8 \u09a5\u09be\u0995\u09b2\u09c7 \u09b2\u09bf\u0996\u09c1\u09a8 (\u09af\u09c7\u09ae\u09a8 avenor.com)\u0964 \u0996\u09be\u09b2\u09bf \u09b0\u09be\u0996\u09b2\u09c7 \u09b8\u09be\u09ac\u09a1\u09cb\u09ae\u09c7\u0987\u09a8\u0987 \u09ae\u09c2\u09b2 \u09a0\u09bf\u0995\u09be\u09a8\u09be \u09b9\u09ac\u09c7\u0964",
  domainInvalid: "\u09b8\u09a0\u09bf\u0995 \u09a1\u09cb\u09ae\u09c7\u0987\u09a8 \u09b2\u09bf\u0996\u09c1\u09a8, \u09af\u09c7\u09ae\u09a8 avenor.com\u0964",
  domainConnected: "\u09b8\u0982\u09af\u09c1\u0995\u09cd\u09a4: \u09ad\u09bf\u099c\u09bf\u099f\u09b0\u09b0\u09be \u098f\u0987 \u09a1\u09cb\u09ae\u09c7\u0987\u09a8\u09c7 \u09af\u09be\u09ac\u09c7\u0964",
  domainPending: "\u098f\u0996\u09a8\u09cb \u09b8\u0982\u09af\u09c1\u0995\u09cd\u09a4 \u09a8\u09af\u09bc (\u09a1\u09cb\u09ae\u09c7\u0987\u09a8\u09c7\u09b0 DNS \u09a6\u09cb\u0995\u09be\u09a8\u09c0\u09a4\u09c7 \u09aa\u09af\u09bc\u09c7\u09a8\u09cd\u099f \u0995\u09b0\u09be \u09a8\u09c7\u0987)\u0964 \u09af\u09a4\u0995\u09cd\u09b7\u09a3 \u09a8\u09be \u09b9\u09af\u09bc, \u09ad\u09bf\u099c\u09bf\u099f\u09b0\u09b0\u09be \u09b8\u09be\u09ac\u09a1\u09cb\u09ae\u09c7\u0987\u09a8\u09c7\u0987 \u09af\u09be\u09ac\u09c7\u0964",
  subdomain: "\u09b8\u09cd\u099f\u09cb\u09b0\u09c7\u09b0 \u09b8\u09be\u09ac\u09a1\u09cb\u09ae\u09c7\u0987\u09a8",
  subdomainHint: "\u09b6\u09c1\u09a7\u09c1 \u099b\u09cb\u099f \u09b9\u09be\u09a4\u09c7\u09b0 \u0987\u0982\u09b0\u09c7\u099c\u09bf \u0985\u0995\u09cd\u09b7\u09b0, \u09b8\u0982\u0996\u09cd\u09af\u09be \u0993 \u09ae\u09be\u099d\u0996\u09be\u09a8\u09c7 \u09b9\u09be\u0987\u09ab\u09c7\u09a8 \u09a6\u09bf\u09a8।",
});
Object.assign(copy.bn, { pagesTab: "\u09aa\u09c7\u099c\u09c7\u09b0 \u09b2\u09c7\u0996\u09be", pageSelect: "\u09aa\u09c7\u099c \u09ac\u09be\u099b\u09c1\u09a8", pageTitle: "\u09aa\u09c7\u099c\u09c7\u09b0 \u09b6\u09bf\u09b0\u09cb\u09a8\u09be\u09ae", pageLead: "\u09aa\u09c7\u099c\u09c7\u09b0 \u09aa\u09cd\u09b0\u09be\u09b0\u09ae\u09cd\u09ad\u09bf\u0995 \u09b2\u09c7\u0996\u09be", pageImage: "\u09aa\u09c7\u099c\u09c7\u09b0 \u099b\u09ac\u09bf", pageImageHelp: "\u099b\u09ac\u09bf \u0986\u09aa\u09b2\u09cb\u09a1 \u0995\u09b0\u09c1\u09a8 \u09ac\u09be URL \u09a6\u09bf\u09a8", pageBody: "\u09aa\u09c7\u099c\u09c7\u09b0 \u09b2\u09c7\u0996\u09be", upload: "\u0986\u09aa\u09b2\u09cb\u09a1" });
Object.assign(copy.en, { pagesTab: "Info pages", pageSelect: "Choose page", pageTitle: "Page title", pageLead: "Introductory text", pageImage: "Page image", pageImageHelp: "Upload an image or enter its URL", pageBody: "Page content", upload: "Upload" });

function dt(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

Object.assign(copy.bn, { seasonal: "\u09ae\u09cc\u09b8\u09c1\u09ae\u09bf", off: "\u09ac\u09a8\u09cd\u09a7", theme: "\u09a5\u09bf\u09ae" });
Object.assign(copy.en, { seasonal: "Seasonal", off: "Off", theme: "Theme" });
Object.assign(copy.bn, { featuresTab: "\u09ab\u09bf\u099a\u09be\u09b0 \u099a\u09be\u09b2\u09c1/\u09ac\u09a8\u09cd\u09a7", seoTab: "SEO", featureHeading: "\u0995\u09cb\u09a8 \u09b8\u09c7\u0995\u09b6\u09a8 \u09a6\u09c7\u0996\u09be\u09ac\u09c7", homeHero: "\u09b9\u09cb\u09ae\u09aa\u09c7\u099c \u09aa\u09cd\u09b0\u09a7\u09be\u09a8 \u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0", homeCategories: "\u0995\u09cd\u09af\u09be\u099f\u09be\u0997\u09b0\u09bf \u09b8\u09c7\u0995\u09b6\u09a8", homeProducts: "\u09aa\u09cd\u09b0\u09cb\u09a1\u09be\u0995\u09cd\u099f \u09b8\u09c7\u0995\u09b6\u09a8", homeLookbook: "\u09b2\u09c1\u0995\u09ac\u09c1\u0995 \u09b8\u09c7\u0995\u09b6\u09a8", homePromotions: "\u09aa\u09cd\u09b0\u09ae\u09cb\u09b6\u09a8 \u0995\u09cd\u09af\u09be\u09b0\u09be\u09b8\u09c7\u09b2", homePerks: "\u09b8\u09c1\u09ac\u09bf\u09a7\u09be\u09b0 \u09b8\u09c7\u0995\u09b6\u09a8", seoHeading: "\u09b8\u09be\u0987\u099f SEO \u09a4\u09a5\u09cd\u09af", seoTitle: "\u09aa\u09c7\u099c \u09b6\u09bf\u09b0\u09cb\u09a8\u09be\u09ae", seoDescription: "\u09ae\u09c7\u099f\u09be \u09ac\u09bf\u09ac\u09b0\u09a3", seoKeywords: "\u0995\u09c0\u0993\u09af\u09bc\u09be\u09b0\u09cd\u09a1 (comma separated)", seoImage: "Open Graph \u099b\u09ac\u09bf URL", placement: "\u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0\u09c7\u09b0 \u09b8\u09cd\u09a5\u09be\u09a8", heroPosition: "\u09b9\u09cb\u09ae\u09aa\u09c7\u099c\u09c7\u09b0 \u09ae\u09c2\u09b2 \u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0", promoPosition: "\u09b9\u09cb\u09ae\u09aa\u09c7\u099c \u09aa\u09cd\u09b0\u09ae\u09cb\u09b6\u09a8 \u0995\u09cd\u09af\u09be\u09b0\u09be\u09b8\u09c7\u09b2", announcePosition: "\u09b2\u09cb\u09a1\u09bc\u09be\u09b0\u09c7\u09b0 \u0989\u09aa\u09b0\u09c7\u09b0 \u0985\u09ab\u09be\u09b0 \u09ac\u09be\u09b0", typeBanner: "\u09aa\u09cd\u09b0\u09a7\u09be\u09a8 \u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0", typeOffer: "\u09a1\u09bf\u09b8\u0995\u09be\u0989\u09a8\u09cd\u099f \u0985\u09ab\u09be\u09b0", typeSeasonal: "\u09ae\u09cc\u09b8\u09c1\u09ae\u09bf \u0995\u09cd\u09af\u09be\u09ae\u09cd\u09aa\u09c7\u0987\u09a8" });
Object.assign(copy.en, { featuresTab: "Features", seoTab: "SEO", featureHeading: "Show these sections", homeHero: "Homepage hero banner", homeCategories: "Categories section", homeProducts: "Product showcases", homeLookbook: "Lookbook section", homePromotions: "Promotions carousel", homePerks: "Benefits section", seoHeading: "Search and sharing details", seoTitle: "Page title", seoDescription: "Meta description", seoKeywords: "Keywords (comma separated)", seoImage: "Open Graph image URL", placement: "Show banner in", heroPosition: "Homepage main banner", promoPosition: "Homepage promotions carousel", announcePosition: "Top announcement bar (text only)", typeBanner: "Main banner", typeOffer: "Discount offer", typeSeasonal: "Seasonal campaign" });
Object.assign(copy.bn, { requiredFieldsNote: "* চিহ্নিত ঘরগুলো পূরণ করা বাধ্যতামূলক।", uploadCampaignImage: "ছবি আপলোড (ঐচ্ছিক)", discountPercent: "ছাড়ের পরিমাণ (%)", discountAmount: "ছাড়ের পরিমাণ (টাকা)", discountHint: "নির্বাচিত পণ্যে এই ছাড় প্রযোজ্য হবে।" });
Object.assign(copy.en, { requiredFieldsNote: "Fields marked * are required.", uploadCampaignImage: "Upload image (optional)", discountPercent: "Discount percentage (%)", discountAmount: "Discount amount (BDT)", discountHint: "This discount will apply to the selected products." });

Object.assign(copy.en, {
  kindLabel: "What do you want to add?", kind_main: "Main banner", kind_offer: "Offer banner", kind_bar: "Top bar", kind_festival: "Festival theme",
  kindHelp_main: "Big banner at the top of the home page", kindHelp_offer: "Offer card in the promotions section", kindHelp_bar: "One line of text above the menu", kindHelp_festival: "Eid, Puja, Boishakh… changes the look of the site",
  festival: "Festival", pkHeading: "Products in this offer", pkHint: "Optional. Tick the products this offer is for.", pkSearch: "Search products", pkSelected: "{n} selected", pkSelectShown: "Select all shown", pkClear: "Clear", pkEmpty: "No product matches.",
  discountType: "Discount type", discountPct: "Percentage (%)", discountFixed: "Fixed amount (BDT)", discountPreview: "Shown on the banner:", discountNone: "Leave empty for an offer without a discount.",
  moreOptions: "Start/end dates & display order (optional)", legendOffer: "Offer products and discount", displayOrder: "Display order (lower shows first)",
});
Object.assign(copy.bn, {
  kindLabel: "কী যোগ করতে চান?", kind_main: "মূল ব্যানার", kind_offer: "অফার ব্যানার", kind_bar: "উপরের বার", kind_festival: "উৎসবের থিম",
  kindHelp_main: "হোম পেজের উপরের বড় ব্যানার", kindHelp_offer: "প্রমোশন সেকশনে অফার কার্ড", kindHelp_bar: "মেনুর উপরে এক লাইনের লেখা", kindHelp_festival: "ঈদ, পূজা, বৈশাখ… সাইটের থিম বদলায়",
  festival: "উৎসব", pkHeading: "এই অফারের পণ্য", pkHint: "ঐচ্ছিক। যে পণ্যগুলোর জন্য অফার, সেগুলো টিক দিন।", pkSearch: "পণ্য খুঁজুন", pkSelected: "{n}টি বাছাই করা", pkSelectShown: "দেখানো সব বাছুন", pkClear: "মুছে ফেলুন", pkEmpty: "কোনো পণ্য মিলছে না।",
  discountType: "ছাড়ের ধরন", discountPct: "শতাংশ (%)", discountFixed: "নির্দিষ্ট টাকা (BDT)", discountPreview: "ব্যানারে দেখাবে:", discountNone: "ছাড় ছাড়া অফার হলে ফাঁকা রাখুন।",
  moreOptions: "শুরুর/শেষের তারিখ ও প্রদর্শনের ক্রম (ঐচ্ছিক)", legendOffer: "অফারের পণ্য ও ছাড়", displayOrder: "দেখানোর ক্রম (ছোট সংখ্যা আগে)",
});

/* ---- Layout copy (sidebar groups, top bar, hints) ---- */
Object.assign(copy.en, {
  customPagesTab: "Custom pages", customPagesHint: "Create pages from existing fixed sections.",
  customPagesTitle: "Custom pages", customPageNew: "New page", customPageDelete: "Delete page", customPagePublished: "Published", customPageDraft: "Draft",
  customPageSlug: "Page URL", customPageTitleEn: "Title (English)", customPageTitleBn: "Title (Bangla)",
  customPageMenuLabelEn: "Menu label (English)", customPageMenuLabelBn: "Menu label (Bangla)", customPageShowMenu: "Show in header menu",
  customPageSections: "Available sections", customPageAddSection: "Add section", customPageMoveUp: "Move up", customPageMoveDown: "Move down",
  customPageRemoveSection: "Remove section", customPageSectionTitleEn: "Section title (English)", customPageSectionTitleBn: "Section title (Bangla)",
  customPageDeleteConfirm: "Delete this page?",
  confirmAction: "Confirm", keepEditing: "Cancel",
  navSite: "Store", navHome: "Homepage", navContent: "Content",
  contactSocial: "Contact & social", backToStore: "Back to store", leaveConfirm: "You have unsaved changes. Leave anyway?",
  leaveAction: "Leave",
  unsaved: "Unsaved changes", allSaved: "All changes saved", discard: "Discard", saving: "Saving...", retry: "Try again",
  brandHint: "Your store name, language and logos.", contactHint: "How customers reach you and where to find you online.",
  featuresHint: "Turn homepage sections on or off.", campaignsHint: "Banners, offers, the top bar and festival themes.",
  pagesHint: "Edit shipping, returns, FAQ and other information pages.", footerHint: "Text and links shown at the bottom of every page.",
  seoHint: "How your store looks in Google and when shared.",
  namesHeading: "Name & language", logosHeading: "Logos and icon", replace: "Replace", item: "Item", filterAll: "All",
  shown: "Shown", hidden: "Hidden", serpPreview: "Google preview", editCampaign: "Edit banner / offer", socialHint: "Rows without a link are not saved.",
  featuresTab: "Homepage sections", loadFailed: "Could not load the settings.",
});
Object.assign(copy.bn, {
  customPagesTab: "কাস্টম পেজ", customPagesHint: "বিদ্যমান fixed section দিয়ে নতুন পেজ তৈরি করুন।",
  customPagesTitle: "কাস্টম পেজ", customPageNew: "নতুন পেজ", customPageDelete: "পেজ মুছুন", customPagePublished: "প্রকাশিত", customPageDraft: "ড্রাফট",
  customPageSlug: "পেজের URL", customPageTitleEn: "শিরোনাম (English)", customPageTitleBn: "শিরোনাম (বাংলা)",
  customPageMenuLabelEn: "মেনুর নাম (English)", customPageMenuLabelBn: "মেনুর নাম (বাংলা)", customPageShowMenu: "হেডার মেনুতে দেখান",
  customPageSections: "উপলব্ধ সেকশন", customPageAddSection: "সেকশন যোগ করুন", customPageMoveUp: "উপরে নিন", customPageMoveDown: "নিচে নিন",
  customPageRemoveSection: "সেকশন মুছুন", customPageSectionTitleEn: "সেকশন শিরোনাম (English)", customPageSectionTitleBn: "সেকশন শিরোনাম (বাংলা)",
  customPageDeleteConfirm: "এই পেজটি মুছবেন?",
  confirmAction: "নিশ্চিত করুন", keepEditing: "বাতিল",
  navSite: "স্টোর", navHome: "হোমপেজ", navContent: "কনটেন্ট",
  contactSocial: "যোগাযোগ ও সোশ্যাল", backToStore: "স্টোরে ফিরুন", leaveConfirm: "সংরক্ষণ না করা পরিবর্তন আছে। তবুও বের হবেন?",
  leaveAction: "বের হন",
  unsaved: "সংরক্ষণ না করা পরিবর্তন আছে", allSaved: "সব পরিবর্তন সংরক্ষিত", discard: "বাতিল করুন", saving: "সংরক্ষণ হচ্ছে...", retry: "আবার চেষ্টা করুন",
  brandHint: "স্টোরের নাম, ভাষা ও লোগো।", contactHint: "গ্রাহক কীভাবে যোগাযোগ করবে এবং অনলাইনে কোথায় পাবে।",
  featuresHint: "হোমপেজের সেকশন চালু বা বন্ধ করুন।", campaignsHint: "ব্যানার, অফার, উপরের বার ও উৎসবের থিম।",
  pagesHint: "শিপিং, রিটার্ন, FAQ সহ তথ্যের পেজ সম্পাদনা করুন।", footerHint: "প্রতিটি পেজের নিচে দেখানো লেখা ও লিংক।",
  seoHint: "গুগলে ও শেয়ার করলে স্টোর কেমন দেখাবে।",
  namesHeading: "নাম ও ভাষা", logosHeading: "লোগো ও আইকন", replace: "বদলান", item: "আইটেম", filterAll: "সব",
  shown: "দেখানো হচ্ছে", hidden: "লুকানো", serpPreview: "গুগল প্রিভিউ", editCampaign: "ব্যানার / অফার এডিট", socialHint: "লিংক ছাড়া সারি সংরক্ষণ হবে না।",
  featuresTab: "হোমপেজ সেকশন", loadFailed: "সেটিংস লোড করা যায়নি।",
});

const SECTIONS = [
  { id: "brand", group: "navSite", icon: FiHome, label: "brandTab", hint: "brandHint" },
  { id: "contact", group: "navSite", icon: FiPhone, label: "contactSocial", hint: "contactHint" },
  { id: "features", group: "navHome", icon: FiToggleRight, label: "featuresTab", hint: "featuresHint" },
  { id: "campaigns", group: "navHome", icon: FiImage, label: "campaigns", hint: "campaignsHint" },
  { id: "customPages", group: "navContent", icon: FiLayout, label: "customPagesTab", hint: "customPagesHint" },
  { id: "pages", group: "navContent", icon: FiFileText, label: "pagesTab", hint: "pagesHint" },
  { id: "footer", group: "navContent", icon: FiLayout, label: "footerTab", hint: "footerHint" },
  { id: "seo", group: "navContent", icon: FiSearch, label: "seoTab", hint: "seoHint" },
];
const NAV_GROUPS = ["navSite", "navHome", "navContent"];
const SETTINGS_SECTIONS = new Set(["brand", "contact", "features", "customPages", "pages", "footer", "seo"]);
const HOMEPAGE_SECTION_ITEMS = [
  { id: "categories", toggle: "home_categories", titleKeys: ["categories"], en: "Categories", bn: "ক্যাটাগরি" },
  { id: "brands", toggle: "home_brands", titleKeys: ["brands"], en: "Shop by brand", bn: "ব্র্যান্ড অনুযায়ী" },
  { id: "products", toggle: "home_products", titleKeys: ["products_new", "products_best"], en: "Product showcases", bn: "পণ্যের প্রদর্শনী" },
  { id: "lookbook", toggle: "home_lookbook", titleKeys: ["lookbook"], en: "Lookbook", bn: "লুকবুক" },
  { id: "promotions", toggle: "home_promotions", titleKeys: ["promotions"], en: "Promotions", bn: "অফার" },
  { id: "perks", toggle: "home_perks", titleKeys: ["perks"], en: "Benefits", bn: "সুবিধাসমূহ" },
];
const HOMEPAGE_TITLE_FIELDS = [
  { key: "categories", en: "Categories", bn: "ক্যাটাগরি" },
  { key: "brands", en: "Shop by brand", bn: "ব্র্যান্ড অনুযায়ী" },
  { key: "products_new", en: "New arrivals", bn: "নতুন পণ্য" },
  { key: "products_best", en: "Best sellers", bn: "সেরা বিক্রিত" },
  { key: "lookbook", en: "Lookbook", bn: "লুকবুক" },
  { key: "promotions", en: "Promotions", bn: "অফার" },
  { key: "perks", en: "Benefits", bn: "সুবিধাসমূহ" },
];
const PLATFORMS = ["facebook", "instagram", "tiktok", "youtube", "whatsapp", "linkedin", "pinterest", "telegram", "x", "snapchat", "website"];
const platformName = (p) => (p === "x" ? "X" : p.charAt(0).toUpperCase() + p.slice(1));
const PAGE_NAMES = {
  en: { shipping: "Shipping", returns: "Returns", size: "Size guide", faq: "FAQ", about: "About", privacy: "Privacy", terms: "Terms" },
  bn: { shipping: "শিপিং", returns: "রিটার্ন", size: "সাইজ গাইড", faq: "FAQ", about: "আমাদের সম্পর্কে", privacy: "গোপনীয়তা", terms: "শর্তাবলী" },
};
const FALLBACK_CUSTOM_PAGE_SECTIONS = [
  { type: "page_banner", label_en: "Page title banner", label_bn: "পেজ শিরোনাম ব্যানার" },
  { type: "hero", label_en: "Hero banner", label_bn: "হিরো ব্যানার" },
  { type: "categories", label_en: "Categories", label_bn: "ক্যাটাগরি" },
  { type: "brands", label_en: "Brands", label_bn: "ব্র্যান্ড" },
  { type: "products", label_en: "Our Picks", label_bn: "আমাদের বাছাই" },
  { type: "lookbook", label_en: "Lookbook", label_bn: "লুকবুক" },
  { type: "promotions", label_en: "Promotions", label_bn: "প্রমোশন" },
  { type: "perks", label_en: "Why Choose Avenor", label_bn: "কেন AVENOR" },
];
const CUSTOM_PAGE_SECTION_TYPES = new Set(FALLBACK_CUSTOM_PAGE_SECTIONS.map((item) => item.type));
const CUSTOM_PAGE_LAYOUT_OPTIONS = [
  ["announcementBar", "Announcement / offer bar", "ঘোষণা / অফার বার"],
  ["header", "Header", "হেডার"],
  ["logo", "Logo", "লোগো"],
  ["navigation", "Navigation menu", "নেভিগেশন মেনু"],
  ["search", "Search", "সার্চ"],
  ["wishlist", "Wishlist", "পছন্দের তালিকা"],
  ["cart", "Cart and mini-cart", "কার্ট ও মিনি-কার্ট"],
  ["account", "Customer account", "কাস্টমার অ্যাকাউন্ট"],
  ["admin", "Admin shortcut", "অ্যাডমিন শর্টকাট"],
  ["theme", "Theme switch", "থিম পরিবর্তন"],
  ["language", "Language switch", "ভাষা পরিবর্তন"],
  ["footer", "Footer", "ফুটার"],
  ["quickLinks", "Floating Shop / Sale links", "ভাসমান Shop / Sale লিংক"],
];
const CUSTOM_PAGE_HEADER_CONTROL_ORDER = ["search", "wishlist", "cart", "account", "admin", "theme", "language"];
const BRAND_ASSETS = [
  ["site_logo", "siteLogo", "image/png,image/jpeg,image/webp"],
  ["favicon", "favicon", "image/png,image/jpeg,image/webp,image/x-icon,.ico"],
  ["brand_logo", "brandLogo", "image/png,image/jpeg,image/webp"],
];

export default function AdminControlPanel({ lang = "bn" }) {
  const t = copy[lang === "en" ? "en" : "bn"];
  const campaignTypeLabel = (type) => ({ banner: t.typeBanner, offer: t.typeOffer, seasonal: t.typeSeasonal, theme: t.theme, eid: lang === "en" ? "Eid" : "ঈদ", puja: lang === "en" ? "Puja" : "পূজা", boishakh: lang === "en" ? "Boishakh" : "বৈশাখ" }[String(type || "").toLowerCase()] || String(type || ""));
  const router = useRouter();
  const [section, setSection] = useState("brand");
  const [footerGroup, setFooterGroup] = useState("content");
  const [footerLanguage, setFooterLanguage] = useState("en");
  const [pageLanguage, setPageLanguage] = useState("en");
  const [seoLanguage, setSeoLanguage] = useState("en");
  const [pageSlug, setPageSlug] = useState("shipping");
  const [customPages, setCustomPages] = useState([]);
  const [customPageSectionCatalog, setCustomPageSectionCatalog] = useState(FALLBACK_CUSTOM_PAGE_SECTIONS);
  const [selectedCustomPage, setSelectedCustomPage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [support, setSupport] = useState({});
  const [featureToggles, setFeatureToggles] = useState({ home_hero: true, home_categories: true, home_brands: true, home_products: true, home_lookbook: true, home_promotions: true, home_perks: true });
  const [storefrontGroupingMode, setStorefrontGroupingMode] = useState("category");
  const [homepageSectionOrder, setHomepageSectionOrder] = useState(HOMEPAGE_SECTION_ORDER);
  const [draggedHomepageSection, setDraggedHomepageSection] = useState(null);
  const [dropTargetHomepageSection, setDropTargetHomepageSection] = useState(null);
  const [draggedHeaderControl, setDraggedHeaderControl] = useState(null);
  const [dropTargetHeaderControl, setDropTargetHeaderControl] = useState(null);
  const [draggedCustomPageSection, setDraggedCustomPageSection] = useState(null);
  const [dropTargetCustomPageSection, setDropTargetCustomPageSection] = useState(null);
  const [homepageSectionTitles, setHomepageSectionTitles] = useState(HOMEPAGE_SECTION_TITLES_DEFAULTS);
  const [homepageMenu, setHomepageMenu] = useState(HOMEPAGE_MENU_DEFAULTS);
  const [seo, setSeo] = useState({ en: { title: "", description: "", keywords: "" }, bn: { title: "", description: "", keywords: "" }, og_image: "" });
  const [branding, setBranding] = useState({ brand_name_en: "Dokani", brand_name_bn: "", language: "en", site_logo_url: "", favicon_url: "", brand_logo_url: "" });
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [canonicalHost, setCanonicalHost] = useState("");
  const [domainStatus, setDomainStatus] = useState({ domain: "", available: false });
  const [brandFiles, setBrandFiles] = useState({});
  const [brandPreviews, setBrandPreviews] = useState({});
  const [footerContent, setFooterContent] = useState({ en: normalizeFooter("en"), bn: normalizeFooter("bn") });
  const [infoPages, setInfoPages] = useState({ en: clone(infoPageDefaults.en), bn: clone(infoPageDefaults.bn) });
  const [socialLinks, setSocialLinks] = useState(V2_SOCIALS.map((item) => ({ platform: item.platform || item.icon, name: item.name, url: item.url || item.href })));
  const [campaigns, setCampaigns] = useState([]);
  const [shopCategories, setShopCategories] = useState([]); // real category keys, for the campaign Link picker
  const [campaignProducts, setCampaignProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const baseline = useRef(null);
  const initialAddress = useRef({ subdomain: "", domain: "" });
  const toastTimer = useRef(null);

  const flash = (message, kind = "ok") => {
    clearTimeout(toastTimer.current);
    setNotice({ message, kind });
    toastTimer.current = setTimeout(() => setNotice(null), 4500);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Keep the open section in the address (#brand, #seo ...) so a refresh lands in the same place.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (SECTIONS.some((item) => item.id === id)) setSection(id);
  }, []);
  const go = (id) => {
    setSection(id);
    try { window.history.replaceState(null, "", `#${id}`); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!imageFile) { setImagePreview(""); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);
  useEffect(() => {
    const next = {};
    for (const [key, file] of Object.entries(brandFiles)) if (file) next[key] = URL.createObjectURL(file);
    setBrandPreviews(next);
    return () => Object.values(next).forEach((url) => URL.revokeObjectURL(url));
  }, [brandFiles]);
  useEffect(() => {
    if (!draft) return;
    const onKey = (event) => { if (event.key === "Escape" && !saving) setDraft(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [draft, saving]);
  useEffect(() => {
    if (!confirmation) return;
    const onKey = (event) => { if (event.key === "Escape") setConfirmation(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmation]);

  async function load() {
    baseline.current = null;
    setLoading(true);
    setLoadFailed(false);
    try {
      const [settingsResponse, campaignResponse, productsResponse, subdomainResponse] = await Promise.all([
        fetch("/api/admin/settings", { cache: "no-store" }),
        fetch("/api/admin/campaigns", { cache: "no-store" }),
        fetch("/api/admin/campaign-products", { cache: "no-store" }),
        fetch("/api/admin/subdomain", { cache: "no-store" }),
      ]);
      // Only the site settings are essential. Campaigns, campaign products and the subdomain are optional extras: if the backend
      // refuses or lacks one of them, the rest of the panel still opens (that section just starts empty).
      if (!settingsResponse.ok) throw new Error("load");
      const optionalJson = async (response) => (response.ok ? await response.json().catch(() => ({})) : {});
      const settingsData = await settingsResponse.json();
      const [campaignData, productData, subdomainData] = await Promise.all([optionalJson(campaignResponse), optionalJson(productsResponse), optionalJson(subdomainResponse)]);
      setSubdomain(subdomainData.subdomain || "");
      setCustomDomain(subdomainData.domain || "");
      initialAddress.current = { subdomain: subdomainData.subdomain || "", domain: subdomainData.domain || "" };
      setCanonicalHost(subdomainData.canonical_host || "");
      setDomainStatus({ domain: subdomainData.domain || "", available: Boolean(subdomainData.domain_available) });
      const values = settingsData.settings || settingsData;
      setSupport(values.support || {});
      setStorefrontGroupingMode(["gender", "category", "hidden"].includes(values.storefront_grouping?.mode) ? values.storefront_grouping.mode : "category");
      const savedFeatures = { ...(values.feature_toggles || {}) };
      delete savedFeatures.footer_newsletter;
      setFeatureToggles((current) => ({ ...current, ...savedFeatures }));
      const savedOrder = Array.isArray(values.homepage_section_order) ? values.homepage_section_order : HOMEPAGE_SECTION_ORDER;
      const validOrder = savedOrder.filter((key, index) => HOMEPAGE_SECTION_ORDER.includes(key) && savedOrder.indexOf(key) === index);
      setHomepageSectionOrder([...validOrder, ...HOMEPAGE_SECTION_ORDER.filter((key) => !validOrder.includes(key))]);
      setHomepageSectionTitles({ en: { ...(values.homepage_section_titles?.en || {}) }, bn: { ...(values.homepage_section_titles?.bn || {}) } });
      setHomepageMenu(Object.fromEntries(HOMEPAGE_MENU_KEYS.map((key) => [key, { ...HOMEPAGE_MENU_DEFAULTS[key], ...(values.homepage_menu?.[key] || {}) }])));
      setSeo((current) => ({ ...current, ...(values.seo || {}), en: { ...current.en, ...(values.seo?.en || {}) }, bn: { ...current.bn, ...(values.seo?.bn || {}) } }));
      setBranding({
        brand_name_en: values.brand_name_en || "Dokani",
        brand_name_bn: values.brand_name_bn || "",
        language: ["en", "bn", "both"].includes(values.language_mode) ? values.language_mode : (["en", "bn", "both"].includes(values.language) ? values.language : "en"),
        site_logo_url: values.site_logo_url || "",
        favicon_url: values.favicon_url || "",
        brand_logo_url: values.brand_logo_url || "",
      });
      setBrandFiles({});
      setFooterContent({
        en: normalizeFooter("en", values.footer_content?.en || {}),
        bn: normalizeFooter("bn", values.footer_content?.bn || {}),
      });
      setInfoPages(Object.fromEntries(["en", "bn"].map((language) => [language, Object.fromEntries(infoPageSlugs.map((slug) => {
        const saved = values.info_pages?.[language]?.[slug];
        return [slug, saved ? { ...clone(infoPageDefaults[language][slug] || {}), ...saved } : clone(infoPageDefaults[language][slug] || {})];
      }))])));
      setSocialLinks((Array.isArray(values.social_links) ? values.social_links : V2_SOCIALS).map((item) => ({
        platform: item.platform || item.icon || "website", name: item.name || "", url: item.url || item.href || "",
      })));
      const savedCustomPages = Array.isArray(values.custom_pages) ? values.custom_pages : (Array.isArray(values.customPages) ? values.customPages : []);
      const supportedCustomPages = savedCustomPages.map((page) => ({
        ...page,
        sections: (Array.isArray(page.sections) ? page.sections : []).filter((item) => CUSTOM_PAGE_SECTION_TYPES.has(item?.type)),
      }));
      setCustomPages(supportedCustomPages);
      const sectionCatalog = Array.isArray(values.page_section_catalog)
        ? values.page_section_catalog.filter((item) => CUSTOM_PAGE_SECTION_TYPES.has(item?.type))
        : [];
      const sectionCatalogByType = new Map(sectionCatalog.map((item) => [item.type, item]));
      setCustomPageSectionCatalog(FALLBACK_CUSTOM_PAGE_SECTIONS.map((item) => sectionCatalogByType.get(item.type) || item));
      setSelectedCustomPage((current) => supportedCustomPages.some((page) => page.id === current) ? current : (supportedCustomPages[0]?.id || ""));
      setCampaigns(Array.isArray(campaignData.campaigns) ? campaignData.campaigns : []);
      setCampaignProducts(Array.isArray(productData.products) ? productData.products : []);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }
  // Refreshing only the campaign list keeps any unsaved site-settings edits intact.
  async function reloadCampaigns() {
    try {
      const response = await fetch("/api/admin/campaigns", { cache: "no-store" });
      if (!response.ok) throw new Error("load");
      const data = await response.json();
      setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
    } catch { flash(t.failed, "err"); }
  }
  useEffect(() => { load(); /* load once when the protected panel opens */ }, []);

  const buildPayload = () => ({
    brand_name_en: branding.brand_name_en.trim(),
    brand_name_bn: branding.brand_name_bn.trim() || null,
    language_mode: branding.language,
    site_logo_url: branding.site_logo_url || null,
    info_pages: infoPages,
    support,
    feature_toggles: Object.fromEntries(Object.entries(featureToggles).filter(([key]) => key !== "footer_newsletter")),
    storefront_grouping: { mode: storefrontGroupingMode },
    homepage_section_order: homepageSectionOrder,
    homepage_section_titles: homepageSectionTitles,
    homepage_menu: homepageMenu,
    seo,
    footer_content: footerContent,
    social_links: socialLinks.filter((item) => item.platform && item.url),
    custom_pages: customPages,
  });
  const payloadJson = loading ? "" : JSON.stringify({ settings: buildPayload(), subdomain, customDomain });
  useEffect(() => { if (!loading && baseline.current === null) baseline.current = payloadJson; }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = !loading && baseline.current !== null && (payloadJson !== baseline.current || Object.values(brandFiles).some(Boolean));
  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const setSupportField = (key, value) => setSupport((current) => ({ ...current, [key]: value }));
  const moveHomepageSection = (key, direction) => setHomepageSectionOrder((current) => {
    const index = current.indexOf(key);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const dropHomepageSection = (sourceKey, targetKey) => setHomepageSectionOrder((current) => {
    const sourceIndex = current.indexOf(sourceKey);
    const targetIndex = current.indexOf(targetKey);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return current;
    const next = [...current];
    next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, sourceKey);
    return next;
  });
  const setHomepageTitle = (language, key, value) => setHomepageSectionTitles((current) => ({ ...current, [language]: { ...current[language], [key]: value } }));
  const setHomepageMenuValue = (key, property, value) => setHomepageMenu((current) => ({ ...current, [key]: { ...current[key], [property]: value } }));
  const setPageValue = (path, value) => setInfoPages((current) => {
    const next = clone(current);
    let target = next[pageLanguage][pageSlug];
    for (const key of path.slice(0, -1)) target = target[key];
    target[path[path.length - 1]] = value;
    return next;
  });
  const updateFooter = (language, key, value) => setFooterContent((current) => ({ ...current, [language]: { ...current[language], [key]: value } }));
  const updateFooterLink = (language, key, index, property, value) => setFooterContent((current) => ({
    ...current,
    [language]: { ...current[language], [key]: current[language][key].map((link, i) => i === index ? { ...link, [property]: value } : link) },
  }));
  const updateSocial = (index, key, value) => setSocialLinks((current) => current.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const pageName = (slug) => PAGE_NAMES[lang === "en" ? "en" : "bn"][slug] || slug;

  /* ---- small building blocks (plain functions, not components, so inputs never lose focus) ---- */
  const field = (label, value, onChange, { type = "text", required = false, wide = false, hint, placeholder, maxLength } = {}) => (
    <label key={label} className={`adm-field${wide ? " is-wide" : ""}`}>
      <span>{label}{required && <b className="adm-req" aria-hidden="true"> *</b>}</span>
      <input type={type} value={value ?? ""} required={required} placeholder={placeholder} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
      {hint && <small>{hint}</small>}
    </label>
  );
  const bare = (label, value, onChange, type = "text", placeholder) => (
    <input type={type} aria-label={label} placeholder={placeholder} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
  );
  const langSeg = (value, set) => (
    <div className="adm-seg" role="group" aria-label={t.languageMode}>
      {[["en", t.english], ["bn", t.bangla]].map(([code, label]) => <button type="button" key={code} aria-pressed={value === code} onClick={() => set(code)}>{label}</button>)}
    </div>
  );
  const delButton = (label, onClick, disabled) => <button type="button" className="adm-iconbtn adm-iconbtn--danger" aria-label={label} title={label} disabled={disabled} onClick={onClick}><FiTrash2 aria-hidden="true" /></button>;

  /* ---- settings save ---- */
  async function saveSettings(event) {
    event.preventDefault();
    if (saving) return;
    if (!branding.brand_name_en.trim()) { go("brand"); flash(t.nameRequired, "err"); return; }
    const cleanDomain = normalizeDomain(customDomain);
    if (cleanDomain && !DOMAIN_RE.test(cleanDomain)) { go("brand"); flash(t.domainInvalid, "err"); return; }
    setSaving(true);
    try {
      const payload = buildPayload();
      const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || Object.values(error.errors || {}).flat()[0] || "Could not save settings.");
      }
      const cleanSubdomain = subdomain.replace(/^-+|-+$/g, "");
      if (cleanSubdomain !== initialAddress.current.subdomain || cleanDomain !== initialAddress.current.domain) {
        const domainResponse = await fetch("/api/admin/subdomain", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subdomain: cleanSubdomain, domain: cleanDomain }) });
        if (!domainResponse.ok) {
          const error = await domainResponse.json().catch(() => ({}));
          throw new Error(error.message || Object.values(error.errors || {}).flat()[0] || "Could not save the store address.");
        }
        const savedAddress = await domainResponse.json().catch(() => ({}));
        if (savedAddress.canonical_host) setCanonicalHost(savedAddress.canonical_host);
        setDomainStatus({ domain: savedAddress.domain || "", available: Boolean(savedAddress.domain_available) });
        initialAddress.current = { subdomain: cleanSubdomain, domain: cleanDomain };
      }
      const uploaded = {};
      for (const type of ["site_logo", "favicon", "brand_logo"]) {
        if (!brandFiles[type]) continue;
        const body = new FormData();
        body.set("type", type);
        body.set("asset", brandFiles[type]);
        const upload = await fetch("/api/admin/settings/assets", { method: "POST", body });
        if (!upload.ok) throw new Error("upload");
        uploaded[`${type}_url`] = (await upload.json()).url;
      }
      if (Object.keys(uploaded).length) setBranding((current) => ({ ...current, ...uploaded }));
      setBrandFiles({});
      setCustomDomain(cleanDomain);
      baseline.current = JSON.stringify({ settings: payload, subdomain, customDomain: cleanDomain });
      flash(t.saved);
      router.refresh();
    } catch (error) {
      flash(error?.message || t.failed, "err");
    } finally { setSaving(false); }
  }

  async function uploadPageImage(file) {
    if (!file) return;
    const body = new FormData();
    body.set("type", "info_page_image");
    body.set("page_slug", pageSlug);
    body.set("asset", file);
    try {
      const response = await fetch("/api/admin/settings/assets", { method: "POST", body });
      if (!response.ok) throw new Error("upload");
      setPageValue(["image_url"], (await response.json()).url);
      flash(t.imageSaved);
    } catch { flash(t.failed, "err"); }
  }

  useEffect(() => {
    let off = false;
    fetch(`/api/storefront/categories?lang=${lang === "en" ? "en" : "bn"}`).then((r) => (r.ok ? r.json() : {})).then((d) => { if (!off && Array.isArray(d.categories)) setShopCategories(d.categories); }).catch(() => {});
    return () => { off = true; };
  }, [lang]);

  /* ---- campaigns ---- */
  const campaignProductNames = (campaign) => {
    let ids = campaign.product_ids || [];
    if (typeof ids === "string") { try { ids = JSON.parse(ids); } catch { ids = []; } }
    return Array.isArray(ids) ? ids.map((id) => campaignProducts.find((product) => String(product.id) === String(id))?.name).filter(Boolean).join(", ") : "";
  };
  const campaignTitle = (campaign) => (lang === "en" ? campaign.title_en : campaign.title_bn) || campaign.title_en || campaign.title_bn || campaignTypeLabel(campaign.type);
  function editCampaign(campaign) {
    let productIds = campaign.product_ids || [];
    if (typeof productIds === "string") { try { productIds = JSON.parse(productIds); } catch { productIds = []; } }
    const legacyKind = kindOf(campaign);
    setDraft({ ...emptyCampaign(), ...campaign, ...(legacyKind === "offer" || legacyKind === "bar" ? { type: "offer" } : legacyKind === "main" ? { type: "banner" } : {}), product_ids: Array.isArray(productIds) ? productIds.map(String) : [], discount_type: campaign.discount_type || "percentage", discount_value: campaign.discount_value == null ? "" : String(campaign.discount_value), placement: placementOf(campaign), starts_at: dt(campaign.starts_at), ends_at: dt(campaign.ends_at), order_deadline: dt(campaign.order_deadline) });
    setImageFile(null);
  }
  async function saveCampaign(event) {
    event.preventDefault();
    if (!draft || saving) return;
    setSaving(true);
    const body = new FormData();
    const saveKind = kindOf(draft);
    const withOffer = saveKind === "offer" || saveKind === "bar";
    let campaignPayload = withOffer ? draft : { ...draft, product_ids: [], discount_type: "", discount_value: "" };
    if (!draft.discount_value) campaignPayload = { ...campaignPayload, discount_type: "", discount_value: "" };
    if (saveKind !== "festival") campaignPayload = { ...campaignPayload, order_deadline: "" }; // only the festival countdown uses a deadline
    campaignPayload = { ...campaignPayload, target_url: fixShopLink(String(campaignPayload.target_url || "").trim(), shopCategories) }; // "skincare" -> "skin-care"
    for (const [key, value] of Object.entries(campaignPayload)) {
      if (key !== "id" && value !== null && value !== undefined) body.set(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
    }
    try {
      if (imageFile) body.set("image", await prepareCampaignImage(imageFile));
      const response = await fetch(draft.id ? `/api/admin/campaigns/${draft.id}` : "/api/admin/campaigns", { method: draft.id ? "PUT" : "POST", body });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const validationMessage = Object.values(result?.errors || {}).flat().find((message) => typeof message === "string");
        throw new Error(validationMessage || result?.message || `Campaign save failed (HTTP ${response.status}).`);
      }
      setDraft(null); setImageFile(null); flash(t.saved); await reloadCampaigns();
    } catch (error) { flash(error?.message || t.failed, "err"); }
    finally { setSaving(false); }
  }
  async function deleteCampaign(campaign) {
    setConfirmation({
      title: t.remove,
      message: `${t.remove}: ${campaignTitle(campaign)}?`,
      confirmLabel: t.remove,
      danger: true,
      onConfirm: async () => {
        setSaving(true);
        try {
          const response = await fetch(`/api/admin/campaigns/${campaign.id}`, { method: "DELETE" });
          if (!response.ok) throw new Error("delete");
          flash(t.saved); await reloadCampaigns();
        } catch { flash(t.failed, "err"); }
        finally { setSaving(false); }
      },
    });
  }
  const kind = draft ? kindOf(draft) : "main";
  const offerKind = kind === "offer" || kind === "bar";
  const chooseKind = (next) => {
    if (next === kind) return;
    setDraft({ ...draft, ...KIND_DEFAULTS[next], ...(next === "offer" || next === "bar" ? {} : { product_ids: [], discount_value: "" }) });
    if (next === "bar") setImageFile(null);
  };
  const hasProducts = !!draft?.product_ids?.length;
  const previewLabel = discountLabel(draft?.discount_type, draft?.discount_value, lang);
  const discountIsPct = (draft?.discount_type || "percentage") === "percentage";

  /* ---- section panels ---- */
  const renderBrand = () => (
    <>
      <section className="adm-card">
        <div className="adm-card__head"><div><h2>{t.namesHeading}</h2><p className="adm-section-intro">{t.namesHelp}</p></div></div>
        <div className="adm-grid adm-brand-grid">
          {field(t.websiteNameEn, branding.brand_name_en, (value) => setBranding((current) => ({ ...current, brand_name_en: value })), { required: true })}
          {field(t.websiteNameBn, branding.brand_name_bn, (value) => setBranding((current) => ({ ...current, brand_name_bn: value })))}
          {field(t.subdomain, subdomain, (value) => setSubdomain(value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-").replace(/^-+/, "")), { required: true, placeholder: "avenor", maxLength: 63, hint: <><span>{t.subdomainHint}</span><a className="adm-address-link" href={`https://${subdomain || "your-shop"}.dokani.cloud`} target="_blank" rel="noreferrer">https://{subdomain || "your-shop"}.dokani.cloud <FiExternalLink aria-hidden="true" /></a></> })}
          {field(t.customDomain, customDomain, (value) => setCustomDomain(value.toLowerCase().replace(/\s/g, "")), { placeholder: "https://www.avenor.com", maxLength: 255, hint: <><span>{t.customDomainHint}</span>{normalizeDomain(customDomain) && <a className="adm-address-link" href={`https://${normalizeDomain(customDomain)}`} target="_blank" rel="noreferrer">https://{normalizeDomain(customDomain)} <FiExternalLink aria-hidden="true" /></a>}{domainStatus.domain && domainStatus.domain === normalizeDomain(customDomain) && <span>{domainStatus.available ? t.domainConnected : t.domainPending}</span>}</> })}
          <label className="adm-field"><span>{t.languageMode}</span>
            <select value={branding.language} onChange={(event) => setBranding((current) => ({ ...current, language: event.target.value }))}>
              <option value="en">{t.englishOnly}</option><option value="bn">{t.banglaOnly}</option><option value="both">{t.bothLanguages}</option>
            </select>
          </label>
        </div>
      </section>
      <section className="adm-card">
        <h2>{t.logosHeading}</h2>
        <div className="adm-assets">
          {BRAND_ASSETS.map(([type, labelKey, accept]) => {
            const preview = brandPreviews[type] || branding[`${type}_url`];
            return (
              <div className="adm-asset" key={type}>
                <div className="adm-asset__thumb">{preview ? <img src={preview} alt="" /> : <FiImage aria-hidden="true" />}</div>
                <div className="adm-asset__body">
                  <strong>{t[labelKey]}</strong>
                  <small className="adm-asset__name">{brandFiles[type]?.name || t.chooseImage}</small>
                  <label className="adm-file">
                    <input type="file" accept={accept} onChange={(event) => setBrandFiles((current) => ({ ...current, [type]: event.target.files?.[0] || null }))} />
                    <span><FiUpload aria-hidden="true" /> {preview ? t.replace : t.upload}</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );

  const renderContact = () => (
    <>
      <section className="adm-card">
        <h2>{t.support}</h2>
        <div className="adm-grid">
          {field(t.phone, support.phone, (value) => setSupportField("phone", value), { type: "tel" })}
          {field(t.whatsapp, support.whatsapp, (value) => setSupportField("whatsapp", value), { type: "tel" })}
          {field(t.email, support.email, (value) => setSupportField("email", value), { type: "email" })}
          {field(t.address, support.address, (value) => setSupportField("address", value))}
        </div>
      </section>
      <section className="adm-card">
        <div className="adm-card__head"><h2>{t.socials}</h2><small>{t.socialHint}</small></div>
        <div className="adm-rows">
          {socialLinks.length > 0 && <div className="adm-row adm-row--social adm-row--head" aria-hidden="true"><span>{t.platform}</span><span>{t.linkName}</span><span>{t.url}</span><span /></div>}
          {socialLinks.map((item, index) => (
            <div className="adm-row adm-row--social" key={`social-${index}`}>
              <select aria-label={t.platform} value={item.platform} onChange={(event) => updateSocial(index, "platform", event.target.value)}>
                {PLATFORMS.map((platform) => <option key={platform} value={platform}>{platformName(platform)}</option>)}
              </select>
              {bare(t.linkName, item.name, (value) => updateSocial(index, "name", value))}
              {bare(t.url, item.url, (value) => updateSocial(index, "url", value), "url", "https://")}
              {delButton(`${t.remove} ${item.name || platformName(item.platform)}`, () => setSocialLinks((current) => current.filter((_, i) => i !== index)))}
            </div>
          ))}
        </div>
        <button type="button" className="adm-btn adm-btn--self" onClick={() => setSocialLinks((current) => [...current, { platform: "website", name: "", url: "" }])}><FiPlus aria-hidden="true" /> {t.addRow}</button>
      </section>
    </>
  );

  const renderFeatures = () => {
    const ui = lang === "en" ? {
      sections: "Homepage sections", sectionsHint: "Choose what appears, edit its heading, then drag a row to change the order.",
      menu: "Header menu", menuHint: "Rename or hide links in the clothing storefront navigation.",
      highlights: "Hero highlights", highlightsHint: "Short selling points shown under the hero copy. Add up to 8 per language.",
      visible: "Shown", hidden: "Hidden", moveUp: "Move up", moveDown: "Move down", moveLeft: "Move left", moveRight: "Move right", drag: "Drag to reorder", english: "English", bangla: "Bangla",
      add: "Add highlight", remove: "Remove", hero: "Homepage hero banner", home: "Home", categories: "Categories", brands: "Shop by brand", products: "Product showcases", lookbook: "Lookbook", promotions: "Promotions carousel", perks: "Benefits section",
      placeholder: "Short selling point", newArrivals: "New arrivals", bestSellers: "Best sellers", outfit: "Build a Look",
    } : {
      sections: "হোমপেজের সেকশন", sectionsHint: "কোন সেকশন দেখাবেন ঠিক করুন, শিরোনাম লিখুন, তারপর টেনে এনে ক্রম বদলান।",
      menu: "হেডার মেনু", menuHint: "ক্লথিং স্টোরের মেনুর নাম বদলান বা লুকান।",
      highlights: "হিরোর হাইলাইট", highlightsHint: "হিরোর নিচে ছোট বিক্রয়-বার্তা দেখান। প্রতি ভাষায় সর্বোচ্চ ৮টি।",
      visible: "দেখানো হচ্ছে", hidden: "লুকানো", moveUp: "উপরে নিন", moveDown: "নিচে নিন", drag: "ক্রম বদলাতে টেনে আনুন", english: "English", bangla: "বাংলা",
      add: "হাইলাইট যোগ করুন", remove: "মুছুন", hero: "হোমপেজ হিরো ব্যানার", home: "হোম", categories: "ক্যাটাগরি", brands: "ব্র্যান্ড অনুযায়ী", products: "পণ্যের প্রদর্শনী", lookbook: "লুকবুক", promotions: "অফার ক্যারোসেল", perks: "সুবিধাসমূহ",
      placeholder: "সংক্ষিপ্ত বিক্রয়-বার্তা", newArrivals: "নতুন পণ্য", bestSellers: "সেরা বিক্রিত", outfit: "লুক বানান",
    };
    const labels = { categories: ui.categories, brands: ui.brands, products: ui.products, lookbook: ui.lookbook, promotions: ui.promotions, perks: ui.perks };
    const menuLabels = { home: ui.home, categories: ui.categories, picks: ui.newArrivals, lookbook: ui.lookbook, outfit: ui.outfit };
    const toggleFeature = (key, checked) => setFeatureToggles((current) => ({ ...current, [key]: checked }));
    return (
      <>
        <section className="adm-card">
          <div className="adm-card__head"><div><h2>{ui.sections}</h2><p className="adm-section-intro">{ui.sectionsHint}</p></div></div>
          <label className="adm-home-hero-toggle">
            <span><strong>{ui.hero}</strong><small>{featureToggles.home_hero === false ? ui.hidden : ui.visible}</small></span>
            <input type="checkbox" checked={featureToggles.home_hero !== false} onChange={(event) => toggleFeature("home_hero", event.target.checked)} />
            <i aria-hidden="true" />
          </label>
          <label className="adm-field">
            <span>Storefront grouping</span>
            <select value={storefrontGroupingMode} onChange={(event) => setStorefrontGroupingMode(event.target.value)}>
              <option value="gender">Gender</option>
              <option value="category">Category</option>
              <option value="hidden">Hidden</option>
            </select>
            <small>Choose gender groups, top-level categories, or hide the homepage carousel.</small>
          </label>
          <ol className="adm-home-order">
            {homepageSectionOrder.map((id, index) => {
              const item = HOMEPAGE_SECTION_ITEMS.find((entry) => entry.id === id);
              if (!item) return null;
              const on = featureToggles[item.toggle] !== false;
              const titleFields = HOMEPAGE_TITLE_FIELDS.filter((field) => item.titleKeys.includes(field.key));
              return (
                <li
                  className={`adm-home-order__item${titleFields.length > 1 ? " is-multi-title" : ""}${draggedHomepageSection === id ? " is-dragging" : ""}${dropTargetHomepageSection === id ? " is-drop-target" : ""}`}
                  key={id}
                  onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTargetHomepageSection(id); }}
                  onDrop={(event) => { event.preventDefault(); const source = draggedHomepageSection || event.dataTransfer.getData("text/plain"); dropHomepageSection(source, id); setDraggedHomepageSection(null); setDropTargetHomepageSection(null); }}
                  onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDropTargetHomepageSection(null); }}
                >
                  <div className="adm-home-order__position">
                    <span className="adm-home-order__number">{index + 1}</span>
                    <button type="button" className="adm-home-drag-handle" draggable aria-label={`${ui.drag}: ${labels[id]}`} title={ui.drag} onDragStart={(event) => { setDraggedHomepageSection(id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", id); }} onDragEnd={() => { setDraggedHomepageSection(null); setDropTargetHomepageSection(null); }}><FiMenu aria-hidden="true" /></button>
                  </div>
                  <strong className="adm-home-order__label">{labels[id]}</strong>
                  <div className="adm-home-order__titles">
                    {titleFields.map((field) => <div className="adm-home-order__title-pair" key={field.key}>
                      {titleFields.length > 1 && <span className="adm-home-order__title-name">{lang === "en" ? field.en : field.bn}</span>}
                      <input aria-label={`${lang === "en" ? field.en : field.bn} — ${ui.english}`} placeholder={`${ui.english} · ${lang === "en" ? field.en : field.bn}`} value={homepageSectionTitles.en?.[field.key] || ""} maxLength={80} onChange={(event) => setHomepageTitle("en", field.key, event.target.value)} />
                      <input aria-label={`${lang === "en" ? field.en : field.bn} — ${ui.bangla}`} placeholder={`${ui.bangla} · ${lang === "en" ? field.en : field.bn}`} value={homepageSectionTitles.bn?.[field.key] || ""} maxLength={80} onChange={(event) => setHomepageTitle("bn", field.key, event.target.value)} />
                    </div>)}
                  </div>
                  <label className="adm-home-row-toggle"><input type="checkbox" checked={on} onChange={(event) => toggleFeature(item.toggle, event.target.checked)} /><span>{on ? ui.visible : ui.hidden}</span></label>
                  <div className="adm-home-order__actions">
                    <button type="button" className="adm-iconbtn" aria-label={`${ui.moveUp}: ${labels[id]}`} disabled={index === 0} onClick={() => moveHomepageSection(id, -1)}><FiArrowUp aria-hidden="true" /></button>
                    <button type="button" className="adm-iconbtn" aria-label={`${ui.moveDown}: ${labels[id]}`} disabled={index === homepageSectionOrder.length - 1} onClick={() => moveHomepageSection(id, 1)}><FiArrowDown aria-hidden="true" /></button>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="adm-card">
          <div className="adm-card__head"><div><h2>{ui.menu}</h2><p className="adm-section-intro">{ui.menuHint}</p></div></div>
          <div className="adm-home-edit-list">
            {HOMEPAGE_MENU_KEYS.map((key) => (
              <div className="adm-home-menu-row" key={key}>
                <div className="adm-home-menu-row__fields">
                  <label className="adm-field"><span>{ui.english}</span><input value={homepageMenu[key]?.en || ""} maxLength={40} onChange={(event) => setHomepageMenuValue(key, "en", event.target.value)} /></label>
                  <label className="adm-field"><span>{ui.bangla}</span><input value={homepageMenu[key]?.bn || ""} maxLength={40} onChange={(event) => setHomepageMenuValue(key, "bn", event.target.value)} /></label>
                </div>
                <label className="adm-home-row-toggle"><input type="checkbox" checked={homepageMenu[key]?.visible !== false && (key !== "outfit" || featureToggles.build_a_look !== false)} onChange={(event) => {
                  const checked = event.target.checked;
                  setHomepageMenuValue(key, "visible", checked);
                  if (key === "outfit") toggleFeature("build_a_look", checked);
                }} /><span>{menuLabels[key]}</span></label>
              </div>
            ))}
          </div>
        </section>

      </>
    );
  };

  const renderCampaigns = () => {
    const kinds = ["main", "offer", "bar", "festival"];
    const counts = Object.fromEntries(kinds.map((k) => [k, campaigns.filter((c) => kindOf(c) === k).length]));
    const shown = filter === "all" ? campaigns : campaigns.filter((c) => kindOf(c) === filter);
    const newButton = <button type="button" className="adm-btn adm-btn--primary" onClick={() => { setDraft(emptyCampaign()); setImageFile(null); }}><FiPlus aria-hidden="true" /> {t.newCampaign}</button>;
    return (
      <>
        <div className="adm-toolbar">
          <div className="adm-chips" role="group" aria-label={t.type}>
            <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>{t.filterAll} <em>{campaigns.length}</em></button>
            {kinds.map((k) => <button type="button" key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{t[`kind_${k}`]} <em>{counts[k]}</em></button>)}
          </div>
          {newButton}
        </div>
        {shown.length ? (
          <ul className="adm-list">
            {shown.map((campaign) => {
              const on = String(campaign.status) === "1" || campaign.status === true;
              const off = discountLabel(campaign.discount_type, campaign.discount_value, lang);
              const names = campaignProductNames(campaign);
              const title = campaignTitle(campaign);
              return (
                <li key={campaign.id}>
                  <div className="adm-list__thumb">{campaign.image_url ? <img src={campaign.image_url} alt="" /> : <FiImage aria-hidden="true" />}</div>
                  <div className="adm-list__text">
                    <strong>{title}</strong>
                    <small>{t[`kind_${kindOf(campaign)}`]}{FESTIVALS.includes(campaign.type) ? ` · ${campaignTypeLabel(campaign.type)}` : ""}{off ? ` · ${off}` : ""}{names ? ` · ${names}` : ""}</small>
                  </div>
                  <span className={`adm-pill${on ? " is-on" : ""}`}>{on ? t.active : t.off}</span>
                  <button type="button" className="adm-iconbtn" aria-label={`${t.edit}: ${title}`} title={t.edit} onClick={() => editCampaign(campaign)}><FiEdit2 aria-hidden="true" /></button>
                  {delButton(`${t.remove}: ${title}`, () => deleteCampaign(campaign), saving)}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="adm-empty"><FiImage aria-hidden="true" /><p>{t.noCampaigns}</p>{newButton}</div>
        )}
      </>
    );
  };

  const renderPageValue = (value, path = [], fieldName = "") => {
    if (fieldName === "type" || fieldName === "image") return null;
    const key = path.join("-");
    const label = /^\d+$/.test(fieldName) ? `${t.item} ${fieldName}` : fieldName.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (s) => s.toUpperCase());
    if (typeof value === "string") {
      const long = value.length > 90;
      return <label className={`adm-field${long ? " is-wide" : ""}`} key={key}><span>{label}</span>{long ? <textarea rows={3} value={value} onChange={(event) => setPageValue(path, event.target.value)} /> : <input value={value} onChange={(event) => setPageValue(path, event.target.value)} />}</label>;
    }
    if (Array.isArray(value)) return <div className="adm-stack is-wide" key={key}>{value.map((item, index) => renderPageValue(item, [...path, index], String(index + 1)))}</div>;
    if (value && typeof value === "object") return <fieldset className="adm-sub is-wide" key={key}><legend>{fieldName === "blocks" ? `${t.pageBody} ${path[path.length - 1] + 1}` : label}</legend><div className="adm-grid">{Object.entries(value).map(([childKey, child]) => renderPageValue(child, [...path, childKey], childKey))}</div></fieldset>;
    return null;
  };
  const renderPages = () => {
    const page = infoPages[pageLanguage]?.[pageSlug] || {};
    return (
      <>
        <div className="adm-toolbar">
          <div className="adm-chips" role="group" aria-label={t.pageSelect}>
            {infoPageSlugs.map((slug) => <button type="button" key={slug} aria-pressed={pageSlug === slug} onClick={() => setPageSlug(slug)}>{pageName(slug)}</button>)}
          </div>
          {langSeg(pageLanguage, setPageLanguage)}
        </div>
        <section className="adm-card">
          <div className="adm-grid">
            {field(t.pageTitle, page.title, (value) => setPageValue(["title"], value))}
            {field(t.pageLead, page.lead, (value) => setPageValue(["lead"], value))}
            {pageSlug === "about" && (
              <div className="adm-field is-wide">
                <span>{t.pageImage}</span>
                <div className="adm-upload">
                  <div className="adm-asset__thumb">{page.image_url ? <img src={page.image_url} alt="" /> : <FiImage aria-hidden="true" />}</div>
                  <div className="adm-upload__fields">
                    <input type="url" aria-label={t.pageImage} value={page.image_url || ""} placeholder="https://..." onChange={(event) => setPageValue(["image_url"], event.target.value)} />
                    <label className="adm-file"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { uploadPageImage(event.target.files?.[0]); event.target.value = ""; }} /><span><FiUpload aria-hidden="true" /> {t.upload}</span></label>
                  </div>
                </div>
                <small>{t.pageImageHelp}. {t.chooseImage}</small>
              </div>
            )}
            {page.blocks?.map((block, index) => renderPageValue(block, ["blocks", index], "blocks"))}
          </div>
        </section>
      </>
    );
  };

  const renderCustomPages = () => {
    const sectionLabel = (type) => customPageSectionCatalog.find((item) => item.type === type)?.[lang === "en" ? "label_en" : "label_bn"] || type;
    const page = customPages.find((item) => item.id === selectedCustomPage) || customPages[0];
    const headerDragLabel = lang === "en" ? "Drag to reorder" : "ক্রম বদলাতে টেনে আনুন";
    const headerMoveLeftLabel = lang === "en" ? "Move left" : "বামে সরান";
    const headerMoveRightLabel = lang === "en" ? "Move right" : "ডানে সরান";
    const updatePage = (patch) => setCustomPages((current) => current.map((item) => item.id === page.id ? { ...item, ...patch } : item));
    const updatePageSection = (sectionId, patch) => updatePage({
      sections: (page.sections || []).map((item) => item.id === sectionId ? { ...item, ...patch } : item),
    });
    const newPage = () => {
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const next = {
        id, slug: "", published: false, showInMenu: false, menuOrder: customPages.length,
        title: { en: "", bn: "" }, menuLabel: { en: "", bn: "" }, layout: {},
        sections: [{ id: `products-${Date.now()}`, type: "products", enabled: true, position: 0, title: { en: "", bn: "" } }],
      };
      setCustomPages((current) => [...current, next]);
      setSelectedCustomPage(id);
    };
    const deletePage = () => {
      if (!page) return;
      setConfirmation({
        title: t.customPageDelete,
        message: t.customPageDeleteConfirm,
        confirmLabel: t.customPageDelete,
        danger: true,
        onConfirm: () => {
          const next = customPages.filter((item) => item.id !== page.id);
          setCustomPages(next);
          setSelectedCustomPage(next[0]?.id || "");
        },
      });
    };
    const addSection = (type) => {
      if (!page) return;
      const id = `${type}-${Date.now()}`;
      const sections = [...(page.sections || []), { id, type, enabled: true, position: (page.sections || []).length, title: { en: "", bn: "" } }];
      updatePage({ sections });
    };
    const moveSection = (sectionId, direction) => {
      if (!page) return;
      const sections = [...(page.sections || [])];
      const index = sections.findIndex((item) => item.id === sectionId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= sections.length) return;
      [sections[index], sections[target]] = [sections[target], sections[index]];
      updatePage({ sections: sections.map((item, position) => ({ ...item, position })) });
    };
    const moveSectionTo = (sourceId, targetId) => {
      if (!page || !sourceId || !targetId || sourceId === targetId) return;
      const sections = [...(page.sections || [])];
      const sourceIndex = sections.findIndex((item) => item.id === sourceId);
      const targetIndex = sections.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return;
      const [source] = sections.splice(sourceIndex, 1);
      sections.splice(targetIndex, 0, source);
      updatePage({ sections: sections.map((item, position) => ({ ...item, position })) });
    };
    const moveHeaderControl = (control, direction) => {
      const current = Array.isArray(page.layout?.headerControlOrder) ? page.layout.headerControlOrder : CUSTOM_PAGE_HEADER_CONTROL_ORDER;
      const order = [...current];
      const index = order.indexOf(control);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= order.length) return;
      [order[index], order[target]] = [order[target], order[index]];
      updatePage({ layout: { ...page.layout, headerControlOrder: order } });
    };
    const moveHeaderControlTo = (source, target) => {
      if (!source || !target || source === target) return;
      const current = Array.isArray(page.layout?.headerControlOrder) ? page.layout.headerControlOrder : CUSTOM_PAGE_HEADER_CONTROL_ORDER;
      const order = [...current];
      const sourceIndex = order.indexOf(source);
      const targetIndex = order.indexOf(target);
      if (sourceIndex < 0 || targetIndex < 0) return;
      order.splice(targetIndex, 0, ...order.splice(sourceIndex, 1));
      updatePage({ layout: { ...page.layout, headerControlOrder: order } });
    };

    return (
      <>
        <div className="adm-toolbar">
          <div className="adm-chips" role="group" aria-label={t.customPagesTitle}>
            {customPages.map((item) => (
              <button type="button" key={item.id} aria-pressed={page?.id === item.id} onClick={() => setSelectedCustomPage(item.id)}>
                {item.title?.[lang] || item.title?.en || item.slug || t.customPageDraft}
              </button>
            ))}
          </div>
          <button type="button" className="adm-btn adm-btn--primary" onClick={newPage}><FiPlus aria-hidden="true" /> {t.customPageNew}</button>
        </div>
        {!page ? (
          <div className="adm-empty"><FiLayout aria-hidden="true" /><p>{t.customPagesHint}</p></div>
        ) : (
          <>
            <section className="adm-card">
              <div className="adm-card__head">
                <h2>{page.title?.[lang] || page.title?.en || t.customPageDraft}</h2>
                <span className={`adm-pill${page.published ? " is-on" : ""}`}>{page.published ? t.customPagePublished : t.customPageDraft}</span>
              </div>
              <div className="adm-grid">
                {field(t.customPageSlug, page.slug, (value) => updatePage({ slug: value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") }), { required: true, placeholder: "summer-collection" })}
                {field(t.customPageTitleEn, page.title?.en || "", (value) => updatePage({ title: { ...page.title, en: value } }))}
                {field(t.customPageTitleBn, page.title?.bn || "", (value) => updatePage({ title: { ...page.title, bn: value } }))}
                {field(t.customPageMenuLabelEn, page.menuLabel?.en || "", (value) => updatePage({ menuLabel: { ...page.menuLabel, en: value } }))}
                {field(t.customPageMenuLabelBn, page.menuLabel?.bn || "", (value) => updatePage({ menuLabel: { ...page.menuLabel, bn: value } }))}
                <label className="adm-home-row-toggle">
                  <input type="checkbox" checked={page.showInMenu === true} onChange={(event) => updatePage({ showInMenu: event.target.checked })} />
                  <span>{t.customPageShowMenu}</span>
                </label>
                <label className="adm-home-row-toggle">
                  <input type="checkbox" checked={page.published === true} onChange={(event) => updatePage({ published: event.target.checked })} />
                  <span>{t.customPagePublished}</span>
                </label>
              </div>
            </section>
            <section className="adm-card">
              <div className="adm-card__head"><h2>{lang === "en" ? "Page features" : "পেজের ফিচার"}</h2></div>
              <div className="adm-grid">
                {CUSTOM_PAGE_LAYOUT_OPTIONS.map(([key, labelEn, labelBn]) => (
                  <label className="adm-home-row-toggle" key={key}>
                    <input
                      type="checkbox"
                      checked={page.layout?.[key] !== false}
                      onChange={(event) => updatePage({ layout: { ...page.layout, [key]: event.target.checked } })}
                    />
                    <span>{lang === "en" ? labelEn : labelBn}</span>
                  </label>
                ))}
              </div>
              <div className="adm-field is-wide">
                <span>{lang === "en" ? "Header control order" : "হেডার কন্ট্রোলের ক্রম"}</span>
                <ol className="adm-home-order adm-header-control-order">
                  {(Array.isArray(page.layout?.headerControlOrder) ? page.layout.headerControlOrder : CUSTOM_PAGE_HEADER_CONTROL_ORDER).map((key, index, order) => {
                    const [, labelEn, labelBn] = CUSTOM_PAGE_LAYOUT_OPTIONS.find(([option]) => option === key) || [];
                    return (
                      <li
                        className={`adm-home-order__item adm-header-control-order__item${draggedHeaderControl === key ? " is-dragging" : ""}${dropTargetHeaderControl === key ? " is-drop-target" : ""}`}
                        key={key}
                        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTargetHeaderControl(key); }}
                        onDrop={(event) => { event.preventDefault(); moveHeaderControlTo(draggedHeaderControl || event.dataTransfer.getData("text/plain"), key); setDraggedHeaderControl(null); setDropTargetHeaderControl(null); }}
                        onDragLeave={() => setDropTargetHeaderControl((current) => current === key ? null : current)}
                      >
                        <div className="adm-home-order__position">
                          <span className="adm-home-order__number">{index + 1}</span>
                          <button type="button" className="adm-home-drag-handle" draggable aria-label={`${headerDragLabel}: ${labelEn || key}`} title={headerDragLabel}
                            onDragStart={(event) => { setDraggedHeaderControl(key); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", key); }}
                            onDragEnd={() => { setDraggedHeaderControl(null); setDropTargetHeaderControl(null); }}><FiMenu aria-hidden="true" /></button>
                        </div>
                        <strong className="adm-home-order__label">{lang === "en" ? labelEn || key : labelBn || key}</strong>
                        <div className="adm-home-order__actions">
                          <button type="button" className="adm-iconbtn" aria-label={headerMoveLeftLabel} title={headerMoveLeftLabel} disabled={index === 0} onClick={() => moveHeaderControl(key, -1)}><FiArrowLeft aria-hidden="true" /></button>
                          <button type="button" className="adm-iconbtn" aria-label={headerMoveRightLabel} title={headerMoveRightLabel} disabled={index === order.length - 1} onClick={() => moveHeaderControl(key, 1)}><FiArrowRight aria-hidden="true" /></button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </section>
            <section className="adm-card">
              <div className="adm-card__head"><h2>{t.customPageSections}</h2></div>
              <div className="adm-chips">
                {customPageSectionCatalog.map((item) => (
                  <button type="button" key={item.type} onClick={() => addSection(item.type)}><FiPlus aria-hidden="true" /> {sectionLabel(item.type)}</button>
                ))}
              </div>
              <ol className="adm-home-order adm-custom-page-sections">
                {(page.sections || []).map((item, index) => (
                  <li
                    className={`adm-home-order__item${draggedCustomPageSection === item.id ? " is-dragging" : ""}${dropTargetCustomPageSection === item.id ? " is-drop-target" : ""}`}
                    key={item.id}
                    onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTargetCustomPageSection(item.id); }}
                    onDrop={(event) => { event.preventDefault(); moveSectionTo(draggedCustomPageSection || event.dataTransfer.getData("text/plain"), item.id); setDraggedCustomPageSection(null); setDropTargetCustomPageSection(null); }}
                    onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDropTargetCustomPageSection((current) => current === item.id ? null : current); }}
                  >
                    <div className="adm-home-order__position">
                      <span className="adm-home-order__number">{index + 1}</span>
                      <button
                        type="button"
                        className="adm-home-drag-handle"
                        draggable
                        aria-label={`${headerDragLabel}: ${sectionLabel(item.type)}`}
                        title={headerDragLabel}
                        onDragStart={(event) => { setDraggedCustomPageSection(item.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", item.id); }}
                        onDragEnd={() => { setDraggedCustomPageSection(null); setDropTargetCustomPageSection(null); }}
                      ><FiMenu aria-hidden="true" /></button>
                    </div>
                    <strong className="adm-home-order__label">{sectionLabel(item.type)}</strong>
                    <div className="adm-home-order__titles">
                      <div className="adm-home-order__title-pair">
                        <input aria-label={t.customPageSectionTitleEn} placeholder={t.customPageSectionTitleEn} value={item.title?.en || ""} maxLength={80} onChange={(event) => updatePageSection(item.id, { title: { ...item.title, en: event.target.value } })} />
                        <input aria-label={t.customPageSectionTitleBn} placeholder={t.customPageSectionTitleBn} value={item.title?.bn || ""} maxLength={80} onChange={(event) => updatePageSection(item.id, { title: { ...item.title, bn: event.target.value } })} />
                      </div>
                    </div>
                    <label className="adm-home-row-toggle"><input type="checkbox" checked={item.enabled !== false} onChange={(event) => updatePageSection(item.id, { enabled: event.target.checked })} /><span>{item.enabled !== false ? t.shown : t.hidden}</span></label>
                    <div className="adm-home-order__actions">
                      <button type="button" className="adm-iconbtn" aria-label={t.customPageMoveUp} disabled={index === 0} onClick={() => moveSection(item.id, -1)}><FiArrowUp aria-hidden="true" /></button>
                      <button type="button" className="adm-iconbtn" aria-label={t.customPageMoveDown} disabled={index === (page.sections || []).length - 1} onClick={() => moveSection(item.id, 1)}><FiArrowDown aria-hidden="true" /></button>
                      <button type="button" className="adm-iconbtn adm-iconbtn--danger" aria-label={t.customPageRemoveSection} onClick={() => updatePage({ sections: (page.sections || []).filter((entry) => entry.id !== item.id).map((entry, position) => ({ ...entry, position })) })}><FiTrash2 aria-hidden="true" /></button>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <button type="button" className="adm-btn adm-btn--danger" onClick={deletePage}><FiTrash2 aria-hidden="true" /> {t.customPageDelete}</button>
          </>
        )}
      </>
    );
  };

  const renderFooter = () => {
    const entries = Object.entries(footerContent[footerLanguage] || {}).filter(([key]) => footerFieldGroups[footerGroup].includes(key));
    return (
      <>
        <div className="adm-toolbar">
          <div className="adm-chips" role="group" aria-label={t.footer}>
            {Object.entries({ content: t.copyGroup, serviceLinks: t.serviceGroup, aboutLinks: t.companyGroup, payments: t.paymentsGroup }).map(([key, label]) => <button type="button" key={key} aria-pressed={footerGroup === key} onClick={() => setFooterGroup(key)}>{label}</button>)}
          </div>
          {langSeg(footerLanguage, setFooterLanguage)}
        </div>
        <section className="adm-card">
          <div className="adm-grid">
            {entries.map(([key, value]) => {
              const label = t[key] || key.replace(/([A-Z])/g, " $1");
              if (Array.isArray(value)) {
                const isLink = footerLinkKeys.has(key);
                return (
                  <div className="adm-field is-wide" key={key}>
                    <span>{label}</span>
                    {isLink && <small>{t.linkHelp}</small>}
                    <div className="adm-rows">
                      {isLink && value.length > 0 && <div className="adm-row adm-row--link adm-row--head" aria-hidden="true"><span>{t.linkName}</span><span>{t.destination}</span><span /></div>}
                      {value.map((item, index) => (
                        <div className={`adm-row ${isLink ? "adm-row--link" : "adm-row--single"}`} key={`${key}-${index}`}>
                          {isLink ? <>
                            {bare(`${t.linkName} ${index + 1}`, item.label, (next) => updateFooterLink(footerLanguage, key, index, "label", next))}
                            {bare(t.destination, item.url, (next) => updateFooterLink(footerLanguage, key, index, "url", next))}
                          </> : bare(`${label} ${index + 1}`, item, (next) => updateFooter(footerLanguage, key, value.map((entry, i) => i === index ? next : entry)))}
                          {delButton(`${t.remove} ${label} ${index + 1}`, () => updateFooter(footerLanguage, key, value.filter((_, i) => i !== index)))}
                        </div>
                      ))}
                    </div>
                    <button type="button" className="adm-btn adm-btn--self" onClick={() => updateFooter(footerLanguage, key, [...value, isLink ? { label: "", url: "" } : ""])}><FiPlus aria-hidden="true" /> {t.addRow}</button>
                  </div>
                );
              }
              if (typeof value === "string") return field(label, value, (next) => updateFooter(footerLanguage, key, next), { wide: value.length > 60 });
              return null;
            })}
          </div>
        </section>
      </>
    );
  };

  const renderSeo = () => {
    const current = seo[seoLanguage] || {};
    const siteName = (seoLanguage === "bn" && branding.brand_name_bn) || branding.brand_name_en;
    const patch = (key, value) => setSeo((state) => ({ ...state, [seoLanguage]: { ...state[seoLanguage], [key]: value } }));
    return (
      <>
        <div className="adm-toolbar"><span className="adm-toolbar__label">{t.seoHeading}</span>{langSeg(seoLanguage, setSeoLanguage)}</div>
        <section className="adm-card">
          <div className="adm-grid">
            {field(t.seoTitle, current.title, (value) => patch("title", value))}
            {field(t.seoKeywords, current.keywords, (value) => patch("keywords", value))}
            <label className="adm-field is-wide"><span>{t.seoDescription}</span>
              <textarea maxLength={500} rows={3} value={current.description || ""} onChange={(event) => patch("description", event.target.value)} />
              <small className="adm-count">{(current.description || "").length}/500</small>
            </label>
            {field(t.seoImage, seo.og_image, (value) => setSeo((state) => ({ ...state, og_image: value })), { type: "url", wide: true })}
          </div>
        </section>
        <section className="adm-card">
          <h2>{t.serpPreview}</h2>
          <div className="adm-serp">
            <b>{current.title?.trim() || siteName}</b>
            <span>{current.description?.trim() || "—"}</span>
          </div>
        </section>
      </>
    );
  };

  const panels = { brand: renderBrand, contact: renderContact, features: renderFeatures, campaigns: renderCampaigns, customPages: renderCustomPages, pages: renderPages, footer: renderFooter, seo: renderSeo };
  const active = SECTIONS.find((item) => item.id === section) || SECTIONS[0];
  const isSettings = SETTINGS_SECTIONS.has(section);

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-side__brand"><span>{branding.brand_name_en || "Dokani"}</span><small>{t.title}</small></div>
        <nav className="adm-nav" aria-label={t.title}>
          {NAV_GROUPS.map((group) => (
            <div className="adm-nav__group" key={group}>
              <p className="adm-nav__label">{t[group]}</p>
              {SECTIONS.filter((item) => item.group === group).map((item) => (
                <button type="button" key={item.id} aria-current={section === item.id ? "page" : undefined} onClick={() => go(item.id)}>
                  <item.icon aria-hidden="true" /><span>{t[item.label]}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <Link
          href="/"
          className="adm-back"
          onClick={(event) => {
            if (!dirty) return;
            event.preventDefault();
            setConfirmation({
              title: t.backToStore,
              message: t.leaveConfirm,
              confirmLabel: t.leaveAction,
              onConfirm: () => window.location.assign("/"),
            });
          }}
        ><FiArrowLeft aria-hidden="true" /> <span>{t.backToStore}</span></Link>
      </aside>

      <div className="adm-main">
        <header className="adm-top">
          <div className="adm-top__title"><h1>{t[active.label]}</h1><p>{t[active.hint]}</p></div>
          {isSettings && !loading && !loadFailed && (
            <div className="adm-top__actions">
              <span className={`adm-status${dirty ? " is-dirty" : ""}`} role="status"><i aria-hidden="true" />{dirty ? t.unsaved : t.allSaved}</span>
              <button type="button" className="adm-btn adm-btn--ghost" disabled={!dirty || saving} onClick={load}>{t.discard}</button>
              <button type="submit" form="adm-settings-form" className="adm-btn adm-btn--primary" disabled={saving || !dirty}>{saving ? t.saving : <><FiSave aria-hidden="true" /> {t.save}</>}</button>
            </div>
          )}
        </header>
        <div className="adm-scroll">
          <div className="adm-content">
            {loading ? <p className="adm-empty">{t.loading}</p>
              : loadFailed ? <div className="adm-empty"><p>{t.loadFailed}</p><button type="button" className="adm-btn adm-btn--primary" onClick={load}>{t.retry}</button></div>
              : isSettings ? <form id="adm-settings-form" className="adm-form" onSubmit={saveSettings} noValidate>{panels[section]()}</form>
              : panels[section]()}
          </div>
        </div>
      </div>

      {draft && (
        <div className="adm-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDraft(null); }}>
          <section className="adm-dialog" role="dialog" aria-modal="true" aria-labelledby="adm-campaign-title">
            <form onSubmit={saveCampaign}>
              <div className="adm-dialog__head">
                <div><h2 id="adm-campaign-title">{draft.id ? t.editCampaign : t.newCampaign}</h2><small>{t.requiredFieldsNote}</small></div>
                <button type="button" className="adm-iconbtn" aria-label={t.cancel} onClick={() => setDraft(null)}><FiX aria-hidden="true" /></button>
              </div>
              <div className="adm-dialog__body">
                <div className="adm-kinds" role="radiogroup" aria-label={t.kindLabel}>
                  {["main", "offer", "bar", "festival"].map((k) => (
                    <label key={k} className={`adm-kind${kind === k ? " is-on" : ""}`}>
                      <input type="radio" name="campaign-kind" value={k} checked={kind === k} onChange={() => chooseKind(k)} />
                      <strong>{t[`kind_${k}`]}</strong><small>{t[`kindHelp_${k}`]}</small>
                    </label>
                  ))}
                </div>
                <div className="adm-grid">
                  {kind === "festival" && <label className="adm-field is-wide"><span>{t.festival}</span><select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>{FESTIVALS.map((type) => <option key={type} value={type}>{campaignTypeLabel(type)}</option>)}</select></label>}
                  {field(t.titleEn, draft.title_en, (value) => setDraft({ ...draft, title_en: value }), { required: true })}
                  {field(t.titleBn, draft.title_bn, (value) => setDraft({ ...draft, title_bn: value }))}
                  {kind !== "bar" && <label className="adm-field"><span>{t.contentEn}</span><textarea rows={3} value={draft.content_en || ""} onChange={(event) => setDraft({ ...draft, content_en: event.target.value })} /></label>}
                  {kind !== "bar" && <label className="adm-field"><span>{t.contentBn}</span><textarea rows={3} value={draft.content_bn || ""} onChange={(event) => setDraft({ ...draft, content_bn: event.target.value })} /></label>}
                  {(() => {
                    const url = draft.target_url || "";
                    const typedKey = shopCategoryOf(url);
                    const exact = typedKey && shopCategories.some((item) => item.key === typedKey);
                    const fixed = shopCategories.length && typedKey && !exact ? fixShopLink(url, shopCategories) : url;
                    const pick = typedKey === "" && !url.includes("?") ? "shop" : exact ? `cat:${typedKey}` : "custom";
                    const en = lang === "en";
                    return (
                      <label className={`adm-field${kind === "bar" ? " is-wide" : ""}`}>
                        <span>{t.target}</span>
                        {shopCategories.length > 0 && (
                          <select aria-label={t.target} value={pick} onChange={(event) => { const v = event.target.value; if (v === "shop") setDraft({ ...draft, target_url: "/shop" }); else if (v.startsWith("cat:")) setDraft({ ...draft, target_url: shopCategoryHref(v.slice(4)) }); }}>
                            <option value="shop">{en ? "All products (/shop)" : "সব পণ্য (/shop)"}</option>
                            {shopCategories.map((item) => <option key={item.key} value={`cat:${item.key}`}>{`${"— ".repeat(item.depth)}${item.label}`}</option>)}
                            <option value="custom" disabled={pick !== "custom"}>{en ? "Custom link (typed below)" : "নিজের লেখা লিংক (নিচে)"}</option>
                          </select>
                        )}
                        <input type="text" value={url} placeholder="/shop?category=..." onChange={(event) => setDraft({ ...draft, target_url: event.target.value })} />
                        {typedKey && !exact && shopCategories.length > 0 && (fixed !== url
                          ? <small>{en ? `Will be saved as ${fixed}` : `সংরক্ষণের সময় হবে ${fixed}`}</small>
                          : <small>{en ? "No category has this key. Pick one from the list above." : "এই কী-র কোনো ক্যাটাগরি নেই। উপরের তালিকা থেকে বেছে নিন।"}</small>)}
                      </label>
                    );
                  })()}
                  {kind !== "bar" && (
                    <div className="adm-field" role="group" aria-label={t.uploadCampaignImage}>
                      <span>{t.uploadCampaignImage}</span>
                      <div className="adm-upload">
                        <div className="adm-asset__thumb">{(imagePreview || draft.image_url) ? <img src={imagePreview || draft.image_url} alt="" /> : <FiImage aria-hidden="true" />}</div>
                        <div className="adm-asset__body">
                          <small className="adm-asset__name">{imageFile?.name || (lang === "en" ? "PNG, JPG or WebP, up to 5 MB." : "PNG, JPG বা WebP, সর্বোচ্চ ৫ MB।")}</small>
                          <label className="adm-file"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] || null)} /><span><FiUpload aria-hidden="true" /> {(imagePreview || draft.image_url) ? t.replace : t.upload}</span></label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {offerKind && (
                  <fieldset className="adm-sub">
                    <legend>{t.legendOffer}</legend>
                    <small>{t.pkHint}</small>
                    <ProductPicker products={campaignProducts} value={(draft.product_ids || []).map(String)} onChange={(ids) => setDraft({ ...draft, product_ids: ids })} t={t} lang={lang} />
                    <div className="adm-grid">
                      <label className="adm-field"><span>{t.discountType}</span><select value={draft.discount_type || "percentage"} onChange={(event) => setDraft({ ...draft, discount_type: event.target.value })}><option value="percentage">{t.discountPct}</option><option value="fixed">{t.discountFixed}</option></select></label>
                      <label className="adm-field"><span>{discountIsPct ? t.discountPercent : t.discountAmount}{hasProducts && <b className="adm-req" aria-hidden="true"> *</b>}</span>
                        <input type="number" min="0.01" max={discountIsPct ? "100" : undefined} step={discountIsPct ? "1" : "0.01"} required={hasProducts} value={draft.discount_value || ""} onChange={(event) => setDraft({ ...draft, discount_value: event.target.value })} />
                        <small>{hasProducts ? t.discountHint : t.discountNone}</small>
                      </label>
                    </div>
                    {previewLabel && <p className="adm-preview">{t.discountPreview} <b className="adm-sale">{previewLabel}</b></p>}
                  </fieldset>
                )}
                <details className="adm-more" open><summary>{t.moreOptions}</summary>
                  <div className="adm-grid">
                    {field(t.start, draft.starts_at, (value) => setDraft({ ...draft, starts_at: value }), { type: "datetime-local" })}
                    {field(t.end, draft.ends_at, (value) => setDraft({ ...draft, ends_at: value }), { type: "datetime-local" })}
                    {kind === "festival" && field(t.deadline, draft.order_deadline, (value) => setDraft({ ...draft, order_deadline: value }), { type: "datetime-local" })}
                    {field(t.displayOrder, draft.sort_order, (value) => setDraft({ ...draft, sort_order: value }), { type: "number" })}
                  </div>
                </details>
              </div>
              <div className="adm-dialog__foot">
                <label className="adm-switch adm-switch--inline"><input type="checkbox" checked={String(draft.status) === "1" || draft.status === true} onChange={(event) => setDraft({ ...draft, status: event.target.checked ? "1" : "0" })} /><i aria-hidden="true" /><strong>{t.active}</strong></label>
                <div className="adm-dialog__buttons">
                  <button type="button" className="adm-btn" onClick={() => setDraft(null)} disabled={saving}>{t.cancel}</button>
                  <button type="submit" className="adm-btn adm-btn--primary" disabled={saving}>{saving ? t.saving : <><FiSave aria-hidden="true" /> {t.saveCampaign}</>}</button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}

      {confirmation && (
        <div className="adm-modal adm-confirm-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmation(null); }}>
          <section className="adm-confirm" role="alertdialog" aria-modal="true" aria-labelledby="adm-confirm-title" aria-describedby="adm-confirm-message">
            <div className="adm-confirm__icon" aria-hidden="true"><FiAlertCircle /></div>
            <h2 id="adm-confirm-title">{confirmation.title}</h2>
            <p id="adm-confirm-message">{confirmation.message}</p>
            <div className="adm-confirm__actions">
              <button type="button" className="adm-btn" onClick={() => setConfirmation(null)}>{t.keepEditing}</button>
              <button
                type="button"
                className={`adm-btn${confirmation.danger ? " adm-btn--danger" : " adm-btn--primary"}`}
                onClick={() => {
                  const action = confirmation.onConfirm;
                  setConfirmation(null);
                  action?.();
                }}
              >{confirmation.confirmLabel || t.confirmAction}</button>
            </div>
          </section>
        </div>
      )}

      {notice && <p className={`adm-toast${notice.kind === "err" ? " is-err" : ""}`} role="status">{notice.kind === "err" ? <FiAlertCircle aria-hidden="true" /> : <FiCheck aria-hidden="true" />}{notice.message}</p>}
    </div>
  );
}
