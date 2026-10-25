import { cache } from "react";
import { api } from "@/services";
import * as dokani from "@/services/dokani/catalog";
import { isEnabled as dokaniOn } from "@/services/dokani/config";

// Server-side catalogue access for pages. Every product screen reads through here, so mock vs real API is decided in one place (services/).
// cache() = one fetch per request, shared by generateMetadata, the page and the layout.
// Where products come from:  DOKANI_* set in .env.local -> straight from Dokani Cloud (services/dokani, server only)
//                            otherwise                    -> api.catalog (mock server, or the Laravel API when NEXT_PUBLIC_API_URL is set)
const source = () => (dokaniOn() ? dokani : api.catalog);
const fail = (what, e) => console.warn(`[catalog] ${what} failed:`, e?.message || e); // visible in the terminal running `next dev`

export const getCatalog = cache(async (lang = "bn") => {
  try { return await source().listAll({}, { lang }); }
  catch (e) { fail("listAll", e); return []; } // source down: render an empty shop instead of crashing the whole site
});

export const getCategories = cache(async (lang = "bn") => {
  try { return await source().categories({ lang }); }
  catch (e) { console.warn(`[catalog] categories unavailable; using storefront defaults: ${e?.message || e}`); return []; }
});

export const getProduct = cache(async (id, lang = "bn") => {
  try { return await source().get(id, { lang }); }
  catch (e) { fail("get", e); return null; }
});

export const getRelated = cache(async (id, lang = "bn", limit = 4) => {
  try { return await source().related(id, { lang, limit }); }
  catch (e) { fail("related", e); return []; }
});
