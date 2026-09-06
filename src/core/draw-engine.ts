import { getCtx } from './util/canvas';

export const ctx4 = getCtx(c4);

let canvasWidth = 0;
let canvasHeight = 0;

export function resizeCanvas() {
  canvasWidth = grid.clientWidth;
  canvasHeight = grid.clientHeight;
  ctx4.canvas.width = canvasWidth;
  ctx4.canvas.height = canvasHeight;
  ctx4.imageSmoothingEnabled = false;
}

export function clea() {
  ctx4.clearRect(0, 0, canvasWidth, canvasHeight);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();
