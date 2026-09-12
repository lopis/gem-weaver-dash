type WavedashInitConfig = {
  debug?: boolean;
  deferEvents?: boolean;
  p2p?: unknown;
};

type LaunchParams = Record<string, string>;

interface WavedashSdk {
  init(config?: WavedashInitConfig): boolean;
  updateLoadProgressZeroToOne(progress: number): void;
  loadComplete?(): void;
  getLaunchParams?(): LaunchParams;
  toggleOverlay?(): void;
}

declare global {
  interface Window {
    Wavedash?: WavedashSdk;
  }
}

const getWavedashSdk = (): WavedashSdk | undefined => {
  const globalSdk = (globalThis as { Wavedash?: WavedashSdk }).Wavedash;
  return globalSdk ?? window.Wavedash;
};

let queuedProgress: number | undefined;
let queuedInit = false;
let flushScheduled = false;
let flushAttempts = 0;
const MAX_FLUSH_ATTEMPTS = 240;

const flushQueuedLifecycleCalls = () => {
  const sdk = getWavedashSdk();
  if (!sdk) {
    return false;
  }

  if (queuedProgress !== undefined) {
    sdk.updateLoadProgressZeroToOne(queuedProgress);
    queuedProgress = undefined;
  }

  if (queuedInit) {
    sdk.init({ debug: window.location.hostname === 'localhost' });
    queuedInit = false;
  }

  return true;
};

const scheduleLifecycleFlush = () => {
  if (flushScheduled) {
    return;
  }

  flushScheduled = true;
  flushAttempts = 0;

  const tryFlush = () => {
    flushAttempts++;
    const flushed = flushQueuedLifecycleCalls();
    const done = flushed || flushAttempts >= MAX_FLUSH_ATTEMPTS;

    if (done) {
      flushScheduled = false;
      return;
    }

    requestAnimationFrame(tryFlush);
  };

  requestAnimationFrame(tryFlush);
};

export const updateWavedashLoadProgress = (progress: number) => {
  const clamped = Math.max(0, Math.min(1, progress));
  const sdk = getWavedashSdk();
  if (sdk) {
    sdk.updateLoadProgressZeroToOne(clamped);
    return;
  }

  queuedProgress = queuedProgress === undefined ? clamped : Math.max(queuedProgress, clamped);
  scheduleLifecycleFlush();
};

export const initWavedash = (): boolean => {
  const sdk = getWavedashSdk();
  if (!sdk) {
    queuedInit = true;
    scheduleLifecycleFlush();
    return false;
  }

  const debug = window.location.hostname === 'localhost';
  return sdk.init({ debug });
};

export const getWavedashLaunchParams = (): LaunchParams => {
  const sdk = getWavedashSdk();
  return sdk?.getLaunchParams?.() ?? {};
};

export const toggleWavedashOverlay = () => {
  getWavedashSdk()?.toggleOverlay?.();
};
