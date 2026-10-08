import V2AccountDashboard from "@/components/v2/account/V2AccountDashboard";
import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";

export const metadata = {
  title: "My Account | Avenor",
  description: "Manage your Avenor account, orders, and saved addresses.",
};

export default async function AccountPage() {
  const { v2 } = await getV2Locale();
  return (
    <>
      <V2PageBanner title="My Account" crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: "My Account" }]} />
      <V2AccountDashboard copy={v2.returns} referral={v2.referral} />
    </>
  );
}
