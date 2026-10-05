import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import { ROUTES, FOOTER_HREFS, V2_SOCIALS, BRAND } from "@/config/v2";
import V2Logo from "@/components/v2/ui/V2Logo";

const ICONS = { facebook: FaFacebookF, instagram: FaInstagram, tiktok: FaTiktok, youtube: FaYoutube };

// Link targets live in config/v2.js (FOOTER_HREFS), in the same order as the labels in messages/v2.
export default function V2Footer({ v2 }) {
  const f = v2.footer;
  const cols = [[f.quick, f.quickLinks, FOOTER_HREFS.quick], [f.service, f.serviceLinks, FOOTER_HREFS.service], [f.about, f.aboutLinks, FOOTER_HREFS.about]];
  return (
    <footer className="v2-footer">
      <div className="v2-wrap">
        <div className="v2-footer__grid">
          <div className="v2-footer__brand">
            <V2Logo />
            <p>{f.tagline}</p>
            <ul className="v2-social" aria-label={f.follow}>
              {V2_SOCIALS.map(({ name, href, icon }) => {
                const Icon = ICONS[icon];
                return <li key={name}><a href={href} aria-label={name} target="_blank" rel="noopener noreferrer"><Icon aria-hidden="true" /></a></li>;
              })}
            </ul>
          </div>
          {cols.map(([title, labels, hrefs]) => (
            <nav key={title} aria-label={title}>
              <h3>{title}</h3>
              <ul>{labels.map((l, i) => <li key={l}><Link href={hrefs[i]}>{l}</Link></li>)}</ul>
            </nav>
          ))}
        </div>
        <div className="v2-footer__bottom">
          <p>© {new Date().getFullYear()} {BRAND.name}. {f.rights}</p>
          <ul className="v2-pay" aria-hidden="true">{f.payments.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      </div>
    </footer>
  );
}
