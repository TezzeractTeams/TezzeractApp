import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_CHANNEL_NAME,
  broadcastLogout,
  handleUnauthorized,
  listenForLogout,
  resetUnauthorizedGuard,
  startSessionPolling,
} from './authSession';

class FakeChannel {
  static instances: FakeChannel[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  closed = false;
  constructor(public name: string) {
    FakeChannel.instances.push(this);
  }
  postMessage(data: unknown) {
    for (const other of FakeChannel.instances) {
      if (other !== this && !other.closed && other.name === this.name) {
        other.onmessage?.({ data } as MessageEvent);
      }
    }
  }
  close() {
    this.closed = true;
  }
}

const assign = vi.fn();

function setLocation(pathname: string, search = '') {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { pathname, search, assign },
  });
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  FakeChannel.instances = [];
  assign.mockReset();
  resetUnauthorizedGuard();
  vi.stubGlobal('BroadcastChannel', FakeChannel);
  setLocation('/talent', '?q=1');
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('handleUnauthorized', () => {
  it('redirects to /auth/login with the current path, never to /', () => {
    handleUnauthorized();
    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith('/auth/login?next=%2Ftalent%3Fq%3D1');
  });

  it('fires only once for a burst of 401s', () => {
    handleUnauthorized();
    handleUnauthorized();
    handleUnauthorized();
    expect(assign).toHaveBeenCalledTimes(1);
  });

  it('does not redirect while already on an auth route', () => {
    setLocation('/auth/login');
    handleUnauthorized();
    expect(assign).not.toHaveBeenCalled();
  });
});

describe('logout broadcast', () => {
  it('reaches listeners in other tabs on the tz-auth channel', () => {
    const onLogout = vi.fn();
    const stop = listenForLogout(onLogout);

    broadcastLogout();
    expect(FakeChannel.instances.every((c) => c.name === AUTH_CHANNEL_NAME)).toBe(true);
    expect(onLogout).toHaveBeenCalledTimes(1);

    stop();
  });

  it('is a no-op when BroadcastChannel is unavailable', () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    expect(() => broadcastLogout()).not.toThrow();
    expect(() => listenForLogout(() => undefined)()).not.toThrow();
  });
});

describe('startSessionPolling', () => {
  it('polls every interval while visible and stops while hidden', () => {
    vi.useFakeTimers();
    const check = vi.fn();
    const stop = startSessionPolling(check, 60_000);

    vi.advanceTimersByTime(60_000);
    expect(check).toHaveBeenCalledTimes(1);

    setVisibility('hidden');
    vi.advanceTimersByTime(180_000);
    expect(check).toHaveBeenCalledTimes(1);

    setVisibility('visible');
    expect(check).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(60_000);
    expect(check).toHaveBeenCalledTimes(3);

    stop();
    vi.advanceTimersByTime(120_000);
    expect(check).toHaveBeenCalledTimes(3);
  });
});
