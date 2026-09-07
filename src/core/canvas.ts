export const ctx4 = c1.getContext('2d') as CanvasRenderingContext2D;

let canvasWidth = 0;
let canvasHeight = 0;

export function resizeCanvas() {
  canvasWidth = gd.clientWidth;
  canvasHeight = gd.clientHeight;
  ctx4.canvas.width = canvasWidth;
  ctx4.canvas.height = canvasHeight;
  ctx4.imageSmoothingEnabled = false;
}

export function clearCanvas() {
  ctx4.clearRect(0, 0, canvasWidth, canvasHeight);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();
