"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const mod = (n, m) => ((n % m) + m) % m;

// Signed distance (in slots) from the active slot to slot `i`, going the short way round a loop of `total` slots.
export const offsetOf = (i, active, total) => {
  const d = mod(i - active, total);
  return d > total / 2 ? d - total : d;
};

// State for the looping 3D carousels (journal coverflow + Men/Women/Kids cards).
// `total` slots are rendered; `count` is how many distinct items exist (total = count × k when items are repeated,
// so that the slots at the far ends are hidden while they jump from one side of the loop to the other).
export default function useStage({ total, count, autoMs = 0 }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const move = useCallback((delta) => setActive((a) => mod(a + delta, total)), [total]);
  const goTo = useCallback((item) => setActive((a) => {
    let d = mod(item - a, count);
    if (d > count / 2) d -= count;
    return mod(a + d, total);
  }), [count, total]);

  const canPlay = autoMs > 0 && !reduced && count > 1;
  const playing = canPlay && !paused;
  useEffect(() => {
    if (!playing || hold) return;
    const t = setTimeout(() => setActive((a) => mod(a + 1, total)), autoMs);
    return () => clearTimeout(t);
  }, [playing, hold, autoMs, total, active]); // `active` restarts the timer after every manual move

  return {
    active, current: mod(active, count), move, goTo, canPlay, playing, paused,
    togglePause: () => setPaused((p) => !p), setHold,
  };
}

// Horizontal swipe / drag. A drag never counts as a click on the card underneath it.
export function useSwipe(onSwipe) {
  const startX = useRef(null);
  const dragged = useRef(false);
  return {
    onPointerDown: (e) => { if (e.pointerType === "mouse" && e.button !== 0) return; startX.current = e.clientX; dragged.current = false; },
    onPointerUp: (e) => {
      if (startX.current == null) return;
      const dx = e.clientX - startX.current;
      startX.current = null;
      if (Math.abs(dx) > 40) { dragged.current = true; onSwipe(dx < 0 ? 1 : -1); }
    },
    onPointerCancel: () => { startX.current = null; },
    onClickCapture: (e) => { if (dragged.current) { e.preventDefault(); e.stopPropagation(); dragged.current = false; } },
  };
}
