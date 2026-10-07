import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import V2AuthForm from "@/components/v2/account/V2AuthForm";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";

export async function generateMetadata() {
  const { v2 } = await getV2Locale();
  return { title: { absolute: `${v2.auth.loginTitle} — AVENOR` } };
}

export default async function LoginPage() {
  const { v2 } = await getV2Locale();
  return (
    <>
    <V2PageBanner title={v2.auth.loginTitle} crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: v2.auth.loginTitle }]} />
    <div className="v2-wrap v2-page v2-page--narrow">
      <V2AuthForm mode="login" copy={v2.auth} />
    </div>
    </>
  );
}
