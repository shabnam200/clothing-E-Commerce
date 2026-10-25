"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiAward, FiBox, FiGift, FiFileText, FiLifeBuoy, FiLogOut, FiMapPin, FiPlus, FiRefreshCw, FiTruck, FiUser, FiXCircle } from "react-icons/fi";
import V2SizePassport from "@/components/v2/account/V2SizePassport";
import V2PasswordChange from "@/components/v2/account/V2PasswordChange";
import V2Referral from "@/components/v2/account/V2Referral";
import V2EmptyState from "@/components/v2/ui/V2EmptyState";
import { ROUTES, RETURN_WINDOW_DAYS } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { api } from "@/services";
import { canCancel } from "@/lib/v2/orders";

// Orders, addresses, profile and points come from the API (api.orders / api.user, see services/).
const statusLabel = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const firstError = (e) => (e?.errors ? Object.values(e.errors)[0]?.[0] || e.message : e?.message) || "Something went wrong. Please try again.";

const TABS = [
  { key: "orders", label: "Orders", icon: FiBox },
  { key: "addresses", label: "Addresses", icon: FiMapPin },
  { key: "profile", label: "Profile", icon: FiUser },
  { key: "referral", label: "Refer & earn", icon: FiGift },
];

export default function V2AccountDashboard({ copy: c, referral: rc }) {
  const router = useRouter();
  const { hydrated, isLoggedIn, user, logout, updateUser, setAuthModalOpen, showToast, num, fill, fmt, lang, settings } = useV2Store();
  const returnDays = settings.returnWindowDays ?? RETURN_WINDOW_DAYS;
  const [tab, setTab] = useState("orders");
  const [confirmOut, setConfirmOut] = useState(false);
  const [orders, setOrders] = useState({ status: "loading", items: [], message: "" });
  const [addresses, setAddresses] = useState([]);
  const [adding, setAdding] = useState(false);
  const [delId, setDelId] = useState(null);
  const [draft, setDraft] = useState({ type: "", address: "", city: "", phone: "" });
  const [draftErr, setDraftErr] = useState("");
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [returnFor, setReturnFor] = useState(null);      // order currently showing the return form
  const [rDraft, setRDraft] = useState({ type: "return", reason: "", note: "" });
  const [rErr, setRErr] = useState("");

  useEffect(() => {
    const h = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.key === h)) setTab(h);
  }, []);

  const loadOrders = useCallback(async () => {
    setOrders((s) => ({ ...s, status: "loading" }));
    try { setOrders({ status: "ready", items: await api.orders.list(), message: "" }); }
    catch (e) { setOrders({ status: "error", items: [], message: e.message }); }
  }, []);
  const loadAddresses = useCallback(async () => {
    try { setAddresses(await api.user.addresses.list()); } catch { /* the Addresses tab shows an empty list */ }
  }, []);

  // Load the account data once the session is known (and refresh the profile so points / tier are current).
  useEffect(() => {
    if (!hydrated || !isLoggedIn) return;
    loadOrders();
    loadAddresses();
    api.user.profile().then(updateUser).catch(() => {});
  }, [hydrated, isLoggedIn, loadOrders, loadAddresses, updateUser]);

  // Fill the profile form when the account is first known (not on every refresh, so typing is never overwritten).
  useEffect(() => { if (user) setProfile({ name: user.name, email: user.email, phone: user.phone || "" }); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (key) => { setTab(key); setConfirmOut(false); history.replaceState(null, "", `#${key}`); };
  const points = user?.points ?? 0;                  // the server's balance already includes credited referral rewards
  const nextTier = user?.nextTierPoints || 0;
  const pct = nextTier ? Math.min(100, Math.round((points / nextTier) * 100)) : 100;
  const fmtDate = (iso) => { const d = new Date(iso); return Number.isNaN(+d) ? "" : d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric" }); };

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

  const signOut = async () => { await logout(); showToast?.("You have been signed out", "info"); router.push(ROUTES.home); };

  const addAddress = async (e) => {
    e.preventDefault();
    if (draft.type.trim().length < 2 || draft.address.trim().length < 6 || draft.city.trim().length < 2) { setDraftErr("Please fill in the label, address and city."); return; }
    try {
      setAddresses(await api.user.addresses.add(draft));
      setDraft({ type: "", address: "", city: "", phone: "" }); setDraftErr(""); setAdding(false);
      showToast?.("Address added", "success");
    } catch (ex) { setDraftErr(firstError(ex)); }
  };
  const removeAddress = async (id) => {
    try { setAddresses(await api.user.addresses.remove(id)); showToast?.("Address removed", "info"); }
    catch (ex) { showToast?.(firstError(ex), "error"); }
    setDelId(null);
  };
  const makeDefault = async (id) => {
    try { setAddresses(await api.user.addresses.setDefault(id)); }
    catch (ex) { showToast?.(firstError(ex), "error"); }
  };
  const saveProfile = async (e) => {
    e.preventDefault();
    try { updateUser(await api.user.updateProfile(profile)); showToast?.("Profile saved", "success"); }
    catch (ex) { showToast?.(firstError(ex), "error"); }
  };

  // Return / exchange: allowed for delivered orders until the end of day `returnDays` after delivery (the server checks this too).
  const returnInfo = (o) => {
    if (o.status !== "delivered" || !o.deliveredOn) return null;
    const deadline = new Date(`${o.deliveredOn}T00:00:00`);
    deadline.setDate(deadline.getDate() + returnDays);
    deadline.setHours(23, 59, 59, 999);
    const ms = deadline - Date.now();
    return ms > 0 ? { open: true, left: Math.min(returnDays, Math.ceil(ms / 864e5)) } : { open: false, left: 0 };
  };
  const openReturn = (id) => { setReturnFor(id); setRDraft({ type: "return", reason: "", note: "" }); setRErr(""); };
  const submitReturn = async (e) => {
    e.preventDefault();
    if (!rDraft.reason) { setRErr(c.errReason); return; }
    try {
      const rr = await api.orders.requestReturn(returnFor, rDraft);
      setOrders((s) => ({ ...s, items: s.items.map((o) => (o.id === returnFor ? { ...o, returnRequest: rr } : o)) }));
      setReturnFor(null); setRErr("");
      showToast?.(c.ok, "success");
    } catch (ex) { setRErr(firstError(ex)); }
  };

  return (
    <div className="v2-wrap v2-page">
      <div className="v2-acc">
        <aside className="v2-acc__side">
          <div className="v2-acc__me">
            <span className="v2-acc__avatar" aria-hidden="true">{(user?.name || "").trim().charAt(0)}</span>
            <div><strong>{user?.name}</strong><small>{user?.email || user?.phone}</small></div>
          </div>

          <div className="v2-acc__tier">
            <div className="v2-acc__tierhead"><FiAward aria-hidden="true" /><div><small>Current tier</small><strong>{user?.tier}</strong></div></div>
            <div className="v2-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progress to next tier"><span style={{ width: `${pct}%` }} /></div>
            <p>{points.toLocaleString("en-US")} points · {Math.max(0, nextTier - points).toLocaleString("en-US")} to next tier</p>
          </div>

          <nav className="v2-acc__nav" aria-label="Account">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" aria-current={tab === key ? "page" : undefined} onClick={() => pick(key)}><Icon aria-hidden="true" />{key === "referral" && rc?.tab ? rc.tab : label}</button>
            ))}
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
              {orders.status === "loading" ? (
                <p className="v2-loading" role="status"><span className="v2-spinner" aria-hidden="true" /></p>
              ) : orders.status === "error" ? (
                <V2EmptyState icon={<FiBox />} title="We could not load your orders" text={orders.message}>
                  <button type="button" className="v2-pill v2-pill--solid" onClick={loadOrders}>Try again</button>
                </V2EmptyState>
              ) : orders.items.length === 0 ? (
                <V2EmptyState icon={<FiBox />} title="No orders yet" text="When you place an order it will show up here.">
                  <Link href={ROUTES.shop} className="v2-pill v2-pill--solid">Start shopping</Link>
                </V2EmptyState>
              ) : (
                <ul className="v2-orders">
                  {orders.items.map((o) => {
                    const ri = returnInfo(o);
                    const req = o.returnRequest;
                    return (
                      <li key={o.id} className="v2-order">
                        <div>
                          <p className="v2-order__id">
                            #{o.number}<span className="v2-status" data-s={o.status}>{statusLabel(o.status)}</span>
                            {req && <span className="v2-status" data-s="return">{req.type === "exchange" ? c.statusExchange : c.statusReturn}</span>}
                          </p>
                          <p className="v2-order__meta">{fmtDate(o.date)} · {o.itemsCount} {o.itemsCount === 1 ? "item" : "items"}</p>
                          {ri && !req && (
                            <p className="v2-order__note" data-open={ri.open || undefined}>
                              {ri.open ? (ri.left === 1 ? c.dayLeft : fill(c.daysLeft, { n: num(ri.left) })) : c.closed}
                            </p>
                          )}
                        </div>
                        <p className="v2-order__total">{fmt(o.total)}</p>
                        <div className="v2-order__acts">
                          <Link href={ROUTES.order(o.id)} className="v2-pill v2-pill--solid v2-order__btn"><FiTruck aria-hidden="true" /> {c.track}</Link>
                          <Link href={ROUTES.orderDetails(o.id)} className="v2-pill v2-pill--outline v2-order__btn">{c.details}</Link>
                          {canCancel(o) && <Link href={ROUTES.orderCancel(o.id)} className="v2-pill v2-pill--outline v2-order__btn"><FiXCircle aria-hidden="true" /> {c.cancelOrder}</Link>}
                          <Link href={ROUTES.shop} className="v2-pill v2-pill--outline v2-order__btn">Buy again</Link>
                          {ri?.open && !req && returnFor !== o.id && (
                            <button type="button" className="v2-pill v2-pill--outline v2-order__btn" onClick={() => openReturn(o.id)}><FiRefreshCw aria-hidden="true" /> {c.cta}</button>
                          )}
                          <Link href={ROUTES.orderInvoice(o.id)} className="v2-textbtn"><FiFileText aria-hidden="true" />&nbsp;{c.invoice}</Link>
                          <Link href={`${ROUTES.support}?order=${encodeURIComponent(`#${o.number}`)}`} className="v2-textbtn"><FiLifeBuoy aria-hidden="true" />&nbsp;{c.help}</Link>
                        </div>

                        {returnFor === o.id && (
                          <form className="v2-order__panel" onSubmit={submitReturn} noValidate aria-label={fill(c.formTitle, { id: `#${o.number}` })}>
                            <h3>{fill(c.formTitle, { id: `#${o.number}` })}</h3>
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

          {tab === "referral" && rc && <V2Referral copy={rc} />}

          {tab === "profile" && (
            <>
              <h2 className="v2-acc__h">Profile details</h2>
              <div className="v2-card-form">
                <form className="v2-profile-form" onSubmit={saveProfile}>
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
                <V2PasswordChange lang={lang} />
              </div>
              <V2SizePassport />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
