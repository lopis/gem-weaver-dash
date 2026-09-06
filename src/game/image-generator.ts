import { createCanvasWithCtx } from '../core/util/canvas';
import { blue2, Color, cyan, cyan2, green, green2, magenta2, magenta3, red2, white, yellow, yellow2 } from './colors';

export let rainbowSprite: HTMLCanvasElement, bushSprite: HTMLCanvasElement;

const BUSH_SMOKE = {
  size: 96,
  frames: 12,
  fill: white,
  border: magenta3,
  borderPx: 4,
  drawThreshold: 0.2,
  center: { x: 0.5, y: 0.52 },
  spread: { start: 2, end: 26, burstEndT: 0.58 },
  outer: { startR: 6, peakR: 23, peakT: 0.55, endR: 0 },
  centerPuff: { delayT: 0.25, peakR: 30, peakT: 0.72, endR: 0 },
  jitterAmp: 1.5,
  dirs: [
    { x: -0.85, y: -0.4 },
    { x: 0.88, y: -0.32 },
    { x: -0.58, y: 0.78 },
    { x: 0.62, y: 0.82 },
  ] as const,
} as const;

const BUSH_SMOKE_BORDER_OFFSETS = (() => {
  const radius = BUSH_SMOKE.borderPx;
  const offsets: Array<{ x: number; y: number }> = [];
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if ((x !== 0 || y !== 0) && x * x + y * y <= radius * radius) {
        offsets.push({ x, y });
      }
    }
  }
  return offsets;
})();

const drawSmokeBlob = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = BUSH_SMOKE.fill;
  ctx.fill();
};

const createBushSmokeSpriteSheet = (): HTMLCanvasElement => {
  const sheet = document.createElement('canvas');
  sheet.width = BUSH_SMOKE.size * BUSH_SMOKE.frames;
  sheet.height = BUSH_SMOKE.size;
  const ctx = sheet.getContext('2d') as CanvasRenderingContext2D;

  const blobCanvas = document.createElement('canvas');
  blobCanvas.width = BUSH_SMOKE.size;
  blobCanvas.height = BUSH_SMOKE.size;
  const blobCtx = blobCanvas.getContext('2d') as CanvasRenderingContext2D;

  const borderCanvas = document.createElement('canvas');
  borderCanvas.width = BUSH_SMOKE.size;
  borderCanvas.height = BUSH_SMOKE.size;
  const borderCtx = borderCanvas.getContext('2d') as CanvasRenderingContext2D;

  const centerX = BUSH_SMOKE.size * BUSH_SMOKE.center.x;
  const centerY = BUSH_SMOKE.size * BUSH_SMOKE.center.y;

  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  const shape = (t: number, peakAt: number, from: number, peak: number, to: number) => {
    if (t <= peakAt) {
      return mix(from, peak, t / peakAt);
    }
    return mix(peak, to, (t - peakAt) / (1 - peakAt));
  };

  for (let frame = 0; frame < BUSH_SMOKE.frames; frame++) {
    const p = frame / (BUSH_SMOKE.frames - 1);
    const frameOffsetX = frame * BUSH_SMOKE.size;

    // Ease-out burst: fast expansion at start, then slower toward the end.
    const burstT = Math.min(1, p / BUSH_SMOKE.spread.burstEndT);
    const spread = BUSH_SMOKE.spread.start
      + (BUSH_SMOKE.spread.end - BUSH_SMOKE.spread.start) * (1 - (1 - burstT) * (1 - burstT));
    const outerRadius = shape(
      p,
      BUSH_SMOKE.outer.peakT,
      BUSH_SMOKE.outer.startR,
      BUSH_SMOKE.outer.peakR,
      BUSH_SMOKE.outer.endR,
    );

    // Delayed center puff (5th circle).
    const q = Math.max(0, (p - BUSH_SMOKE.centerPuff.delayT) / (1 - BUSH_SMOKE.centerPuff.delayT));
    const centerRadius = q > 0
      ? shape(q, BUSH_SMOKE.centerPuff.peakT, 0, BUSH_SMOKE.centerPuff.peakR, BUSH_SMOKE.centerPuff.endR)
      : 0;

    blobCtx.clearRect(0, 0, BUSH_SMOKE.size, BUSH_SMOKE.size);
    for (let i = 0; i < BUSH_SMOKE.dirs.length; i++) {
      const d = BUSH_SMOKE.dirs[i];
      const jitter = (i % 2 === 0 ? -1 : 1) * p * BUSH_SMOKE.jitterAmp;
      drawSmokeBlob(blobCtx, centerX + d.x * spread + jitter, centerY + d.y * spread, outerRadius);
    }
    if (centerRadius > BUSH_SMOKE.drawThreshold) {
      drawSmokeBlob(blobCtx, centerX, centerY, centerRadius);
    }

    // Build one outline around the combined white blob shape.
    borderCtx.clearRect(0, 0, BUSH_SMOKE.size, BUSH_SMOKE.size);
    for (let i = 0; i < BUSH_SMOKE_BORDER_OFFSETS.length; i++) {
      const o = BUSH_SMOKE_BORDER_OFFSETS[i];
      borderCtx.drawImage(blobCanvas, o.x, o.y);
    }

    borderCtx.globalCompositeOperation = 'destination-out';
    borderCtx.drawImage(blobCanvas, 0, 0);
    borderCtx.globalCompositeOperation = 'source-in';
    borderCtx.fillStyle = BUSH_SMOKE.border;
    borderCtx.fillRect(0, 0, BUSH_SMOKE.size, BUSH_SMOKE.size);
    borderCtx.globalCompositeOperation = 'source-over';

    ctx.drawImage(borderCanvas, frameOffsetX, 0);
    ctx.drawImage(blobCanvas, frameOffsetX, 0);
  }

  return sheet;
};

