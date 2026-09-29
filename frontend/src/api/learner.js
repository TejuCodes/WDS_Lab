const LEARNER_KEY = "wvl-learner-id";

/**
 * ============================================================
 * LEARNER ID
 * ------------------------------------------------------------
 * There is no login in this project, so the "learner" is just a
 * generated id kept in localStorage. It is what progress is stored
 * against on the server, so a student can close the tab and come
 * back and still see their progress.
 *
 * When you add authentication later, delete this file and take the
 * user id from the JWT instead. Nothing else needs to change.
 * ============================================================
 */

function createId() {
  // crypto.randomUUID is available in all modern browsers on HTTPS
  // and on localhost. The fallback keeps it working on plain http
  // origins such as a lab machine on the LAN.
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `learner-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getLearnerId() {
  try {
    let id = window.localStorage.getItem(LEARNER_KEY);
    if (!id) {
      id = createId();
      window.localStorage.setItem(LEARNER_KEY, id);
    }
    return id;
  } catch {
    // Storage blocked (private mode). A per-session id still works
    // for the current visit.
    return createId();
  }
}
