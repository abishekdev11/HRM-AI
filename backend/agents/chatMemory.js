const MAX_SESSIONS = 200;
const SESSION_TTL_MS = 15 * 60 * 1000;
const MAX_FIELDS_PER_SESSION = 12;

const sessionDrafts = new Map();

function normalizeSessionKey(actor) {
  if (!actor) return "guest";
  if (actor._id) return `user:${String(actor._id)}`;
  if (actor.email) return `email:${String(actor.email).toLowerCase()}`;
  return `actor:${String(actor).slice(0, 32)}`;
}

function pruneExpiredDrafts() {
  const now = Date.now();

  for (const [key, value] of sessionDrafts.entries()) {
    if (!value || value.expiresAt <= now) {
      sessionDrafts.delete(key);
    }
  }

  if (sessionDrafts.size > MAX_SESSIONS) {
    const oldestEntries = [...sessionDrafts.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt);
    while (sessionDrafts.size > MAX_SESSIONS && oldestEntries.length) {
      const [oldestKey] = oldestEntries.shift();
      sessionDrafts.delete(oldestKey);
    }
  }
}

function getPendingDraft(actor) {
  pruneExpiredDrafts();

  const key = normalizeSessionKey(actor);
  const draft = sessionDrafts.get(key);

  if (!draft) {
    return null;
  }

  return {
    action: draft.action || "generic",
    fields: { ...(draft.fields || {}) },
    updatedAt: draft.updatedAt,
    expiresAt: draft.expiresAt,
  };
}

function getPendingDraftFor(actor, actionName) {
  const draft = getPendingDraft(actor);
  if (!draft || !draft.action) return null;
  if (actionName && draft.action !== actionName) return null;
  return draft;
}

function savePendingDraft(actor, { action = "generic", fields = {} } = {}) {
  const key = normalizeSessionKey(actor);
  pruneExpiredDrafts();

  const existing = sessionDrafts.get(key) || {
    action,
    fields: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mergedFields = { ...(existing.fields || {}), ...fields };
  const trimmedEntries = Object.entries(mergedFields).slice(-MAX_FIELDS_PER_SESSION);

  const nextDraft = {
    action: action || existing.action || "generic",
    fields: Object.fromEntries(trimmedEntries),
    createdAt: existing.createdAt || Date.now(),
    updatedAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  sessionDrafts.set(key, nextDraft);
  return nextDraft;
}

function clearPendingDraft(actor) {
  const key = normalizeSessionKey(actor);
  sessionDrafts.delete(key);
}

function getPendingUserDraft(actor) {
  const draft = getPendingDraftFor(actor, "user.create");
  return draft ? { ...draft.fields } : {};
}

function savePendingUserDraft(actor, fields = {}) {
  return savePendingDraft(actor, { action: "user.create", fields });
}

function clearPendingUserDraft(actor) {
  clearPendingDraft(actor);
}

module.exports = {
  normalizeSessionKey,
  getPendingDraft,
  getPendingDraftFor,
  savePendingDraft,
  clearPendingDraft,
  getPendingUserDraft,
  savePendingUserDraft,
  clearPendingUserDraft,
};
