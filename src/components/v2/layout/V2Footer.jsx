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
  // Owner-managed text (settings.footerContent[lang]) overrides the defaults in messages/v2; unset keys keep the default.
  const custom = settings?.footerContent?.[lang] || {};
  const f = { ...v2.footer, ...Object.fromEntries(Object.entries(custom).filter(([, v]) => typeof v === "string" ? v.trim() : Array.isArray(v) && v.length)) };
  const n = v2.news;
  const cols = [
    [f.service, f.serviceLinks || [], FOOTER_HREFS.service || []],
    [f.about, f.aboutLinks || [], FOOTER_HREFS.about || []],
  ];

  const [state, setState] = useState("idle");
  const onSubmit = (e) => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("email")?.toString().trim() ?? "";
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setState(valid ? "ok" : "error");
    if (valid) e.currentTarget.reset();
  };

  return (
    <footer className="v2-ft">
      <div className="v2-wrap">
        <div className="v2-ft__grid">
          <div className="v2-ft__brand">
            <div style={{ display: "grid", gap: 10 }}>
              <Link href="/" className="v2-display v2-ft__logo" aria-label={BRAND.name}>{BRAND.name}</Link>
              <p className="v2-ft__tag">{f.tagline}</p>
              <ul className="v2-ft__contact">
                <li><FiPhone size={13} aria-hidden="true" /> {settings?.support?.phone || "+880 1234 567 890"}</li>
                <li><FiMail size={13} aria-hidden="true" /> {settings?.support?.email || `hello@${BRAND.name.toLowerCase()}.com`}</li>
                {settings?.support?.address && <li><FiMapPin size={13} aria-hidden="true" /> {settings.support.address}</li>}
              </ul>
            </div>
            <ul className="v2-ft__social" aria-label={f.follow}>
              {(settings?.socialLinks?.length ? settings.socialLinks : V2_SOCIALS).filter((x) => x.url || x.href).map((x) => {
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

          {cols.map(([title, labels, hrefs, customLinks]) => (
            <nav key={title} aria-label={title}>
              <h3>{title}</h3>
              <ul>
                {labels.map((l, i) => (
                  <li key={l}><Link href={hrefs[i] || "#"}>{l}</Link></li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="v2-ft__news">
            <h3>{n.title}</h3>
            <p className="v2-ft__tag">{n.text}</p>
            <form className="v2-ft__form" onSubmit={onSubmit} noValidate>
              <input name="email" type="email" aria-label={n.label} placeholder={n.placeholder} autoComplete="email" />
              <button type="submit" className="v2-pill v2-pill--solid">{n.button}</button>
            </form>
            <p className="v2-ft__msg" role="status" data-state={state === "error" ? "error" : "ok"}>
              {state === "ok" ? n.ok : state === "error" ? n.bad : ""}
            </p>
          </div>
        </div>

        <div className="v2-ft__bottom">
          <p>© {new Date().getFullYear()} {BRAND.name}. {f.rights}</p>
          <ul className="v2-ft__pay" aria-label="Payment methods">
            {(f.payments || []).map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </div>
    </footer>
  );
}
