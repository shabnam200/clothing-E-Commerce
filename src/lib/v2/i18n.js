import { cookies } from "next/headers";
import bn from "@/messages/v2/bn";
import en from "@/messages/v2/en";

// V2 copy. Reads the same "lang" preference cookie the language switch writes (Bangla default).
export async function getV2Locale() {
  const lang = (await cookies()).get("lang")?.value === "en" ? "en" : "bn";
  return { lang, v2: lang === "en" ? en : bn };
}
