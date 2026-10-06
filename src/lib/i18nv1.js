import { cookies } from "next/headers";
import bn from "@/messages/bn";
import en from "@/messages/en";

// Bangla is the default; the "lang" cookie switches to English.
export async function getLocale() {
  const lang = (await cookies()).get("lang")?.value === "en" ? "en" : "bn";
  return { lang, t: lang === "en" ? en : bn };
}
