import { notFound } from "next/navigation";
import { adminBackendGet, getAdminAccessToken } from "@/services/dokani/adminSession";
import { getV2Locale } from "@/lib/v2/i18n";
import AdminControlPanel from "@/components/v2/admin/AdminControlPanel";
export const dynamic = "force-dynamic";
export default async function WebsiteControlPage() {
  const token = await getAdminAccessToken();
  if (!token) notFound();
  // Settings are fetched here, in parallel with the language lookup, so the form opens with its data instead of showing "Loading...".
  const [{ lang }, initialSettings] = await Promise.all([getV2Locale(), adminBackendGet("/settings", token)]);
  return <AdminControlPanel lang={lang} displayMode="page" initialSettings={initialSettings} />;
}