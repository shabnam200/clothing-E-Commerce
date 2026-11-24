import V2PromoCarousel from "@/components/v2/campaign/V2PromoCarousel";
import { CAMPAIGN_LABELS } from "@/config/campaigns";

// Home promo section: a slideshow of the banners / offers / festival campaigns that really exist (managed from the admin
// panel). There is no built-in placeholder slide any more: with nothing live the section is not rendered at all.
export default function V2Promo({ v2, lang = "bn", campaigns = [], placedCampaigns = [], sectionTitle = "" }) {
  const l = lang === "en" ? "en" : "bn";
  const p = v2.promo;
  const slides = [
    ...placedCampaigns.map((c) => ({
      id: `placed-${c.id}`, kind: "campaign", theme: "seasonal", endsAt: c.endsAt ?? null,
      eyebrow: p.eyebrow, title: c.title, text: c.text, cta: p.cta, href: c.href,
      image: c.image, alt: c.title, position: undefined, badge: null, discount: c.discount || "", validity: c.validity || null,
      validityLabel: l === "bn" ? "\u09AE\u09C7\u09DF\u09BE\u09A6" : "Valid", lang: l,
    })),
    ...campaigns.map((c) => ({
      id: `campaign-${c.id}`, kind: "campaign", theme: c.theme, endsAt: c.endsAt ?? null,
      eyebrow: c.eyebrow, title: c.title, text: c.text, cta: c.cta, href: c.ctaHref,
      image: c.image, alt: c.title, position: c.imagePosition, badge: c.badge,
    })),
  ];
  if (!slides.length) return null;
  return (
    <section className="v2-wrap v2-block" aria-label={sectionTitle || CAMPAIGN_LABELS[l].region}>
      {sectionTitle && <div className="v2-sechead v2-reveal"><h2 className="v2-display v2-h2">{sectionTitle}</h2></div>}
      <div className="v2-reveal">
        <V2PromoCarousel slides={slides} labels={CAMPAIGN_LABELS[l]} />
      </div>
    </section>
  );
}
