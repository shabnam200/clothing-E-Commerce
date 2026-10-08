"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import V2DeadlineBadge from "@/components/v2/campaign/V2DeadlineBadge";
import useStage, { useSwipe } from "@/components/v2/ui/useStage";

// The home "promo" section as a slideshow: festival slides (Eid / Boishakh / Puja ...) first, the regular
// "Refresh Your Wardrobe" slide last. With a single slide it looks exactly like the old static section (no arrows, no dots).
// Auto-advances every 4 s (pauses while the mouse / keyboard focus is inside). Arrows sit on both sides of the poster,
// the dots sit under it; the active dot fills up over the 4 s so people can see when the next slide comes.
// slide = { id, kind: "campaign" | "default", theme?, eyebrow, title, text, cta, href, image, alt, position, badge }
export default function V2PromoCarousel({ slides: allSlides, labels }) {
  // A festival slide carries `endsAt`; once that time passes it drops out of the slideshow, even if the page stays open.
  // (`now` starts empty so the server HTML and the first client render match.)
  const [now, setNow] = useState(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  const slides = useMemo(() => allSlides.filter((s) => !s.endsAt || now === null || now < s.endsAt), [allSlides, now]);
  const n = slides.length;
  const multi = n > 1;
  const st = useStage({ total: n, count: n, autoMs: multi ? 4000 : 0 });
  const swipe = useSwipe(st.move);
  const pad = (i) => String(i).padStart(2, "0");

  const onKeyDown = (e) => {
    if (!multi) return;
    if (e.key === "ArrowRight") { e.preventDefault(); st.move(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); st.move(-1); }
  };

  return (
    <div
      className="v2-pcar-wrap" data-theme={slides[st.current]?.theme} data-playing={st.playing || undefined} data-multi={multi || undefined}
      role="group" aria-roledescription="carousel" aria-label={labels.region}
      onMouseEnter={() => st.setHold(true)} onMouseLeave={() => st.setHold(false)}
      onFocus={() => st.setHold(true)} onBlur={() => st.setHold(false)} onKeyDown={onKeyDown}
    >
      <div className="v2-pcar">
        <ul className="v2-pcar__track" aria-live={st.playing ? "off" : "polite"} {...(multi ? swipe : {})}>
          {slides.map((s, i) => {
            const active = i === st.current;
            return (
              <li
                key={s.id} className="v2-pslide" data-kind={s.kind} data-theme={s.theme} data-active={active || undefined}
                aria-hidden={!active} role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${n}`}
              >
                <div className="v2-pslide__img">
                  {s.image
                    ? <RemoteImage src={s.image} alt={s.alt} sizes="(min-width: 900px) 40vw, 100vw" priority={i === 0} style={{ objectPosition: s.position }} />
                    : <span className="v2-pslide__art" role="img" aria-label={s.alt} />}
                </div>
                <div className="v2-pslide__text">
                  {multi && <span className="v2-pslide__count" aria-hidden="true"><b>{pad(i + 1)}</b> / {pad(n)}</span>}
                  <p className="v2-eyebrow">{s.eyebrow}</p>
                  <h2 className="v2-display v2-h2">{s.title}</h2>
                  <p className="v2-lede">{s.text}</p>
                  {s.badge && <V2DeadlineBadge {...s.badge} />}
                  <div>
                    <Link href={s.href} className="v2-pill v2-pill--solid">{s.cta}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {multi && (
          <>
            <button type="button" className="v2-pcar__side v2-pcar__side--prev" aria-label={labels.prev} onClick={() => st.move(-1)}><FiArrowLeft aria-hidden="true" /></button>
            <button type="button" className="v2-pcar__side v2-pcar__side--next" aria-label={labels.next} onClick={() => st.move(1)}><FiArrowRight aria-hidden="true" /></button>
          </>
        )}
      </div>

      {multi && (
        <div className="v2-pcar__dots">
          {slides.map((s, i) => (
            <button key={s.id} type="button" className="v2-pcar__dot" aria-label={labels.goTo.replace("{n}", i + 1)} aria-current={i === st.current ? "true" : undefined} onClick={() => st.goTo(i)} />
          ))}
        </div>
      )}
    </div>
  );
}
