import { on } from "@/core/event";
import { GAME_EVENT_INVENTORY_CLICK, GAME_EVENT_WORKSPACE_SPACE_CLICK } from "./event-manifest";
import { colorOfItem, GameItem, isGameItem } from "./game-item";
import { isInteractionLocked } from "./interaction-lock";
import { addToInventory, removeFromInventory } from "./inventory";

export class Workspace {
  constructor() {
    on(GAME_EVENT_INVENTORY_CLICK, ({ item }: { item: GameItem, el: HTMLElement }) => {
      if (isInteractionLocked()) {
        return;
      }

      const target = !s1.dataset.i ? s1 : !s2.dataset.i ? s2 : null;
      if (!target) {
        return;
      }

      const removed = removeFromInventory(item);
      if (!removed) {
        return;
      }

      const $i = target.querySelector('i') as HTMLElement | null;
      if (!$i) {
        return;
      }

      target.classList.add(item);
      $i.className = item;
      const color = colorOfItem(item);
      target.dataset.i = item;
      target.dataset.c = String(color);
    });

    on(GAME_EVENT_WORKSPACE_SPACE_CLICK, ({ el }: { el: HTMLElement }) => {
      if (isInteractionLocked()) {
        return;
      }

      const item = el.dataset.i;
      if (!item || !isGameItem(item)) {
        return;
      }

      addToInventory(item);

      el.classList.remove(item);
      const $i = el.querySelector('i') as HTMLElement | null;
      if ($i) {
        $i.className = '';
      }
      delete el.dataset.i;
      delete el.dataset.c;
    })
  }
}
