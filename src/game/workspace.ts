import { on } from "@/core/event";
import { GAME_EVENT_INVENTORY_CLICK, GAME_EVENT_WORKSPACE_SPACE_CLICK } from "./event-manifest";
import { colorOfItem, GameItem, isGameItem } from "./game-item";
import { isInteractionLocked } from "./interaction-lock";
import { addToInventory, removeFromInventory } from "./inventory";

export class Workspace {
  selectedItem: GameItem | null = null;

  constructor() {
    on(GAME_EVENT_INVENTORY_CLICK, ({ item, el }: { item: GameItem, el: HTMLElement }) => {
      if (isInteractionLocked()) {
        return;
      }

      const isSelected = el.classList.contains('selected');

      for (const item of iv.querySelectorAll('.selected')) {
        item.classList.remove('selected');
      }

      if (!isSelected) {
        el.classList.add('selected');
        this.selectedItem = item;
        return;
      }

      this.selectedItem = null;
    });

    on(GAME_EVENT_WORKSPACE_SPACE_CLICK, ({ el }: { el: HTMLElement }) => {
      if (isInteractionLocked()) {
        return;
      }

      if (!this.selectedItem) {
        return;
      }

      const item = this.selectedItem;
      const $i: HTMLElement | null = el.querySelector('i');
      if (!$i) {
        return;
      }

      const prevToken = el.dataset.i;
      const previous = prevToken && isGameItem(prevToken) ? prevToken : undefined;

      const removed = removeFromInventory(item);
      if (!removed) {
        return;
      }

      if (previous) {
        addToInventory(previous, false);
        el.classList.remove(previous);
      }

      el.classList.add(item);
      $i.className = item;
      const color = colorOfItem(item);
      el.dataset.i = item;
      el.dataset.c = String(color);

      for (const item of iv.querySelectorAll('.selected')) {
        item.classList.remove('selected');
      }

      this.selectedItem = null;
    })
  }
}
