"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiAward, FiBox, FiHeart, FiLifeBuoy, FiLogOut, FiMapPin, FiPlus, FiRefreshCw, FiUser } from "react-icons/fi";
import V2EmptyState from "@/components/v2/ui/V2EmptyState";
import { ROUTES, RETURN_WINDOW_DAYS } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

// Demo data: replace with the Laravel API (orders, addresses, profile) later.
const USER = { name: "আরিয়ান খান", email: "arian@example.com", phone: "01700-000000", tier: "VIP Elite", points: 1250, nextTierPoints: 2000 };
const ORDERS = [
  { id: "#AVN-9023", date: "Oct 4, 2026", status: "Processing", total: "৳5,200", items: 2 },
  { id: "#AVN-8941", date: "Sep 28, 2026", status: "Delivered", deliveredOn: "2026-10-03", total: "৳3,450", items: 1 },
  { id: "#AVN-8102", date: "Aug 15, 2026", status: "Delivered", deliveredOn: "2026-08-19", total: "৳8,900", items: 3 },
];
const ADDRESSES = [
  { id: 1, type: "Home", address: "House 12, Road 5, Dhanmondi", city: "Dhaka", phone: "01700-000000", isDefault: true },
  { id: 2, type: "Office", address: "Level 4, Summit Tower, Karwan Bazar", city: "Dhaka", phone: "01800-000000", isDefault: false },
];
const TABS = [
  { key: "orders", label: "Orders", icon: FiBox },
  { key: "addresses", label: "Addresses", icon: FiMapPin },
  { key: "profile", label: "Profile", icon: FiUser },
];

