"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import useStage, { offsetOf, useSwipe } from "@/components/v2/ui/useStage";

const REACH = 1; // one card on each side of the centre one

// Men / Women / Kids as a looping card carousel: the centre card is large and shows the offer, the side cards sit back, smaller.
// Items are rendered twice so the card that wraps from one side to the other does so while hidden. items: [{ key, name, href, off, src }]
export default function V2GenderCarousel({ items, label, shopNow }) {
  const count = items.length;
  const total = count * 2;
  const st = useStage({ total, count, autoMs: 4500 });
  const swipe = useSwipe(st.move);

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); st.move(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); st.move(-1); }
  };

  return (
    <div className="v2-gcar" role="group" aria-roledescription="carousel" aria-label={label}
      onMouseEnter={() => st.setHold(true)} onMouseLeave={() => st.setHold(false)}
      onFocus={() => st.setHold(true)} onBlur={() => st.setHold(false)} onKeyDown={onKeyDown}>
      <ul className="v2-gcar__stage" aria-live="off" {...swipe}>
        {Array.from({ length: total }, (_, j) => {
          const it = items[j % count];
          const o = offsetOf(j, st.active, total);
          const a = Math.abs(o);
          const far = a > REACH;
          return (
            <li key={j} className="v2-gcard" data-far={far || undefined} data-active={o === 0 || undefined} aria-hidden={far || undefined}
              style={{ "--o": o, "--a": a, "--sg": Math.sign(o) }}>
              <Link href={it.href} className="v2-gcard__link" draggable={false} tabIndex={far ? -1 : 0}
                onClick={(e) => { if (o !== 0) { e.preventDefault(); st.move(o); } }}>
                <span className="v2-media v2-gcard__img">
                  {it.src && <RemoteImage src={it.src} alt="" sizes="(min-width: 640px) 320px, 60vw" />}
                </span>
                <span className="v2-gcard__shade" />
                <span className="v2-gcard__body">
                  <span className="v2-gcard__title v2-display">{it.name}</span>
                  <span className="v2-gcard__more">
                    <span className="v2-gcard__off">{it.off}</span>
                    <span className="v2-gcard__cta">{shopNow} <FiArrowRight aria-hidden="true" /></span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="v2-dots" role="group" aria-label={label}>
        {items.map((it, i) => (
          <button key={it.key} type="button" className="v2-dot" aria-label={it.name} aria-current={st.current === i ? "true" : undefined} onClick={() => st.goTo(i)} />
        ))}
      </div>
    </div>
  );
}
