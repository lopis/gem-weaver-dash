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
    green2, "m36 2-10 8-8-5-1 12-12 1 5 8-8 10 19 .7 17-17z",
  ],
  ['FY', // BANANA
    yellow2, "m50 1c-5 1-2 5 0 9 4 36-27 34-49 42 15 21 54 7 59-15s-3-26-4-28c-1-5-0.2-9-6-8z",
    yellow, "m7 54c-7 0.5-8-6-0.7-7 59-6 32-42 50-38 2 2 13 48-49 45z",
  ],
  ['FB', // BLUEBERRY
    blue, "m35 25c-10-15-34-6-34 13s28 22 35 2c10 13 30 5 27-10-3-15-23-17-28-5z",
    blue2, "m10 27 1 9 8 2 5-8-6-6z"
  ],
  ['FO', // ORANGE
    green, "m23 14c-6-3 3-11 9 4-.3-7 7-17 23-16-4 12-13 21-22 18 2 5 1 9-3 9s-1-12-7-15z",
    orange, "m30 63c32 0 28-40 0-40-28 0-32 40 0 40z"
  ],
  ['FV', // GRAPES
    green2, "m8 5c-3 7 4 8 4 26l19-14c-21-1-17-10-17-10 1-3 9 0 9 0l2-5s-14-4-17 3z",
    magenta3, "m32 15c-5-4-16 2-12 10-7-5-15 3-10 9-7 4-5 19 7 14-2 6 7 11 13 7-1 8 11 12 15 5 5 10 19-4 11-10 0 0 7-12-5-13 4-5 .9-12-6-12 8-8-8-21-13-10z"
  ],
  ['HN', // HAND
    yellow, "m16 31s-13-7-13 .03c0 7 8 8 16 17s13 1 16 11 28-2 26-11c-2-9-3 2-7-16s-20-16-29-7c-3-7-7-14-12-21-5-7-11-1-8 5 3 6 12 22 12 22z"
  ],
  ['FG', // KIWI
    orange2, 'm12 18c-33 42 21 60 43 33 21-27-9-75-43-33z',
    green2, 'm14 20c-23 30 4 50 27 20 23-30-4-50-27-20z',
    white, 'm35 21-12 5-2 13 12-5z'
  ],
  ['HD', // HEDGE
    green2, 'm10 25c-17 11 .05 33 8 27-2 11 28 16 28 1 16 2 21-14 9-28 9-20-17-27-25-17-15-12-28 11-20 17z',
    red2, 'm6 3s24 7 14 16c-10 9-14-16-14-16z',
    red2, 'm58 8s-7 28-17 17 17-17 17-17z',
    red2, 'm33 36c16 13-20 22-20 22s4-35 20-22z',
  ],
  ['HG', // GRASS
    green, 'm25 34 4 2m2-8 1 7m8-2-4 3',
  ],
  ['FC', // WATER
    cyan, 'm33 10c-15-1-53 21-2 29 5 1-14 3-14 9 0 6 42 11 42 2 0-9-6-8-12-12-6-4 11-2 11-7 0-13-10-20-25-21z',
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
