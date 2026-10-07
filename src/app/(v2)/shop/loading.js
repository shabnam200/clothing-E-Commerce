// Shown while /v2/shop (or a filter / search change) is loading.
export default function Loading() {
  return (
    <div className="v2-wrap v2-page" aria-busy="true">
      <p className="sr-only" role="status">Loading…</p>
      <div className="v2-skel v2-skel--title" style={{ marginBottom: '40px' }} />
      
      {/* Skeleton matches the new Sidebar + Grid layout */}
      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Sidebar Skeleton */}
        <aside style={{ flex: '0 0 260px', width: '100%' }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="v2-skel v2-skel--line" style={{ height: '40px', marginBottom: '20px', borderRadius: '4px' }} />
          ))}
        </aside>

        {/* Product Grid Skeleton */}
        <main style={{ flex: '1 1 600px', minWidth: 0 }}>
          <div className="v2-skel v2-skel--line" style={{ height: '30px', width: '200px', marginBottom: '25px', marginLeft: 'auto' }} />
          <ul className="v2-pgrid">
            {Array.from({ length: 9 }, (_, i) => (
              <li key={i}>
                <div className="v2-skel v2-skel--img" />
                <div className="v2-skel v2-skel--line" />
                <div className="v2-skel v2-skel--line v2-skel--short" />
              </li>
            ))}
          </ul>
        </main>
        
      </div>
    </div>
  );
}