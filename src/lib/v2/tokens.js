import { fmtNum, fmtPrice } from "@/lib/v2/format";

// Copy in messages/v2 and in owner-edited info pages can use these placeholders. They are filled from the live storefront
// settings, so changing delivery_fee / free_delivery_over / express_fee / return_window_days updates every page and language.
//   {freeOver} -> ৳3,000    {deliveryFee} -> ৳100    {expressFee} -> ৳250    {returnDays} -> 7
export const settingTokens = (settings, lang) => ({
  freeOver: fmtPrice(Number(settings.freeDeliveryOver), lang),
  deliveryFee: fmtPrice(Number(settings.deliveryFee), lang),
  expressFee: fmtPrice(Number(settings.expressFee), lang),
  returnDays: fmtNum(Number(settings.returnWindowDays), lang),
});

// Deep copy of any messages / page object with the tokens filled. Unknown {placeholders} such as {n} or {id} are left alone.
export function fillTokens(node, tokens) {
  if (typeof node === "string") return node.replace(/\{(freeOver|deliveryFee|expressFee|returnDays)\}/g, (_, k) => tokens[k] ?? `{${k}}`);
  if (Array.isArray(node)) return node.map((x) => fillTokens(x, tokens));
  if (node && typeof node === "object") return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, fillTokens(v, tokens)]));
  return node;
}
