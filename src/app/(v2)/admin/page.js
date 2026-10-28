import { notFound } from "next/navigation";
import { getAdminSession } from "@/services/dokani/adminSession";
import { getV2Locale } from "@/lib/v2/i18n";
import AdminControlPanel from "@/components/v2/admin/AdminControlPanel";
export const dynamic = "force-dynamic";
export default async function WebsiteControlPage() {
  const admin = await getAdminSession();
  if (!admin) notFound();
  const { lang } = await getV2Locale();
  return <AdminControlPanel lang={lang} displayMode="page" />;
}
