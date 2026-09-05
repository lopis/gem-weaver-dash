import { emit } from "@/core/event"
import { GameEvent } from "./event-manifest"
import { isInteractionLocked } from "./interaction-lock";
import { isGameItem } from "./game-item";
import { Levels } from "./level-data";

export const initMouse = () => {
  gameGrid.addEventListener('click', (event) => {
    if (isInteractionLocked()) {
      return;
    }
    emit(GameEvent.GRID_CLICK, { x: event.clientX, y: event.clientY});
  });

  add.addEventListener('click', () => {
    if (isInteractionLocked()) {
      return;
    }
    emit(GameEvent.SPELL_ADD);
  });

  sub.addEventListener('click', () => {
    if (isInteractionLocked()) {
      return;
    }
    emit(GameEvent.SPELL_SUB);
  });

  redo.addEventListener('click', () => {
    emit(GameEvent.REDO_LEVEL);
  });

  levels.innerHTML = '';
  for (let i = 0; i < Levels.length; i++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.textContent = String(i + 1);
    button.type = 'submit';
    button.addEventListener('click', () => {
      emit(GameEvent.LEVEL, i);
    });
    levels.appendChild(button);
  }

  space1.addEventListener('click', () => {
    if (isInteractionLocked()) {
      return;
    }
    emit(GameEvent.WORKSPACE_SPACE_CLICK, { el: space1 });
  });

  space2.addEventListener('click', () => {
    if (isInteractionLocked()) {
      return;
    }
    emit(GameEvent.WORKSPACE_SPACE_CLICK, { el: space2 });
  });

  document.body.classList.toggle('stop', toggleImageAnim.checked);
  toggleImageAnim.addEventListener('input', () => {
    document.body.classList.toggle('stop', toggleImageAnim.checked);
  });

  // Bind directly to each slot: smaller logic surface than delegated target walking.
  for (const el of inventory.querySelectorAll('i') as NodeListOf<HTMLElement>) {
    el.addEventListener('click', () => {
      if (isInteractionLocked()) {
        return;
      }

      const token = el.dataset['i'];
      const item = token && isGameItem(token) ? token : undefined;
      if (!item) {
        return;
      }

      emit(GameEvent.INVENTORY_CLICK, { item, el });
    });
  }
}
