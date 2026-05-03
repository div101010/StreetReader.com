const KEY = 'streetreader.user_id';

// Backdoor: paste your own user_id here once you've created your first story.
// Whoever has this id sees Delete on every card. Empty string disables admin.
export const ADMIN_USER_ID = '';

export function getOrCreateUserId() {
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `u-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(KEY, id);
      console.log('[user_id] generated new session id:', id);
    } else {
      console.log('[user_id] restored from localStorage:', id);
    }
    return id;
  } catch {
    // Storage unavailable (private mode, etc.) — fall back to a runtime id.
    return `runtime-${Date.now()}`;
  }
}

export function isAdmin(userId) {
  return ADMIN_USER_ID !== '' && userId === ADMIN_USER_ID;
}
