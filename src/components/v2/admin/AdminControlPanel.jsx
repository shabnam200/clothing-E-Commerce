"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiX, FiTrash2, FiEdit2, FiSave } from "react-icons/fi";
import enMessages from "@/messages/v2/en";
import bnMessages from "@/messages/v2/bn";
import { FOOTER_HREFS, V2_SOCIALS } from "@/config/v2";

const emptyCampaign = () => ({ type: "banner", placement: "hero", title_bn: "", title_en: "", content_bn: "", content_en: "", image_url: "", target_url: "/shop", starts_at: "", ends_at: "", order_deadline: "", status: "1", sort_order: "0" });
const footerDefaults = {
  en: { ...enMessages.footer, newsletterTitle: enMessages.news.title, newsletterText: enMessages.news.text, newsletterPlaceholder: enMessages.news.placeholder, newsletterLabel: enMessages.news.label, newsletterButton: enMessages.news.button, newsletterOk: enMessages.news.ok, newsletterBad: enMessages.news.bad },
  bn: { ...bnMessages.footer, newsletterTitle: bnMessages.news.title, newsletterText: bnMessages.news.text, newsletterPlaceholder: bnMessages.news.placeholder, newsletterLabel: bnMessages.news.label, newsletterButton: bnMessages.news.button, newsletterOk: bnMessages.news.ok, newsletterBad: bnMessages.news.bad },
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
  newsletter: ["newsletterTitle", "newsletterText", "newsletterLabel", "newsletterPlaceholder", "newsletterButton", "newsletterOk", "newsletterBad"],
  payments: ["payments"],
};
const normalizeFooter = (language, stored = {}) => {
  const content = { ...footerDefaults[language], ...stored };
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
  bn: { title: "\u0993\u09af\u09bc\u09c7\u09ac\u09b8\u09be\u0987\u099f \u0995\u09a8\u09cd\u099f\u09cd\u09b0\u09cb\u09b2", close: "\u09ac\u09a8\u09cd\u09a7", settings: "\u09b8\u09be\u0987\u099f \u09b8\u09c7\u099f\u09bf\u0982\u09b8", campaigns: "\u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0 \u0993 \u0985\u09ab\u09be\u09b0", loading: "\u09b2\u09cb\u09a1 \u09b9\u099a\u09cd\u099b\u09c7...", save: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3", saved: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09bf\u09a4 \u09b9\u09af\u09bc\u09c7\u099b\u09c7", failed: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3 \u09b9\u09af\u09bc\u09a8\u09bf", delivery: "\u09a1\u09c7\u09b2\u09bf\u09ad\u09be\u09b0\u09bf", fee: "\u09a1\u09c7\u09b2\u09bf\u09ad\u09be\u09b0\u09bf \u099a\u09be\u09b0\u09cd\u099c", freeOver: "\u09ab\u09cd\u09b0\u09bf \u09a1\u09c7\u09b2\u09bf\u09ad\u09be\u09b0\u09bf \u09b8\u09c0\u09ae\u09be", express: "\u098f\u0995\u09cd\u09b8\u09aa\u09cd\u09b0\u09c7\u09b8 \u099a\u09be\u09b0\u09cd\u099c", returns: "\u09b0\u09bf\u099f\u09be\u09b0\u09cd\u09a8 \u09b8\u09ae\u09af\u09bc (\u09a6\u09bf\u09a8)", support: "\u09af\u09cb\u0997\u09be\u09af\u09cb\u0997", phone: "\u09ab\u09cb\u09a8", whatsapp: "WhatsApp", email: "\u0987\u09ae\u0987\u09b2", address: "\u09a0\u09bf\u0995\u09be\u09a8\u09be", footer: "\u09ab\u09c1\u099f\u09be\u09b0 (JSON)", socials: "\u09b8\u09cb\u09b6\u09cd\u09af\u09be\u09b2 \u09b2\u09bf\u0982\u0995 (JSON)", newCampaign: "\u09a8\u09a4\u09c1\u09a8 \u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0 / \u0985\u09ab\u09be\u09b0", type: "\u09a7\u09b0\u09a8", banner: "\u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0", offer: "\u0985\u09ab\u09be\u09b0", titleBn: "\u09b6\u09bf\u09b0\u09cb\u09a8\u09be\u09ae (\u09ac\u09be\u0982\u09b2\u09be)", titleEn: "Title (English)", contentBn: "\u09ac\u09bf\u09ac\u09b0\u09a3 (\u09ac\u09be\u0982\u09b2\u09be)", contentEn: "Description (English)", image: "\u099b\u09ac\u09bf \u0986\u09aa\u09b2\u09cb\u09a1", imageUrl: "\u0985\u09a5\u09ac\u09be \u099b\u09ac\u09bf\u09b0 URL", target: "\u09b2\u09bf\u0982\u0995", active: "\u099a\u09be\u09b2\u09c1", order: "\u0995\u09cd\u09b0\u09ae", start: "\u09b6\u09c1\u09b0\u09c1", end: "\u09b6\u09c7\u09b7", deadline: "\u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u09a1\u09c7\u09a1\u09b2\u09be\u0987\u09a8", saveCampaign: "\u0995\u09cd\u09af\u09be\u09ae\u09cd\u09aa\u09c7\u0987\u09a8 \u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3", edit: "\u098f\u09a1\u09bf\u099f", remove: "\u09ae\u09c1\u099b\u09c1\u09a8", noCampaigns: "\u0995\u09cb\u09a8\u09cb \u0995\u09cd\u09af\u09be\u09ae\u09cd\u09aa\u09c7\u0987\u09a8 \u09a8\u09c7\u0987", cancel: "\u09ac\u09be\u09a4\u09bf\u09b2" },
  en: { title: "Website Control", close: "Close", settings: "Site settings", campaigns: "Banners & offers", loading: "Loading...", save: "Save changes", saved: "Changes saved.", failed: "Could not save changes.", delivery: "Delivery", fee: "Delivery fee", freeOver: "Free delivery from", express: "Express fee", returns: "Return window (days)", support: "Contact details", phone: "Phone", whatsapp: "WhatsApp", email: "Email", address: "Address", footer: "Footer content (JSON)", socials: "Social links (JSON)", newCampaign: "New banner / offer", type: "Type", banner: "Banner", offer: "Offer", titleBn: "Title (Bangla)", titleEn: "Title (English)", contentBn: "Description (Bangla)", contentEn: "Description (English)", image: "Upload image", imageUrl: "Or image URL", target: "Link", active: "Active", order: "Order", start: "Starts at", end: "Ends at", deadline: "Order deadline", saveCampaign: "Save campaign", edit: "Edit", remove: "Delete", noCampaigns: "No banners or offers yet.", cancel: "Cancel" },
};

Object.assign(copy.bn, {
  footer: "ফুটার কনটেন্ট", socials: "সোশ্যাল লিংক", addRow: "যোগ করুন", remove: "মুছুন",
  footerEn: "English ফুটার", footerBn: "বাংলা ফুটার", platform: "প্ল্যাটফর্ম", linkName: "লিংকের নাম", url: "লিংক URL", destination: "লিংকের গন্তব্য", linkHelp: "নিজের সাইটের পেজ হলে /info/about-এর মতো path দিন, বাইরের সাইট হলে https:// URL দিন।", brandTab: "ব্র্যান্ড", contactTab: "যোগাযোগ", footerTab: "ফুটার", socialsTab: "সোশ্যাল",
  english: "English", bangla: "বাংলা", copyGroup: "লেখা", serviceGroup: "সার্ভিস লিংক", companyGroup: "কোম্পানি লিংক", newsletterGroup: "নিউজলেটার", paymentsGroup: "পেমেন্ট",
  newsletterTitle: "নিউজলেটার শিরোনাম", newsletterText: "নিউজলেটার বিবরণ", newsletterLabel: "ইমেইল লেবেল", newsletterPlaceholder: "ইনপুট placeholder", newsletterButton: "সাবস্ক্রাইব বাটন", newsletterOk: "সফল বার্তা", newsletterBad: "ভুল ইমেইলের বার্তা",
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
  footer: "Footer content", socials: "Social links", addRow: "Add item", remove: "Remove",
  footerEn: "English footer", footerBn: "Bangla footer", platform: "Platform", linkName: "Link name", url: "Link URL", destination: "Destination URL", linkHelp: "For a page on this site, use a path like /info/about. For another site, use its full https:// URL.", brandTab: "Brand", contactTab: "Contact", footerTab: "Footer", socialsTab: "Social links",
  english: "English", bangla: "Bangla", copyGroup: "Footer copy", serviceGroup: "Service links", companyGroup: "Company links", newsletterGroup: "Newsletter", paymentsGroup: "Payment methods",
  newsletterTitle: "Newsletter heading", newsletterText: "Newsletter description", newsletterLabel: "Email label", newsletterPlaceholder: "Input placeholder", newsletterButton: "Subscribe button", newsletterOk: "Success message", newsletterBad: "Invalid email message",
  tagline: "Brand tagline", quick: "Quick links heading", service: "Service heading", about: "Company heading", follow: "Social heading", rights: "Copyright text",
  quickLinks: "Quick links", serviceLinks: "Service links", aboutLinks: "Company links", payments: "Payment methods",
  brandHeading: "Brand & language", websiteNameEn: "Website name (English, required)", websiteNameBn: "Website name (Bangla, optional)",
  languageMode: "Website language", englishOnly: "English (en)", banglaOnly: "Bangla (bn)", bothLanguages: "English and Bangla",
  nameRequired: "Enter the website name in English.", siteLogo: "Header logo", favicon: "Favicon", brandLogo: "Footer brand logo",
  chooseImage: "Choose image (PNG, JPG, WebP; up to 5 MB)", imageSaved: "Image uploaded.",
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
Object.assign(copy.bn, { featuresTab: "\u09ab\u09bf\u099a\u09be\u09b0 \u099a\u09be\u09b2\u09c1/\u09ac\u09a8\u09cd\u09a7", seoTab: "SEO", featureHeading: "\u0995\u09cb\u09a8 \u09b8\u09c7\u0995\u09b6\u09a8 \u09a6\u09c7\u0996\u09be\u09ac\u09c7", homeHero: "\u09b9\u09cb\u09ae\u09aa\u09c7\u099c \u09aa\u09cd\u09b0\u09a7\u09be\u09a8 \u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0", homeCategories: "\u0995\u09cd\u09af\u09be\u099f\u09be\u0997\u09b0\u09bf \u09b8\u09c7\u0995\u09b6\u09a8", homeProducts: "\u09aa\u09cd\u09b0\u09cb\u09a1\u09be\u0995\u09cd\u099f \u09b8\u09c7\u0995\u09b6\u09a8", homeLookbook: "\u09b2\u09c1\u0995\u09ac\u09c1\u0995 \u09b8\u09c7\u0995\u09b6\u09a8", homePromotions: "\u09aa\u09cd\u09b0\u09ae\u09cb\u09b6\u09a8 \u0995\u09cd\u09af\u09be\u09b0\u09be\u09b8\u09c7\u09b2", homePerks: "\u09b8\u09c1\u09ac\u09bf\u09a7\u09be\u09b0 \u09b8\u09c7\u0995\u09b6\u09a8", footerNewsletter: "\u09ab\u09c1\u099f\u09be\u09b0 \u09a8\u09bf\u0989\u099c\u09b2\u09c7\u099f\u09be\u09b0", seoHeading: "\u09b8\u09be\u0987\u099f SEO \u09a4\u09a5\u09cd\u09af", seoTitle: "\u09aa\u09c7\u099c \u09b6\u09bf\u09b0\u09cb\u09a8\u09be\u09ae", seoDescription: "\u09ae\u09c7\u099f\u09be \u09ac\u09bf\u09ac\u09b0\u09a3", seoKeywords: "\u0995\u09c0\u0993\u09af\u09bc\u09be\u09b0\u09cd\u09a1 (comma separated)", seoImage: "Open Graph \u099b\u09ac\u09bf URL", placement: "\u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0\u09c7\u09b0 \u09b8\u09cd\u09a5\u09be\u09a8", heroPosition: "\u09b9\u09cb\u09ae\u09aa\u09c7\u099c\u09c7\u09b0 \u09ae\u09c2\u09b2 \u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0", promoPosition: "\u09b9\u09cb\u09ae\u09aa\u09c7\u099c \u09aa\u09cd\u09b0\u09ae\u09cb\u09b6\u09a8 \u0995\u09cd\u09af\u09be\u09b0\u09be\u09b8\u09c7\u09b2", announcePosition: "\u09b2\u09cb\u09a1\u09bc\u09be\u09b0\u09c7\u09b0 \u0989\u09aa\u09b0\u09c7\u09b0 \u0985\u09ab\u09be\u09b0 \u09ac\u09be\u09b0", typeBanner: "\u09aa\u09cd\u09b0\u09a7\u09be\u09a8 \u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0", typeOffer: "\u09a1\u09bf\u09b8\u0995\u09be\u0989\u09a8\u09cd\u099f \u0985\u09ab\u09be\u09b0", typeSeasonal: "\u09ae\u09cc\u09b8\u09c1\u09ae\u09bf \u0995\u09cd\u09af\u09be\u09ae\u09cd\u09aa\u09c7\u0987\u09a8" });
Object.assign(copy.en, { featuresTab: "Features", seoTab: "SEO", featureHeading: "Show these sections", homeHero: "Homepage hero banner", homeCategories: "Categories section", homeProducts: "Product showcases", homeLookbook: "Lookbook section", homePromotions: "Promotions carousel", homePerks: "Benefits section", footerNewsletter: "Footer newsletter", seoHeading: "Search and sharing details", seoTitle: "Page title", seoDescription: "Meta description", seoKeywords: "Keywords (comma separated)", seoImage: "Open Graph image URL", placement: "Show banner in", heroPosition: "Homepage main banner", promoPosition: "Homepage promotions carousel", announcePosition: "Top announcement bar", typeBanner: "Main banner", typeOffer: "Discount offer", typeSeasonal: "Seasonal campaign" });

export default function AdminControlPanel({ lang = "bn", displayMode = "drawer" }) {
  const t = copy[lang === "en" ? "en" : "bn"];
  const campaignTypeLabel = (type) => ({ banner: t.typeBanner, offer: t.typeOffer, seasonal: t.typeSeasonal, theme: t.theme, eid: lang === "en" ? "Eid" : "\u0988\u09a6", puja: lang === "en" ? "Puja" : "\u09aa\u09c2\u099c\u09be", boishakh: lang === "en" ? "Boishakh" : "\u09ac\u09c8\u09b6\u09be\u0996" }[String(type || "").toLowerCase()] || String(type || ""));
  const campaignPlacementLabel = (campaign) => {
    const placement = campaign.placement || (campaign.type === "offer" ? "announcement" : ["seasonal", "theme", "eid", "puja", "boishakh"].includes(campaign.type) ? "promo" : "hero");
    return placement === "announcement" ? t.announcePosition : placement === "promo" ? t.promoPosition : t.heroPosition;
  };
  const router = useRouter();
  const [tab, setTab] = useState("settings");
  const [settingsSection, setSettingsSection] = useState("brand");
  const [footerGroup, setFooterGroup] = useState("content");
  const [footerLanguage, setFooterLanguage] = useState("en");
  const [pageLanguage, setPageLanguage] = useState("en");
  const [seoLanguage, setSeoLanguage] = useState("en");
  const [pageSlug, setPageSlug] = useState("shipping");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [support, setSupport] = useState({});
  const [featureToggles, setFeatureToggles] = useState({ home_hero: true, home_categories: true, home_products: true, home_lookbook: true, home_promotions: true, home_perks: true, footer_newsletter: true });
  const [seo, setSeo] = useState({ en: { title: "", description: "", keywords: "" }, bn: { title: "", description: "", keywords: "" }, og_image: "" });
  const [branding, setBranding] = useState({ brand_name_en: "AVENOR", brand_name_bn: "", language: "en", site_logo_url: "", favicon_url: "", brand_logo_url: "" });
  const [brandFiles, setBrandFiles] = useState({});
  const [footerContent, setFooterContent] = useState({ en: normalizeFooter("en"), bn: normalizeFooter("bn") });
  const [infoPages, setInfoPages] = useState({ en: clone(infoPageDefaults.en), bn: clone(infoPageDefaults.bn) });
  const [pageImageFile, setPageImageFile] = useState(null);
  const [socialLinks, setSocialLinks] = useState(V2_SOCIALS.map((item) => ({ platform: item.platform || item.icon, name: item.name, url: item.url || item.href })));
  const [campaigns, setCampaigns] = useState([]);
  const [draft, setDraft] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (!imageFile) { setImagePreview(""); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  async function load() {
    setLoading(true);
    setNotice("");
    try {
      const [settingsResponse, campaignResponse] = await Promise.all([
        fetch("/api/admin/settings", { cache: "no-store" }),
        fetch("/api/admin/campaigns", { cache: "no-store" }),
      ]);
      if (!settingsResponse.ok || !campaignResponse.ok) throw new Error("load");
      const settingsData = await settingsResponse.json();
      const campaignData = await campaignResponse.json();
      const values = settingsData.settings || settingsData;
      setSupport(values.support || {});
      setFeatureToggles((current) => ({ ...current, ...(values.feature_toggles || {}) }));
      setSeo((current) => ({ ...current, ...(values.seo || {}), en: { ...current.en, ...(values.seo?.en || {}) }, bn: { ...current.bn, ...(values.seo?.bn || {}) } }));
      setBranding({
        brand_name_en: values.brand_name_en || "AVENOR",
        brand_name_bn: values.brand_name_bn || "",
        language: ["en", "bn"].includes(values.language) ? values.language : (values.language_mode === "bn" ? "bn" : "en"),
        site_logo_url: values.site_logo_url || "",
        favicon_url: values.favicon_url || "",
        brand_logo_url: values.brand_logo_url || "",
      });
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
      setCampaigns(Array.isArray(campaignData.campaigns) ? campaignData.campaigns : []);
    } catch {
      setNotice(t.failed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* load once when the protected panel opens */ }, []);

  const setSupportField = (key, value) => setSupport((current) => ({ ...current, [key]: value }));
  const setPageValue = (path, value) => setInfoPages((current) => {
    const next = clone(current);
    let target = next[pageLanguage][pageSlug];
    for (const key of path.slice(0, -1)) target = target[key];
    target[path[path.length - 1]] = value;
    return next;
  });
  const renderPageValue = (value, path = [], fieldName = "") => {
    if (fieldName === "type" || fieldName === "image") return null;
    const label = fieldName.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (s) => s.toUpperCase());
    if (typeof value === "string") return <label className="v2-admin-control__field" key={path.join("-")}><span>{label}</span>{value.length > 110 ? <textarea rows={4} value={value} onChange={(event) => setPageValue(path, event.target.value)} /> : <input value={value} onChange={(event) => setPageValue(path, event.target.value)} />}</label>;
    if (Array.isArray(value)) return <div className="v2-admin-control__page-values" key={path.join("-")}>{value.map((item, index) => renderPageValue(item, [...path, index], String(index + 1)))}</div>;
    if (value && typeof value === "object") return <fieldset className="v2-admin-control__page-block" key={path.join("-")}><legend>{fieldName === "blocks" ? `${t.pageBody} ${path[path.length - 1] + 1}` : label}</legend>{Object.entries(value).map(([key, child]) => renderPageValue(child, [...path, key], key))}</fieldset>;
    return null;
  };
  const updateFooter = (language, key, value) => setFooterContent((current) => ({ ...current, [language]: { ...current[language], [key]: value } }));
  const updateFooterLink = (language, key, index, property, value) => setFooterContent((current) => ({
    ...current,
    [language]: { ...current[language], [key]: current[language][key].map((link, i) => i === index ? { ...link, [property]: value } : link) },
  }));
  const updateSocial = (index, key, value) => setSocialLinks((current) => current.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const input = (label, value, onChange, type = "text", required = false) => (
    <label key={label} className="v2-admin-control__field"><span>{label}{required && <span aria-hidden="true" style={{ color: "#c0392b" }}> *</span>}</span><input type={type} value={value ?? ""} required={required} onChange={(event) => onChange(event.target.value)} /></label>
  );

  async function saveSettings(event) {
    event.preventDefault();
    if (!branding.brand_name_en.trim()) { setNotice(t.nameRequired); return; }
    setSaving(true); setNotice("");
    try {
      const payload = {
        brand_name_en: branding.brand_name_en.trim(),
        brand_name_bn: branding.brand_name_bn.trim() || null,
        language: branding.language,
        info_pages: infoPages,
        support,
        feature_toggles: featureToggles,
        seo,
        footer_content: footerContent,
        social_links: socialLinks.filter((item) => item.platform && item.url),
      };
      const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("save");
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
      if (Object.keys(uploaded).length) {
        setBranding((current) => ({ ...current, ...uploaded }));
        setBrandFiles({});
      }
      setNotice(t.saved);
      router.refresh();
    } catch {
      setNotice(t.failed);
    } finally { setSaving(false); }
  }

  function editCampaign(campaign) {
    setDraft({ ...emptyCampaign(), ...campaign, placement: campaign.placement || (campaign.type === "offer" ? "announcement" : ["seasonal", "theme", "eid", "puja", "boishakh"].includes(campaign.type) ? "promo" : "hero"), starts_at: dt(campaign.starts_at), ends_at: dt(campaign.ends_at), order_deadline: dt(campaign.order_deadline) });
    setImageFile(null);
  }
  async function saveCampaign(event) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true); setNotice("");
    const body = new FormData();
    for (const [key, value] of Object.entries(draft)) {
      if (key !== "id" && value !== null && value !== undefined) body.set(key, String(value));
    }
    if (imageFile) body.set("image", imageFile);
    try {
      const response = await fetch(draft.id ? `/api/admin/campaigns/${draft.id}` : "/api/admin/campaigns", { method: draft.id ? "PUT" : "POST", body });
      if (!response.ok) throw new Error("campaign");
      setDraft(null); setImageFile(null); setNotice(t.saved); await load();
    } catch { setNotice(t.failed); }
    finally { setSaving(false); }
  }
  async function deleteCampaign(id) {
    if (!window.confirm(t.remove + "?")) return;
    setSaving(true); setNotice("");
    try {
      const response = await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("delete");
      setNotice(t.saved); await load();
    } catch { setNotice(t.failed); }
    finally { setSaving(false); }
  }

  return (
    <div className={`v2-admin-control${displayMode === "page" ? " v2-admin-control--page" : ""}`} role="presentation" onMouseDown={displayMode === "drawer" ? (event) => { if (event.target === event.currentTarget) router.push("/"); } : undefined}>
      <aside className="v2-admin-control__drawer" role={displayMode === "page" ? "region" : "dialog"} aria-modal={displayMode === "page" ? undefined : "true"} aria-labelledby="v2-admin-control-title">
        <header className="v2-admin-control__head"><div><p>AVENOR</p><h2 id="v2-admin-control-title">{t.title}</h2></div><button type="button" aria-label={t.close} onClick={() => router.push("/")}><FiX /></button></header>
        <nav className="v2-admin-control__tabs" aria-label={t.title}>
          <button type="button" aria-current={tab === "settings" ? "page" : undefined} onClick={() => setTab("settings")}>{t.settings}</button>
          <button type="button" aria-current={tab === "campaigns" ? "page" : undefined} onClick={() => setTab("campaigns")}>{t.campaigns}</button>
        </nav>
        {notice && <p className="v2-admin-control__notice" role="status">{notice}</p>}
        {loading ? <p className="v2-admin-control__loading">{t.loading}</p> : tab === "settings" ? (
          <form className="v2-admin-control__body" onSubmit={saveSettings}>
            <div className="v2-admin-control__settings-layout">
              <nav className="v2-admin-control__settings-nav" aria-label={t.settings}>
                {[["brand", t.brandTab], ["contact", t.contactTab], ["pages", t.pagesTab], ["features", t.featuresTab], ["seo", t.seoTab], ["footer", t.footerTab], ["socials", t.socialsTab]].map(([key, label]) => <button type="button" key={key} aria-current={settingsSection === key ? "page" : undefined} onClick={() => setSettingsSection(key)}>{label}</button>)}
              </nav>
              <div className="v2-admin-control__settings-content">
            {settingsSection === "brand" && <section><h3>{t.brandHeading}</h3><div className="v2-admin-control__grid">
              {input(t.websiteNameEn, branding.brand_name_en, (value) => setBranding((current) => ({ ...current, brand_name_en: value })), "text", true)}
              {input(t.websiteNameBn, branding.brand_name_bn, (value) => setBranding((current) => ({ ...current, brand_name_bn: value })))}
              <label className="v2-admin-control__field"><span>{t.languageMode}</span><select value={branding.language} onChange={(event) => setBranding((current) => ({ ...current, language: event.target.value }))}>
                <option value="en">{t.englishOnly}</option><option value="bn">{t.banglaOnly}</option>
              </select></label>
            </div><div className="v2-admin-control__brand-assets">
              {[["site_logo", t.siteLogo, "image/png,image/jpeg,image/webp"], ["favicon", t.favicon, "image/png,image/jpeg,image/webp,image/x-icon,.ico"], ["brand_logo", t.brandLogo, "image/png,image/jpeg,image/webp"]].map(([type, label, accept]) => (
                <label className="v2-admin-control__field" key={type}><span>{label}</span>
                  {branding[`${type}_url`] && <img className="v2-admin-control__asset-preview" src={branding[`${type}_url`]} alt={label} />}
                  <input type="file" accept={accept} onChange={(event) => setBrandFiles((current) => ({ ...current, [type]: event.target.files?.[0] || null }))} />
                  <small>{brandFiles[type]?.name || t.chooseImage}</small>
                </label>
              ))}
            </div></section>}
            {settingsSection === "contact" && <section><h3>{t.support}</h3><div className="v2-admin-control__grid">
              {input(t.phone, support.phone, (value) => setSupportField("phone", value), "tel")}
              {input(t.whatsapp, support.whatsapp, (value) => setSupportField("whatsapp", value), "tel")}
              {input(t.email, support.email, (value) => setSupportField("email", value), "email")}
              {input(t.address, support.address, (value) => setSupportField("address", value))}
            </div></section>}
            {settingsSection === "pages" && <section><h3>{t.pagesTab}</h3>
              <div className="v2-admin-control__footer-editor-nav"><label className="v2-admin-control__field"><span>{t.pageSelect}</span><select value={pageSlug} onChange={(event) => setPageSlug(event.target.value)}>{infoPageSlugs.map((slug) => <option key={slug} value={slug}>{slug}</option>)}</select></label><div className="v2-admin-control__footer-languages">{[["en", t.english], ["bn", t.bangla]].map(([language, label]) => <button type="button" key={language} aria-pressed={pageLanguage === language} onClick={() => setPageLanguage(language)}>{label}</button>)}</div></div>
              {input(t.pageTitle, infoPages[pageLanguage]?.[pageSlug]?.title, (value) => setPageValue(["title"], value))}
              {input(t.pageLead, infoPages[pageLanguage]?.[pageSlug]?.lead, (value) => setPageValue(["lead"], value))}
              {pageSlug === "about" && <label className="v2-admin-control__field"><span>{t.pageImage}</span><input type="url" value={infoPages[pageLanguage]?.[pageSlug]?.image_url || ""} placeholder="https://..." onChange={(event) => setPageValue(["image_url"], event.target.value)} /><small>{t.pageImageHelp}</small><input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; const body = new FormData(); body.set("type", "info_page_image"); body.set("page_slug", pageSlug); body.set("asset", file); try { const response = await fetch("/api/admin/settings/assets", { method: "POST", body }); if (!response.ok) throw new Error("upload"); setPageValue(["image_url"], (await response.json()).url); setNotice(t.imageSaved); } catch { setNotice(t.failed); } }} /><small>{t.chooseImage}</small></label>}
              {infoPages[pageLanguage]?.[pageSlug]?.blocks?.map((block, index) => renderPageValue(block, ["blocks", index], "blocks"))}
            </section>}
            {settingsSection === "features" && <section><h3>{t.featureHeading}</h3>
              {[["home_hero", t.homeHero], ["home_categories", t.homeCategories], ["home_products", t.homeProducts], ["home_lookbook", t.homeLookbook], ["home_promotions", t.homePromotions], ["home_perks", t.homePerks], ["footer_newsletter", t.footerNewsletter]].map(([key, label]) => <label className="v2-admin-control__check" key={key}><input type="checkbox" checked={featureToggles[key] !== false} onChange={(event) => setFeatureToggles((current) => ({ ...current, [key]: event.target.checked }))} /> {label}</label>)}
            </section>}
            {settingsSection === "seo" && <section><h3>{t.seoHeading}</h3>
              <div className="v2-admin-control__footer-languages">{[["en", t.english], ["bn", t.bangla]].map(([language, label]) => <button type="button" key={language} aria-pressed={seoLanguage === language} onClick={() => setSeoLanguage(language)}>{label}</button>)}</div>
              {input(`${t.seoTitle} (${seoLanguage})`, seo[seoLanguage]?.title, (value) => setSeo((current) => ({ ...current, [seoLanguage]: { ...current[seoLanguage], title: value } })))}
              <label className="v2-admin-control__field"><span>{t.seoDescription} ({seoLanguage})</span><textarea maxLength={500} rows={4} value={seo[seoLanguage]?.description || ""} onChange={(event) => setSeo((current) => ({ ...current, [seoLanguage]: { ...current[seoLanguage], description: event.target.value } }))} /></label>
              {input(`${t.seoKeywords} (${seoLanguage})`, seo[seoLanguage]?.keywords, (value) => setSeo((current) => ({ ...current, [seoLanguage]: { ...current[seoLanguage], keywords: value } })))}
              {input(t.seoImage, seo.og_image, (value) => setSeo((current) => ({ ...current, og_image: value })), "url")}
            </section>}
            {settingsSection === "footer" && <section><h3>{t.footer}</h3>
              <div className="v2-admin-control__footer-editor-nav">
                <nav className="v2-admin-control__footer-groups" aria-label={t.footer}>
                  {Object.entries({ content: t.copyGroup, serviceLinks: t.serviceGroup, aboutLinks: t.companyGroup, newsletter: t.newsletterGroup, payments: t.paymentsGroup }).map(([key, label]) => <button type="button" key={key} aria-current={footerGroup === key ? "page" : undefined} onClick={() => setFooterGroup(key)}>{label}</button>)}
                </nav>
                <div className="v2-admin-control__footer-languages">
                  {[["en", t.english], ["bn", t.bangla]].map(([language, label]) => <button type="button" key={language} aria-pressed={footerLanguage === language} onClick={() => setFooterLanguage(language)}>{label}</button>)}
                </div>
              </div>
              <fieldset className="v2-admin-control__footer-language"><legend>{footerLanguage === "en" ? t.footerEn : t.footerBn}</legend>
                  {Object.entries(footerContent[footerLanguage] || {}).filter(([key]) => footerFieldGroups[footerGroup].includes(key)).map(([key, value]) => {
                    const label = t[key] || key.replace(/([A-Z])/g, " $1");
                    if (Array.isArray(value)) return <div className="v2-admin-control__list-field" key={key}>
                      <strong>{label}</strong>
                      {footerLinkKeys.has(key) && <small>{t.linkHelp}</small>}
                      {value.map((item, index) => <div className={`v2-admin-control__list-row${footerLinkKeys.has(key) ? " v2-admin-control__list-row--link" : ""}`} key={`${key}-${index}`}>
                        {footerLinkKeys.has(key) ? <>
                          {input(`${t.linkName} ${index + 1}`, item.label, (next) => updateFooterLink(footerLanguage, key, index, "label", next))}
                          {input(t.destination, item.url, (next) => updateFooterLink(footerLanguage, key, index, "url", next))}
                        </> : input(`${label} ${index + 1}`, item, (next) => updateFooter(footerLanguage, key, value.map((entry, i) => i === index ? next : entry)))}
                        <button type="button" aria-label={`${t.remove} ${label} ${index + 1}`} onClick={() => updateFooter(footerLanguage, key, value.filter((_, i) => i !== index))}><FiTrash2 /></button>
                      </div>)}
                      <button type="button" className="v2-pill v2-pill--outline v2-admin-control__add-row" onClick={() => updateFooter(footerLanguage, key, [...value, footerLinkKeys.has(key) ? { label: "", url: "" } : ""])}><FiPlus /> {t.addRow}</button>
                    </div>;
                    if (typeof value === "string") return input(label, value, (next) => updateFooter(footerLanguage, key, next), "text", false);
                    return null;
                  })}
              </fieldset>
            </section>}
            {settingsSection === "socials" && <section><h3>{t.socials}</h3>
              <div className="v2-admin-control__social-list">
                {socialLinks.map((item, index) => <div className="v2-admin-control__social-row" key={`social-${index}`}>
                  <label className="v2-admin-control__field"><span>{t.platform}</span><select value={item.platform} onChange={(event) => updateSocial(index, "platform", event.target.value)}>
                    {["facebook", "instagram", "tiktok", "youtube", "whatsapp", "linkedin", "pinterest", "telegram", "x", "snapchat", "website"].map((platform) => <option key={platform} value={platform}>{platform}</option>)}
                  </select></label>
                  {input(t.linkName, item.name, (value) => updateSocial(index, "name", value))}
                  {input(t.url, item.url, (value) => updateSocial(index, "url", value), "url", true)}
                  <button type="button" aria-label={`${t.remove} ${item.name || item.platform}`} onClick={() => setSocialLinks((current) => current.filter((_, i) => i !== index))}><FiTrash2 /></button>
                </div>)}
                <button type="button" className="v2-pill v2-pill--outline v2-admin-control__add-row" onClick={() => setSocialLinks((current) => [...current, { platform: "website", name: "", url: "" }])}><FiPlus /> {t.addRow}</button>
              </div>
            </section>}
              </div>
            </div>
            <button className="v2-pill v2-pill--solid v2-admin-control__save" disabled={saving}><FiSave /> {saving ? t.loading : t.save}</button>
          </form>
        ) : (
          <div className="v2-admin-control__body">
            <button type="button" className="v2-pill v2-pill--outline" onClick={() => { setDraft(emptyCampaign()); setImageFile(null); }}><FiPlus /> {t.newCampaign}</button>
            {draft && <div className="v2-admin-control__campaign-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDraft(null); }}>
              <section className="v2-admin-control__campaign-dialog" role="dialog" aria-modal="true" aria-labelledby="v2-campaign-edit-title">
              <form className="v2-admin-control__campaign-form" onSubmit={saveCampaign}>
              <div className="v2-admin-control__campaign-heading"><h3 id="v2-campaign-edit-title">{draft.id ? t.edit : t.newCampaign}</h3><button type="button" aria-label={t.cancel} onClick={() => setDraft(null)}><FiX /></button></div>
              <label className="v2-admin-control__field"><span>{t.type}</span><select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value, placement: event.target.value === "offer" ? "announcement" : ["seasonal", "theme", "eid", "puja", "boishakh"].includes(event.target.value) ? "promo" : "hero" })}>{["banner", "offer", "seasonal", "theme", "eid", "puja", "boishakh"].map((type) => <option key={type} value={type}>{campaignTypeLabel(type)}</option>)}</select></label>
              <label className="v2-admin-control__field"><span>{t.placement}</span><select value={draft.placement || "hero"} onChange={(event) => setDraft({ ...draft, placement: event.target.value })}><option value="hero">{t.heroPosition}</option><option value="promo">{t.promoPosition}</option><option value="announcement">{t.announcePosition}</option></select></label>
              {input(t.titleBn, draft.title_bn, (value) => setDraft({ ...draft, title_bn: value }))}
              {input(t.titleEn, draft.title_en, (value) => setDraft({ ...draft, title_en: value }))}
              <label className="v2-admin-control__field"><span>{t.contentBn}</span><textarea value={draft.content_bn || ""} onChange={(event) => setDraft({ ...draft, content_bn: event.target.value })} /></label>
              <label className="v2-admin-control__field"><span>{t.contentEn}</span><textarea value={draft.content_en || ""} onChange={(event) => setDraft({ ...draft, content_en: event.target.value })} /></label>
              {input(t.imageUrl, draft.image_url, (value) => setDraft({ ...draft, image_url: value }), "url")}
              <label className="v2-admin-control__field"><span>{t.image}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] || null)} /></label>
              {(draft.image_url || imageFile) && <div className="v2-admin-control__campaign-preview">{draft.image_url && <img src={draft.image_url} alt={lang === "en" ? "Banner preview" : "\u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0 preview"} />}{imageFile && <small>{imageFile.name}</small>}</div>}
              {input(t.target, draft.target_url, (value) => setDraft({ ...draft, target_url: value }), "url")}
              {input(t.start, draft.starts_at, (value) => setDraft({ ...draft, starts_at: value }), "datetime-local")}
              {input(t.end, draft.ends_at, (value) => setDraft({ ...draft, ends_at: value }), "datetime-local")}
              {input(t.deadline, draft.order_deadline, (value) => setDraft({ ...draft, order_deadline: value }), "datetime-local")}
              {input(t.order, draft.sort_order, (value) => setDraft({ ...draft, sort_order: value }), "number")}
              <label className="v2-admin-control__check"><input type="checkbox" checked={String(draft.status) === "1" || draft.status === true} onChange={(event) => setDraft({ ...draft, status: event.target.checked ? "1" : "0" })} /> {t.active}</label>
              <button type="button" className="v2-pill v2-pill--outline" disabled={saving} onClick={() => setDraft(null)}>{t.cancel}</button>
              <button className="v2-pill v2-pill--solid v2-admin-control__save" disabled={saving}><FiSave /> {saving ? t.loading : t.saveCampaign}</button>
              </form>
              </section>
            </div>}
            {campaigns.length ? <ul className="v2-admin-control__campaign-list">{campaigns.map((campaign) => <li key={campaign.id}>
              {campaign.image_url && <img className="v2-admin-control__campaign-thumb" src={campaign.image_url} alt="" />}
              <div><strong>{(lang === "en" ? campaign.title_en : campaign.title_bn) || campaignTypeLabel(campaign.type)}</strong><small>{campaignTypeLabel(campaign.type)} · {campaignPlacementLabel(campaign)} · {(String(campaign.status) === "1" || campaign.status === true) ? t.active : t.off}</small></div>
              <button type="button" aria-label={`${t.edit}: ${(lang === "en" ? campaign.title_en : campaign.title_bn) || campaignTypeLabel(campaign.type)}`} onClick={() => editCampaign(campaign)}><FiEdit2 /></button>
              <button type="button" aria-label={`${t.remove}: ${(lang === "en" ? campaign.title_en : campaign.title_bn) || campaignTypeLabel(campaign.type)}`} disabled={saving} onClick={() => deleteCampaign(campaign.id)}><FiTrash2 /></button>
            </li>)}</ul> : <p className="v2-admin-control__empty">{t.noCampaigns}</p>}
          </div>
        )}
      </aside>
    </div>
  );
}
