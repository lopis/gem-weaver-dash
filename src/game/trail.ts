import { ctx4 } from '@/core/canvas';
import { Vec2 } from '@/core/util/vec2';
import { rainbowSprite } from './image-generator';
import { player } from './unicorn';

const TRAIL_DURATION = 200;
const TRAIL_SPACING = 0.04;

type TrailSprite = {
  pos: Vec2
  angle: number
  born: number
}

let sprites: TrailSprite[] = [];
let prevPos: Vec2 | null = null;
let distanceSinceLastSpawn = 0;

export const resetTrail = () => {
  sprites = [];
  prevPos = null;
  distanceSinceLastSpawn = 0;
};

export const drawTrail = (cellSize: number) => {
  if (!prevPos) {
    prevPos = { ...player.pos };
  }

  // Generate sprites
  if (player.moving) {
    const dx = player.pos.x - prevPos.x;
    const dy = player.pos.y - prevPos.y;
    const segmentLength = Math.hypot(dx, dy);

    if (segmentLength > 0) {
      distanceSinceLastSpawn += segmentLength;

      while (distanceSinceLastSpawn >= TRAIL_SPACING) {
        const overshoot = distanceSinceLastSpawn - TRAIL_SPACING;
        const traveledOnSegment = segmentLength - overshoot;
        const alpha = traveledOnSegment / segmentLength;

        sprites.push({
          pos: {
            x: prevPos.x + dx * alpha,
            y: prevPos.y + dy * alpha,
          },
          angle: player.angle,
          born: performance.now(),
        });

        distanceSinceLastSpawn = overshoot;
      }
    }
  }

  prevPos = { ...player.pos };

  // Draw Sprites
  const now = performance.now();
  sprites = sprites.filter(s => now - s.born < TRAIL_DURATION);
  const sprite = rainbowSprite;
  const ctx = ctx4;
  for (const s of sprites) {
    const opacity = 1 - (now - s.born) / TRAIL_DURATION;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(cellSize * s.pos.x + cellSize / 2, cellSize * s.pos.y + cellSize / 2);
    ctx.rotate(s.angle - Math.PI / 2);
    ctx.drawImage(sprite, -cellSize / 2, -cellSize / 2, cellSize, cellSize);
    ctx.restore();
  }
};
