/* eslint-disable id-denylist */
// Canvas creation and context helpers for bundle size optimization

export const createCanvas = (w?: number, h?: number) => {
  const c = document.createElement('canvas');
  if (w) c.width = w;
  if (h) c.height = h;
  return c;
};

export const createCanvasWithCtx = (w?: number, h?: number) => {
  const canvas = createCanvas(w, h);
  return [canvas, canvas.getContext('2d') as CanvasRenderingContext2D] as const;
};

export const setCanvasSize = (canvas: HTMLCanvasElement, w: number, h: number) => {
  canvas.width = w;
  canvas.height = h;
};
