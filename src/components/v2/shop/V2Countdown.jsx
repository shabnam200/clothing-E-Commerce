"use client";

import { useState, useEffect } from "react";
import { FiClock } from "react-icons/fi";

export default function V2Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };
    
    calculateTimeLeft(); // initial call
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--v2-tile)', padding: '10px 15px', borderRadius: '6px', marginBottom: '5px' }}>
      <div style={{ color: 'var(--v2-sale)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>
        <FiClock size={16} /> Flash Sale Ends In:
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--v2-ink)', background: 'var(--v2-card)', padding: '4px 8px', borderRadius: '4px', minWidth: '32px', textAlign: 'center', border: '1px solid var(--v2-line)' }}>
              {value.toString().padStart(2, '0')}
            </span>
            <span style={{ fontSize: '9px', color: 'var(--v2-muted)', textTransform: 'uppercase', marginTop: '3px' }}>{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}