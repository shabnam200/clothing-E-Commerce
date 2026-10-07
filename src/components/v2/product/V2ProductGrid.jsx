"use client";

import { useRef } from "react";
import V2ProductCard from "./V2ProductCard";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function V2ProductGrid({ items, className = "" }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300; 
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div style={{ position: 'relative', width: '100%', padding: '0 15px' }}>
      
      <button 
        type="button"
        onClick={() => scroll("left")}
        style={{
          position: 'absolute', left: '-5px', top: '45%', transform: 'translateY(-50%)', zIndex: 10,
          background: 'rgba(25,25,25,0.85)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#ffffff'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(25,25,25,0.85)'}
      >
        <FiChevronLeft size={22} style={{ color: 'inherit' }} />
      </button>

      <ul 
        ref={scrollRef}
        className={`v2-pgrid ${className}`.trim()}
        style={{
          display: 'flex', overflowX: 'auto', gap: '20px', scrollbarWidth: 'none', msOverflowStyle: 'none',
          padding: '10px 0', scrollBehavior: 'smooth', scrollSnapType: 'x mandatory'
        }}
      >
        {items.map((p) => (
          <li key={p.id} style={{ flex: '0 0 auto', width: '220px', scrollSnapAlign: 'start' }}>
            <V2ProductCard p={p} />
          </li>
        ))}
      </ul>
      
      <button 
        type="button"
        onClick={() => scroll("right")}
        style={{
          position: 'absolute', right: '-5px', top: '45%', transform: 'translateY(-50%)', zIndex: 10,
          background: 'rgba(25,25,25,0.85)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#ffffff'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(25,25,25,0.85)'}
      >
        <FiChevronRight size={22} style={{ color: 'inherit' }} />
      </button>

      <style>{`
        ul::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}