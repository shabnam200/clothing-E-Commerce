import { cache } from "react";
import { api } from "@/services";

// Server-side catalogue access for pages. Every product screen reads through here, so mock vs real API is decided in one place (services/).
// cache() = one fetch per request, shared by generateMetadata, the page and the layout.
export const getCatalog = cache(async (lang = "bn") => {
  try { return await api.catalog.listAll({}, { lang }); }
  catch { return []; } // API down: render an empty shop instead of crashing the whole site
});

export const getProduct = cache(async (id, lang = "bn") => {
  try { return await api.catalog.get(id, { lang }); }
  catch { return null; }
});

export const getRelated = cache(async (id, lang = "bn", limit = 4) => {
  try { return await api.catalog.related(id, { lang, limit }); }
  catch { return []; }
});
