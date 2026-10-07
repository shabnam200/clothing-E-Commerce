"use client";

import RemoteImage from "@/components/ui/RemoteImage";
import useStage, { offsetOf, useSwipe } from "@/components/v2/ui/useStage";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/v2";

const REACH = 3; 

export default function V2Coverflow({ items, ctrl }) {
  const n = items.length;
  // autoMs 2800 theke komiye 1800 kora holo jate scroll speed fast hoy
  const st = useStage({ total: n, count: n, autoMs: 1800 });
  const swipe = useSwipe(st.move);
  const router = useRouter();

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); st.move(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); st.move(-1); }
  };

  const handleItemClick = (o, id) => {
    if (o === 0) {
      // Chobiti jodi majhkhaner (active) hoy, tobe click korle product page e jabe
      if (typeof ROUTES.product === 'function') {
        router.push(ROUTES.product(id));
      } else {
        router.push(`/shop`); 
      }
    } else {
      // Pasher chobi hole click korle seta majhkhane ashbe
      st.move(o);
    }
  };

  return (
    <div className="v2-flow" role="group" aria-roledescription="carousel" aria-label={ctrl.label}
      onMouseEnter={() => st.setHold(true)} onMouseLeave={() => st.setHold(false)}
      onFocus={() => st.setHold(true)} onBlur={() => st.setHold(false)} onKeyDown={onKeyDown}>
      <ul className="v2-flow__stage" aria-live={st.playing ? "off" : "polite"} {...swipe}>
        {items.map((it, i) => {
          const o = offsetOf(i, st.active, n);
          const a = Math.abs(o);
          const far = a > REACH;
          return (
            <li key={i} className="v2-flow__page" data-far={far || undefined} data-active={o === 0 || undefined}
              style={{ "--o": o, "--a": a, "--sg": Math.sign(o) }}>
              <button 
                type="button" 
                className="v2-flow__hit" 
                aria-label={it.alt} 
                aria-current={o === 0 ? "true" : undefined}
                tabIndex={o === 0 || far ? -1 : 0} 
                onClick={() => handleItemClick(o, it.id)}
                style={{ cursor: o === 0 ? 'pointer' : 'default' }} // Active chobite pointer icon dekhabe
              >
                <span className="v2-media v2-flow__img">
                  {it.src && <RemoteImage src={it.src} alt="" sizes="(min-width: 640px) 340px, 60vw" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}