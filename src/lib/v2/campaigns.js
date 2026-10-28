import { cache } from "react";
import { CAMPAIGN_LABELS, CAMPAIGN_TYPES } from "@/config/campaigns";
import { api } from "@/services";
import { existingImage } from "@/lib/v2/media";
import { dokaniGet } from "@/services/dokani/client";
import { isEnabled as dokaniEnabled } from "@/services/dokani/config";

// Server-only. getActiveCampaigns() returns every campaign that is live right now (translated and serialisable),
// getActiveCampaign() the first one (it drives the page theme, the top bar and the product-page badge).

const OVERRIDE_URL = process.env.CAMPAIGNS_API_URL || ""; // optional: read campaigns from a different URL than the main API
const PREVIEW = (process.env.CAMPAIGN_PREVIEW || "").toLowerCase().split(",").map((s) => s.trim()).filter((t) => CAMPAIGN_TYPES[t]);
const DAY = 86_400_000;

const pick = (o, ...keys) => { for (const k of keys) if (o?.[k] !== undefined && o[k] !== null && o[k] !== "") return o[k]; return undefined; };
const toMs = (v) => { if (v === undefined) return null; const t = typeof v === "number" ? v : Date.parse(v); return Number.isNaN(t) ? null : t; };
const toBool = (v) => v === undefined || v === true || v === 1 || v === "1" || v === "true";

function normalize(r) {
  const type = String(pick(r, "type", "key", "theme") ?? "").toLowerCase();
  if (!CAMPAIGN_TYPES[type]) return null; // unknown festival: ignore instead of breaking the page
  return {
    id: String(pick(r, "id", "slug") ?? type),
    type,
    placement: pick(r, "placement") || null,
    enabled: toBool(pick(r, "enabled", "is_active", "isActive", "active", "status")),
    startsAt: toMs(pick(r, "startsAt", "starts_at", "start_at")),
    endsAt: toMs(pick(r, "endsAt", "ends_at", "end_at")),
    orderDeadline: toMs(pick(r, "orderDeadline", "order_deadline", "deadline")),
    image: pick(r, "image", "image_url", "imageUrl"),
    ctaHref: pick(r, "ctaHref", "cta_href", "target_url", "targetUrl"),
    priority: pick(r, "priority") !== undefined ? Number(r.priority) || 0 : -(Number(r.sort_order) || 0),
    over: {
      bn: { title: pick(r, "titleBn", "title_bn", "title"), text: pick(r, "textBn", "text_bn", "content_bn", "content") },
      en: { title: pick(r, "titleEn", "title_en", "title"), text: pick(r, "textEn", "text_en", "content_en", "content") },
    },
  };
}

async function loadRaw() {
  try {
    if (OVERRIDE_URL) {
      const res = await fetch(OVERRIDE_URL, { headers: { Accept: "application/json" }, next: { revalidate: 60 }, signal: AbortSignal.timeout(2500) });
      if (!res.ok) throw new Error(`campaigns ${res.status}`);
      const json = await res.json();
      return Array.isArray(json) ? json : json.data ?? json.campaigns ?? [];
    }
    if (dokaniEnabled()) {
      const json = await dokaniGet("/campaigns");
      return Array.isArray(json) ? json : json?.campaigns ?? json?.data ?? [];
    }
    return await api.campaigns.list(); // use configured HTTP API, or mock only when no Dokani service is configured
  } catch {
    return []; // API down: show no festival mode rather than a campaign the admin may have switched off
  }
}

const fmtDate = (ms, lang) =>
  new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "bn-BD", { day: "numeric", month: "long", timeZone: "Asia/Dhaka" }).format(ms);

