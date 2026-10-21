/**
 * Cross-tab session handling shared by every API caller.
 *
 * - `handleUnauthorized` is the single place a lost session is handled: it
 *   redirects to `/auth/login` (never `/`), once, remembering where the user was.
 * - `broadcastLogout` / `listenForLogout` tell other tabs of this origin to
 *   do the same the moment one tab signs out.
 * - `startSessionPolling` re-checks the session while the tab is visible.
 *
 * Nothing here reads or logs tokens, cookies or session ids.
 */

export const AUTH_CHANNEL_NAME = 'tz-auth';
export const SESSION_POLL_INTERVAL_MS = 60_000;

let redirecting = false;
/** Set once this tab starts signing out; its own navigation must not be replaced. */
let signingOut = false;

/** Identifies this tab so it can ignore its own broadcast. */
const TAB_ID =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

type LogoutMessage = { type: 'logout'; from: string };

/** Test seam: allow `handleUnauthorized` to fire again. */
export function resetUnauthorizedGuard(): void {
  redirecting = false;
  signingOut = false;
}

export function handleUnauthorized(): void {
  if (redirecting || signingOut) return;

  const { pathname, search } = window.location;
  // Already on an auth route: another redirect would only loop.
  if (pathname.startsWith('/auth/')) return;

  redirecting = true;
  const next = `${pathname}${search}`;
  window.location.assign(`/auth/login?next=${encodeURIComponent(next)}`);
}

function openChannel(): BroadcastChannel | null {
  return typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(AUTH_CHANNEL_NAME);
}

export function broadcastLogout(): void {
  // Mark first: BroadcastChannel also delivers to other channel objects in
  // this same tab (e.g. a mounted session watcher), and a login redirect
  // there would replace the pending /auth/logout navigation.
  signingOut = true;
  const channel = openChannel();
  if (!channel) return;
  channel.postMessage({ type: 'logout', from: TAB_ID } satisfies LogoutMessage);
  channel.close();
}

/** Calls `onLogout` when another tab broadcasts a logout. Returns a cleanup function. */
export function listenForLogout(onLogout: () => void): () => void {
  const channel = openChannel();
  if (!channel) return () => undefined;

  channel.onmessage = (event: MessageEvent) => {
    const data = event.data as Partial<LogoutMessage> | undefined;
    if (data?.type === 'logout' && data.from !== TAB_ID) onLogout();
  };
  return () => channel.close();
}

/**
 * Runs `check` on every visibilitychange to visible and every
 * `intervalMs` while the tab stays visible. Hidden tabs do not poll.
 * Returns a cleanup function.
 */
export function startSessionPolling(
  check: () => void | Promise<void>,
  intervalMs: number = SESSION_POLL_INTERVAL_MS,
): () => void {
  let timer: ReturnType<typeof setInterval> | undefined;

  const stop = () => {
    if (timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };

  const start = () => {
    stop();
    timer = setInterval(() => void check(), intervalMs);
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      void check();
      start();
    } else {
      stop();
    }
  };

  document.addEventListener('visibilitychange', onVisibility);
  if (document.visibilityState === 'visible') start();

  return () => {
    stop();
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
