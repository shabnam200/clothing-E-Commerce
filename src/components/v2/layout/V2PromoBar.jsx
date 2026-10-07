"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiX } from "react-icons/fi";
import { ROUTES } from "@/config/v2";

export default function V2PromoBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [showTimer, setShowTimer] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3);

  useEffect(() => {
    const calculateTime = () => {
      const diff = +targetDate - +new Date();
      if (diff > 0) {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        });
      }
    };
    
    calculateTime();
    const timerInterval = setInterval(calculateTime, 1000);

    const toggleInterval = setInterval(() => {
      setShowTimer((prev) => !prev);
    }, 3000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(toggleInterval);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div style={{ background: 'var(--v2-card, #111111)', color: 'var(--v2-ink, #ffffff)', borderBottom: '1px solid var(--v2-line)', padding: '10px 15px', position: 'relative', fontSize: '13px', fontWeight: '500', textAlign: 'center', zIndex: 1000 }}>
      
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '20px' }}>
        {showTimer ? (
          <span className="promo-fade">
            Today deal sale off <strong style={{ color: '#56cfe1' }}>70%</strong>. End in {timeLeft.d} days {timeLeft.h.toString().padStart(2, '0')}:{timeLeft.m.toString().padStart(2, '0')}:{timeLeft.s.toString().padStart(2, '0')} . <Link href={ROUTES.shop || "/shop"} style={{ textDecoration: 'underline', color: '#56cfe1', marginLeft: '6px' }}>Hurry Up →</Link>
          </span>
        ) : (
          <span className="promo-fade">
            Welcome to our store! Enjoy free shipping on all orders.
          </span>
        )}
      </div>
      
      <button 
        onClick={() => setIsVisible(false)} 
        style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--v2-ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', opacity: 0.8 }}
      >
        <FiX size={16} /> close
      </button>
    </div>
  );
}