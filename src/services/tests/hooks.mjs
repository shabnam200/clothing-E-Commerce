// Test helper: lets plain Node run the services layer (resolves the "@/..." alias and extension-less imports).
import { pathToFileURL, fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
const ROOT = fileURLToPath(new URL("../../", import.meta.url)); // .../src/
const tryFiles = (base) => { for (const c of [base, base + ".js", base + ".jsx", base + "/index.js"]) { if (fs.existsSync(c) && fs.statSync(c).isFile()) return c; } return null; };
export async function resolve(spec, ctx, next) {
  if (spec.startsWith("@/")) { const f = tryFiles(path.join(ROOT, spec.slice(2))); if (f) return { url: pathToFileURL(f).href, shortCircuit: true, format: "module" }; }
  if ((spec.startsWith("./") || spec.startsWith("../")) && ctx.parentURL?.startsWith("file:")) {
    const f = tryFiles(path.resolve(path.dirname(fileURLToPath(ctx.parentURL)), spec)); if (f) return { url: pathToFileURL(f).href, shortCircuit: true, format: "module" };
  }
  return next(spec, ctx);
}
