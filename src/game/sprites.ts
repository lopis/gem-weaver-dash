import { black, blue, blue2, cyan, cyan2, green, green2, magenta2, magenta3, orange, orange2, red2, white, yellow, yellow2 } from "./colors";
import { GameItem } from "./game-item";
import { drawSketchStroke, samplePathData, SamplePoint } from "./sketch-path";

export type SpriteLayer = {
  fill: string;
  d: string;
};

export type SpriteName = GameItem | 'UN';
export type SpriteEntry = readonly [SpriteName, ...string[]];
export type SpriteRegistry = SpriteEntry[];

const gemOuterPath = 'm13 9-12 15 31 35 31-35-12-15z';
const gemInnerPath = 'm13 9-12 15h15l16 35 16-35h15l-12-15h-15l11 15h-31l11-15h-15z';

const gemFill = [
  red2,
  orange,
  yellow,
  green,
  cyan,
  blue,
  magenta2,
  black,
  white,
];

const gemSprite = (fill: string): string[] => [
  fill, gemOuterPath,
  '#ffffff88', gemInnerPath,
];

export const sprites: SpriteRegistry = [
  ['UN', // UNICORN
    white, 'm4 0.3-2 1 7 11c-14 14-2 19 8 12 3 13 2 25 2 38h5v-17h2v14h5v-14l6 0.02v17h5v-17l2-0.03v14h5c-0.7-25 6-30-16-29l-13-19 2-5-3-0.7-3 6 1-6-3-0.5-1 4z',
    magenta3, 'm5 13 11-4 23 4-4 6h6l-8 13-13-18-13 3z',
    magenta3, 'm51 28c8-1 4 8 10 18-10-0.5-18-17-10-18z'
  ],
  ['FR', // STRAWBERRY
    red2, "m59 59c-11 11-70-5-38-38s48 27 38 38z",
    green2, "m36 2-10 8-8-5-1 12-12 1 5 8-8 10s17 7 29-6c12-13 5-27 5-27z",
  ],
  ['FY', // BANANA
    yellow2, "m50 1c-5 1-2 5 0 9 4 36-27 34-49 42 15 21 54 7 59-15s-3-26-4-28c-1-5-0.2-9-6-8z",
    yellow, "m7 54c-7 0.5-8-6-0.7-7 59-6 32-42 50-38 2 2 13 48-49 45z",
  ],
  ['FB', // BLUEBERRY
    blue, "m48 17a16 14 29 0 0 -13 7 16 14 29 0 0 7 20 16 14 29 0 0 21 -5 16 14 29 0 0 -6 -20 16 14 29 0 0 -8 -2z",
    blue, "m22 17a18 19 51 0 0 -14 5 18 19 51 0 0 -4 26 18 19 51 0 0 26 2 18 19 51 0 0 4 -26 18 19 51 0 0 -12 -6z",
    blue2, "m18 24c-3 1 -6 2 -8 3 0 3 1 6 1 9 3 1 6 1 8 2 2 -3 3 -5 5 -8 -2 -2 -4 -4 -6 -6z"
  ],
  ['FO', // ORANGE
    green, "m34 29c-3 -1 -2 -1 -5 -7 -2 -5 -7 -6 -3 -11 4 -3 7 4 8 7 0 0 -1 -6 5 -12 6 -6 17 -6 17 -6s-2 10 -8 16c-6 6 -13 4 -13 4 2 5 2 9 -2 8z",
    orange, "m19 22c-10 2 -15 14 -11 25 4 11 24 17 24 17s21 -6 24 -17c4 -11 -2 -23 -11 -25s-13 3 -13 3 -3 -5 -13 -3z"
  ],
  ['FV', // GRAPES
    green2, "m17 1c-4 0 -8 1 -9 5 -2 8 3 9 3 14 1 5 0 12 0 12s19 -13 19 -13 -9 0 -13 -2c-3 -2 -5 -5 -4 -8 2 -3 9 0 9 0l2 -5s-3 -1 -7 -1z",
    magenta3, "m32 16c-5 -4 -16 0 -12 8 -7 -4 -15 4 -10 10 -8 4 -5 20 7 15 -1 6 8 9 13 6 -1 7 11 11 15 5 5 10 21 -2 12 -9 2 0 6 -12 -5 -14 3 -4 0 -12 -5 -12 9 -9 -11 -19 -14 -9z"
  ],
  ['HN', // HAND
    yellow, "m5 8c4 8 12 24 12 24 -6 -5 -13 -3 -13 1 -1 4 4 4 6 5 4 3 7 7 10 11 11 14 13 1 16 11s28 -1 26 -11c-2 -8 -6 -3 -7 -16 -4 -20 -16 -14 -30 -10 -3 -7 -7 -13 -11 -19 -5 -6 -10 0 -8 5z"
  ],
  ['FG', // KIWI
    orange2, 'm12 18c-33 42 21 60 43 33 21-27-9-75-43-33z',
    green2, 'm14 20c-23 30 4 50 27 20 23-30-4-50-27-20z',
    white, 'm35 21-12 5-2 13 12-5z'
  ],
  ['HD', // HEDGE
    green2, 'm9 25c-7.5 2.9-10 13-6.1 20 5.8 11 12 5.3 15 6.7 3.7 1.6 3.1 7.2 7 8.6 9 5.6 21 0.35 21-7.3 2-5.6 4.3 1.8 13-7.2 4.6-5.2 5.2-14 0.014-19-7.6-2.2-1.4-8.3-5.2-15-3.5-6.6-13-10-19-6.4-5.5 3-5 1.9-8.4-0.46-8.7-4.4-21 2.8-21 13-0.071 2.7 0.69 5.5 2.3 7.8z',
    red2, 'm12 19-5.7-16 14 9.2c-0.64 6.5-1.2 7-8.1 7.2z',
    red2, 'm40 18 18-10-10 19c-7.8 0.33-9.3-3.5-8.1-9.1z',
    red2, 'm23 36c7.5-1.6 12 0.24 11 9.2l-20 12z',
  ],
  ['HG', // GRASS
    green, 'm25 34 4 2m2-8 1 7m8-2-4 3',
  ],
  ['FC', // WATER
    cyan, 'm35 8.8c-21-1.3-53 24-1.5 29 4.6 0.87-14 3-14 8.5s22 11 35 7.5c2.7-0.72 5.9-2.2 6.2-5.3-0.67-8.8-6.9-8.3-12-12-6.5-3.5 9.3-2.6 11-7 2-6.4-6.7-20-25-21z',
  ],
  [
    'HL', // LAKE
    cyan, 'm0 0h64v64h-64z',
  ],
  ['GR', ...gemSprite(gemFill[0])],
  ['GO', ...gemSprite(gemFill[1])],
  ['GY', ...gemSprite(gemFill[2])],
  ['GG', ...gemSprite(gemFill[3])],
  ['GC', ...gemSprite(gemFill[4])],
  ['GB', ...gemSprite(gemFill[5])],
  ['GV', ...gemSprite(gemFill[6])],
  ['GK', ...gemSprite(gemFill[7])],
  ['GW', ...gemSprite(gemFill[8])],
];

