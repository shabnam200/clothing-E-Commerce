"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiX, FiTrash2, FiEdit2, FiSave } from "react-icons/fi";

const emptyCampaign = () => ({ type: "banner", title_bn: "", title_en: "", content_bn: "", content_en: "", image_url: "", target_url: "/shop", starts_at: "", ends_at: "", order_deadline: "", status: "1", sort_order: "0" });
const copy = {
  bn: { title: "\u0993\u09af\u09bc\u09c7\u09ac\u09b8\u09be\u0987\u099f \u0995\u09a8\u09cd\u099f\u09cd\u09b0\u09cb\u09b2", close: "\u09ac\u09a8\u09cd\u09a7", settings: "\u09b8\u09be\u0987\u099f \u09b8\u09c7\u099f\u09bf\u0982\u09b8", campaigns: "\u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0 \u0993 \u0985\u09ab\u09be\u09b0", loading: "\u09b2\u09cb\u09a1 \u09b9\u099a\u09cd\u099b\u09c7...", save: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3", saved: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09bf\u09a4 \u09b9\u09af\u09bc\u09c7\u099b\u09c7", failed: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3 \u09b9\u09af\u09bc\u09a8\u09bf", delivery: "\u09a1\u09c7\u09b2\u09bf\u09ad\u09be\u09b0\u09bf", fee: "\u09a1\u09c7\u09b2\u09bf\u09ad\u09be\u09b0\u09bf \u099a\u09be\u09b0\u09cd\u099c", freeOver: "\u09ab\u09cd\u09b0\u09bf \u09a1\u09c7\u09b2\u09bf\u09ad\u09be\u09b0\u09bf \u09b8\u09c0\u09ae\u09be", express: "\u098f\u0995\u09cd\u09b8\u09aa\u09cd\u09b0\u09c7\u09b8 \u099a\u09be\u09b0\u09cd\u099c", returns: "\u09b0\u09bf\u099f\u09be\u09b0\u09cd\u09a8 \u09b8\u09ae\u09af\u09bc (\u09a6\u09bf\u09a8)", support: "\u09af\u09cb\u0997\u09be\u09af\u09cb\u0997", phone: "\u09ab\u09cb\u09a8", whatsapp: "WhatsApp", email: "\u0987\u09ae\u09c7\u0987\u09b2", address: "\u09a0\u09bf\u0995\u09be\u09a8\u09be", footer: "\u09ab\u09c1\u099f\u09be\u09b0 (JSON)", socials: "\u09b8\u09cb\u09b6\u09cd\u09af\u09be\u09b2 \u09b2\u09bf\u0982\u0995 (JSON)", newCampaign: "\u09a8\u09a4\u09c1\u09a8 \u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0 / \u0985\u09ab\u09be\u09b0", type: "\u09a7\u09b0\u09a8", banner: "\u09ac\u09cd\u09af\u09be\u09a8\u09be\u09b0", offer: "\u0985\u09ab\u09be\u09b0", titleBn: "\u09b6\u09bf\u09b0\u09cb\u09a8\u09be\u09ae (\u09ac\u09be\u0982\u09b2\u09be)", titleEn: "Title (English)", contentBn: "\u09ac\u09bf\u09ac\u09b0\u09a3 (\u09ac\u09be\u0982\u09b2\u09be)", contentEn: "Description (English)", image: "\u099b\u09ac\u09bf \u0986\u09aa\u09b2\u09cb\u09a1", imageUrl: "\u0985\u09a5\u09ac\u09be \u099b\u09ac\u09bf\u09b0 URL", target: "\u09b2\u09bf\u0982\u0995", active: "\u099a\u09be\u09b2\u09c1", order: "\u0995\u09cd\u09b0\u09ae", start: "\u09b6\u09c1\u09b0\u09c1", end: "\u09b6\u09c7\u09b7", deadline: "\u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u09a1\u09c7\u09a1\u09b2\u09be\u0987\u09a8", saveCampaign: "\u0995\u09cd\u09af\u09be\u09ae\u09cd\u09aa\u09c7\u0987\u09a8 \u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3", edit: "\u098f\u09a1\u09bf\u099f", remove: "\u09ae\u09c1\u099b\u09c1\u09a8", noCampaigns: "\u0995\u09cb\u09a8\u09cb \u0995\u09cd\u09af\u09be\u09ae\u09cd\u09aa\u09c7\u0987\u09a8 \u09a8\u09c7\u0987", cancel: "\u09ac\u09be\u09a4\u09bf\u09b2" },
  en: { title: "Website Control", close: "Close", settings: "Site settings", campaigns: "Banners & offers", loading: "Loading...", save: "Save changes", saved: "Changes saved.", failed: "Could not save changes.", delivery: "Delivery", fee: "Delivery fee", freeOver: "Free delivery from", express: "Express fee", returns: "Return window (days)", support: "Contact details", phone: "Phone", whatsapp: "WhatsApp", email: "Email", address: "Address", footer: "Footer content (JSON)", socials: "Social links (JSON)", newCampaign: "New banner / offer", type: "Type", banner: "Banner", offer: "Offer", titleBn: "Title (Bangla)", titleEn: "Title (English)", contentBn: "Description (Bangla)", contentEn: "Description (English)", image: "Upload image", imageUrl: "Or image URL", target: "Link", active: "Active", order: "Order", start: "Starts at", end: "Ends at", deadline: "Order deadline", saveCampaign: "Save campaign", edit: "Edit", remove: "Delete", noCampaigns: "No banners or offers yet.", cancel: "Cancel" },
};

Object.assign(copy.bn, {
  brandHeading: "\u09ac\u09cd\u09b0\u09cd\u09af\u09be\u09a8\u09cd\u09a1 \u0993 \u09ad\u09be\u09b7\u09be",
  websiteNameEn: "\u0993\u09af\u09bc\u09c7\u09ac\u09b8\u09be\u0987\u099f\u09c7\u09b0 \u09a8\u09be\u09ae (English, \u09ac\u09be\u09a7\u09cd\u09af\u09a4\u09be\u09ae\u09c2\u09b2\u0995)",
  websiteNameBn: "\u0993\u09af\u09bc\u09c7\u09ac\u09b8\u09be\u0987\u099f\u09c7\u09b0 \u09a8\u09be\u09ae (\u09ac\u09be\u0982\u09b2\u09be, \u0987\u099a\u09cd\u099b\u09be\u09a7\u09c0\u09a8)",
  languageMode: "\u0995\u09cb\u09a8 \u09ad\u09be\u09b7\u09be\u09af\u09bc \u09b8\u09be\u0987\u099f \u09a6\u09c7\u0996\u09be\u09ac\u09c7",
  englishOnly: "\u09b6\u09c1\u09a7\u09c1 English", banglaOnly: "\u09b6\u09c1\u09a7\u09c1 \u09ac\u09be\u0982\u09b2\u09be", bothLanguages: "English \u0993 \u09ac\u09be\u0982\u09b2\u09be",
  nameRequired: "English \u09a8\u09be\u09ae \u09a6\u09c7\u0993\u09af\u09bc\u09be \u09ac\u09be\u09a7\u09cd\u09af\u09a4\u09be\u09ae\u09c2\u09b2\u0995।",
  siteLogo: "\u09b9\u09c7\u09a1\u09be\u09b0 \u09b2\u0997\u09cb", favicon: "Favicon", brandLogo: "\u09ab\u09c1\u099f\u09be\u09b0\u09c7\u09b0 \u09ac\u09cd\u09b0\u09cd\u09af\u09be\u09a8\u09cd\u09a1 \u09b2\u0997\u09cb", chooseImage: "\u099b\u09ac\u09bf \u09ac\u09be\u099b\u09c1\u09a8 (PNG, JPG, WebP; 5 MB \u09aa\u09b0\u09cd\u09af\u09a8\u09cd\u09a4)", imageSaved: "\u09b2\u0997\u09cb \u0986\u09aa\u09b2\u09cb\u09a1 \u09b9\u09af\u09bc\u09c7\u099b\u09c7।",
});
Object.assign(copy.en, {
  brandHeading: "Brand & language", websiteNameEn: "Website name (English, required)", websiteNameBn: "Website name (Bangla, optional)",
  languageMode: "Languages available on the website", englishOnly: "English only", banglaOnly: "Bangla only", bothLanguages: "English and Bangla",
  nameRequired: "Enter the website name in English.", siteLogo: "Header logo", favicon: "Favicon", brandLogo: "Footer brand logo",
  chooseImage: "Choose image (PNG, JPG, WebP; up to 5 MB)", imageSaved: "Image uploaded.",
});

function dt(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function AdminControlPanel({ lang = "bn", displayMode = "drawer" }) {
  const t = copy[lang === "en" ? "en" : "bn"];
  const router = useRouter();
  const [tab, setTab] = useState("settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [settings, setSettings] = useState({});
  const [support, setSupport] = useState({});
  const [branding, setBranding] = useState({ brand_name_en: "AVENOR", brand_name_bn: "", language_mode: "both", site_logo_url: "", favicon_url: "", brand_logo_url: "" });
  const [brandFiles, setBrandFiles] = useState({});
  const [footerText, setFooterText] = useState("{}");
  const [socialText, setSocialText] = useState("[]");
  const [campaigns, setCampaigns] = useState([]);
  const [draft, setDraft] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  async function load() {
    setLoading(true);
    setNotice("");
    try {
      const [settingsResponse, campaignResponse] = await Promise.all([
        fetch("/api/admin/settings", { cache: "no-store" }),
        fetch("/api/admin/campaigns", { cache: "no-store" }),
      ]);
      if (!settingsResponse.ok || !campaignResponse.ok) throw new Error("load");
      const settingsData = await settingsResponse.json();
      const campaignData = await campaignResponse.json();
      const values = settingsData.settings || settingsData;
      setSettings(values);
      setSupport(values.support || {});
      setBranding({
        brand_name_en: values.brand_name_en || "AVENOR",
        brand_name_bn: values.brand_name_bn || "",
        language_mode: ["en", "bn", "both"].includes(values.language_mode) ? values.language_mode : "both",
        site_logo_url: values.site_logo_url || "",
        favicon_url: values.favicon_url || "",
        brand_logo_url: values.brand_logo_url || "",
      });
      setFooterText(JSON.stringify(values.footer_content || {}, null, 2));
      setSocialText(JSON.stringify(values.social_links || [], null, 2));
      setCampaigns(Array.isArray(campaignData.campaigns) ? campaignData.campaigns : []);
    } catch {
      setNotice(t.failed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* load once when the protected panel opens */ }, []);

  const setSetting = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const setSupportField = (key, value) => setSupport((current) => ({ ...current, [key]: value }));
  const input = (label, value, onChange, type = "text", required = false) => (
    <label className="v2-admin-control__field"><span>{label}</span><input type={type} value={value ?? ""} required={required} onChange={(event) => onChange(event.target.value)} /></label>
  );

  async function saveSettings(event) {
    event.preventDefault();
    if (!branding.brand_name_en.trim()) { setNotice(t.nameRequired); return; }
    setSaving(true); setNotice("");
    try {
      const footer_content = JSON.parse(footerText);
      const social_links = JSON.parse(socialText);
      if (!footer_content || typeof footer_content !== "object" || Array.isArray(footer_content) || !Array.isArray(social_links)) throw new Error("json");
      const payload = {
        delivery_fee: Number(settings.delivery_fee || 0),
        free_delivery_over: Number(settings.free_delivery_over || 0),
        express_fee: Number(settings.express_fee || 0),
        return_window_days: Number(settings.return_window_days || 0),
        brand_name_en: branding.brand_name_en.trim(),
        brand_name_bn: branding.brand_name_bn.trim() || null,
        language_mode: branding.language_mode,
        support,
        footer_content,
        social_links,
      };
      const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("save");
      const uploaded = {};
      for (const type of ["site_logo", "favicon", "brand_logo"]) {
        if (!brandFiles[type]) continue;
        const body = new FormData();
        body.set("type", type);
        body.set("asset", brandFiles[type]);
        const upload = await fetch("/api/admin/settings/assets", { method: "POST", body });
        if (!upload.ok) throw new Error("upload");
        uploaded[`${type}_url`] = (await upload.json()).url;
      }
      if (Object.keys(uploaded).length) {
        setBranding((current) => ({ ...current, ...uploaded }));
        setBrandFiles({});
      }
      setNotice(t.saved);
      router.refresh();
    } catch {
      setNotice(t.failed);
    } finally { setSaving(false); }
  }

  function editCampaign(campaign) {
    setDraft({ ...emptyCampaign(), ...campaign, starts_at: dt(campaign.starts_at), ends_at: dt(campaign.ends_at), order_deadline: dt(campaign.order_deadline) });
    setImageFile(null);
  }
  async function saveCampaign(event) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true); setNotice("");
    const body = new FormData();
    for (const [key, value] of Object.entries(draft)) {
      if (key !== "id" && value !== null && value !== undefined) body.set(key, String(value));
    }
    if (imageFile) body.set("image", imageFile);
    try {
      const response = await fetch(draft.id ? `/api/admin/campaigns/${draft.id}` : "/api/admin/campaigns", { method: draft.id ? "PUT" : "POST", body });
      if (!response.ok) throw new Error("campaign");
      setDraft(null); setImageFile(null); setNotice(t.saved); await load();
    } catch { setNotice(t.failed); }
    finally { setSaving(false); }
  }
  async function deleteCampaign(id) {
    if (!window.confirm(t.remove + "?")) return;
    setSaving(true); setNotice("");
    try {
      const response = await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("delete");
      setNotice(t.saved); await load();
    } catch { setNotice(t.failed); }
    finally { setSaving(false); }
  }

  return (
    <div className={`v2-admin-control${displayMode === "page" ? " v2-admin-control--page" : ""}`} role="presentation" onMouseDown={displayMode === "drawer" ? (event) => { if (event.target === event.currentTarget) router.push("/"); } : undefined}>
      <aside className="v2-admin-control__drawer" role={displayMode === "page" ? "region" : "dialog"} aria-modal={displayMode === "page" ? undefined : "true"} aria-labelledby="v2-admin-control-title">
        <header className="v2-admin-control__head"><div><p>AVENOR</p><h2 id="v2-admin-control-title">{t.title}</h2></div><button type="button" aria-label={t.close} onClick={() => router.push("/")}><FiX /></button></header>
        <nav className="v2-admin-control__tabs" aria-label={t.title}>
          <button type="button" aria-current={tab === "settings" ? "page" : undefined} onClick={() => setTab("settings")}>{t.settings}</button>
          <button type="button" aria-current={tab === "campaigns" ? "page" : undefined} onClick={() => setTab("campaigns")}>{t.campaigns}</button>
        </nav>
        {notice && <p className="v2-admin-control__notice" role="status">{notice}</p>}
        {loading ? <p className="v2-admin-control__loading">{t.loading}</p> : tab === "settings" ? (
          <form className="v2-admin-control__body" onSubmit={saveSettings}>
            <section><h3>{t.delivery}</h3><div className="v2-admin-control__grid">
              {input(t.fee, settings.delivery_fee, (value) => setSetting("delivery_fee", value), "number")}
              {input(t.freeOver, settings.free_delivery_over, (value) => setSetting("free_delivery_over", value), "number")}
              {input(t.express, settings.express_fee, (value) => setSetting("express_fee", value), "number")}
              {input(t.returns, settings.return_window_days, (value) => setSetting("return_window_days", value), "number")}
            </div></section>
            <section><h3>{t.support}</h3><div className="v2-admin-control__grid">
              {input(t.phone, support.phone, (value) => setSupportField("phone", value), "tel")}
              {input(t.whatsapp, support.whatsapp, (value) => setSupportField("whatsapp", value), "tel")}
              {input(t.email, support.email, (value) => setSupportField("email", value), "email")}
              {input(t.address, support.address, (value) => setSupportField("address", value))}
            </div></section>
            <section><h3>{t.brandHeading}</h3><div className="v2-admin-control__grid">
              {input(t.websiteNameEn, branding.brand_name_en, (value) => setBranding((current) => ({ ...current, brand_name_en: value })), "text", true)}
              {input(t.websiteNameBn, branding.brand_name_bn, (value) => setBranding((current) => ({ ...current, brand_name_bn: value })))}
              <label className="v2-admin-control__field"><span>{t.languageMode}</span><select value={branding.language_mode} onChange={(event) => setBranding((current) => ({ ...current, language_mode: event.target.value }))}>
                <option value="en">{t.englishOnly}</option><option value="bn">{t.banglaOnly}</option><option value="both">{t.bothLanguages}</option>
              </select></label>
            </div><div className="v2-admin-control__brand-assets">
              {[["site_logo", t.siteLogo, "image/png,image/jpeg,image/webp"], ["favicon", t.favicon, "image/png,image/jpeg,image/webp,image/x-icon,.ico"], ["brand_logo", t.brandLogo, "image/png,image/jpeg,image/webp"]].map(([type, label, accept]) => (
                <label className="v2-admin-control__field" key={type}><span>{label}</span>
                  {branding[`${type}_url`] && <img className="v2-admin-control__asset-preview" src={branding[`${type}_url`]} alt={label} />}
                  <input type="file" accept={accept} onChange={(event) => setBrandFiles((current) => ({ ...current, [type]: event.target.files?.[0] || null }))} />
                  <small>{brandFiles[type]?.name || t.chooseImage}</small>
                </label>
              ))}
            </div></section>
            <section><h3>{t.footer}</h3><textarea className="v2-admin-control__json" value={footerText} onChange={(event) => setFooterText(event.target.value)} spellCheck={false} /></section>
            <section><h3>{t.socials}</h3><textarea className="v2-admin-control__json" value={socialText} onChange={(event) => setSocialText(event.target.value)} spellCheck={false} /></section>
            <button className="v2-pill v2-pill--solid v2-admin-control__save" disabled={saving}><FiSave /> {saving ? t.loading : t.save}</button>
          </form>
        ) : (
          <div className="v2-admin-control__body">
            <button type="button" className="v2-pill v2-pill--outline" onClick={() => { setDraft(emptyCampaign()); setImageFile(null); }}><FiPlus /> {t.newCampaign}</button>
            {draft && <form className="v2-admin-control__campaign-form" onSubmit={saveCampaign}>
              <div className="v2-admin-control__campaign-heading"><h3>{draft.id ? t.edit : t.newCampaign}</h3><button type="button" aria-label={t.cancel} onClick={() => setDraft(null)}><FiX /></button></div>
              <label className="v2-admin-control__field"><span>{t.type}</span><select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}><option value="banner">{t.banner}</option><option value="offer">{t.offer}</option></select></label>
              {input(t.titleBn, draft.title_bn, (value) => setDraft({ ...draft, title_bn: value }))}
              {input(t.titleEn, draft.title_en, (value) => setDraft({ ...draft, title_en: value }))}
              <label className="v2-admin-control__field"><span>{t.contentBn}</span><textarea value={draft.content_bn || ""} onChange={(event) => setDraft({ ...draft, content_bn: event.target.value })} /></label>
              <label className="v2-admin-control__field"><span>{t.contentEn}</span><textarea value={draft.content_en || ""} onChange={(event) => setDraft({ ...draft, content_en: event.target.value })} /></label>
              {input(t.imageUrl, draft.image_url, (value) => setDraft({ ...draft, image_url: value }), "url")}
              <label className="v2-admin-control__field"><span>{t.image}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] || null)} /></label>
              {input(t.target, draft.target_url, (value) => setDraft({ ...draft, target_url: value }), "url")}
              {input(t.start, draft.starts_at, (value) => setDraft({ ...draft, starts_at: value }), "datetime-local")}
              {input(t.end, draft.ends_at, (value) => setDraft({ ...draft, ends_at: value }), "datetime-local")}
              {input(t.deadline, draft.order_deadline, (value) => setDraft({ ...draft, order_deadline: value }), "datetime-local")}
              {input(t.order, draft.sort_order, (value) => setDraft({ ...draft, sort_order: value }), "number")}
              <label className="v2-admin-control__check"><input type="checkbox" checked={String(draft.status) === "1" || draft.status === true} onChange={(event) => setDraft({ ...draft, status: event.target.checked ? "1" : "0" })} /> {t.active}</label>
              <button className="v2-pill v2-pill--solid v2-admin-control__save" disabled={saving}><FiSave /> {saving ? t.loading : t.saveCampaign}</button>
            </form>}
            {campaigns.length ? <ul className="v2-admin-control__campaign-list">{campaigns.map((campaign) => <li key={campaign.id}>
              <div><strong>{campaign.title_bn || campaign.title_en || campaign.type}</strong><small>{campaign.type} · {String(campaign.status) === "1" ? t.active : "Off"}</small></div>
              <button type="button" aria-label={`${t.edit}: ${campaign.title_bn || campaign.title_en || campaign.type}`} onClick={() => editCampaign(campaign)}><FiEdit2 /></button>
              <button type="button" aria-label={`${t.remove}: ${campaign.title_bn || campaign.title_en || campaign.type}`} disabled={saving} onClick={() => deleteCampaign(campaign.id)}><FiTrash2 /></button>
            </li>)}</ul> : <p className="v2-admin-control__empty">{t.noCampaigns}</p>}
          </div>
        )}
      </aside>
    </div>
  );
}
