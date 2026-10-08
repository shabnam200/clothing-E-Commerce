"use client";

import { useEffect, useState } from "react";
import { FiClock } from "react-icons/fi";
import { fmtNum } from "@/lib/v2/format";

// "Order by 4 March to get it before Eid" + a live "6 days left" chip.
// The days-left part appears after mount, so the server HTML and the first client render are identical.
export default function V2DeadlineBadge({ deadline, text, daysLeft, lastDay, lang = "bn", className = "" }) {
  const [ms, setMs] = useState(null);

  useEffect(() => {
    const tick = () => setMs(deadline - Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!deadline || (ms !== null && ms <= 0)) return null; // deadline passed while the page was open

  const days = ms === null ? null : Math.ceil(ms / 86_400_000);
  return (
    <span className={`v2-deadline ${className}`.trim()}>
      <FiClock aria-hidden="true" />
      <span>{text}</span>
      {days !== null && <b className="v2-deadline__left">{days <= 1 ? lastDay : daysLeft.replace("{n}", fmtNum(days, lang))}</b>}
    </span>
  );
}
