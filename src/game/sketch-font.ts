import { black } from "./colors";
import { drawSketchStroke, samplePathData, SamplePoint } from "./sketch-path";

type Glyph = {
  samples: SamplePoint[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type GlyphEntry = readonly [string, string];
type GlyphAsset = {
  url: string;
  widthEm: number;
};

const FONT_EM = 1.6;
const SAMPLE_COUNT = 48;
const STROKE_WIDTH = 3;
const STROKE_AMP = 0.95;
const STROKE_PASSES = 2;
const STROKE_FRAMES = 5;
const HTML_FONT_CLASS = "skf";
const HTML_GLYPH_CLASS = "skf-g";
const HTML_SPACE_EM = 0.45;
const HTML_TRACKING_UNITS = 0.12;
const HTML_DISPLAY_HEIGHT = 32;
const HTML_RENDER_SCALE = 4;
const HTML_ASSET_HEIGHT = HTML_DISPLAY_HEIGHT * HTML_RENDER_SCALE;
// Keep padding proportional when rendering at higher internal resolution.
const HTML_ASSET_PADDING = 5 * HTML_RENDER_SCALE;

// Custom font.
// The ununsed glyths are commented out
const glyphEntries: readonly GlyphEntry[] = [
  ["A", "m1.1 15 7.4-13 7.4 13-2.5-4.5h-9.8"],
  // ["B", "m3.6 15v-13h2.5c9.8 0 9.8 6.7 0 6.7 9.8 0 9.8 6.7 0 6.7z"],
  ["C", "m14 1.9c-15 0-15 13 0 13"],
  ["D", "m2.9 1.9c15 0 15 13 0 13z"],
  ["E", "m13 1.9h-9.8v6.7h4.9-4.9v6.7h9.8"],
  ["F", "m13 2h-9.8v13-6.7h4.9"],
  ["G", "m14 1.9c-15 0-15 13 0 13v-6.7"],
  ["H", "m3.6 2v13-6.7h9.8v-6.7 13"],
  ["I", "m8.5 2v13"],
  // ["J", "m6 1.9h7.4c0 18-9.8 16-9.8 6.7"],
  // ["K", "m3.6 15v-6.7l9.8 6.7-9.8-6.7 9.8-6.7-9.8 6.7v-6.7"],
  ["L", "m3.6 1.9v13h9.8"],
  ["M", "m1.1 15 2.5-13 4.9 9 4.9-9 2.5 13"],
  ["N", "m3.6 15v-13l9.8 13v-13"],
  ["O", "m8.5 1.9c-7.4 0-7.4 13 0 13 7.4 0 7.4-13 0-13z"],
  ["P", "m2.9 15v-13c15 0 15 9 0 9"],
  ["Q", "m9.4 15c3.6 0 6-2.4 6-6 0-3.6-2.4-6-6-6-3.6 0-6 3.6-6 7.2l5.1-1.3-5.1 1.3-2.7-4.8"], // REPLAY ICON
  ["R", "m3 15v-13c15 0 15 9 0 9l7.4 4.5"],
  ["S", "m13 1.7c-12-2.2-12 4.5-4.9 6.7 7.4 2.2 7.4 9-4.9 6.7"],
  ["T", "m13 2h-4.9v13-13h-4.9"],
  ["U", "m3.6 1.9c-2.5 18 12 18 9.8 0"],
  ["V", "m3.6 1.8 4.9 13 4.9-13"],
  ["W", "m1.1 1.8 2.5 13 4.9-6.7 4.9 6.7 2.5-13"],
  // ["X", "m3.6 1.9 4.9 6.7-4.9 6.7 4.9-6.7 4.9 6.7-4.9-6.7 4.9-6.7"],
  ["Y", "m3.6 1.9 4.9 6.7 4.9-6.7-9.8 13"],
  // ["Z", "m3.6 1.9h9.8l-9.8 13h9.8"],
  ["!", "m8.5 2.3v9s-2.5 1.2-2.5 2.2 1.3 2.2 2.5 2.2 2.5-1.2 2.5-2.2-2.5-2.2-2.5-2.2"],
  ["?", "m3.6 4.5c0-4.5 9.8-4.5 9.8 0 0 2.2-4.9 4.5-4.9 6.7 0 0-2.5 1.2-2.5 2.2s1.3 2.2 2.5 2.2c1.2 0 2.5-1.2 2.5-2.2s-2.5-2.2-2.5-2.2"],
  // [".", "m8.5 11c-1.2 0-2.5 1.2-2.5 2.2s1.3 2.2 2.5 2.2c1.2 0 2.5-1.2 2.5-2.2s-1.3-2.2-2.5-2.2z"],
  ["1", "m6.3 6.4 4.2-4.2v13"],
  ["2", "m4.8 6.4c-2.1-6.3 19-6.3 0 8.4h8.4"],
  ["3", "m4.2 2.2c11 0 11 6.3 2.1 6.3 8.4 0 8.4 6.3-2.1 6.3"],
  ["4", "m8.6 2.2-4.2 8.4c8.4 0 8.4 4 8.4-4.2v8.4"],
  ["5", "m13 2.2h-8.4v4.2c11-2.1 11 11 0 8.4"],
  ["6", "m11 2.2c-6.3 0-6.3 4.2-6.3 8.4 0 6.3 8.4 6.3 8.4 0 0-4.2-8.4-4.2-8.4 0"],
  ["7", "m4.1 2.2h8.4l-8.4 13"],
  ["8", "m8.5 2.2c15 0-15 13 0 13 15 8e-6 -15-13 0-13z"],
  ["9", "m6.4 15c6.3 0 6.3-4.2 6.3-8.4 0-6.3-8.4-6.3-8.4 0 0 4.2 8.4 4.2 8.4 0"],
  ["0", "m8.5 2.2c-4.2 0-8.4 13 0 13 8.4 8e-6 4.2-13 0-13z"],
];

const glyphs = new Map<string, Glyph>();
const glyphAssets = new Map<string, GlyphAsset>();
let loaded = false;
let fontMinY = 0;
let fontMaxY = 0;

const buildGlyph = (d: string): Glyph => {
  const samples = samplePathData(d, SAMPLE_COUNT);
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const s of samples) {
    if (s.x < minX) minX = s.x;
    if (s.x > maxX) maxX = s.x;
    if (s.y < minY) minY = s.y;
    if (s.y > maxY) maxY = s.y;
  }

  return {
    samples,
    minX,
    maxX,
    minY,
    maxY,
  };
};

const buildGlyphAsset = (glyph: Glyph): GlyphAsset => {
  const emUnits = fontMaxY - fontMinY;
  const widthUnits = glyph.maxX - glyph.minX;
  const unitScale = (HTML_ASSET_HEIGHT - HTML_ASSET_PADDING * 2) / emUnits;
  const frameWidthPx = Math.ceil((widthUnits + HTML_TRACKING_UNITS) * unitScale + HTML_ASSET_PADDING * 2);

  const canvas = document.createElement("canvas");
  canvas.width = frameWidthPx * STROKE_FRAMES;
  canvas.height = HTML_ASSET_HEIGHT;

  const ctx = canvas.getContext("2d")!;

  for (let frame = 0; frame < STROKE_FRAMES; frame++) {
    ctx.save();
    ctx.translate(
      frame * frameWidthPx + HTML_ASSET_PADDING - glyph.minX * unitScale,
      HTML_ASSET_PADDING - fontMinY * unitScale,
    );
    ctx.scale(unitScale, unitScale);

    for (let pass = 0; pass < STROKE_PASSES; pass++) {
      drawSketchStroke(ctx, glyph.samples, frame, pass, black, STROKE_WIDTH, STROKE_AMP, false);
    }

    ctx.restore();
  }

  return {
    url: canvas.toDataURL("image/png"),
    widthEm: frameWidthPx / HTML_ASSET_HEIGHT,
  };
};

const ensureHtmlAssets = () => {
  if (glyphAssets.size > 0) {
    return;
  }

  for (const [key, glyph] of glyphs) {
    glyphAssets.set(key, buildGlyphAsset(glyph));
  }
};

const appendSpacer = (target: HTMLElement, em: number) => {
  const space = document.createElement("span");
  space.className = HTML_GLYPH_CLASS;
  space.style.width = `${em}em`;
  space.style.height = "1em";
  target.appendChild(space);
};

export const initSketchFont = (): void => {
  if (loaded) return;

  for (const [key, d] of glyphEntries) {
    const glyph = buildGlyph(d);
    glyphs.set(key, glyph);

    if (glyph.minY < fontMinY) fontMinY = glyph.minY;
    if (glyph.maxY > fontMaxY) fontMaxY = glyph.maxY;
  }

  ensureHtmlAssets();
  loaded = true;
};

export const setSketchText = (el: HTMLElement, text: string): void => {
  // if (!loaded) {
  //   initSketchFont();
  // }

  el.textContent = "";

  const row = document.createElement("span");
  row.className = HTML_FONT_CLASS;

  for (const ch of text) {
    if (ch === " ") {
      appendSpacer(row, HTML_SPACE_EM);
      continue;
    }

    const asset = glyphAssets.get(ch)!;

    const glyph = document.createElement("span");
    glyph.className = HTML_GLYPH_CLASS;
    glyph.style.width = `${asset.widthEm}em`;
    glyph.style.height = "1em";
    glyph.style.backgroundImage = `url(${asset.url})`;
    row.appendChild(glyph);
  }

  el.appendChild(row);
};

export const applySketchTextFromDataAttr = (root: ParentNode = document): void => {
  // if (!loaded) {
  //   initSketchFont();
  // }

  const nodes = root.querySelectorAll<HTMLElement>("[sketch]");
  for (const node of nodes) {
    const text = node.innerText ?? node.textContent ?? "";
    setSketchText(node, text);
  }
};

export const drawSketchText = (
  targetCtx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  frame: number = 0,
): void => {
  // if (!loaded) {
  //   initSketchFont();
  // }

  const scale = size / FONT_EM;
  let cursorX = x;

  targetCtx.save();
  targetCtx.translate(0, y);
  targetCtx.scale(scale, scale);

  for (const ch of text) {
    if (ch === " ") {
      cursorX += size * 0.45;
      continue;
    }

    const glyph = glyphs.get(ch)!;

    targetCtx.save();
    targetCtx.translate(cursorX / scale - glyph.minX, 0);
    for (let pass = 0; pass < STROKE_PASSES; pass++) {
      drawSketchStroke(targetCtx, glyph.samples, frame, pass, black, STROKE_WIDTH, STROKE_AMP, false);
    }
    targetCtx.restore();

    const glyphWidth = (glyph.maxX - glyph.minX) * scale;
    cursorX += Math.max(size * 0.35, glyphWidth + size * 0.08);
  }

  targetCtx.restore();
};
