// Slow text ticker (own content — no third-party brand marks). Duplicated once for a seamless loop; the copy is hidden from AT.
export default function V2Marquee({ words }) {
  const row = (hidden) => (
    <ul aria-hidden={hidden || undefined}>
      {words.map((w) => <li key={w}>{w}</li>)}
    </ul>
  );
  return (
    <section className="v2-marquee" aria-label={words.join(", ")}>
      <div className="v2-marquee__track">{row(false)}{row(true)}</div>
    </section>
  );
}
