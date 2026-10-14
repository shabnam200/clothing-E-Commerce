// Login / sign-up credential: a customer types ONE field that can be an email address or a Bangladeshi mobile number.
// parseIdentifier("01712-345678") -> { type: "phone", value: "01712345678" }
// parseIdentifier(" Me@Mail.com ") -> { type: "email", value: "me@mail.com" }
// parseIdentifier("abc")           -> { type: null, value: "abc" }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^01[3-9]\d{8}$/;
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

// Bengali digits -> 0-9, strip spaces / dashes / brackets, drop the +88 / 88 country code.
export function normalizePhone(v) {
  const ascii = String(v ?? "").replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  return ascii.replace(/[\s\-().]/g, "").replace(/^\+?88(?=01)/, "");
}

export function parseIdentifier(raw) {
  const text = String(raw ?? "").trim();
  if (EMAIL_RE.test(text)) return { type: "email", value: text.toLowerCase() };
  const phone = normalizePhone(text);
  if (PHONE_RE.test(phone)) return { type: "phone", value: phone };
  return { type: null, value: text };
}

// Body fields for the API: { email } or { phone } (the other one stays undefined).
export function identifierFields(raw) {
  const { type, value } = parseIdentifier(raw);
  return { identifier: value, email: type === "email" ? value : undefined, phone: type === "phone" ? value : undefined };
}
