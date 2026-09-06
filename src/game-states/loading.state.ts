import { State } from '@/core/state';
import { gameStateMachine } from '@/game-state-machine';
import { applySpellIcons, init as initImages } from '@/game/image-generator';
import { initMouse } from '@/game/mouse';
import { applySketchTextFromDataAttr, initSketchFont } from '@/game/sketch-font';
import { initSpellListener } from '@/game/spells';
import { initSprites } from '@/game/sprites';
import { menuState } from './menu.state';

const nextFrame = () => new Promise<void>((resolve) => {
  requestAnimationFrame(() => resolve());
});

class LoadingState implements State {
  onEnter() {
    ld.classList.toggle('show', true);
    this.bootstrap();
  }

  private async bootstrap() {
    const tasks: Array<() => void> = [
      initImages,
      initSprites,
      initMouse,
      initSpellListener,
      initSketchFont,
      applySketchTextFromDataAttr,
      applySpellIcons,
      () => gameStateMachine.setState(menuState),
    ];

    // Let loading UI paint before and between expensive init work.
    await nextFrame();

    for (const task of tasks) {
      task();
      await nextFrame();
    }
  }

  onLeave() {
    ld.classList.toggle('show', false);
  }

  onUpdate() {}
}

export const loadingState = new LoadingState();
