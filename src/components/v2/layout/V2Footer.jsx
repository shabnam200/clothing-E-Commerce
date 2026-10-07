"use client";

import { useState } from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import { FOOTER_HREFS, V2_SOCIALS, BRAND } from "@/config/v2";

const ICONS = { facebook: FaFacebookF, instagram: FaInstagram, tiktok: FaTiktok, youtube: FaYoutube };

export default function V2Footer({ v2 }) {
  const f = v2.footer;
  const cols = [
    ["Shop", f.quickLinks || [], FOOTER_HREFS.quick || []],
    ["Customer Care", f.serviceLinks || [], FOOTER_HREFS.service || []]
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
    <footer style={{ backgroundColor: 'var(--v2-card, #111111)', color: 'var(--v2-ink, #ffffff)', borderTop: '1px solid var(--v2-line, #222222)' }}>
      <div className="v2-wrap" style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px' }}>
          
          {/* Brand Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2 style={{ fontSize: '24px', letterSpacing: '4px', fontWeight: '400', margin: 0 }}>{BRAND.name.toUpperCase()}</h2>
            <p style={{ fontSize: '12px', color: 'var(--v2-muted, #888888)', lineHeight: '1.6', margin: 0, maxWidth: '250px' }}>
              {BRAND.name} is a premium clothing brand that celebrates the timeless art of fashion with modern aesthetics.
            </p>
            <ul style={{ display: 'flex', gap: '15px', listStyle: 'none', padding: 0, margin: '10px 0 0 0' }}>
              {V2_SOCIALS.map(({ name, href, icon }) => {
                const Icon = ICONS[icon] || FaInstagram;
                return (
                  <li key={name}>
                    <a href={href} aria-label={name} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--v2-muted, #888888)', fontSize: '15px' }}>
                      <Icon aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Newsletter */}
          <div style={{ gridColumn: 'span 2' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase', color: 'var(--v2-ink, #ffffff)' }}>Stay in the loop</h3>
            <p style={{ fontSize: '12px', color: 'var(--v2-muted, #888888)', lineHeight: '1.5', marginBottom: '15px', maxWidth: '300px' }}>
              Sign up for exclusive updates, new arrivals and special offers.
            </p>
            <form onSubmit={onSubmit} noValidate style={{ display: 'flex', gap: '10px', height: '42px', maxWidth: '380px' }}>
              <input 
                name="email" 
                type="email" 
                placeholder="Enter your email" 
                required
                style={{ flex: 1, padding: '0 15px', border: '1px solid var(--v2-line, #333333)', fontSize: '12px', outline: 'none', background: 'var(--v2-base, #000000)', color: 'var(--v2-ink, #ffffff)', borderRadius: '4px' }}
              />
              <button 
                type="submit" 
                className="v2-pill v2-pill--solid"
                style={{ borderRadius: '4px', padding: '0 25px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Subscribe
              </button>
            </form>
            {state === "ok" && <p style={{ fontSize: '11px', color: '#22c55e', marginTop: '8px' }}>Subscribed!</p>}
            {state === "error" && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '8px' }}>Invalid email.</p>}
          </div>

          {/* Links */}
          {cols.map(([title, labels, hrefs]) => (
            <nav key={title} aria-label={title}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '15px', textTransform: 'uppercase', color: 'var(--v2-ink, #ffffff)' }}>{title}</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {labels.map((l, i) => (
                  <li key={l}>
                    <Link href={hrefs[i] || "#"} style={{ fontSize: '12px', color: 'var(--v2-muted, #888888)', textDecoration: 'none' }}>{l}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Contact Us */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '15px', textTransform: 'uppercase', color: 'var(--v2-ink, #ffffff)' }}>Contact Us</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--v2-muted, #888888)' }}>
                <FiPhone size={14} /> +880 1234 567 890
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--v2-muted, #888888)' }}>
                <FiMail size={14} /> hello@{BRAND.name.toLowerCase()}.com
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--v2-muted, #888888)' }}>
                <FiMapPin size={14} /> Dhaka, Bangladesh
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ backgroundColor: 'var(--v2-base, #0a0a0a)', borderTop: '1px solid var(--v2-line, #222222)', padding: '15px 0' }}>
        <div className="v2-wrap" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 15px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <p style={{ fontSize: '11px', margin: 0, color: 'var(--v2-muted, #888888)' }}>
            © {new Date().getFullYear()} {BRAND.name}. All Rights Reserved.
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {['VISA', 'Mastercard', 'Amex', 'PayPal'].map(p => (
              <span key={p} style={{ fontSize: '9px', border: '1px solid var(--v2-line, #333333)', padding: '3px 6px', borderRadius: '3px', fontWeight: '600', letterSpacing: '0.5px', color: 'var(--v2-muted, #888888)' }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
}