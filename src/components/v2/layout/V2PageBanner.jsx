import Link from "@/components/ui/AppLink";
import V2Media from "@/components/v2/ui/V2Media";
import { BANNERS } from "@/data/banners";
import { getStorefrontCreative } from "@/lib/v2/campaigns";
import { getCategories } from "@/lib/v2/catalogSource";
import { getV2Locale } from "@/lib/v2/i18n";
import { isCosmeticsStore } from "@/lib/v2/niche";

// Which photo sits behind the band:
// 1) the main banner image uploaded in the admin panel (Banners & offers);
// 2) otherwise, for a cosmetics shop, no photo at all (a plain brand-colour band), never a clothing picture;
// 3) otherwise (clothing shop) the built-in clothing photo, exactly as before.
async function bannerImage() {
  try {
    const { lang } = await getV2Locale();
    const creative = await getStorefrontCreative(lang);
    if (creative?.hero?.image) return { src: creative.hero.image, plain: false };
    if (isCosmeticsStore(await getCategories(lang))) return { src: null, plain: true };
  } catch { /* fall through to the built-in photo */ }
  return { src: BANNERS.v2Hero, plain: false };
}

// Page header band used on every inner page: the landing-page photo behind a dimmed scrim,
// centred breadcrumb trail and (optionally) the page title. Last crumb has no href.
// crumbs: [{ label, href? }]   title: optional <h1>   children: optional row under the title (filters, counts…)
export default async function V2PageBanner({ crumbs = [], title, children, position = "50% 28%" }) {
  const { src, plain } = await bannerImage();
  return (
    <section className="v2-banner-wrap" aria-label={title || crumbs[crumbs.length - 1]?.label}>
      <V2Media src={src} alt="" priority position={position} sizes="100vw" unoptimized={!!src && src !== BANNERS.v2Hero} className={plain ? "v2-banner v2-banner--plain" : "v2-banner"}>
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
