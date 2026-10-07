import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import Link from "next/link";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";

export default async function V2NotFound() {
  const { v2 } = await getV2Locale();
  return (
    <>
    <V2PageBanner crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: "404" }]} />
    <div className="v2-wrap v2-page v2-page--narrow v2-center">
      <h1 className="v2-display v2-h2">{v2.product.notFoundTitle}</h1>
      <p className="v2-lede">{v2.product.notFoundText}</p>
      <p style={{ marginTop: 28 }}><Link href={ROUTES.shop} className="v2-pill v2-pill--solid">{v2.product.back}</Link></p>
    </div>
    </>
  );
}
