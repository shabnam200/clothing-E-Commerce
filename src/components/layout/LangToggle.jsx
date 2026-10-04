import { setLanguage } from "@/app/actions";

// Server Component form → server action sets the "lang" cookie. No client JS.
export default function LangToggle({ lang, t }) {
  return (
    <form action={setLanguage}>
      <input type="hidden" name="lang" value={lang === "bn" ? "en" : "bn"} />
      <button type="submit" aria-label={t.ui.langAria} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold transition hover:border-accent hover:text-accent">
        {t.ui.lang}
      </button>
    </form>
  );
}
