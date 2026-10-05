// Checks that every remote image URL used in the dummy data actually loads.
// Run:  npm run check:images      (needs internet; Node 18+)
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "src", "data");
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".js"));
const found = new Map(); // url -> [file, ...]
for (const f of files) {
  const text = fs.readFileSync(path.join(DIR, f), "utf8");
  for (const [u] of text.matchAll(/https?:\/\/[^\s"'`)]+/g)) {
    if (!found.has(u)) found.set(u, []);
    found.get(u).push(f);
  }
}

async function check(url) {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(20000) });
    const type = res.headers.get("content-type") || "";
    await res.body?.cancel();
    return { ok: res.ok && type.startsWith("image/"), status: res.status, type };
  } catch (e) {
    return { ok: false, status: "ERR", type: e.cause?.code || e.message };
  }
}

const urls = [...found.keys()];
console.log(`Checking ${urls.length} image URLs from src/data ...\n`);
let bad = 0;
const results = await Promise.all(urls.map(async (u) => [u, await check(u)]));
for (const [u, r] of results) {
  if (!r.ok) bad++;
  console.log(`${r.ok ? "OK  " : "FAIL"} ${String(r.status).padEnd(4)} ${found.get(u)[0].padEnd(14)} ${u.replace("https://images.unsplash.com/", "")}${r.ok ? "" : "  <- " + r.type}`);
}
console.log(`\n${urls.length - bad}/${urls.length} loaded.${bad ? ` ${bad} FAILED: replace those URLs in src/data.` : " All good."}`);
process.exit(bad ? 1 : 0);
