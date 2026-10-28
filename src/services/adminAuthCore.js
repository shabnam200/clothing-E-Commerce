/** Pure checks shared by the server routes and Node tests. Never accepts an email from a request. */
export function staffLoginBody(adminEmail, phone, password) {
  const configuredAdmin = typeof adminEmail === "string" ? adminEmail.trim() : "";
  const login = typeof phone === "string" ? phone.trim() : "";
  const digitCount = (login.match(/\d/g) || []).length;
  if (!configuredAdmin || !login || !/^[+()\d\s-]{7,24}$/.test(login) || digitCount < 7 || typeof password !== "string" || !password) return null;
  return { login, password };
}
export function isVerifiedAdmin(status, data) {
  return status === 200 && data?.admin?.authorized === true
    && Number.isSafeInteger(Number(data.admin.id)) && Number(data.admin.id) > 0
    && Number.isSafeInteger(Number(data.admin.shop_id)) && Number(data.admin.shop_id) > 0;
}
export function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  return !!origin && origin === new URL(request.url).origin;
}
