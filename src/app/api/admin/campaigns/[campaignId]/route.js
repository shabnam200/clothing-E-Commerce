import { proxyAdminRequest } from "../../_lib/backend";

export const dynamic = "force-dynamic";
async function campaignPath(context) {
  const { campaignId } = await context.params;
  return /^\d+$/.test(String(campaignId)) ? `/storefront/campaigns/${campaignId}` : null;
}
export async function PUT(request, context) {
  const path = await campaignPath(context);
  if (!path) return Response.json({ message: "Campaign not found." }, { status: 404 });
  const body = await request.formData().catch(() => null);
  if (!body) return Response.json({ message: "Invalid campaign payload." }, { status: 422 });
  // Send multipart as POST so PHP parses the uploaded image; Laravel honors _method=PUT.
  body.set("_method", "PUT");
  return proxyAdminRequest(request, path, { method: "POST", body });
}
export async function DELETE(request, context) {
  const path = await campaignPath(context);
  if (!path) return Response.json({ message: "Campaign not found." }, { status: 404 });
  return proxyAdminRequest(request, path, { method: "DELETE" });
}
