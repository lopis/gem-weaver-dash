import { on } from "@/core/event";
import { addTimeEvent } from "@/core/timer";
import { GAME_EVENT_SPELL_ADD, GAME_EVENT_SPELL_SUB } from "./event-manifest";
import { addToInventory } from "./inventory";
import { addSpell } from "./game-data";
import { isInteractionLocked, lockInteractions, unlockInteractions } from "./interaction-lock";
import {
  CB,
  CC,
  CG,
  CK,
  CO,
  CR,
  CV,
  CW,
  CY,
  ColorId,
  GemItem,
  GameItem,
  isGameItem,
  parseColorId,
} from "./game-item";

export type SpellKind = 'add' | 'sub';
export type SpellResult = ColorId;

const SPELL_PHASE_MS = 1000;

let spellPending = false;

const colorOf = (id: number): ColorId => id as ColorId;

const complementOf = (color: ColorId): ColorId => {
  switch (color) {
    case CR: return CG;
    case CG: return CR;
    case CO: return CB;
    case CB: return CO;
    case CY: return CV;
    case CV: return CY;
    case CC: return CO;
    case CK: return CW;
    case CW: return CK;
    default: return color;
  }
};

const addLUT: Array<Array<number>> = [
// R  O  Y  G  C  B  V
  [0, 1, 1, 2, 6, 6, 6], // R
  [1, 1, 1, 2, 3, 6, 8], // O
  [1, 1, 2, 3, 3, 3, 8], // Y
  [2, 2, 3, 3, 4, 4, 4], // G
  [6, 3, 3, 4, 4, 4, 5], // C
  [6, 6, 3, 4, 4, 5, 6], // B
  [6, 8, 8, 4, 5, 6, 6], // V
];

// SUB is row minus column
const subLUT: Array<Array<number>> = [
// R  O  Y  G  C  B  V
  [7, 0, 0, 0, 0, 0, 0], // R = 0
  [2, 7, 0, 1, 1, 1, 1], // O = 1
  [2, 2, 7, 2, 2, 2, 2], // Y = 2
  [3, 3, 4, 7, 2, 2, 3], // G = 3
  [4, 4, 4, 5, 7, 3, 4], // C = 4
  [5, 5, 5, 5, 6, 7, 4], // B = 5
  [4, 6, 6, 6, 0, 6, 7], // V = 6
];

export const lookupAdd = (
  left: ColorId,
  right: ColorId,
): SpellResult => {
  const a = left;
  const b = right;

  // Black + any = black
  if (a === CK || b === CK) return CK;
  // White + any = the other color
  if (a === CW) return b;
  if (b === CW) return a;

  return colorOf(addLUT[a][b]);
};

export const lookupSub = (
  left: ColorId,
  right: ColorId,
): SpellResult => {
  const a = left;
  const b = right;

  // Black - any = complement
  if (a === CK) return complementOf(b);
  // White - any = white
  if (a === CW) return CW;
  // Any - white = any
  if (b === CW) return a;
  // Any - black = any
  if (b === CK) return a;

  return colorOf(subLUT[a][b]);
};

export const lookupSpell = (
  kind: SpellKind,
  left: ColorId,
  right: ColorId,
): SpellResult | undefined => {
  switch (kind) {
    case 'add':
      return lookupAdd(left, right);
    case 'sub':
      return lookupSub(left, right);
    default:
      return undefined;
  }
};

const gemForColor = (color: ColorId): GemItem => {
  switch (color) {
    case CR: return 'GR';
    case CO: return 'GO';
    case CY: return 'GY';
    case CG: return 'GG';
    case CC: return 'GC';
    case CB: return 'GB';
    case CV: return 'GV';
    case CK: return 'GK';
    default: return 'GW';
  }
};

const getSpaceItem = (space: HTMLElement): GameItem | undefined => {
  const token = space.dataset['i'];
  if (!token || !isGameItem(token)) return undefined;
  return token;
};

const clearSpace = (space: HTMLElement): void => {
  const token = getSpaceItem(space);
  if (token && isGameItem(token)) {
    space.classList.remove(token);
  }

  const icon = space.querySelector('i') as HTMLElement | null;
  if (icon) {
    icon.className = '';
  }

  delete space.dataset['i'];
  delete space.dataset['c'];
};

const setSpaceItem = (space: HTMLElement, item: GameItem, color: ColorId): void => {
  const icon = space.querySelector('i') as HTMLElement | null;
  if (!icon) return;

  space.classList.add(item);
  icon.className = item;
  space.dataset['i'] = item;
  space.dataset['c'] = String(color);
};

const runSpell = (lookup: (left: ColorId, right: ColorId) => SpellResult | undefined): SpellResult | undefined => {
  if (spellPending || isInteractionLocked()) return undefined;

  const left = s1.dataset['c'];
  const right = s2.dataset['c'];

  if (!left || !right) return undefined;
  const leftId = parseColorId(left);
  const rightId = parseColorId(right);
  if (leftId === undefined || rightId === undefined) return undefined;

  if (!getSpaceItem(s1) || !getSpaceItem(s2)) return undefined;

  const result = lookup(leftId, rightId);
  if (result === undefined) return undefined;
  const resultGem = gemForColor(result);
  addSpell();

  spellPending = true;
  lockInteractions();
  s1.classList.add('animate');
  s2.classList.add('animate');

  addTimeEvent(() => {
    clearSpace(s1);
    clearSpace(s2);

    setSpaceItem(s3, resultGem, result);
    s3.classList.add('animate');

    addTimeEvent(() => {
      addToInventory(resultGem);
      clearSpace(s3);
      s3.classList.remove('animate');
      s1.classList.remove('animate');
      s2.classList.remove('animate');
      spellPending = false;
      unlockInteractions();
    }, SPELL_PHASE_MS);
  }, SPELL_PHASE_MS);

  return result;
}

const spellAdd = () => runSpell(lookupAdd);

const spellSub = () => runSpell(lookupSub);


export const initSpellListener = (): void => {
  on(GAME_EVENT_SPELL_ADD, spellAdd);
  on(GAME_EVENT_SPELL_SUB, spellSub);
};


