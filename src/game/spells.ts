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
const LUT_W = 7;

let spellPending = false;

const complementLUT: readonly ColorId[] = [CG, CB, CV, CR, CO, CO, CY, CW, CK];
const gemLUT: readonly GemItem[] = ['GR', 'GO', 'GY', 'GG', 'GC', 'GB', 'GV', 'GK', 'GW'];
// ADD LUT
// [
//   [0, 1, 1, 2, 6, 6, 6],
//   [1, 1, 1, 2, 3, 6, 8],
//   [1, 1, 2, 3, 3, 3, 8],
//   [2, 2, 3, 3, 4, 4, 4],
//   [6, 3, 3, 4, 4, 4, 5],
//   [6, 6, 3, 4, 4, 5, 6],
//   [6, 8, 8, 4, 5, 6, 6],
// ]
const addLUT = '0112666111236811233382233444633444566344566884566';
// SUB LUT
// [
//   [7, 0, 0, 0, 0, 0, 0],
//   [2, 7, 0, 1, 1, 1, 1],
//   [2, 2, 7, 2, 2, 2, 2],
//   [3, 3, 4, 7, 2, 2, 3],
//   [4, 4, 4, 5, 7, 3, 4],
//   [5, 5, 5, 5, 6, 7, 4],
//   [4, 6, 6, 6, 0, 6, 7],
// ]
const subLUT = '7700000270111127722223347233444573455556745666007';

export const lookupAdd = (
  left: ColorId,
  right: ColorId,
): SpellResult => {
  const a = left;
  const b = right;

  // Black is the identity for add.
  if (a === CK) return b;
  if (b === CK) return a;
  // White absorbs all add inputs.
  if (a === CW || b === CW) return CW;

  return (addLUT.charCodeAt(a * LUT_W + b) - 48) as ColorId;
};

export const lookupSub = (
  left: ColorId,
  right: ColorId,
): SpellResult => {
  const a = left;
  const b = right;

  // Black - any = black.
  if (a === CK) return CK;
  // White - any = complement.
  if (a === CW) return complementLUT[b];
  // Any - white = black.
  if (b === CW) return CK;
  // Any - black = any.
  if (b === CK) return a;

  return (subLUT.charCodeAt(a * LUT_W + b) - 48) as ColorId;
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

const gemForColor = (color: ColorId): GemItem => gemLUT[color];

const getSpaceItem = (space: HTMLElement): GameItem | undefined => {
  const token = space.dataset.i;
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

  delete space.dataset.i;
  delete space.dataset.c;
};

const setSpaceItem = (space: HTMLElement, item: GameItem, color: ColorId): void => {
  const icon = space.querySelector('i') as HTMLElement | null;
  if (!icon) return;

  space.classList.add(item);
  icon.className = item;
  space.dataset.i = item;
  space.dataset.c = String(color);
};

const runSpell = (lookup: (left: ColorId, right: ColorId) => SpellResult | undefined): SpellResult | undefined => {
  if (spellPending || isInteractionLocked()) return undefined;

  const left = s1.dataset.c;
  const right = s2.dataset.c;

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


