import { setLanguage } from "@/app/actions";

// Same server action as V1 (sets the "lang" cookie). No client JS.
export default function V2LangToggle({ lang, label, ariaLabel }) {
  return (
    <form action={setLanguage}>
      <input type="hidden" name="lang" value={lang === "bn" ? "en" : "bn"} />
      <button type="submit" className="v2-lang" aria-label={ariaLabel}>{label}</button>
    </form>
  );
}
