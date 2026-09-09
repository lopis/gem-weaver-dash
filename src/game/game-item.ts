import { vec2, Vec2 } from "@/core/util/vec2";

// R O Y G C B V K W
export const CR = 0 as const;
export const CO = 1 as const;
export const CY = 2 as const;
export const CG = 3 as const;
export const CC = 4 as const;
export const CB = 5 as const;
export const CV = 6 as const;
export const CK = 7 as const;
export const CW = 8 as const;

export const colorIds = [CR, CO, CY, CG, CC, CB, CV, CK, CW] as const;
export type ColorId = (typeof colorIds)[number];

export type FruitItem = 'FR' | 'FO' | 'FY' | 'FG' | 'FC' | 'FB' | 'FV';
export type GemItem = 'GR' | 'GO' | 'GY' | 'GG' | 'GC' | 'GB' | 'GV' | 'GK' | 'GW';
export type SpecialItem = 'HD' | 'HN' | 'HL' | 'HG';
export type ObstacleItem = 'HD' | 'HL';
export type GameItem = FruitItem | GemItem | SpecialItem;

export const fruits: FruitItem[] = ['FR', 'FO', 'FY', 'FG', 'FC', 'FB', 'FV'];
export const gems: GemItem[] = ['GR', 'GO', 'GY', 'GG', 'GC', 'GB', 'GV', 'GK', 'GW'];
export const rainbowGems: GemItem[] = ['GR', 'GO', 'GY', 'GG', 'GC', 'GB', 'GV'];
export const specialItems: SpecialItem[] = ['HD', 'HN', 'HL', 'HG'];
export const levelTokens: Array<'UN' | GameItem> = ['UN', ...fruits, ...gems, ...specialItems];
export const inventoryItems: GameItem[] = [...fruits, ...gems];
export const spawnItems: GameItem[] = [...fruits, ...gems];

const colorMap = 'ROYGCBVKW';
const colorFromInitial = (id: string): ColorId => {
  const index = colorMap.indexOf(id);
  return (index === -1 ? CW : index) as ColorId;
};

export const colorOfItem = (item: GameItem): ColorId => {
  return colorFromInitial(item[1]);
};

const gameItems: GameItem[] = [...inventoryItems, ...specialItems];
const gameItemSet = new Set<GameItem>(gameItems);

export const isGameItem = (value: string): value is GameItem => gameItemSet.has(value as GameItem);
export const isFruitItem = (value: GameItem): value is FruitItem => value[0] === 'F';
export const isGemItem = (value: GameItem): value is GemItem => value[0] === 'G';
export const isObstacleItem = (value: GameItem): value is ObstacleItem => value === 'HD' || value === 'HL';
export const isColorId = (value: number): value is ColorId => Number.isInteger(value) && value >= CR && value <= CW;
export const parseColorId = (value: string): ColorId | undefined => {
  const n = Number(value);
  return isColorId(n) ? n : undefined;
};

export interface GridItem {
  s: GameItem;
  pos: Vec2,
  id: string,
  taken?: boolean,
}

export const gameItem = (x: number, y: number, s: GameItem): GridItem => ({ pos: vec2(x, y), s, id: `i-${x}${y}` });
