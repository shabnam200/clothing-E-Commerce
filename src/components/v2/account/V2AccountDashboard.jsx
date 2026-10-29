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
const firstError = (e, fb = "Something went wrong. Please try again.") => (e?.errors ? Object.values(e.errors)[0]?.[0] || e.message : e?.message) || fb;

const TABS = [
  { key: "orders", icon: FiBox },
  { key: "addresses", icon: FiMapPin },
  { key: "profile", icon: FiUser },
  { key: "referral", icon: FiGift },
];

export default function V2AccountDashboard({ copy: c, referral: rc, account: L, track: tr }) {
  const router = useRouter();
  const { hydrated, isLoggedIn, user, logout, updateUser, setAuthModalOpen, showToast, num, fill, fmt, lang, settings } = useV2Store();
  const returnDays = settings.returnWindowDays ?? RETURN_WINDOW_DAYS;
  const features = settings?.featureToggles || {};
  const [tab, setTab] = useState("orders");
  const [confirmOut, setConfirmOut] = useState(false);
  const [orders, setOrders] = useState({ status: "loading", items: [], message: "" });
  const [addresses, setAddresses] = useState([]);
  const [adding, setAdding] = useState(false);
  const [delId, setDelId] = useState(null);
  const EMPTY_ADDR = { name: "", type: "", address: "", city: "", phone: "" };
  const [draft, setDraft] = useState(EMPTY_ADDR);
  const [draftErr, setDraftErr] = useState("");
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [returnFor, setReturnFor] = useState(null);      // order currently showing the return form
  const [rDraft, setRDraft] = useState({ type: "return", reason: "", note: "" });
  const [rErr, setRErr] = useState("");

  useEffect(() => {
    const h = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.key === h && (t.key !== "referral" || features.refer_and_earn !== false))) setTab(h);
  }, [features.refer_and_earn]);

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
        <V2EmptyState icon={<FiUser />} title={L.signInTitle} text={L.signInText}>
          <button type="button" className="v2-pill v2-pill--solid" onClick={() => setAuthModalOpen(true)}>{L.signIn}</button>
          <Link href={ROUTES.register} className="v2-pill v2-pill--outline">{L.create}</Link>
        </V2EmptyState>
      </div>
    );
  }

  const signOut = async () => { await logout(); showToast?.(L.signedOut, "info"); router.push(ROUTES.home); };

  const addAddress = async (e) => {
    e.preventDefault();
    // The server needs the receiver's name and phone as well, so all five fields are checked here with a clear message.
    const d = draft;
    if (d.name.trim().length < 2) { setDraftErr(L.errName); return; }
    if (d.phone.trim().length < 6) { setDraftErr(L.errPhone); return; }
    if (d.type.trim().length < 2) { setDraftErr(L.errLabel); return; }
    if (d.city.trim().length < 2) { setDraftErr(L.errCity); return; }
    if (d.address.trim().length < 6) { setDraftErr(L.errAddress); return; }
    try {
      setAddresses(await api.user.addresses.add({ ...draft, name: draft.name.trim(), type: draft.type.trim(), address: draft.address.trim(), city: draft.city.trim(), phone: draft.phone.trim() }));
      setDraft(EMPTY_ADDR); setDraftErr(""); setAdding(false);
      showToast?.(L.added, "success");
    } catch (ex) { setDraftErr(firstError(ex, L.error)); }
  };
  const removeAddress = async (id) => {
    try { setAddresses(await api.user.addresses.remove(id)); showToast?.(L.removed, "info"); }
    catch (ex) { showToast?.(firstError(ex, L.error), "error"); }
    setDelId(null);
  };
  const makeDefault = async (id) => {
    try { setAddresses(await api.user.addresses.setDefault(id)); }
    catch (ex) { showToast?.(firstError(ex, L.error), "error"); }
  };
  const saveProfile = async (e) => {
    e.preventDefault();
    try { updateUser(await api.user.updateProfile(profile)); showToast?.(L.profileSaved, "success"); }
    catch (ex) { showToast?.(firstError(ex, L.error), "error"); }
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
    } catch (ex) { setRErr(firstError(ex, L.error)); }
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
            <div className="v2-acc__tierhead"><FiAward aria-hidden="true" /><div><small>{L.tier}</small><strong>{L.tiers[user?.tier] || user?.tier}</strong></div></div>
            <div className="v2-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={L.tierProgress}><span style={{ width: `${pct}%` }} /></div>
            <p>{fill(L.points, { p: num(points), n: num(Math.max(0, nextTier - points)) })}</p>
          </div>

          <nav className="v2-acc__nav" aria-label={L.nav}>
            {TABS.filter(({ key }) => key !== "referral" || features.refer_and_earn !== false).map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" aria-current={tab === key ? "page" : undefined} onClick={() => pick(key)}><Icon aria-hidden="true" />{key === "referral" && rc?.tab ? rc.tab : L.tabs[key] || key}</button>
            ))}
            {confirmOut ? (
              <div className="v2-acc__confirm" role="alertdialog" aria-label={L.signOutLabel}>
                <span>{L.signOutQ}</span>
                <div><button type="button" className="v2-confirm__yes" onClick={signOut}>{L.signOut}</button><button type="button" className="v2-confirm__no" onClick={() => setConfirmOut(false)}>{L.stay}</button></div>
              </div>
            ) : (
              <button type="button" className="v2-acc__out" onClick={() => setConfirmOut(true)}><FiLogOut aria-hidden="true" />{L.signOut}</button>
            )}
          </nav>
        </aside>

        <section className="v2-acc__main v2-tabpanel" key={tab} aria-live="polite">
          {tab === "orders" && (
            <>
              <h2 className="v2-acc__h">{L.orderHistory}</h2>
              {orders.status === "loading" ? (
                <p className="v2-loading" role="status"><span className="v2-spinner" aria-hidden="true" /></p>
              ) : orders.status === "error" ? (
                <V2EmptyState icon={<FiBox />} title={L.loadErr} text={orders.message}>
                  <button type="button" className="v2-pill v2-pill--solid" onClick={loadOrders}>{L.retry}</button>
                </V2EmptyState>
              ) : orders.items.length === 0 ? (
                <V2EmptyState icon={<FiBox />} title={L.noOrders} text={L.noOrdersText}>
                  <Link href={ROUTES.shop} className="v2-pill v2-pill--solid">{L.startShopping}</Link>
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
                            #{o.number}<span className="v2-status" data-s={o.status}>{tr?.statuses?.[o.status] || statusLabel(o.status)}</span>
                            {req && <span className="v2-status" data-s="return">{req.type === "exchange" ? c.statusExchange : c.statusReturn}</span>}
                          </p>
                          <p className="v2-order__meta">{fmtDate(o.date)} · {o.itemsCount === 1 ? L.itemOne : fill(L.items, { n: num(o.itemsCount) })}</p>
                          {ri && !req && (
                            <p className="v2-order__note" data-open={ri.open || undefined}>
                              {ri.open ? (ri.left === 1 ? c.dayLeft : fill(c.daysLeft, { n: num(ri.left) })) : c.closed}
                            </p>
                          )}
                        </div>
                        <p className="v2-order__total">{fmt(o.total)}</p>
                        <div className="v2-order__acts">
                          {features.track_order !== false && <Link href={ROUTES.order(o.id)} className="v2-pill v2-pill--solid v2-order__btn"><FiTruck aria-hidden="true" /> {c.track}</Link>}
                          {features.order_details !== false && <Link href={ROUTES.orderDetails(o.id)} className="v2-pill v2-pill--outline v2-order__btn">{c.details}</Link>}
                          {canCancel(o) && <Link href={ROUTES.orderCancel(o.id)} className="v2-pill v2-pill--outline v2-order__btn"><FiXCircle aria-hidden="true" /> {c.cancelOrder}</Link>}
                          {features.buy_again !== false && <Link href={ROUTES.shop} className="v2-pill v2-pill--outline v2-order__btn">{L.buyAgain}</Link>}
                          {ri?.open && !req && returnFor !== o.id && (
                            <button type="button" className="v2-pill v2-pill--outline v2-order__btn" onClick={() => openReturn(o.id)}><FiRefreshCw aria-hidden="true" /> {c.cta}</button>
                          )}
                          {features.invoice !== false && <Link href={ROUTES.orderInvoice(o.id)} className="v2-textbtn"><FiFileText aria-hidden="true" />&nbsp;{c.invoice}</Link>}
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
                <h2 className="v2-acc__h">{L.saved}</h2>
                {!adding && <button type="button" className="v2-pill v2-pill--solid" onClick={() => { setDraft((d) => ({ ...d, name: d.name || profile.name || "", phone: d.phone || profile.phone || "" })); setAdding(true); }}><FiPlus aria-hidden="true" /> {L.add}</button>}
              </div>

              {adding && (
                <form className="v2-card-form" onSubmit={addAddress} noValidate>
                  {draftErr && <p className="v2-auth__alert" role="alert">{draftErr}</p>}
                  <div className="v2-acc__grid2">
                    {[["name", L.recipient, L.recipientPh, "name"], ["phone", L.phone, "01XXXXXXXXX", "tel"], ["type", L.label, L.labelPh, "off"], ["city", L.city, L.cityPh, "address-level2"], ["address", L.full, L.fullPh, "street-address"]].map(([k, label, ph, ac]) => (
                      <div className={`v2-field${k === "address" ? " v2-acc__span2" : ""}`} key={k}>
                        <label htmlFor={`ad-${k}`}>{label}</label>
                        <input id={`ad-${k}`} value={draft[k]} placeholder={ph} autoComplete={ac} inputMode={k === "phone" ? "tel" : undefined} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <div className="v2-acc__btns"><button type="submit" className="v2-pill v2-pill--solid">{L.saveAddress}</button><button type="button" className="v2-pill v2-pill--outline" onClick={() => { setAdding(false); setDraftErr(""); }}>{L.cancel}</button></div>
                </form>
              )}

              {addresses.length === 0 && !adding ? (
                <V2EmptyState icon={<FiMapPin />} title={L.noAddr} text={L.noAddrText} />
              ) : (
                <ul className="v2-addrs">
                  {addresses.map((a) => (
                    <li key={a.id} className="v2-addr" data-default={a.isDefault || undefined}>
                      <p className="v2-addr__t"><FiMapPin aria-hidden="true" />{a.type}{a.isDefault && <em>{L.def}</em>}</p>
                      <p className="v2-addr__b">{a.address}<br />{a.city}{a.phone && <><br />{a.phone}</>}</p>
                      {delId === a.id ? (
                        <div className="v2-confirm v2-confirm--col" role="alertdialog" aria-label={L.delLabel}>
                          <span>{L.delQ}</span>
                          <div><button type="button" className="v2-confirm__yes" onClick={() => removeAddress(a.id)}>{L.del}</button><button type="button" className="v2-confirm__no" onClick={() => setDelId(null)}>{L.cancel}</button></div>
                        </div>
                      ) : (
                        <div className="v2-addr__acts">
                          {!a.isDefault && <button type="button" className="v2-textbtn" onClick={() => makeDefault(a.id)}>{L.makeDefault}</button>}
                          <button type="button" className="v2-textbtn v2-textbtn--del" onClick={() => setDelId(a.id)}>{L.del}</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tab === "referral" && features.refer_and_earn !== false && rc && <V2Referral copy={rc} />}

          {tab === "profile" && (
            <>
              <h2 className="v2-acc__h">{L.profileTitle}</h2>
              <section className="v2-acard" aria-labelledby="pf-title">
                <header className="v2-acard__head">
                  <span className="v2-acard__ico" aria-hidden="true"><FiUser /></span>
                  <div><h3 id="pf-title">{L.personal}</h3><p>{L.personalText}</p></div>
                </header>
                <form className="v2-profile-form" onSubmit={saveProfile}>
                  <div className="v2-acc__grid2">
                    {[["name", L.fullName, "text", "name"], ["email", L.email, "email", "email"], ["phone", L.phone, "tel", "tel"]].map(([k, label, type, ac]) => (
                      <div className="v2-field" key={k}>
                        <label htmlFor={`pf-${k}`}>{label}</label>
                        <input id={`pf-${k}`} type={type} autoComplete={ac} value={profile[k]} onChange={(e) => setProfile((p) => ({ ...p, [k]: e.target.value }))} required />
                      </div>
                    ))}
                  </div>
                  <div className="v2-acc__btns"><button type="submit" className="v2-pill v2-pill--solid">{L.saveChanges}</button></div>
                </form>
              </section>
              <V2PasswordChange lang={lang} />
              <V2SizePassport />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
