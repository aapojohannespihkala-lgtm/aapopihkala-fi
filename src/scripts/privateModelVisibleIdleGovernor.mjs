/**
 * Opt-in frame budget for a STATIC private-model review. The WebGL loop stays
 * installed, but idle frames perform full layer/control/render work at most
 * every idleRefreshMs. UI events immediately restore full-rate updates.
 *
 * Never use this gate to classify source, geometry or model approval.
 */
export function createVisibleIdleFrameGovernor({
  idleRefreshMs = 125,
  activeHoldMs = 1500,
} = {}) {
  if (!Number.isFinite(idleRefreshMs) || idleRefreshMs <= 0 ||
      !Number.isFinite(activeHoldMs) || activeHoldMs < 0) {
    throw new Error('VIEWER_IDLE_BUDGET_INVALID');
  }

  let lastRenderedAt = Number.NEGATIVE_INFINITY;
  let activeUntil = Number.NEGATIVE_INFINITY;
  let dirty = true;

  return Object.freeze({
    invalidate(now) {
      if (!Number.isFinite(now)) {
        dirty = true; // Fail open on an untrusted clock.
        return;
      }
      dirty = true;
      activeUntil = Math.max(activeUntil, now + activeHoldMs);
    },
    shouldRun(now, visible = true) {
      if (!visible) {
        dirty = true; // First foreground callback must render.
        return false;
      }
      if (!Number.isFinite(now)) return true;
      const needsFrame =
        dirty || now <= activeUntil ||
        now < lastRenderedAt || now - lastRenderedAt >= idleRefreshMs;
      if (!needsFrame) return false;
      lastRenderedAt = now;
      dirty = false;
      return true;
    },
  });
}
