import { emit } from "@/core/event"
import {
  GAME_EVENT_GRID_CLICK,
  GAME_EVENT_INVENTORY_CLICK,
  GAME_EVENT_LEVEL,
  GAME_EVENT_REDO_LEVEL,
  GAME_EVENT_SPELL_ADD,
  GAME_EVENT_SPELL_SUB,
  GAME_EVENT_WORKSPACE_SPACE_CLICK,
} from "./event-manifest"
import { isInteractionLocked } from "./interaction-lock";
import { isGameItem } from "./game-item";
import { Levels } from "./level-data";

export const initMouse = () => {
  grid.addEventListener('click', (event) => {
    if (isInteractionLocked()) {
      return;
    }
    emit(GAME_EVENT_GRID_CLICK, { x: event.clientX, y: event.clientY});
  });

  add.addEventListener('click', () => {
    if (isInteractionLocked()) {
      return;
    }
    emit(GAME_EVENT_SPELL_ADD);
  });

  sub.addEventListener('click', () => {
    if (isInteractionLocked()) {
      return;
    }
    emit(GAME_EVENT_SPELL_SUB);
  });

  redo.addEventListener('click', () => {
    emit(GAME_EVENT_REDO_LEVEL);
  });

  levels.innerHTML = '';
  for (let i = 0; i < Levels.length; i++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.textContent = String(i + 1);
    button.type = 'submit';
    button.addEventListener('click', () => {
      emit(GAME_EVENT_LEVEL, i);
    });
    levels.appendChild(button);
  }

  s1.addEventListener('click', () => {
    if (isInteractionLocked()) {
      return;
    }
    emit(GAME_EVENT_WORKSPACE_SPACE_CLICK, { el: s1 });
  });

  s2.addEventListener('click', () => {
    if (isInteractionLocked()) {
      return;
    }
    emit(GAME_EVENT_WORKSPACE_SPACE_CLICK, { el: s2 });
  });

  document.body.classList.toggle('stop', tia.checked);
  tia.addEventListener('input', () => {
    document.body.classList.toggle('stop', tia.checked);
  });

  // Bind directly to each slot: smaller logic surface than delegated target walking.
  for (const el of iv.querySelectorAll('i') as NodeListOf<HTMLElement>) {
    el.addEventListener('click', () => {
      if (isInteractionLocked()) {
        return;
      }

      const token = el.dataset['i'];
      const item = token && isGameItem(token) ? token : undefined;
      if (!item) {
        return;
      }

      emit(GAME_EVENT_INVENTORY_CLICK, { item, el });
    });
  }
}
