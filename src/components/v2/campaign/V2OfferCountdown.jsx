"use client";

import { useEffect, useState } from "react";
import { FiClock } from "react-icons/fi";
import { fmtNum } from "@/lib/v2/format";

export default function V2OfferCountdown({ deadline, lang = "bn", className = "" }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!deadline) return undefined;
    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!deadline || remaining === null || remaining <= 0) return null;
  const totalMinutes = Math.ceil(remaining / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const isBn = lang !== "en";
  const time = hours > 0
    ? (isBn ? `${fmtNum(hours, lang)} ঘণ্টা ${fmtNum(minutes, lang)} মিনিট` : `${fmtNum(hours, lang)}h ${fmtNum(minutes, lang)}m`)
    : (isBn ? `${fmtNum(minutes, lang)} মিনিট` : `${fmtNum(minutes, lang)}m`);

  return (
    <small className={`v2-offer-countdown ${className}`.trim()}>
      <FiClock aria-hidden="true" />
      <span>{isBn ? `শেষ হতে ${time} বাকি` : `Ends in ${time}`}</span>
    </small>
  );
}
