// Flat garment silhouettes used as stand-ins until real photos are added. Colors come from --v2-g-* tokens.
const SHAPES = {
  tee: { body: "M64 30 L92 22 Q100 38 108 22 L136 30 L172 64 L150 86 L138 74 L138 172 L62 172 L62 74 L50 86 L28 64 Z", detail: "" },
  shirt: { body: "M66 28 L92 22 L100 44 L108 22 L134 28 L176 80 L170 128 L148 124 L140 92 L138 176 L62 176 L60 92 L52 124 L30 128 L24 80 Z", detail: "M92 22 L100 44 L108 22 M100 44 V176 M100 70 h.1 M100 100 h.1 M100 130 h.1" },
  jacket: { body: "M60 26 L90 18 L100 34 L110 18 L140 26 L178 70 L168 150 L148 146 L140 98 L140 178 L60 178 L60 98 L52 146 L32 150 L22 70 Z", detail: "M100 34 V178 M70 130 h20 M110 130 h20" },
  panjabi: { body: "M66 24 L92 18 Q100 32 108 18 L134 24 L170 70 L160 112 L142 106 L138 92 L140 186 L60 186 L62 92 L58 106 L40 112 L30 70 Z", detail: "M100 32 V100 M100 48 h.1 M100 68 h.1 M100 88 h.1 M100 152 V186" },
};

export default function V2Garment({ type = "tee", color = 1, className }) {
  const s = SHAPES[type] ?? SHAPES.tee;
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path d={s.body} style={{ fill: `var(--v2-g-${color})`, stroke: "var(--v2-garment-line)" }} strokeWidth="1.5" strokeLinejoin="round" />
      {s.detail && <path d={s.detail} fill="none" style={{ stroke: "var(--v2-garment-line)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
