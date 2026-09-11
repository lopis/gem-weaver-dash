import { vec2, Vec2 } from "@/core/util/vec2";
import { GRID_COLS, GRID_ROWS } from "./constants";
import { GameItem, GemItem, levelTokens, rainbowGems } from "./game-item";

const BITS_PER_CELL = 5;

export const Levels = [
  /* 1 */ 'AAAAAAAAAICQ1GIATABABQAAAAAAAAApAQAAgCqlBA0AAKSUFTgAqpQSAPAAAFJWAAAAAAAAAKgTAAAAAAAAAA',
  /* 2 */ 'fVJKKaWUUkoAAAAASClrAGLKCqQEFQAABJBSSimllEBKAICUUgIpAQFSSgGkBAAAAECVsgICAAFASgkAAABICQ',
  /* 3 */ 'eACACioAAIAgpZSSCAAkkFJKQUCVEgAAiABAygoAEARUKQEAgIgKpKwAAEEAIIIIIgAAQBBBBAEAAAAAAKACAA',
  /* 4 */ 'AADUCgAAAAAAAADgFAAScxKAIAAAibkKAAAAyMScBAAAAEBiDgBgAAAyMQcArQCAmpgDlBoAAAAAUEoBAAAAAA',
  /* 5 */ 'AAAAAIBMAIBaAQAOBAAqABJIIAEAADxZAAAASCCBVAAA4GQBYFUggWQSAAAAAAUAUAGgAEgAADCUAgAAAIZSCg',
  /* 6 */ 'AAAAAAAAAICKIIQwAAAqMsY4AQAAyFDjBAAAMEOpEQAAAI0xBgIAAIEQQlUBAARUAGAFABAIIZQAAAAAAAAAAA',
  /* 7 */ 'eAAAAAAAAEgJgJSgSgkAAAAAAAAIQKWkwASgAgAAAABIAICUoAIJZJUASCABcLIBwOQDFAAAAACAUkoppZRSCg',
  /* 8 */ 'AAAAAAAAAAAAAAgAAFAAAAAAAE4pSwGQ3jkFSCCBBPIYWWWVVVZjjDHGGGMMpZRSSimllFJKKaWUUkoppZRSCg',
  /* 9 */ 'EAAAAAAAAAAAAAAAAACqBBJIAAAAVQIJJAAgpKTUWgAAEGOMMQIAAAAAAAAAAJRSSikAoAJgDAAAAAAAAAAAAA',
  /* 10 */ 'AFJKAAAAQkgpAQAAVCGliinGBAAAMcYYIwAAxLhijAAAkGJUMQEAKogxRgAAAAAAAAAAIAghxhgLAAAAqAAAAA',
  /* 11 */ 'AEBKAAAAUspQJQAAKMlKATEChAAoEsQIEAKgAAAAABAAWKWUAFTwDAAAjDoGNRQAAM4BtBpYwTlHUkoBAABICQ',

  /* 12 */ 'AAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAASSCCBlBJIIIEEEkggpQQSSCmBBBJIIAEAAAAAAAAAAAAAAAAAAA',
  /* 13 */ 'AFJKCqiUEgAJKKASAAAkoJRKCQKQgAIqAQBVVgqolBKklBwATimQAHAOOAVUSsAB5xRQCQAHgFNApZRcrU6pCg',
];

export const levelDashPar = [
  3, /* 1 */
  9, /* 2 */
  5, /* 3 */
  4, /* 4 */
  4, /* 5 */
  4, /* 6 */
  2, /* 7 */
  6, /* 8 */
  3, /* 9 */
  3, /* 10 */
  6, /* 11 */

  9, /* 12 */
  9, /* 13 */
]

/**
 * Info Text
 *
 * The info text area nudges that help the player in the first levels.
 * They are HTML text elements with selector [help], e.g. [help=1].
 *
 * Level 0:
 *  show help 1 and 2
 * Level 1:
 *  show help 3;
 *  after catching 6 fruit, show help 4;
 *  after selecting a fruit from inventory, show help 5 and hide help 4;
 *  after putting fruits in both spaces, hide help 5 and show help 6;
 *  after doing the spell, hide help 6.
 */

export interface DecodedLevel {
  map: Array<Array<GameItem | null>>;
  unicornPos: Vec2;
  initialInventory: GemItem[];
}

const fromBase64Url = (str: string): Uint8Array => {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
};

const bytesToBits = (bytes: Uint8Array): number[] => {
  const bits: number[] = [];

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    for (let b = 0; b < 8; b++) {
      bits.push((byte >> b) & 1);
    }
  }

  return bits;
};

const readBits = (bits: number[], cursor: { pos: number }, bitCount: number): number => {
  let value = 0;
  for (let i = 0; i < bitCount; i++) {
    value |= bits[cursor.pos + i] << i;
  }
  cursor.pos += bitCount;
  return value;
};

const decodeInitialInventory = (mask: number): GemItem[] => {
  const out: GemItem[] = [];
  for (let i = 0; i < rainbowGems.length; i++) {
    if ((mask >> i) & 1) {
      out.push(rainbowGems[i]!);
    }
  }
  return out;
};

export const decodeLevel = (index: number): DecodedLevel => {
  const encoded = Levels[index]!;
  const bytes = fromBase64Url(encoded);
  const inventoryMask = bytes[0]!;
  const payload = bytes.subarray(1);
  const bits = bytesToBits(payload);
  const cursor = { pos: 0 };
  const map: Array<Array<GameItem | null>> = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
  let unicornPos = vec2(6, 6);

  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const code = readBits(bits, cursor, BITS_PER_CELL);
      if (code === 0) {
        continue;
      }

      const token = levelTokens[code - 1]!;

      if (token === 'UN') {
        unicornPos = vec2(x, y);
        continue;
      }

      map[y][x] = token;
    }
  }

  return {
    map,
    unicornPos,
    initialInventory: decodeInitialInventory(inventoryMask),
  };
};
