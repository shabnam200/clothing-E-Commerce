import { FiAward, FiStar, FiHeart, FiSmile, FiRefreshCw } from "react-icons/fi";

const ICONS = [FiAward, FiStar, FiHeart, FiSmile, FiRefreshCw];

export default function V2Perks({ perks }) {
  return (
    <section style={{ backgroundColor: 'var(--v2-base, #0a0a0a)', padding: '60px 15px', borderBottom: '1px solid var(--v2-line, #222222)' }}>
      <div className="v2-wrap" style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        
        <h2 style={{ fontSize: '18px', fontWeight: '500', letterSpacing: '2px', color: 'var(--v2-ink, #ffffff)', marginBottom: '40px', textTransform: 'uppercase' }}>
          Why Choose Avenor?
        </h2>

        <ul style={{ 
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', listStyle: 'none', padding: 0, margin: 0 
        }}>
          {perks.map(([title, text], i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <li key={title} className="v2-reveal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: '1 1 160px', maxWidth: '220px' }}>
                <span style={{ fontSize: '28px', color: '#56cfe1', display: 'flex' }}>
                  <Icon aria-hidden="true" strokeWidth={1.5} />
                </span>
                <div>
                  <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--v2-ink, #ffffff)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--v2-muted, #888888)', margin: 0, lineHeight: '1.4' }}>{text}</p>
                </div>
              </li>
            );
          })}
        </ul>

      </div>
    </section>
  );
}