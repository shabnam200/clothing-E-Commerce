import fs from "node:fs";
import path from "node:path";

const isRemote = (src) => /^https?:\/\//i.test(src);

// Remote URLs (Unsplash / CDN / API) pass straight through. Local paths are returned only if the file exists in /public,
// so V2 never renders a broken <img>. (Remote hosts must also be listed in next.config.mjs → images.remotePatterns.)
export function existingImage(src) {
  if (!src) return null;
  if (isRemote(src)) return src;
  try { return fs.existsSync(path.join(process.cwd(), "public", src)) ? src : null; } catch { return null; }
}
