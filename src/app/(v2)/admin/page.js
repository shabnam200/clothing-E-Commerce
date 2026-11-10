import { redirect } from "next/navigation";
import { adminBackendGet, arrivedFromOutside, getAdminAccessToken } from "@/services/dokani/adminSession";
import { getV2Locale } from "@/lib/v2/i18n";
import AdminControlPanel from "@/components/v2/admin/AdminControlPanel";
export const dynamic = "force-dynamic";
export default async function WebsiteControlPage() {
  if (await arrivedFromOutside()) redirect("/"); // came from another site (e.g. dokani.cloud): guest view, never the admin panel
  const token = await getAdminAccessToken();
  if (!token) redirect("/");
  // Settings are fetched here, in parallel with the language lookup, so the form opens with its data instead of showing "Loading...".
  const [{ lang }, initialSettings] = await Promise.all([getV2Locale(), adminBackendGet("/settings", token)]);
  return <AdminControlPanel lang={lang} displayMode="page" initialSettings={initialSettings} />;
}