export type BuiltSpriteLayer = {
  fill: string;
  path: Path2D;
  samples: SamplePoint[];
};

export type BuiltSprite = {
  name: string;
  sz: number;
  scale: number;
  layers: BuiltSpriteLayer[];
};

export type SketchSettings = {
  strokeWidth: number;
  strokeAmp: number;
  strokeSamples: number;
};

export type SpriteSheetAsset = {
  name: string;
  sprite: BuiltSprite;
  sheet: HTMLCanvasElement;
  frameWidth: number;
  frameHeight: number;
};

const SPRITE_SIZE = 64;
const UNICORN_SPRITE_SIZE = 80;
const SPRITE_PADDING = 4;
const STROKE_COLOR = black;
const RENDER_SCALE = 2;
const SPRITE_FRAME_COUNT = 5;

const getSpriteSize = (name: SpriteName): number => (name === 'UN' ? UNICORN_SPRITE_SIZE : SPRITE_SIZE);
const getSpriteScale = (name: SpriteName): number => (name === 'UN' ? UNICORN_SPRITE_SIZE / SPRITE_SIZE : 1);

export const buildSprite = (name: SpriteName, sampleCount: number = 100): BuiltSprite => {
  const source = sprites.find(([id]) => id === name) ?? [name];
  const layers: BuiltSpriteLayer[] = [];

  for (let i = 1; i + 1 < source.length; i += 2) {
    const fill = source[i];
    const d = source[i + 1];
    layers.push({
      fill,
      path: new Path2D(d),
      samples: samplePathData(d, sampleCount),
    });
  }

  return {
    name,
    sz: getSpriteSize(name),
    scale: getSpriteScale(name),
    layers,
  };
};

