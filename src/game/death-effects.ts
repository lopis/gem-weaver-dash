import { addTimeEvent } from "@/core/timer";
import { Vec2 } from "@/core/util/vec2";
import { ObstacleItem } from "./game-item";

const FX_DURATION = 1200;

export const spawnObstacleDeathFx = (cell: Vec2, obstacle: ObstacleItem) => {
  u.classList.remove('dead-bush');
  u.classList.add('dead-bush');

  const obstacleEl = document.getElementById(`i-${cell.x}${cell.y}`);
  const hitClass = 'obstacle-hit-bush';
  obstacleEl?.classList.add(hitClass);

  addTimeEvent(() => {
    obstacleEl?.classList.remove(hitClass);
  }, 0, 0, FX_DURATION);
};
