import { addTimeEvent } from '@/core/timer';
import { Vec2 } from '@/core/util/vec2';

const HIGHLIGHT_DURATION = 1000;

export function spawnHighlight(cell: Vec2) {
  const $highlight = document.createElement('div');
  $highlight.className = 'highlight';
  $highlight.style.gridColumn = `${cell.x + 1}`;
  $highlight.style.gridRow = `${cell.y + 1}`;
  gd.insertBefore($highlight, gd.firstChild);
  addTimeEvent(() => $highlight.remove(), 0, 0, HIGHLIGHT_DURATION);
}
