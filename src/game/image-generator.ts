import { createCanvasWithCtx } from '../core/util/canvas';
import { blue2, Color, cyan, cyan2, green, green2, magenta2, magenta3, red2, white, yellow, yellow2 } from './colors';

export let rainbowSprite: HTMLCanvasElement, bushSprite: HTMLCanvasElement;

const BUSH_SMOKE_SIZE = 96;
const BUSH_SMOKE_FRAMES = 12;
const BUSH_SMOKE_FILL = white;
const BUSH_SMOKE_BORDER = magenta3;
const BUSH_SMOKE_BORDER_PX = 4;
const BUSH_SMOKE_DRAW_THRESHOLD = 0.2;
const BUSH_SMOKE_CENTER_X = 0.5;
const BUSH_SMOKE_CENTER_Y = 0.52;
const BUSH_SMOKE_SPREAD_START = 2;
const BUSH_SMOKE_SPREAD_END = 26;
const BUSH_SMOKE_SPREAD_BURST_END_T = 0.58;
const BUSH_SMOKE_OUTER_START_R = 6;
const BUSH_SMOKE_OUTER_PEAK_R = 23;
const BUSH_SMOKE_OUTER_PEAK_T = 0.55;
const BUSH_SMOKE_OUTER_END_R = 0;
const BUSH_SMOKE_CENTER_PUFF_DELAY_T = 0.25;
const BUSH_SMOKE_CENTER_PUFF_PEAK_R = 30;
const BUSH_SMOKE_CENTER_PUFF_PEAK_T = 0.72;
const BUSH_SMOKE_CENTER_PUFF_END_R = 0;
const BUSH_SMOKE_JITTER_AMP = 1.5;
const BUSH_SMOKE_DIRS = [
  { x: -0.85, y: -0.4 },
  { x: 0.88, y: -0.32 },
  { x: -0.58, y: 0.78 },
  { x: 0.62, y: 0.82 },
] as const;

const BUSH_SMOKE_BORDER_OFFSETS = (() => {
  const radius = BUSH_SMOKE_BORDER_PX;
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
  ctx.fillStyle = BUSH_SMOKE_FILL;
  ctx.fill();
};

const createBushSmokeSpriteSheet = (): HTMLCanvasElement => {
  const sheet = document.createElement('canvas');
  sheet.width = BUSH_SMOKE_SIZE * BUSH_SMOKE_FRAMES;
  sheet.height = BUSH_SMOKE_SIZE;
  const ctx = sheet.getContext('2d') as CanvasRenderingContext2D;

  const blobCanvas = document.createElement('canvas');
  blobCanvas.width = BUSH_SMOKE_SIZE;
  blobCanvas.height = BUSH_SMOKE_SIZE;
  const blobCtx = blobCanvas.getContext('2d') as CanvasRenderingContext2D;

  const borderCanvas = document.createElement('canvas');
  borderCanvas.width = BUSH_SMOKE_SIZE;
  borderCanvas.height = BUSH_SMOKE_SIZE;
  const borderCtx = borderCanvas.getContext('2d') as CanvasRenderingContext2D;

  const centerX = BUSH_SMOKE_SIZE * BUSH_SMOKE_CENTER_X;
  const centerY = BUSH_SMOKE_SIZE * BUSH_SMOKE_CENTER_Y;

  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  const shape = (t: number, peakAt: number, from: number, peak: number, to: number) => {
    if (t <= peakAt) {
      return mix(from, peak, t / peakAt);
    }
    return mix(peak, to, (t - peakAt) / (1 - peakAt));
  };

  for (let frame = 0; frame < BUSH_SMOKE_FRAMES; frame++) {
    const p = frame / (BUSH_SMOKE_FRAMES - 1);
    const frameOffsetX = frame * BUSH_SMOKE_SIZE;

    // Ease-out burst: fast expansion at start, then slower toward the end.
    const burstT = Math.min(1, p / BUSH_SMOKE_SPREAD_BURST_END_T);
    const spread = BUSH_SMOKE_SPREAD_START
      + (BUSH_SMOKE_SPREAD_END - BUSH_SMOKE_SPREAD_START) * (1 - (1 - burstT) * (1 - burstT));
    const outerRadius = shape(
      p,
      BUSH_SMOKE_OUTER_PEAK_T,
      BUSH_SMOKE_OUTER_START_R,
      BUSH_SMOKE_OUTER_PEAK_R,
      BUSH_SMOKE_OUTER_END_R,
    );

    // Delayed center puff (5th circle).
    const q = Math.max(0, (p - BUSH_SMOKE_CENTER_PUFF_DELAY_T) / (1 - BUSH_SMOKE_CENTER_PUFF_DELAY_T));
    const centerRadius = q > 0
      ? shape(q, BUSH_SMOKE_CENTER_PUFF_PEAK_T, 0, BUSH_SMOKE_CENTER_PUFF_PEAK_R, BUSH_SMOKE_CENTER_PUFF_END_R)
      : 0;

    blobCtx.clearRect(0, 0, BUSH_SMOKE_SIZE, BUSH_SMOKE_SIZE);
    for (let i = 0; i < BUSH_SMOKE_DIRS.length; i++) {
      const d = BUSH_SMOKE_DIRS[i];
      const jitter = (i % 2 === 0 ? -1 : 1) * p * BUSH_SMOKE_JITTER_AMP;
      drawSmokeBlob(blobCtx, centerX + d.x * spread + jitter, centerY + d.y * spread, outerRadius);
    }
    if (centerRadius > BUSH_SMOKE_DRAW_THRESHOLD) {
      drawSmokeBlob(blobCtx, centerX, centerY, centerRadius);
    }

    // Build one outline around the combined white blob shape.
    borderCtx.clearRect(0, 0, BUSH_SMOKE_SIZE, BUSH_SMOKE_SIZE);
    for (let i = 0; i < BUSH_SMOKE_BORDER_OFFSETS.length; i++) {
      const o = BUSH_SMOKE_BORDER_OFFSETS[i];
      borderCtx.drawImage(blobCanvas, o.x, o.y);
    }

    borderCtx.globalCompositeOperation = 'destination-out';
    borderCtx.drawImage(blobCanvas, 0, 0);
    borderCtx.globalCompositeOperation = 'source-in';
    borderCtx.fillStyle = BUSH_SMOKE_BORDER;
    borderCtx.fillRect(0, 0, BUSH_SMOKE_SIZE, BUSH_SMOKE_SIZE);
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
