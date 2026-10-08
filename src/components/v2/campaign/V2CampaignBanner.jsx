import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import V2DeadlineBadge from "@/components/v2/campaign/V2DeadlineBadge";

// Home page banner under the hero while a campaign is live. Pure CSS artwork (crescent for Eid, sun for Boishakh).
export default function V2CampaignBanner({ campaign }) {
  return (
    <section className="v2-wrap v2-campaign" aria-labelledby="v2-campaign-title">
      <div className="v2-campaign__box">
        <p className="v2-campaign__eyebrow">{campaign.eyebrow}</p>
        <h2 id="v2-campaign-title" className="v2-display v2-campaign__title">{campaign.title}</h2>
        <p className="v2-campaign__text">{campaign.text}</p>
        {campaign.badge && <V2DeadlineBadge {...campaign.badge} />}
        <Link href={campaign.ctaHref} className="v2-campaign__cta">{campaign.cta} <FiArrowUpRight aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
