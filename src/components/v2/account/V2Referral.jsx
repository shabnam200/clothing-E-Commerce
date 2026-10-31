"use client";

import { useEffect, useRef, useState } from "react";
import { FiCheck, FiCopy, FiMessageCircle, FiShare2, FiUsers } from "react-icons/fi";
import V2EmptyState from "@/components/v2/ui/V2EmptyState";
import { REFERRAL_REWARD } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { applyCode, ensureCode, inviteLink, referralPoints, useReferral } from "@/lib/v2/referral";

// Account > Refer & earn. Code, invites and rewards come from the API (lib/v2/referral.js -> api.referrals.me).
export default function V2Referral({ copy: c }) {
  const { fmt, num, fill, showToast, settings } = useV2Store();
  const reward = settings?.referralReward ?? REFERRAL_REWARD;
  const ref = useReferral();
  const [origin, setOrigin] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyError, setApplyError] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    ensureCode();
    setOrigin(window.location.origin);
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    return () => clearTimeout(timer.current);
  }, []);

  const amount = fmt(reward);
  const link = ref.code && origin ? inviteLink(ref.code, origin) : "";
  const shareText = link ? fill(c.shareText, { amount, link }) : "";
  const pts = referralPoints(ref, settings?.pointsPerTaka ?? 1);
  const mine = ref.ledger.find((l) => l.kind === "invited");

  const submitReferral = async (event) => {
    event.preventDefault();
    if (applying) return;
    setApplying(true); setApplyMessage(""); setApplyError(false);
    const result = await applyCode(codeInput);
    if (result.ok) { setCodeInput(""); setApplyMessage(c.applySuccess); }
    else {
      const message = result.reason === "own" ? c.applyOwn : result.reason === "used" ? c.applyUsed : result.reason === "unknown" ? c.applyUnknown : c.applyInvalid;
      setApplyMessage(message); setApplyError(true);
    }
    setApplying(false);
  };
  const copyText = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 1800);
    } catch { showToast?.(c.copyFail, "error"); }
  };
  const share = async () => {
    try { await navigator.share({ title: c.shareTitle, text: shareText }); } catch { /* dismissed by the person */ }
  };
  // Called as a function (not used as <Component/>) so the button keeps focus when `copied` changes.
  const copyBtn = (text, k, label) => (
    <button type="button" className="v2-pill v2-pill--light" onClick={() => copyText(text, k)} disabled={!text}>
      {copied === k ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}{copied === k ? c.copied : label}
    </button>
  );

  return (
    <div className="v2-ref">
      <h2 className="v2-acc__h">{c.tab}</h2>

      <section className="v2-ref__hero" aria-labelledby="v2-ref-h">
        <div>
          <h3 id="v2-ref-h">{fill(c.title, { amount })}</h3>
          <p>{fill(c.lead, { amount })}</p>
        </div>
        <div className="v2-ref__box">
          <small>{c.codeLabel}</small>
          <div className="v2-ref__row">
            <output className="v2-ref__code" aria-live="polite">{ref.code ?? (ref.loaded ? "Unavailable" : "Loading…")}</output>
            {copyBtn(ref.code, "code", c.copy)}
          </div>
        </div>
        <div className="v2-ref__box">
          <small>{c.linkLabel}</small>
          <div className="v2-ref__row">
            <span className="v2-ref__link" dir="ltr">{link || "…"}</span>
            {copyBtn(link, "link", c.copyLink)}
          </div>
        </div>
        <div className="v2-ref__row">
          <a className="v2-pill v2-pill--ghost" aria-disabled={!link} href={link ? `https://wa.me/?text=${encodeURIComponent(shareText)}` : undefined} target="_blank" rel="noopener noreferrer"><FiMessageCircle aria-hidden="true" />{c.whatsapp}</a>
          {canShare && <button type="button" className="v2-pill v2-pill--ghost" onClick={share} disabled={!link}><FiShare2 aria-hidden="true" />{c.share}</button>}
        </div>
      </section>

      {ref.error && <p className="v2-field-error" role="alert">Referral data could not be loaded. {ref.error}</p>}

      {ref.referredBy && (
        <p className="v2-ref__mine" role="status">
          <b>{fill(c.joinedWith, { code: ref.referredBy })}</b>{" "}
          {mine?.status === "credited" ? fill(c.rewardCredited, { amount }) : fill(c.rewardPending, { amount })}
        </p>
      )}

      {!ref.referredBy && (
        <form className="v2-ref__apply" onSubmit={submitReferral}>
          <label htmlFor="v2-ref-apply-code">{c.applyPrompt}</label>
          <div className="v2-ref__row">
            <input id="v2-ref-apply-code" value={codeInput} onChange={(event) => setCodeInput(event.target.value.toUpperCase())} autoComplete="off" autoCapitalize="characters" maxLength={16} placeholder={c.applyPlaceholder} aria-invalid={applyError} />
            <button className="v2-pill v2-pill--solid" type="submit" disabled={applying || !codeInput.trim()}>{applying ? c.applying : c.applyButton}</button>
          </div>
          {applyMessage && <p className={applyError ? "v2-field-error" : "v2-field-hint"} role={applyError ? "alert" : "status"}>{applyMessage}</p>}
        </form>
      )}
      <section aria-labelledby="v2-ref-how">
        <h3 className="v2-ref__h" id="v2-ref-how">{c.howTitle}</h3>
        <ol className="v2-ref__steps">{c.steps.map((s) => <li key={s}>{fill(s, { amount })}</li>)}</ol>
      </section>

      <dl className="v2-ref__stats">
        <div><dt>{c.statJoined}</dt><dd>{num(ref.invites.length)}</dd></div>
        <div><dt>{c.statPending}</dt><dd>{fill(c.pts, { n: num(pts.pending) })}</dd></div>
        <div><dt>{c.statEarned}</dt><dd>{fill(c.pts, { n: num(pts.credited) })}</dd></div>
      </dl>

      <section aria-labelledby="v2-ref-list">
        <h3 className="v2-ref__h" id="v2-ref-list">{c.listTitle}</h3>
        {ref.invites.length === 0 ? (
          <V2EmptyState icon={<FiUsers />} title={c.emptyTitle} text={c.emptyText} />
        ) : (
          <ul className="v2-ref__list">
            {ref.invites.map((i) => (
              <li key={i.id}>
                <span>{i.name}</span>
                <span className="v2-status" data-s={i.status === "pending" ? "delivered" : undefined}>{i.status === "pending" ? c.statusPending : c.statusCredited}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="v2-ref__terms">{c.terms}</p>
    </div>
  );
}
