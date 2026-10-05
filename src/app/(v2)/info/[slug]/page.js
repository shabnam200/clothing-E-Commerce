import Link from "next/link";
import { notFound } from "next/navigation";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";

// One small page template for the footer links (contact, shipping, returns, size guide, FAQ, story, privacy, terms).
// Copy lives in messages/v2 -> info.pages; replace with CMS / API content later.
export async function generateMetadata({ params }) {
  const { v2 } = await getV2Locale();
  const page = v2.info.pages[(await params).slug];
  return page ? { title: { absolute: `${page.title} — AVENOR` } } : {};
}

export default async function InfoPage({ params }) {
  const { v2 } = await getV2Locale();
  const page = Object.hasOwn(v2.info.pages, (await params).slug) ? v2.info.pages[(await params).slug] : null;
  if (!page) notFound();
  return (
    <div className="v2-wrap v2-page v2-page--narrow v2-info">
      <h1 className="v2-display v2-h2">{page.title}</h1>
      {page.body.map((para) => <p key={para} className="v2-info__p">{para}</p>)}
      <Link href={ROUTES.home} className="v2-pill v2-pill--outline">{v2.info.back}</Link>
    </div>
  );
}
