// Shown while /v2/shop (or a filter / search change) is loading.
export default function Loading() {
  return (
    <div className="v2-wrap v2-page" aria-busy="true">
      <p className="sr-only" role="status">Loading…</p>
      <div className="v2-skel v2-skel--title" />
      <ul className="v2-pgrid">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i}><div className="v2-skel v2-skel--img" /><div className="v2-skel v2-skel--line" /><div className="v2-skel v2-skel--line v2-skel--short" /></li>
        ))}
      </ul>
    </div>
  );
}
