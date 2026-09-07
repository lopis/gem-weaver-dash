import { dash } from "@/core/audio";
import { easeOut } from "@/core/util/util";
import { vec2, Vec2 } from "@/core/util/vec2";

export class Unicorn {
  pos: Vec2
  private startPos: Vec2
  private targetPos: Vec2
  private moveTime = 0
  readonly moveDuration = 200
  prevT = 0;
  t = 0;
  moving = false
  angle = 0
  facingRight = false
  dead = false

  constructor() {
    this.pos = vec2(0, 0);
    this.startPos = vec2(0, 0);
    this.targetPos = vec2(0, 0);
  }

  snapTo(x: number, y: number) {
    const p = vec2(x, y);
    this.pos = p;
    this.startPos = p;
    this.targetPos = p;
    this.dead = false;
    this.facingRight = x <= 5;
    this.moveTime = this.moveDuration;
    this.moving = false;
    u.classList.remove('dead');
  }

  moveTo(x: number, y: number) {
    if (this.dead) {
      return;
    }

    const dx = x - this.pos.x;
    if (dx > 0.001) {
      this.facingRight = true;
    } else if (dx < -0.001) {
      this.facingRight = false;
    }

    this.angle = Math.atan2(y - this.pos.y, x - this.pos.x);
    this.startPos = { ...this.pos };
    this.targetPos = vec2(x, y);
    this.moveTime = 0;
    dash();
  }

  die(x: number, y: number) {
    const p = vec2(x, y);
    this.pos = p;
    this.startPos = p;
    this.targetPos = p;
    this.moveTime = this.moveDuration;
    this.moving = false;
    this.dead = true;
    u.classList.add('dead');
  }

  update(delta: number) {
    if (this.dead) {
      this.moving = false;
      return;
    }

    if (this.moveTime < this.moveDuration) {
      this.moving = true;
      this.moveTime = Math.min(this.moveTime + delta, this.moveDuration);
      const t = this.moveTime / this.moveDuration;
      this.prevT = this.t;
      this.t = easeOut(t); // ease-out quad
      this.pos = vec2(
        this.startPos.x + (this.targetPos.x - this.startPos.x) * this.t,
        this.startPos.y + (this.targetPos.y - this.startPos.y) * this.t,
      );
    } else {
      this.moving = false;
    }
  }
}

export const player = new Unicorn();