export default function V2AccountDashboard({ copy: c }) {
  const router = useRouter();
  const { hydrated, isLoggedIn, setIsLoggedIn, setAuthModalOpen, wish, showToast, num, fill } = useV2Store();
  const [tab, setTab] = useState("orders");
  const [confirmOut, setConfirmOut] = useState(false);
  const [addresses, setAddresses] = useState(ADDRESSES);
  const [adding, setAdding] = useState(false);
  const [delId, setDelId] = useState(null);
  const [draft, setDraft] = useState({ type: "", address: "", city: "", phone: "" });
  const [draftErr, setDraftErr] = useState("");
  const [profile, setProfile] = useState({ name: USER.name, email: USER.email, phone: USER.phone });
  const [returns, setReturns] = useState({});            // orderId -> { type, reason, note } (frontend demo)
  const [returnFor, setReturnFor] = useState(null);      // order currently showing the return form
  const [rDraft, setRDraft] = useState({ type: "return", reason: "", note: "" });
  const [rErr, setRErr] = useState("");

  useEffect(() => {
    const h = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.key === h)) setTab(h);
  }, []);

  const pick = (key) => { setTab(key); setConfirmOut(false); history.replaceState(null, "", `#${key}`); };
  const pct = Math.min(100, Math.round((USER.points / USER.nextTierPoints) * 100));

  if (!hydrated) return <div className="v2-wrap v2-page"><p className="v2-loading" role="status"><span className="v2-spinner" aria-hidden="true" /></p></div>;

  if (!isLoggedIn) {
    return (
      <div className="v2-wrap v2-page">
        <V2EmptyState icon={<FiUser />} title="Sign in to your account" text="View your orders, saved addresses and wishlist in one place.">
          <button type="button" className="v2-pill v2-pill--solid" onClick={() => setAuthModalOpen(true)}>Sign in</button>
          <Link href={ROUTES.register} className="v2-pill v2-pill--outline">Create account</Link>
        </V2EmptyState>
      </div>
    );
  }

  const signOut = () => { setIsLoggedIn(false); showToast?.("You have been signed out", "info"); router.push(ROUTES.home); };

  const addAddress = (e) => {
    e.preventDefault();
    if (draft.type.trim().length < 2 || draft.address.trim().length < 6 || draft.city.trim().length < 2) { setDraftErr("Please fill in the label, address and city."); return; }
    setAddresses((a) => [...a, { id: Date.now(), ...draft, isDefault: a.length === 0 }]);
    setDraft({ type: "", address: "", city: "", phone: "" }); setDraftErr(""); setAdding(false);
    showToast?.("Address added", "success");
  };
  const removeAddress = (id) => {
    setAddresses((a) => { const next = a.filter((x) => x.id !== id); if (next.length && !next.some((x) => x.isDefault)) next[0] = { ...next[0], isDefault: true }; return next; });
    setDelId(null); showToast?.("Address removed", "info");
  };
  const makeDefault = (id) => setAddresses((a) => a.map((x) => ({ ...x, isDefault: x.id === id })));
  const saveProfile = (e) => { e.preventDefault(); showToast?.("Profile saved", "success"); };

  // Return / exchange: allowed for delivered orders until the end of day RETURN_WINDOW_DAYS after delivery.
  const returnInfo = (o) => {
    if (o.status !== "Delivered" || !o.deliveredOn) return null;
    const deadline = new Date(`${o.deliveredOn}T00:00:00`);
    deadline.setDate(deadline.getDate() + RETURN_WINDOW_DAYS);
    deadline.setHours(23, 59, 59, 999);
    const ms = deadline - Date.now();
    return ms > 0 ? { open: true, left: Math.min(RETURN_WINDOW_DAYS, Math.ceil(ms / 864e5)) } : { open: false, left: 0 };
  };
  const openReturn = (id) => { setReturnFor(id); setRDraft({ type: "return", reason: "", note: "" }); setRErr(""); };
  const submitReturn = (e) => {
    e.preventDefault();
    if (!rDraft.reason) { setRErr(c.errReason); return; }
    setReturns((r) => ({ ...r, [returnFor]: { ...rDraft } }));
    setReturnFor(null); setRErr("");
    showToast?.(c.ok, "success");
  };

  return (
    <div className="v2-wrap v2-page">
      <div className="v2-acc">
        <aside className="v2-acc__side">
          <div className="v2-acc__me">
            <span className="v2-acc__avatar" aria-hidden="true">{profile.name.trim().charAt(0)}</span>
            <div><strong>{profile.name}</strong><small>{profile.email}</small></div>
          </div>

          <div className="v2-acc__tier">
            <div className="v2-acc__tierhead"><FiAward aria-hidden="true" /><div><small>Current tier</small><strong>{USER.tier}</strong></div></div>
            <div className="v2-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progress to next tier"><span style={{ width: `${pct}%` }} /></div>
            <p>{USER.points.toLocaleString("en-US")} points · {(USER.nextTierPoints - USER.points).toLocaleString("en-US")} to next tier</p>
          </div>

          <nav className="v2-acc__nav" aria-label="Account">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" aria-current={tab === key ? "page" : undefined} onClick={() => pick(key)}><Icon aria-hidden="true" />{label}</button>
            ))}
            <Link href={ROUTES.wishlist}><FiHeart aria-hidden="true" />Wishlist{wish?.length > 0 && <b>{wish.length}</b>}</Link>
            {confirmOut ? (
              <div className="v2-acc__confirm" role="alertdialog" aria-label="Confirm sign out">
                <span>Sign out of your account?</span>
                <div><button type="button" className="v2-confirm__yes" onClick={signOut}>Sign out</button><button type="button" className="v2-confirm__no" onClick={() => setConfirmOut(false)}>Stay</button></div>
              </div>
            ) : (
              <button type="button" className="v2-acc__out" onClick={() => setConfirmOut(true)}><FiLogOut aria-hidden="true" />Sign out</button>
            )}
          </nav>
        </aside>

        <section className="v2-acc__main v2-tabpanel" key={tab} aria-live="polite">
          {tab === "orders" && (
            <>
              <h2 className="v2-acc__h">Order history</h2>
              {ORDERS.length === 0 ? (
                <V2EmptyState icon={<FiBox />} title="No orders yet" text="When you place an order it will show up here.">
                  <Link href={ROUTES.shop} className="v2-pill v2-pill--solid">Start shopping</Link>
                </V2EmptyState>
              ) : (
                <ul className="v2-orders">
                  {ORDERS.map((o) => {
                    const ri = returnInfo(o);
                    const req = returns[o.id];
                    return (
                      <li key={o.id} className="v2-order">
                        <div>
                          <p className="v2-order__id">
                            {o.id}<span className="v2-status" data-s={o.status.toLowerCase()}>{o.status}</span>
                            {req && <span className="v2-status" data-s="return">{req.type === "exchange" ? c.statusExchange : c.statusReturn}</span>}
                          </p>
                          <p className="v2-order__meta">{o.date} · {o.items} {o.items === 1 ? "item" : "items"}</p>
                          {ri && !req && (
                            <p className="v2-order__note" data-open={ri.open || undefined}>
                              {ri.open ? (ri.left === 1 ? c.dayLeft : fill(c.daysLeft, { n: num(ri.left) })) : c.closed}
                            </p>
                          )}
                        </div>
                        <p className="v2-order__total">{o.total}</p>
                        <div className="v2-order__acts">
                          <Link href={ROUTES.shop} className="v2-pill v2-pill--outline v2-order__btn">Buy again</Link>
                          {ri?.open && !req && returnFor !== o.id && (
                            <button type="button" className="v2-pill v2-pill--solid v2-order__btn" onClick={() => openReturn(o.id)}><FiRefreshCw aria-hidden="true" /> {c.cta}</button>
                          )}
                          <Link href={`${ROUTES.support}?order=${encodeURIComponent(o.id)}`} className="v2-textbtn"><FiLifeBuoy aria-hidden="true" />&nbsp;{c.help}</Link>
                        </div>

                        {returnFor === o.id && (
                          <form className="v2-order__panel" onSubmit={submitReturn} noValidate aria-label={fill(c.formTitle, { id: o.id })}>
                            <h3>{fill(c.formTitle, { id: o.id })}</h3>
                            <p className="v2-order__policy">{c.policy}</p>
                            {rErr && <p className="v2-auth__alert" role="alert">{rErr}</p>}
                            <fieldset className="v2-order__types">
                              <legend>{c.type}</legend>
                              {[["return", c.typeReturn], ["exchange", c.typeExchange]].map(([val, label]) => (
                                <label key={val}><input type="radio" name={`rt-${o.id}`} checked={rDraft.type === val} onChange={() => setRDraft((d) => ({ ...d, type: val }))} /> {label}</label>
                              ))}
                            </fieldset>
                            <div className="v2-field">
                              <label htmlFor={`rr-${o.id}`}>{c.reason}</label>
                              <select id={`rr-${o.id}`} value={rDraft.reason} onChange={(e) => { setRDraft((d) => ({ ...d, reason: e.target.value })); setRErr(""); }} aria-invalid={!!rErr}>
                                <option value="">{c.choose}</option>
                                {c.reasons.map((r) => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                            <div className="v2-field">
                              <label htmlFor={`rn-${o.id}`}>{c.note}</label>
                              <textarea id={`rn-${o.id}`} rows={3} maxLength={400} value={rDraft.note} onChange={(e) => setRDraft((d) => ({ ...d, note: e.target.value }))} />
                            </div>
                            <div className="v2-acc__btns">
                              <button type="submit" className="v2-pill v2-pill--solid">{c.submit}</button>
                              <button type="button" className="v2-pill v2-pill--outline" onClick={() => { setReturnFor(null); setRErr(""); }}>{c.cancel}</button>
                            </div>
                          </form>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {tab === "addresses" && (
            <>
              <div className="v2-acc__headrow">
                <h2 className="v2-acc__h">Saved addresses</h2>
                {!adding && <button type="button" className="v2-pill v2-pill--solid" onClick={() => setAdding(true)}><FiPlus aria-hidden="true" /> Add address</button>}
              </div>

              {adding && (
                <form className="v2-card-form" onSubmit={addAddress} noValidate>
                  {draftErr && <p className="v2-auth__alert" role="alert">{draftErr}</p>}
                  <div className="v2-acc__grid2">
                    {[["type", "Label (Home, Office…)"], ["city", "City"], ["address", "Full address"], ["phone", "Phone"]].map(([k, label]) => (
                      <div className="v2-field" key={k}>
                        <label htmlFor={`ad-${k}`}>{label}</label>
                        <input id={`ad-${k}`} value={draft[k]} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <div className="v2-acc__btns"><button type="submit" className="v2-pill v2-pill--solid">Save address</button><button type="button" className="v2-pill v2-pill--outline" onClick={() => { setAdding(false); setDraftErr(""); }}>Cancel</button></div>
                </form>
              )}

              {addresses.length === 0 && !adding ? (
                <V2EmptyState icon={<FiMapPin />} title="No saved addresses" text="Add an address to check out faster next time." />
              ) : (
                <ul className="v2-addrs">
                  {addresses.map((a) => (
                    <li key={a.id} className="v2-addr" data-default={a.isDefault || undefined}>
                      <p className="v2-addr__t"><FiMapPin aria-hidden="true" />{a.type}{a.isDefault && <em>Default</em>}</p>
                      <p className="v2-addr__b">{a.address}<br />{a.city}{a.phone && <><br />{a.phone}</>}</p>
                      {delId === a.id ? (
                        <div className="v2-confirm v2-confirm--col" role="alertdialog" aria-label="Confirm delete">
                          <span>Delete this address?</span>
                          <div><button type="button" className="v2-confirm__yes" onClick={() => removeAddress(a.id)}>Delete</button><button type="button" className="v2-confirm__no" onClick={() => setDelId(null)}>Cancel</button></div>
                        </div>
                      ) : (
                        <div className="v2-addr__acts">
                          {!a.isDefault && <button type="button" className="v2-textbtn" onClick={() => makeDefault(a.id)}>Make default</button>}
                          <button type="button" className="v2-textbtn v2-textbtn--del" onClick={() => setDelId(a.id)}>Delete</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tab === "profile" && (
            <>
              <h2 className="v2-acc__h">Profile details</h2>
              <form className="v2-card-form" onSubmit={saveProfile}>
                <div className="v2-acc__grid2">
                  {[["name", "Full name", "text"], ["email", "Email address", "email"], ["phone", "Phone", "tel"]].map(([k, label, type]) => (
                    <div className="v2-field" key={k}>
                      <label htmlFor={`pf-${k}`}>{label}</label>
                      <input id={`pf-${k}`} type={type} value={profile[k]} onChange={(e) => setProfile((p) => ({ ...p, [k]: e.target.value }))} required />
                    </div>
                  ))}
                </div>
                <div className="v2-acc__btns"><button type="submit" className="v2-pill v2-pill--solid">Save changes</button></div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
