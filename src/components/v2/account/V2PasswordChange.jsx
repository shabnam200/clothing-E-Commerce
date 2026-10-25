"use client";

import { useState } from "react";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { api } from "@/services";

const COPY = {
  en: {
    title: "Change password", current: "Current password", next: "New password", confirm: "Confirm new password",
    save: "Update password", mismatch: "The new passwords do not match.", short: "Use at least 6 characters.",
    success: "Password changed successfully.",
  },
  bn: {
    title: "পাসওয়ার্ড পরিবর্তন", current: "বর্তমান পাসওয়ার্ড", next: "নতুন পাসওয়ার্ড", confirm: "নতুন পাসওয়ার্ড নিশ্চিত করুন",
    save: "পাসওয়ার্ড আপডেট করুন", mismatch: "নতুন পাসওয়ার্ড দুটি মেলেনি।", short: "কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন।",
    success: "পাসওয়ার্ড পরিবর্তন হয়েছে।",
  },
};

const errorText = (error) => (error?.errors ? Object.values(error.errors)[0]?.[0] || error.message : error?.message)
  || "Something went wrong. Please try again.";

export default function V2PasswordChange({ lang = "en" }) {
  const { showToast } = useV2Store();
  const t = COPY[lang] || COPY.en;
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const change = (key) => (event) => {
    setValues((value) => ({ ...value, [key]: event.target.value }));
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (values.next.length < 6) return setError(t.short);
    if (values.next !== values.confirm) return setError(t.mismatch);

    setSaving(true);
    try {
      await api.auth.changePassword({ current: values.current, next: values.next });
      setValues({ current: "", next: "", confirm: "" });
      showToast?.(t.success, "success");
    } catch (exception) {
      setError(errorText(exception));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="v2-password-change">
      <h3 id="password-title" className="v2-acc__h">{t.title}</h3>
      <form className="v2-password-form" onSubmit={submit}>
        <div className="v2-acc__grid2">
          {[["current", t.current, "current-password"], ["next", t.next, "new-password"], ["confirm", t.confirm, "new-password"]].map(([key, label, autoComplete]) => (
            <div className="v2-field" key={key}>
              <label htmlFor={`pw-${key}`}>{label}</label>
              <input id={`pw-${key}`} type="password" autoComplete={autoComplete} value={values[key]} onChange={change(key)} required minLength={key === "current" ? undefined : 6} />
            </div>
          ))}
        </div>
        {error && <p className="v2-field-error" role="alert">{error}</p>}
        <div className="v2-acc__btns">
          <button type="submit" className="v2-pill v2-pill--solid" disabled={saving}>
            {saving ? (lang === "bn" ? "আপডেট হচ্ছে…" : "Updating…") : t.save}
          </button>
        </div>
      </form>
    </div>
  );
}
