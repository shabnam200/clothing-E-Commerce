"use client";

import { useState } from "react";
import Link from "next/link";
import { FiBox, FiMapPin, FiAward, FiUser, FiLogOut, FiPlus } from "react-icons/fi";
import { ROUTES } from "@/config/v2";

// Mock Data (পরে API থেকে আসবে)
const mockUser = {
  name: "আরিয়ান খান",
  email: "arian@example.com",
  tier: "VIP Elite", // Loyalty Tier
  points: 1250,
  nextTierPoints: 2000
};

const mockOrders = [
  { id: "#AVN-9023", date: "অক্টোবর ৪, ২০২৬", status: "Processing", total: "৳৫,২০০", items: 2 },
  { id: "#AVN-8941", date: "সেপ্টেম্বর ২৮, ২০২৬", status: "Delivered", total: "৳৩,৪৫০", items: 1 },
  { id: "#AVN-8102", date: "আগস্ট ১৫, ২০২৬", status: "Delivered", total: "৳৮,৯০০", items: 3 },
];

const mockAddresses = [
  { id: 1, type: "Home", address: "বাড়ি ১২, রোড ৫, ধানমন্ডি", city: "ঢাকা", phone: "০১৭০০-০০০০০০", isDefault: true },
  { id: 2, type: "Office", address: "লেভেল ৪, সামিট টাওয়ার, কারওয়ান বাজার", city: "ঢাকা", phone: "০১৮০০-০০০০০০", isDefault: false },
];