export const init = (): void => {
  const [canvas, ctx] = createCanvasWithCtx(128, 128);
  const rainbow = [yellow, green, cyan, magenta2];
  const r = 22;
  const step = r * 2 - 14;
  const startX = (128 - (r * 2 + step * (rainbow.length - 1))) / 2 + r;

  // Clip to canvas bounds so circles never bleed outside
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 128, 128);
  ctx.clip();

  for (let i = 0; i < rainbow.length; i++) {
    ctx.beginPath();
    ctx.arc(startX + i * step, 64, r, 0, Math.PI * 2);
    ctx.fillStyle = rainbow[i];
    ctx.fill();
  }

  ctx.restore();
  rainbowSprite = canvas;
  bushSprite = createBushSmokeSpriteSheet();
  document.body.style.setProperty('--fx-bush-smoke', `url(${bushSprite.toDataURL()})`);
};

const createSpellIcon = (
  colors1: Color[],
  colors2: GlobalCompositeOperation,
  symbol: 'plus' | 'minus',
  size = 130,
) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  [
    { x: size * 0.35, y: size * 0.35 },
    { x: size * 0.65, y: size * 0.35 },
    { x: size * 0.5,  y: size * 0.65 }
  ].forEach((pos, i) => {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = colors1[i];
    if (i) ctx.globalCompositeOperation = colors2;
    ctx.fill();
  });

  ctx.globalCompositeOperation = 'source-over';
  const pos = Math.round(size * 0.5);
  const length = Math.round(size * 0.25);
  const offsetH = Math.round(size * 0.05);
  const thickness = Math.round(size * 0.08);
  const border = Math.max(2, Math.round(size * 0.02));
  const inset = border * 2;
  const base = Math.round(pos - length / 2);
  const cross = Math.round(pos - thickness / 2);

  ctx.beginPath();
  ctx.roundRect(base + border, cross + border - offsetH, length - inset, thickness - inset, 4);
  if (symbol === 'plus') {
    ctx.roundRect(cross + border, base + border - offsetH, thickness - inset, length - inset, 4);
  }
  ctx.strokeStyle = '#1b211f';
  ctx.lineWidth = inset;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.fillStyle = '#ffafa6';
  ctx.fill();

  return canvas.toDataURL();
};

export const applySpellIcons = () => {
  const additiveIcon = createSpellIcon([red2, green2, blue2], 'lighter', 'plus');
  const subtractiveIcon = createSpellIcon([cyan2, magenta2, yellow2], 'multiply', 'minus');

  add.style.backgroundImage = `url(${additiveIcon})`;
  sub.style.backgroundImage = `url(${subtractiveIcon})`;
};
