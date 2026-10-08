"use client";

import { useState } from "react";
import Link from "next/link";
import { FiX } from "react-icons/fi";
import V2DeadlineBadge from "@/components/v2/campaign/V2DeadlineBadge";

// Top bar shown instead of the default promo bar while a campaign is live.
export default function V2CampaignBar({ campaign }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="v2-campbar" role="region" aria-label={campaign.bar}>
      <div className="v2-campbar__row">
        <strong className="v2-campbar__tag">{campaign.bar}</strong>
        {campaign.badge && <V2DeadlineBadge {...campaign.badge} />}
        <Link href={campaign.ctaHref} className="v2-campbar__cta">{campaign.cta} →</Link>
      </div>
      <button type="button" className="v2-campbar__close" aria-label={campaign.closeLabel} onClick={() => setOpen(false)}>
        <FiX size={16} />
      </button>
    </div>
  );
}
