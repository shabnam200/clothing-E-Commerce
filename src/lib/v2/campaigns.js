import { cache } from "react";
import { CAMPAIGN_FALLBACK, CAMPAIGN_LABELS, CAMPAIGN_TYPES } from "@/config/campaigns";
import { existingImage } from "@/lib/v2/media";

// Server-only. getActiveCampaigns() returns every campaign that is live right now (translated and serialisable),
// getActiveCampaign() the first one (it drives the page theme, the top bar and the product-page badge).

const API_URL = process.env.CAMPAIGNS_API_URL || (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/campaigns` : "");
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
    enabled: toBool(pick(r, "enabled", "is_active", "isActive", "active")),
    startsAt: toMs(pick(r, "startsAt", "starts_at", "start_at")),
    endsAt: toMs(pick(r, "endsAt", "ends_at", "end_at")),
    orderDeadline: toMs(pick(r, "orderDeadline", "order_deadline", "deadline")),
    image: pick(r, "image", "image_url", "imageUrl"),
    ctaHref: pick(r, "ctaHref", "cta_href"),
    priority: Number(pick(r, "priority")) || 0,
    over: {
      bn: { title: pick(r, "titleBn", "title_bn"), text: pick(r, "textBn", "text_bn") },
      en: { title: pick(r, "titleEn", "title_en"), text: pick(r, "textEn", "text_en") },
    },
  };
}

async function loadRaw() {
  if (!API_URL) return CAMPAIGN_FALLBACK; // local dev: no API wired yet
  try {
    const res = await fetch(API_URL, { headers: { Accept: "application/json" }, next: { revalidate: 60 }, signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error(`campaigns ${res.status}`);
    const json = await res.json();
    return Array.isArray(json) ? json : json.data ?? json.campaigns ?? [];
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
      .filter((c) => c.enabled && (c.startsAt == null || now >= c.startsAt) && (c.endsAt == null || now <= c.endsAt))
      .sort((a, b) => b.priority - a.priority || (a.endsAt ?? Infinity) - (b.endsAt ?? Infinity));
  }
  return chosen.map((c) => toView(c, lang, now));
});

export async function getActiveCampaign(lang = "bn") {
  return (await getActiveCampaigns(lang))[0] ?? null;
}
