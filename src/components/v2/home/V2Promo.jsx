import V2PromoCarousel from "@/components/v2/campaign/V2PromoCarousel";
import { BANNERS } from "@/data/banners";
import { ROUTES } from "@/config/v2";
import { CAMPAIGN_LABELS } from "@/config/campaigns";
import { SEASON_COPY, currentSeason } from "@/config/seasons";
import { existingImage } from "@/lib/v2/media";

// "Refresh Your Wardrobe" section. While festivals are live (see lib/v2/campaigns.js) their banners come first
// and the regular slide stays last, so the section becomes a slideshow with arrows.
// The regular slide's title and text follow the season (spring / summer / autumn / winter, see config/seasons.js).
export default function V2Promo({ v2, lang = "bn", campaigns = [] }) {
  const l = lang === "en" ? "en" : "bn";
  const season = currentSeason();
  const p = { ...v2.promo, ...SEASON_COPY[season][l] };
  const slides = [
    ...campaigns.map((c) => ({
      id: `campaign-${c.id}`, kind: "campaign", theme: c.theme, endsAt: c.endsAt ?? null,
      eyebrow: c.eyebrow, title: c.title, text: c.text, cta: c.cta, href: c.ctaHref,
      image: c.image, alt: c.title, position: c.imagePosition, badge: c.badge,
    })),
    {
      id: "default", kind: "default",
      eyebrow: p.eyebrow, title: p.title, text: p.text, cta: p.cta, href: `${ROUTES.shop}?tag=new`,
      image: existingImage(BANNERS.v2PromoSeason?.[season] || BANNERS.v2Promo), alt: p.alt, position: undefined, badge: null,
    },
  ];
  return (
    <section className="v2-wrap v2-block" aria-label={CAMPAIGN_LABELS[l].region}>
      <div className="v2-reveal">
        <V2PromoCarousel slides={slides} labels={CAMPAIGN_LABELS[l]} />
      </div>
    </section>
  );
}