function toView(c, lang, now) {
  const l = lang === "en" ? "en" : "bn";
  const base = CAMPAIGN_TYPES[c.type];
  const copy = base[l];
  const labels = CAMPAIGN_LABELS[l];
  const showDeadline = c.orderDeadline != null && c.orderDeadline > now;
  const title = c.over[l].title || copy.title;
  return {
    id: c.id,
    type: c.type,
    theme: base.theme,
    endsAt: c.endsAt, // the slide hides itself when this time passes, even if the page stays open
    eyebrow: copy.eyebrow,
    bar: copy.bar,
    title,
    text: c.over[l].text || copy.text,
    cta: copy.cta,
    ctaHref: c.ctaHref || base.ctaHref,
    closeLabel: labels.close,
    image: existingImage(c.image || base.image), // null when the file is missing -> themed artwork is shown instead
    imagePosition: base.imagePosition,
    // Props for <V2DeadlineBadge/>; null once the order deadline has passed.
    badge: showDeadline
      ? { deadline: c.orderDeadline, text: copy.deadline.replace("{date}", fmtDate(c.orderDeadline, l)), daysLeft: labels.daysLeft, lastDay: labels.lastDay, lang: l }
      : null,
  };
}

export const getActiveCampaigns = cache(async (lang = "bn") => {
  const now = Date.now();
  const list = (await loadRaw()).map(normalize).filter(Boolean);
  let chosen;

  if (PREVIEW.length) {
    // Preview mode ignores dates and the on/off switch, and always shows a deadline a week away.
    chosen = PREVIEW.map((type) => ({ ...(list.find((c) => c.type === type) || normalize({ type })), orderDeadline: now + 7 * DAY, endsAt: null }));
  } else {
    chosen = list
      .filter((c) => !c.placement && c.enabled && (c.startsAt == null || now >= c.startsAt) && (c.endsAt == null || now <= c.endsAt))
      .sort((a, b) => b.priority - a.priority || (a.endsAt ?? Infinity) - (b.endsAt ?? Infinity));
  }
  return chosen.map((c) => toView(c, lang, now));
});

export async function getActiveCampaign(lang = "bn") {
  return (await getActiveCampaigns(lang))[0] ?? null;
}

// Storefront creative managed from Dokani: one live banner and offer per shop.
export const getStorefrontCreative = cache(async (lang = "bn") => {
  const now = Date.now();
  const active = (await loadRaw())
    .filter((row) => row && ["banner", "offer", "seasonal", "theme", "eid", "puja", "boishakh"].includes(String(row.type).toLowerCase()))
    .filter((row) => toBool(pick(row, "status", "enabled", "is_active", "active")))
    .filter((row) => { const start = toMs(pick(row, "starts_at", "startsAt")); return start == null || start <= now; })
    .filter((row) => { const end = toMs(pick(row, "ends_at", "endsAt")); return end == null || end >= now; })
    .sort((a, b) => (Number(a.sort_order ?? a.priority) || 0) - (Number(b.sort_order ?? b.priority) || 0) || Number(a.id) - Number(b.id));
  const first = (type) => active.find((row) => String(row.type).toLowerCase() === type);
  const placed = (placement, legacyType) => active.find((row) => String(row.placement || "").toLowerCase() === placement)
    || active.find((row) => !row.placement && String(row.type).toLowerCase() === legacyType);
  const banner = placed("hero", "banner");
  const offer = placed("announcement", "offer");
  const promos = active.filter((row) => String(row.placement || "").toLowerCase() === "promo").map((row) => ({
    id: row.id,
    title: pick(row, lang === "bn" ? "title_bn" : "title_en", lang === "bn" ? "title_en" : "title_bn", "title") || "",
    text: pick(row, lang === "bn" ? "content_bn" : "content_en", lang === "bn" ? "content_en" : "content_bn", "content") || "",
    image: existingImage(pick(row, "image_url", "image")),
    href: pick(row, "target_url", "targetUrl") || "/shop",
  }));
  const titleField = lang === "bn" ? "title_bn" : "title_en";
  const contentField = lang === "bn" ? "content_bn" : "content_en";
  return {
    hero: banner ? { title: pick(banner, titleField, "title"), text: pick(banner, contentField, "content"), image: existingImage(pick(banner, "image_url", "image")), href: pick(banner, "target_url", "targetUrl") || "/shop" } : null,
    offer: offer ? { title: pick(offer, titleField, "title"), text: pick(offer, contentField, "content") || pick(offer, titleField, "title"), href: pick(offer, "target_url", "targetUrl") || null } : null,
    promos,
  };
});
