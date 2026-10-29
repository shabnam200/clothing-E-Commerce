import test from "node:test";
import assert from "node:assert/strict";
import { normalizeBdPhone, isAdminIdentifier, adminLoginBody, isVerifiedAdmin, isSameOrigin, createLimiter } from "../adminAuthCore.js";

test("phone numbers are normalised the way customers type them", () => {
  assert.equal(normalizeBdPhone("01842-376477"), "01842376477");
  assert.equal(normalizeBdPhone("+8801842376477"), "01842376477");
  assert.equal(normalizeBdPhone("8801842376477"), "01842376477");
  assert.equal(normalizeBdPhone("12345"), "");
});
test("the normal login form is the admin's only when what was typed is exactly ADMIN_EMAIL or ADMIN_PHONE", () => {
  assert.equal(isAdminIdentifier(" Admin@Example.com ", "admin@example.com"), true);
  assert.equal(isAdminIdentifier("admin@example.com", "admin+1@example.com"), false);
  assert.equal(isAdminIdentifier("admin@example.com", "01842376477"), false); // no ADMIN_PHONE set: a phone is a customer
  assert.equal(isAdminIdentifier("admin@example.com", "+880 1842-376477", "01842376477"), true);
  assert.equal(isAdminIdentifier("admin@example.com", "01712345678", "01842376477"), false);
  assert.equal(isAdminIdentifier("", ""), false);
  assert.equal(isAdminIdentifier(undefined, "admin@example.com"), false);
  assert.equal(isAdminIdentifier("", "01842376477", ""), false); // nothing configured -> nobody is admin
});
test("staff login body: email as typed, phone as 01XXXXXXXXX, never for other people", () => {
  assert.deepEqual(adminLoginBody("admin@example.com", "ADMIN@example.com", "secret"), { login: "ADMIN@example.com", password: "secret" });
  assert.deepEqual(adminLoginBody("admin@example.com", "+8801842376477", "secret", "01842376477"), { login: "01842376477", password: "secret" });
  assert.equal(adminLoginBody("admin@example.com", "admin@example.com", ""), null);
  assert.equal(adminLoginBody("admin@example.com", "someone@example.com", "secret"), null);
});
test("admin session requires successful trusted backend authorization", () => {
  const allowed = { admin: { authorized: true, id: 1, shop_id: 9 } };
  assert.equal(isVerifiedAdmin(200, allowed), true);
  assert.equal(isVerifiedAdmin(403, allowed), false);
  assert.equal(isVerifiedAdmin(200, { admin: { authorized: true, id: 1 } }), false);
  assert.equal(isVerifiedAdmin(200, { admin: { authorized: false, id: 1, shop_id: 9 } }), false);
});
test("admin POST requires same-origin request", () => {
  assert.equal(isSameOrigin(new Request("https://shop.test/api/admin/logout", { headers: { origin: "https://shop.test" } })), true);
  assert.equal(isSameOrigin(new Request("https://shop.test/api/admin/logout", { headers: { origin: "https://evil.test" } })), false);
  assert.equal(isSameOrigin(new Request("https://shop.test/api/admin/logout")), false);
});
test("repeated wrong admin passwords are slowed down, then allowed again", () => {
  let t = 0; const l = createLimiter({ max: 3, windowMs: 1000, now: () => t });
  l.fail("ip"); l.fail("ip"); assert.equal(l.blocked("ip"), false); l.fail("ip"); assert.equal(l.blocked("ip"), true);
  assert.equal(l.blocked("other"), false); t = 1500; assert.equal(l.blocked("ip"), false); l.fail("ip"); l.reset("ip"); assert.equal(l.blocked("ip"), false);
});
