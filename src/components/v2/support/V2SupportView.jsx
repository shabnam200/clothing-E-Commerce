"use client";

import { useState } from "react";
import Link from "next/link";
import { FiPhone, FiMail, FiClock, FiCheckCircle, FiChevronRight } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { ROUTES, SUPPORT } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

// Customer support page: contact channels, quick links and a message form.
// Frontend-only for now: submitting shows a confirmation; wire it to the Laravel API later.
export default function V2SupportView({ copy, order = "" }) {
  const { showToast } = useV2Store();
  const f = copy.form;
  const [v, setV] = useState({ name: "", contact: "", order, topic: order ? 1 : 0, message: "" });
  const [errs, setErrs] = useState({});
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => setV((x) => ({ ...x, [k]: k === "topic" ? Number(e.target.value) : e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const c = v.contact.trim();
    const okContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) || c.replace(/[^\d]/g, "").length >= 8;
    const next = {};
    if (v.name.trim().length < 2) next.name = f.errors.name;
    if (!okContact) next.contact = f.errors.contact;
    if (v.message.trim().length < 10) next.message = f.errors.message;
    setErrs(next);
    if (Object.keys(next).length) return;
    setSent(true);
    showToast?.(f.ok, "success");
  };

  const reset = () => { setV({ name: "", contact: "", order: "", topic: 0, message: "" }); setErrs({}); setSent(false); };

  const channels = [
    [FiPhone, copy.channels.call, SUPPORT.phoneLabel, `tel:${SUPPORT.phone}`],
    [FaWhatsapp, copy.channels.whatsapp, SUPPORT.phoneLabel, `https://wa.me/${SUPPORT.whatsapp}`],
    [FiMail, copy.channels.email, SUPPORT.email, `mailto:${SUPPORT.email}`],
  ];
  const helpHrefs = [ROUTES.orders, ROUTES.info("returns"), ROUTES.info("shipping"), ROUTES.info("size")];

  return (
    <div className="v2-wrap v2-page v2-sup">
      <p className="v2-sup__lead">{copy.lead}</p>

      <ul className="v2-sup__cards">
        {channels.map(([Icon, label, value, href]) => (
          <li key={label}>
            <a className="v2-sup__card" href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              <span className="v2-sup__ico" aria-hidden="true"><Icon /></span>
              <span><strong>{label}</strong><small>{value}</small></span>
            </a>
          </li>
        ))}
      </ul>

      <div className="v2-sup__grid">
        <section className="v2-sup__form v2-card-form" aria-labelledby="sup-form-h">
          <h2 id="sup-form-h" className="v2-acc__h">{f.title}</h2>
          {sent ? (
            <div className="v2-sup__done" role="status">
              <FiCheckCircle aria-hidden="true" />
              <p>{f.ok}</p>
              <button type="button" className="v2-pill v2-pill--outline" onClick={reset}>{f.another}</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="v2-sup__fields">
              <div className="v2-acc__grid2">
                <div className="v2-field" data-invalid={errs.name ? "true" : undefined}>
                  <label htmlFor="sp-name">{f.name}</label>
                  <input id="sp-name" value={v.name} onChange={set("name")} autoComplete="name" aria-invalid={!!errs.name} />
                  {errs.name && <span className="v2-field-error" role="alert">{errs.name}</span>}
                </div>
                <div className="v2-field" data-invalid={errs.contact ? "true" : undefined}>
                  <label htmlFor="sp-contact">{f.contact}</label>
                  <input id="sp-contact" value={v.contact} onChange={set("contact")} autoComplete="email" aria-invalid={!!errs.contact} />
                  {errs.contact && <span className="v2-field-error" role="alert">{errs.contact}</span>}
                </div>
                <div className="v2-field">
                  <label htmlFor="sp-order">{f.order}</label>
                  <input id="sp-order" value={v.order} onChange={set("order")} placeholder="#AVN-0000" />
                </div>
                <div className="v2-field">
                  <label htmlFor="sp-topic">{f.topic}</label>
                  <select id="sp-topic" value={v.topic} onChange={set("topic")}>
                    {f.topics.map((t, i) => <option key={t} value={i}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="v2-field" data-invalid={errs.message ? "true" : undefined}>
                <label htmlFor="sp-msg">{f.message}</label>
                <textarea id="sp-msg" rows={5} value={v.message} onChange={set("message")} aria-invalid={!!errs.message} />
                {errs.message && <span className="v2-field-error" role="alert">{errs.message}</span>}
              </div>
              <div className="v2-acc__btns"><button type="submit" className="v2-pill v2-pill--solid">{f.send}</button></div>
              <p className="v2-sup__note">{f.demoNote}</p>
            </form>
          )}
        </section>

        <aside className="v2-sup__side">
          <div className="v2-sup__box">
            <h2><FiClock aria-hidden="true" /> {copy.hoursTitle}</h2>
            <p>{copy.hours}</p>
            <p className="v2-sup__note">{copy.reply}</p>
          </div>
          <div className="v2-sup__box">
            <h2>{copy.helpTitle}</h2>
            <ul className="v2-sup__links">
              {copy.help.map((label, i) => (
                <li key={label}><Link href={helpHrefs[i]}>{label}<FiChevronRight aria-hidden="true" /></Link></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
