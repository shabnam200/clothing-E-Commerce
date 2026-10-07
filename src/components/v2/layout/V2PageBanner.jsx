import Link from "next/link";
import V2Media from "@/components/v2/ui/V2Media";
import { BANNERS } from "@/data/banners";

// Page header band used on every inner page: the landing-page photo behind a dimmed scrim,
// centred breadcrumb trail and (optionally) the page title. Last crumb has no href.
// crumbs: [{ label, href? }]   title: optional <h1>   children: optional row under the title (filters, counts…)
export default function V2PageBanner({ crumbs = [], title, children, position = "50% 28%" }) {
  return (
    <section className="v2-banner-wrap" aria-label={title || crumbs[crumbs.length - 1]?.label}>
      <V2Media src={BANNERS.v2Hero} alt="" position={position} sizes="100vw" className="v2-banner">
        <div className="v2-banner__scrim" />
        <div className="v2-banner__inner">
          {title && <h1 className="v2-display v2-banner__title">{title}</h1>}
          {crumbs.length > 0 && (
            <nav className="v2-banner__crumbs" aria-label="Breadcrumb">
              <ol>
                {crumbs.map((c, i) => {
                  const last = i === crumbs.length - 1;
                  return (
                    <li key={`${c.label}-${i}`}>
                      {last || !c.href ? <span aria-current={last ? "page" : undefined}>{c.label}</span> : <Link href={c.href}>{c.label}</Link>}
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}
          {children && <div className="v2-banner__extra">{children}</div>}
        </div>
      </V2Media>
    </section>
  );
}