const drawSpriteToContext = (
  targetCtx: CanvasRenderingContext2D,
  sprite: BuiltSprite,
  frame: number,
  settings: SketchSettings,
  offsetX: number = 0,
): void => {
  targetCtx.save();
  targetCtx.translate(offsetX + SPRITE_PADDING * RENDER_SCALE, SPRITE_PADDING * RENDER_SCALE);
  targetCtx.scale(RENDER_SCALE, RENDER_SCALE);
  targetCtx.scale(sprite.scale, sprite.scale);

  for (let i = 0; i < sprite.layers.length; i++) {
    const layer = sprite.layers[i];
    targetCtx.fillStyle = layer.fill;
    targetCtx.fill(layer.path);
    const stroke = sprite.name === 'FC' ? cyan2 :
      sprite.name === 'HL' ? cyan2 :
      sprite.name === 'HG' ? green : STROKE_COLOR

    drawSketchStroke(
      targetCtx,
      layer.samples,
      frame,
      i,
      stroke,
      settings.strokeWidth / sprite.scale,
      settings.strokeAmp,
    );
  }

  targetCtx.restore();
};

export const buildSpriteSheet = (sprite: BuiltSprite, settings: SketchSettings): HTMLCanvasElement => {
  const tile = (sprite.sz + SPRITE_PADDING * 2) * RENDER_SCALE;
  const sheet = document.createElement("canvas");
  sheet.width = tile * SPRITE_FRAME_COUNT;
  sheet.height = tile;
  const sheetCtx = sheet.getContext("2d") as CanvasRenderingContext2D;

  for (let frame = 0; frame < SPRITE_FRAME_COUNT; frame++) {
    drawSpriteToContext(sheetCtx, sprite, frame, settings, frame * tile);
  }

  return sheet;
};

export const defaultSpriteSettings: SketchSettings = {
  strokeWidth: 4,
  strokeAmp: 2,
  strokeSamples: 100,
};

export const buildSpriteAssets = (
  settings: Partial<SketchSettings> = {},
): SpriteSheetAsset[] => {
  const finalSettings: SketchSettings = {
    ...defaultSpriteSettings,
    ...settings,
  };

  const out: SpriteSheetAsset[] = [];

  for (const [name] of sprites) {
    const sprite = buildSprite(name, finalSettings.strokeSamples);
    const sheet = buildSpriteSheet(sprite, finalSettings);
    out.push({
      name,
      sprite,
      sheet,
      frameWidth: (sprite.sz + SPRITE_PADDING * 2) * RENDER_SCALE,
      frameHeight: (sprite.sz + SPRITE_PADDING * 2) * RENDER_SCALE,
    });
  }

  return out;
};

export const spriteAssets: SpriteSheetAsset[] = [];

export const initSprites = () => {
  if (spriteAssets.length > 0) {
    return spriteAssets;
  }

  const built = buildSpriteAssets();
  for (const asset of built) {
    spriteAssets.push(asset);
    const base64ImageData = asset.sheet.toDataURL("image/png");
    document.body.style.setProperty(`--b-${asset.name}`, `url(${base64ImageData})`);
  }
};
