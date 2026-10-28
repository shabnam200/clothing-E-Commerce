import { proxyAdminRequest } from "../../_lib/backend";

export const dynamic = "force-dynamic";

const assetTypes = new Set(["site_logo", "favicon", "brand_logo"]);

export async function POST(request) {
  const body = await request.formData().catch(() => null);
  const type = body?.get("type");
  const asset = body?.get("asset");
  if (!body || !assetTypes.has(type) || !(asset instanceof File) || asset.size === 0 || asset.size > 5 * 1024 * 1024) {
    return Response.json({ message: "Choose a valid image under 5 MB." }, { status: 422 });
  }
  return proxyAdminRequest(request, "/storefront/settings/assets", { method: "POST", body });
}
