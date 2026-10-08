import Link from "next/link";
import { FiPhone, FiMail, FiChevronDown, FiChevronRight, FiLayers, FiScissors, FiDroplet } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import V2Media from "@/components/v2/ui/V2Media";
import { V2_COLLAGE } from "@/data/v2";
import { ROUTES, SUPPORT } from "@/config/v2";

const VALUE_ICONS = [FiLayers, FiScissors, FiDroplet];

const SLUGS = ["contact", "shipping", "returns", "size", "faq", "about", "story", "privacy", "terms"];

// Renders one footer info page: side navigation between all info pages + structured content blocks.
function Block({ b, i }) {
  switch (b.type) {
    case "channels": {
      const rows = [
        [FiPhone, SUPPORT.phoneLabel, `tel:${SUPPORT.phone}`],
        [FaWhatsapp, SUPPORT.phoneLabel, `https://wa.me/${SUPPORT.whatsapp}`],
        [FiMail, SUPPORT.email, `mailto:${SUPPORT.email}`],
      ];
      return (
        <ul className="v2-sup__cards v2-ip__channels">
          {rows.map(([Icon, value, href], k) => (
            <li key={k}>
              <a className="v2-sup__card" href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                <span className="v2-sup__ico" aria-hidden="true"><Icon /></span>
                <span><strong>{b.items[k]}</strong><small>{value}</small></span>
              </a>
            </li>
          ))}
        </ul>
      );
    }
    case "facts":
      return (
        <section className="v2-ip__sec">
          {b.title && <h2 className="v2-ip__h">{b.title}</h2>}
          <dl className="v2-ip__facts">
            {b.items.map(([label, value, note]) => (
              <div key={label} className="v2-ip__fact">
                <dt>{label}</dt>
                <dd className="v2-ip__big">{value}</dd>
                {note && <dd className="v2-ip__small">{note}</dd>}
              </div>
            ))}
          </dl>
        </section>
      );
    case "steps":
      return (
        <section className="v2-ip__sec">
          <h2 className="v2-ip__h">{b.title}</h2>
          <ol className="v2-ip__steps">
            {b.items.map(([t, d]) => (
              <li key={t}><strong>{t}</strong><span>{d}</span></li>
            ))}
          </ol>
        </section>
      );
    case "list":
      return (
        <section className="v2-ip__sec">
          <h2 className="v2-ip__h">{b.title}</h2>
          <ul className="v2-ip__list">{b.items.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      );
    case "table":
      return (
        <div className="v2-ip__tablewrap">
          <table className="v2-ip__table">
            <thead><tr>{b.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r) => <tr key={r[0]}>{r.map((c, k) => (k === 0 ? <th key={c} scope="row">{c}</th> : <td key={c}>{c}</td>))}</tr>)}</tbody>
          </table>
        </div>
      );
    case "faq":
      return (
        <div className="v2-ip__faq">
          {b.items.map(([q, a], k) => (
            <details key={q} open={k === 0}>
              <summary>{q}<FiChevronDown className="v2-ip__chev" aria-hidden="true" /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      );
    case "text":
      return (
        <section className="v2-ip__sec">
          {b.title && <h2 className="v2-ip__h">{b.title}</h2>}
          {b.paras.map((p) => <p key={p} className="v2-ip__p">{p}</p>)}
        </section>
      );
    case "split":
      return (
        <section className="v2-ip__split">
          <div className="v2-ip__splittext">
            <h2 className="v2-ip__h">{b.title}</h2>
            {b.paras.map((p) => <p key={p} className="v2-ip__p">{p}</p>)}
          </div>
          <V2Media src={V2_COLLAGE[b.image]?.image} alt={b.alt} sizes="(min-width: 900px) 320px, 100vw" className="v2-ip__img" />
        </section>
      );
    case "values":
      return (
        <section className="v2-ip__sec">
          <h2 className="v2-ip__h">{b.title}</h2>
          <ul className="v2-ip__values">
            {b.items.map(([t, d], k) => {
              const Icon = VALUE_ICONS[k % VALUE_ICONS.length];
              return (
                <li key={t}>
                  <span className="v2-sup__ico" aria-hidden="true"><Icon /></span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </li>
              );
            })}
          </ul>
        </section>
      );
    case "cta":
      return (
        <section className="v2-ip__cta">
          <h2>{b.title}</h2>
          <div className="v2-ip__ctabtns">
            {b.items.map(([label, key], k) => (
              <Link key={key} href={ROUTES[key] ?? ROUTES.info(key)} className={k === 0 ? "is-primary" : undefined}>{label}</Link>
            ))}
          </div>
        </section>
      );
    case "links":
      return (
        <section className="v2-ip__sec">
          <h2 className="v2-ip__h">{b.title}</h2>
          <ul className="v2-sup__links">
            {b.items.map(([label, key]) => (
              <li key={key}><Link href={ROUTES[key] ?? ROUTES.info(key)}>{label}<FiChevronRight aria-hidden="true" /></Link></li>
            ))}
          </ul>
        </section>
      );
    case "note":
      return <p className="v2-ip__note">{b.text}</p>;
    default:
      return null;
  }
}

export default function V2InfoView({ slug, info }) {
  const page = info.pages[slug];
  return (
    <div className="v2-wrap v2-page v2-ip">
      <nav className="v2-ip__nav" aria-label={info.navTitle}>
        <p className="v2-ip__navtitle">{info.navTitle}</p>
        <ul>
          {SLUGS.filter((s) => info.pages[s]).map((s) => (
            <li key={s}>
              <Link href={ROUTES.info(s)} aria-current={s === slug ? "page" : undefined}>{info.pages[s].title}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <article className="v2-ip__main">
        <p className="v2-ip__lead">{page.lead}</p>
        {page.blocks.map((b, i) => <Block key={i} b={b} i={i} />)}

        <aside className="v2-ip__help">
          <div>
            <h2>{info.stillTitle}</h2>
            <p>{info.stillText}</p>
          </div>
          <div className="v2-ip__helpbtns">
            <Link href={ROUTES.support} className="v2-pill v2-pill--solid">{info.stillCta}</Link>
            <Link href={ROUTES.home} className="v2-pill v2-pill--outline">{info.back}</Link>
          </div>
        </aside>
      </article>
    </div>
  );
}
