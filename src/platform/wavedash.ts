type WavedashInitConfig = {
  debug?: boolean;
  deferEvents?: boolean;
  p2p?: unknown;
};

type LaunchParams = Record<string, string>;

interface WavedashSdk {
  init(config?: WavedashInitConfig): boolean;
  updateLoadProgressZeroToOne(progress: number): void;
  getLaunchParams?(): LaunchParams;
  toggleOverlay?(): void;
}

declare global {
  interface Window {
    Wavedash?: WavedashSdk;
  }
}

const getWavedashSdk = (): WavedashSdk | undefined => {
  return window.Wavedash;
};

export const updateWavedashLoadProgress = (progress: number) => {
  const clamped = Math.max(0, Math.min(1, progress));
  getWavedashSdk()?.updateLoadProgressZeroToOne(clamped);
};

export const initWavedash = (): boolean => {
  const sdk = getWavedashSdk();
  if (!sdk) {
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
