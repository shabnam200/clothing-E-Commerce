"use client";

import { useState } from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import { FOOTER_HREFS, V2_SOCIALS, BRAND } from "@/config/v2";

const ICONS = { facebook: FaFacebookF, instagram: FaInstagram, tiktok: FaTiktok, youtube: FaYoutube };

// Compact footer. Every colour comes from the --v2-* tokens (soft sand in light mode, warm charcoal in dark mode).
export default function V2Footer({ v2 }) {
  const f = v2.footer;
  const n = v2.news;
  const cols = [
    [f.quick, f.quickLinks || [], FOOTER_HREFS.quick || []],
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
                <li><FiPhone size={13} aria-hidden="true" /> +880 1234 567 890</li>
                <li><FiMail size={13} aria-hidden="true" /> hello@{BRAND.name.toLowerCase()}.com</li>
                <li><FiMapPin size={13} aria-hidden="true" /> Dhaka, Bangladesh</li>
              </ul>
            </div>
            <ul className="v2-ft__social" aria-label={f.follow}>
              {V2_SOCIALS.map(({ name, href, icon }) => {
                const Icon = ICONS[icon] || FaInstagram;
                return (
                  <li key={name}>
                    <a href={href} aria-label={name} target="_blank" rel="noopener noreferrer"><Icon aria-hidden="true" /></a>
                  </li>
                );
              })}
            </ul>
          </div>

          {cols.map(([title, labels, hrefs]) => (
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
