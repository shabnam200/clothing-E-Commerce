"use client";

import { useState } from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube, FaWhatsapp, FaLinkedinIn, FaPinterestP, FaTelegramPlane, FaTwitter, FaSnapchatGhost, FaGlobe } from "react-icons/fa";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import { FOOTER_HREFS, V2_SOCIALS, BRAND } from "@/config/v2";

const ICONS = {
  facebook: FaFacebookF, instagram: FaInstagram, tiktok: FaTiktok, youtube: FaYoutube, whatsapp: FaWhatsapp, linkedin: FaLinkedinIn,
  pinterest: FaPinterestP, telegram: FaTelegramPlane, x: FaTwitter, twitter: FaTwitter, snapchat: FaSnapchatGhost, website: FaGlobe,
};
// Owner saves { platform, name, url }. Pick the icon from the platform, or guess it from the URL so "Facebook"/"facebook"/"fb.com" all work.
const HOSTS = [["facebook", "facebook"], ["fb.", "facebook"], ["instagram", "instagram"], ["tiktok", "tiktok"], ["youtu", "youtube"], ["wa.me", "whatsapp"], ["whatsapp", "whatsapp"], ["linkedin", "linkedin"], ["pinterest", "pinterest"], ["t.me", "telegram"], ["telegram", "telegram"], ["twitter", "x"], ["x.com", "x"], ["snapchat", "snapchat"]];
const iconKey = ({ platform, icon, url, href }) => {
  const p = String(platform || icon || "").trim().toLowerCase();
  if (ICONS[p]) return p;
  const u = String(url || href || "").toLowerCase();
  return HOSTS.find(([h]) => u.includes(h))?.[1] || "website";
};

// Compact footer. Every colour comes from the --v2-* tokens (soft sand in light mode, warm charcoal in dark mode).
export default function V2Footer({ v2, settings, lang = "en" }) {
  const brandName = lang === "bn" && settings?.brandNameBn ? settings.brandNameBn : settings?.brandNameEn || BRAND.name;
  // Owner-managed text (settings.footerContent[lang]) overrides the defaults in messages/v2; unset keys keep the default.
  const custom = settings?.footerContent?.[lang] || {};
  const f = { ...v2.footer, ...Object.fromEntries(Object.entries(custom).filter(([, v]) => typeof v === "string" || Array.isArray(v))) };
  const n = {
    ...v2.news,
    title: f.newsletterTitle ?? v2.news.title,
    text: f.newsletterText ?? v2.news.text,
    placeholder: f.newsletterPlaceholder ?? v2.news.placeholder,
    label: f.newsletterLabel ?? v2.news.label,
    button: f.newsletterButton ?? v2.news.button,
    ok: f.newsletterOk ?? v2.news.ok,
    bad: f.newsletterBad ?? v2.news.bad,
  };
  const cols = [
    [f.service, f.serviceLinks || [], FOOTER_HREFS.service || []],
    [f.about, (f.aboutLinks || []).filter((item) => !/our story|আমাদের গল্প/i.test(typeof item === "string" ? item : item?.label || item?.name || "")), FOOTER_HREFS.about || []],
  ];
  const renderLink = (item, fallback) => {
    const label = typeof item === "string" ? item : item?.label || item?.name || "";
    const configured = typeof item === "string" ? fallback : item?.url || item?.href || fallback;
    const href = /^https?:\/\//i.test(configured) || (configured?.startsWith("/") && !configured.startsWith("//")) || configured?.startsWith("#") ? configured : "#";
    if (/^https?:\/\//i.test(href)) return <a href={href} target="_blank" rel="noopener noreferrer">{label}</a>;
    return <Link href={href}>{label}</Link>;
  };

  const [state, setState] = useState("idle");
  const failedMessage = lang === "bn" ? "সাবস্ক্রিপশন করা যায়নি। আবার চেষ্টা করুন।" : "Could not subscribe. Please try again.";
  const onSubmit = async (e) => {
    e.preventDefault();
    if (state === "sending") return;
    const form = e.currentTarget;
    const value = new FormData(e.currentTarget).get("email")?.toString().trim() ?? "";
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!valid) { setState("error"); return; }
    setState("sending");
    try {
      const response = await fetch("/api/shopper/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (!response.ok) throw new Error("Newsletter subscription failed.");
      setState("ok");
      form.reset();
    } catch {
      setState("failed");
    }
  };

  return (
    <footer className="v2-ft">
      <div className="v2-wrap">
        <div className="v2-ft__grid">
          <div className="v2-ft__brand">
            <div style={{ display: "grid", gap: 10 }}>
              <Link href="/" className="v2-display v2-ft__logo" aria-label={brandName}>
                {settings?.brandLogoUrl ? <img className="v2-ft__brand-image" src={settings.brandLogoUrl} alt={brandName} /> : brandName}
              </Link>
              <p className="v2-ft__tag">{f.tagline}</p>
              <ul className="v2-ft__contact">
                <li><FiPhone size={13} aria-hidden="true" /> {settings?.support?.phone || "+880 1234 567 890"}</li>
                <li><FiMail size={13} aria-hidden="true" /> {settings?.support?.email || `hello@${brandName.toLowerCase()}.com`}</li>
                {settings?.support?.address && <li><FiMapPin size={13} aria-hidden="true" /> {settings.support.address}</li>}
              </ul>
            </div>
            <ul className="v2-ft__social" aria-label={f.follow}>
              {(Array.isArray(settings?.socialLinks) ? settings.socialLinks : V2_SOCIALS).filter((x) => x.url || x.href).map((x) => {
                const Icon = ICONS[iconKey(x)];
                const label = x.name || x.platform || "Social";
                return (
                  <li key={`${label}-${x.url || x.href}`}>
                    <a href={x.url || x.href} aria-label={label} target="_blank" rel="noopener noreferrer"><Icon aria-hidden="true" /></a>
                  </li>
                );
              })}
            </ul>
          </div>

          {cols.map(([title, labels, hrefs]) => (
            <nav key={title} aria-label={title}>
              <h3>{title}</h3>
              <ul>
                {labels.map((item, i) => (
                  <li key={`${typeof item === "string" ? item : item?.label || item?.name || "Footer link"}-${i}`}>{renderLink(item, hrefs[i] || "#")}</li>
                ))}
              </ul>
            </nav>
          ))}

          {settings?.featureToggles?.footer_newsletter !== false && <div className="v2-ft__news">
            <h3>{n.title}</h3>
            <p className="v2-ft__tag">{n.text}</p>
            <form className="v2-ft__form" onSubmit={onSubmit} noValidate aria-busy={state === "sending"}>
              <input name="email" type="email" aria-label={n.label} placeholder={n.placeholder} autoComplete="email" />
              <button type="submit" className="v2-pill v2-pill--solid" disabled={state === "sending"}>{n.button}</button>
            </form>
            <p className="v2-ft__msg" role="status" data-state={state === "error" || state === "failed" ? "error" : "ok"}>
              {state === "ok" ? n.ok : state === "error" ? n.bad : state === "failed" ? failedMessage : ""}
            </p>
          </div>}
        </div>

        <div className="v2-ft__bottom">
          <p>© {new Date().getFullYear()} {brandName}. {f.rights}</p>
          <ul className="v2-ft__pay" aria-label="Payment methods">
            {(f.payments || []).map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </div>
    </footer>
  );
}
