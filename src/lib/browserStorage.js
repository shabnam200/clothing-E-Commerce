// Browser state should last only for the current tab. Move an existing app key
// out of localStorage the first time it is read, then remove the old copy.
export function getSessionStorage(key) {
  if (typeof window === "undefined") return null;
  let session;
  try {
    session = window.sessionStorage;
    const current = session.getItem(key);
    let previous = null;
    try { previous = window.localStorage?.getItem(key) ?? null; } catch { /* local storage may be blocked */ }
    let migrated = current !== null;
    if (current === null && previous !== null) {
      try { session.setItem(key, previous); migrated = true; } catch { /* session storage may be full */ }
    }
    if (previous !== null && migrated) {
      try { window.localStorage?.removeItem(key); } catch { /* local storage may be blocked */ }
    }
    return session;
  } catch {
    return null;
  }
}

const APP_KEYS = new Set([
  "avenor:v2:state:v1", "avenor:mock:db:v1", "avenor_token", "avenor-theme", "avenor:v2:looks",
]);

// Migrate app-owned data eagerly so unused old localStorage keys are removed too.
export function migrateLegacyAppStorage() {
  try {
    if (typeof window === "undefined") return;
    const local = window.localStorage;
    const keys = [];
    for (let i = 0; i < local.length; i += 1) {
      const key = local.key(i);
      if (key && (APP_KEYS.has(key) || key.startsWith("avenor:v2:size-passport:"))) keys.push(key);
    }
    keys.forEach((key) => getSessionStorage(key));
  } catch { /* local storage may be blocked */ }
}
