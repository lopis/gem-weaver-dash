import { gameItem, GameItem, GridItem, isObstacleItem } from "./game-item";
import { addDash } from "./game-data";
import { player } from "./unicorn";
import { vec2, Vec2, bresenham } from "@/core/util/vec2";
import { addTimeEvent } from "@/core/timer";
import { collectCaughtItem } from "./inventory";
import { drawTrail, resetTrail } from "./trail";
import { spawnHighlight } from "./highlight";
import { spawnObstacleDeathFx } from "./death-effects";
import { on } from "@/core/event";
import { GAME_EVENT_GRID_CLICK } from "./event-manifest";
import { isInteractionLocked, lockInteractions } from "./interaction-lock";
import { DecodedLevel } from "./level-data";
import { GRID_COLS, GRID_ROWS } from "./constants";

export class GameGrid {
  // First coord is Y, second is X
  grid: Array<Array<GridItem | null>>
  gridPos: Vec2 = vec2(6, 6)
  deathPending = false

  constructor(level: DecodedLevel) {
    gd.querySelectorAll('i[id^="i-"], .highlight').forEach((el) => el.remove());

    this.grid = Array.from({ length: GRID_ROWS }, (_, y) =>
      Array.from({ length: GRID_COLS }, (_, x) => {
        const item = level.map[y][x] as GameItem | null;
        return item ? gameItem(x, y, item) : null;
      }),
    );

    player.snapTo(level.unicornPos.x, level.unicornPos.y);
  resetTrail();
    this.gridPos = vec2(level.unicornPos.x, level.unicornPos.y);

    this.grid.forEach((row, y) => {
      row.forEach((gridItem, x) => {
        const $item = document.createElement('i');
        $item.id = `i-${x}${y}`;
        this.placeAtGridCell($item, x, y);
        if (gridItem) {
          $item.classList.add(gridItem.s);
          $item.dataset['i'] = gridItem.s;
        }
        gd.appendChild($item)
      })
    });

    this.placeUnicorn(player.pos.x, player.pos.y);

    on(GAME_EVENT_GRID_CLICK, (pos) => this.moveUnicorn(pos))
  }

  private placeAtGridCell(element: HTMLElement, x: number, y: number) {
    element.style.gridColumn = `${Math.round(x) + 1}`;
    element.style.gridRow = `${Math.round(y) + 1}`;
  }

  private placeUnicorn(x: number, y: number) {
    u.style.left = `${((x + 0.5) / GRID_COLS) * 100}%`;
    u.style.top = `${((y + 0.5) / GRID_ROWS) * 100}%`;
    u.style.setProperty('--ux', player.facingRight ? '-1' : '1');
  }

  moveUnicorn(pos: {x: number, y: number}) {
    if (isInteractionLocked() || player.dead || this.deathPending) {
      return;
    }

    const rect = gd.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const relX = Math.max(0, Math.min(rect.width - 0.0001, pos.x - rect.left));
    const relY = Math.max(0, Math.min(rect.height - 0.0001, pos.y - rect.top));
    const targetGX = Math.floor((relX / rect.width) * GRID_COLS);
    const targetGY = Math.floor((relY / rect.height) * GRID_ROWS);
    const clampedX = Math.max(0, Math.min(GRID_COLS - 1, targetGX));
    const clampedY = Math.max(0, Math.min(GRID_ROWS - 1, targetGY));

    const path = bresenham(this.gridPos.x, this.gridPos.y, clampedX, clampedY);
    // skip first cell (already standing there)
    const newCells = path.slice(1);
    if (newCells.length === 0) return;
    addDash();
    const dashStepDelay = Math.max(90, Math.floor(player.moveDuration / newCells.length));

    let stopAt: Vec2 | null = null;
    let deathObstacle: 'HD' | 'HL' | null = null;

    for (let stepIndex = 0; stepIndex < newCells.length; stepIndex++) {
      const cell = newCells[stepIndex]!;
      spawnHighlight(cell);

      const item = this.grid[cell.y]?.[cell.x];
      if (item && !item.taken) {
        if (isObstacleItem(item.s)) {
          // Stop on obstacle cell, then apply delayed death.
          stopAt = vec2(cell.x, cell.y);
          deathObstacle = item.s;
          break;
        }

        if (item.s === 'HG') {
          continue;
        }

        // Fruit and gem collection.
        item.taken = true;
        const $item = document.getElementById(item.id);
        const collectDelay = stepIndex * dashStepDelay;
        addTimeEvent(() => {
          collectCaughtItem(item.s);
          if ($item) {
            $item.classList.add('animate');
            addTimeEvent(() => {
              $item.textContent = '';
              $item.classList.remove(item.s, 'animate');
              delete $item.dataset['i'];
            }, 0, 0, 500);
          }
        }, 0, 0, collectDelay);
      }
    }

    const destination = stopAt ?? vec2(clampedX, clampedY);
    this.gridPos = destination;
    player.moveTo(destination.x, destination.y);
    this.placeUnicorn(destination.x, destination.y);

    if (deathObstacle) {
      this.deathPending = true;
      addTimeEvent(() => {
        this.deathPending = false;
        lockInteractions();
        player.die(destination.x, destination.y);
        spawnObstacleDeathFx(destination, deathObstacle);
      }, 0, 0, 100);
    }
  }

  update(delta: number) {
    const cellSize = gd.clientWidth / GRID_COLS;

    player.update(delta);

    drawTrail(cellSize);
  }
}
