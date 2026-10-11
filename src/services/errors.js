// Every failed API call (real or mock) throws an ApiError, so the UI has ONE error shape to handle.
//   status  : HTTP status (0 = network error / timeout)
//   message : human-readable text, already in the user's language when the server translates it
//   errors  : Laravel validation errors { field: ["message", ...] } (422), or null
//   reason  : machine-readable code for special cases, e.g. referral: "unknown" | "own_code" | "already_used"
export class ApiError extends Error {
  constructor(message, { status = 0, errors = null, reason = null, data = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.reason = reason;
    this.data = data;
  }
  // First message for one field, e.g. err.field("email")
  field(name) {
    const e = this.errors?.[name];
    return Array.isArray(e) ? e[0] : e || undefined;
  }
  get isAuth() { return this.status === 401; }
  get isNetwork() { return this.status === 0; }
}

// Shorthand used by the mock server to behave like Laravel's validation.
export const invalid = (errors, message = "Please check the highlighted fields.") => new ApiError(message, { status: 422, errors });
export const notFound = (message = "Not found.") => new ApiError(message, { status: 404 });
export const unauthenticated = (message = "Please log in to continue.") => new ApiError(message, { status: 401 });