export default function V2AccountDashboard() {
  const [activeTab, setActiveTab] = useState("orders");

  // Loyalty Tier Progress Calculation
  const progressPct = Math.min(100, Math.round((mockUser.points / mockUser.nextTierPoints) * 100));

  return (
    <div className="v2-wrap v2-block" style={{ paddingBottom: '80px' }}>
      
      {/* Page Header */}
      <div className="v2-center" style={{ marginBottom: '40px' }}>
        <h2 className="v2-display v2-h2">My Account</h2>
        <p className="v2-lede" style={{ marginTop: '8px' }}>Welcome back, {mockUser.name}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', alignItems: 'start' }}>
        
        {/* Sidebar Navigation & Loyalty Card */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Loyalty Tier Card */}
          <div style={{ background: 'var(--v2-dark)', color: 'var(--v2-on-dark)', padding: '24px', borderRadius: '12px', boxShadow: '0 10px 30px var(--v2-shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--v2-star)', color: '#000', padding: '8px', borderRadius: '50%' }}>
                <FiAward size={20} />
              </div>
              <div>
                <p style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--v2-on-dark-muted)' }}>Current Tier</p>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--v2-star)' }}>{mockUser.tier}</h3>
              </div>
            </div>
            
            <div className="v2-bar" style={{ background: 'rgba(255,255,255,0.1)', height: '6px', marginBottom: '10px' }}>
              <span style={{ background: 'var(--v2-star)', width: `${progressPct}%`, display: 'block', height: '100%', borderRadius: '999px' }}></span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--v2-on-dark-muted)' }}>
              {mockUser.points} Points • Earn {mockUser.nextTierPoints - mockUser.points} more for next tier
            </p>
          </div>

          {/* Navigation Menu */}
          <nav style={{ background: 'var(--v2-surface)', border: '1px solid var(--v2-line)', borderRadius: '12px', overflow: 'hidden' }}>
            <button 
              onClick={() => setActiveTab("orders")}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: activeTab === "orders" ? 'var(--v2-sand)' : 'transparent', border: 'none', borderBottom: '1px solid var(--v2-line)', cursor: 'pointer', fontSize: '15px', fontWeight: activeTab === "orders" ? '600' : '400', transition: 'background 0.2s' }}
            >
              <FiBox size={18} /> Order History
            </button>
            <button 
              onClick={() => setActiveTab("addresses")}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: activeTab === "addresses" ? 'var(--v2-sand)' : 'transparent', border: 'none', borderBottom: '1px solid var(--v2-line)', cursor: 'pointer', fontSize: '15px', fontWeight: activeTab === "addresses" ? '600' : '400', transition: 'background 0.2s' }}
            >
              <FiMapPin size={18} /> Saved Addresses
            </button>
            <button 
              onClick={() => setActiveTab("profile")}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: activeTab === "profile" ? 'var(--v2-sand)' : 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: activeTab === "profile" ? '600' : '400', transition: 'background 0.2s' }}
            >
              <FiUser size={18} /> Profile Details
            </button>
            
            <div style={{ padding: '16px 20px', background: 'var(--v2-surface)', borderTop: '1px solid var(--v2-line)' }}>
              <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--v2-sale)', fontWeight: '500' }}>
                <FiLogOut size={18} /> Sign Out
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main style={{ minHeight: '400px' }}>
          
          {/* ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="v2-tabpanel">
              <h2 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: '500' }}>Order History</h2>
              
              {mockOrders.length === 0 ? (
                <div className="v2-empty">
                  <FiBox className="v2-empty__icon" />
                  <p>You haven't placed any orders yet.</p>
                  <Link href={ROUTES?.shop || "/shop"} className="v2-pill v2-pill--solid" style={{ marginTop: '16px' }}>Start Shopping</Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {mockOrders.map((order) => (
                    <div key={order.id} style={{ background: 'var(--v2-surface)', border: '1px solid var(--v2-line)', borderRadius: '8px', padding: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{order.id}</h3>
                          <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '999px', background: order.status === "Delivered" ? 'var(--v2-sand)' : 'var(--v2-ink)', color: order.status === "Delivered" ? 'var(--v2-ink)' : 'var(--v2-bg)', fontWeight: '500' }}>
                            {order.status}
                          </span>
                        </div>
                        <p style={{ fontSize: '13.5px', color: 'var(--v2-muted)' }}>{order.date} • {order.items} Items</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>{order.total}</p>
                        <button className="v2-pill v2-pill--outline v2-pill--sm">View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === "addresses" && (
            <div className="v2-tabpanel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '500' }}>Saved Addresses</h2>
                <button className="v2-pill v2-pill--solid v2-pill--sm"><FiPlus /> Add New</button>
              </div>

              <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                {mockAddresses.map((addr) => (
                  <div key={addr.id} style={{ background: 'var(--v2-surface)', border: addr.isDefault ? '2px solid var(--v2-ink)' : '1px solid var(--v2-line)', borderRadius: '8px', padding: '20px', position: 'relative' }}>
                    {addr.isDefault && (
                      <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '10px', background: 'var(--v2-ink)', color: 'var(--v2-bg)', padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '1px' }}>Default</span>
                    )}
                    <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiMapPin /> {addr.type}
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--v2-muted)', lineHeight: '1.6', marginBottom: '12px' }}>
                      {addr.address}<br />{addr.city}<br />{addr.phone}
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button style={{ background: 'none', border: 'none', textDecoration: 'underline', textUnderlineOffset: '4px', fontSize: '13px', cursor: 'pointer', color: 'var(--v2-ink)' }}>Edit</button>
                      <button style={{ background: 'none', border: 'none', textDecoration: 'underline', textUnderlineOffset: '4px', fontSize: '13px', cursor: 'pointer', color: 'var(--v2-sale)' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="v2-tabpanel">
              <h2 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: '500' }}>Profile Details</h2>
              <div style={{ background: 'var(--v2-surface)', border: '1px solid var(--v2-line)', borderRadius: '8px', padding: '24px' }}>
                <div style={{ display: 'grid', gap: '20px', maxWidth: '400px' }}>
                  <div className="v2-field">
                    <label style={{ fontSize: '13px', color: 'var(--v2-muted)', marginBottom: '4px', display: 'block' }}>Full Name</label>
                    <div style={{ fontSize: '16px', fontWeight: '500' }}>{mockUser.name}</div>
                  </div>
                  <div className="v2-field">
                    <label style={{ fontSize: '13px', color: 'var(--v2-muted)', marginBottom: '4px', display: 'block' }}>Email Address</label>
                    <div style={{ fontSize: '16px', fontWeight: '500' }}>{mockUser.email}</div>
                  </div>
                  <button className="v2-pill v2-pill--outline" style={{ marginTop: '10px', width: 'fit-content' }}>Change Password</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}