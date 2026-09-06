import { CountSet } from "@/core/util/count-set";
import { gameData } from "./game-data";
import { fruits, FruitItem, GameItem, inventoryItems, isFruitItem, isGemItem, rainbowGems } from "./game-item";

const inventoryItemsMap = new Map<GameItem, HTMLElement>();

const animateGain = (item: GameItem) => {
  const el = inventoryItemsMap.get(item) as HTMLElement;
  el.classList.remove('gain');
  // Force restart so repeated gains replay the animation.
  void el.offsetWidth;
  el.classList.add('gain');
};

const hasRainbowSet = () => rainbowGems.every((item) => gameData.inventory.count(item) > 0);

const maybeTriggerVictory = () => {
  if (gameData.victoryTriggered || !hasRainbowSet()) {
    return;
  }

  gameData.victoryTriggered = true;
  gameData.onVictory?.();
};

export const initInventoryView = () => {
  inventoryItemsMap.clear();

  for (const item of inventoryItems) {
    const el = inventory.querySelector(`.${CSS.escape(item)}`) as HTMLElement;
    inventoryItemsMap.set(item, el);
  }
};

export const renderInventory = () => {
  const stagedList: FruitItem[] = [];

  for (const item of inventoryItems) {
    const el = inventoryItemsMap.get(item) as HTMLElement;

    const total = gameData.inventory.count(item);
    if (total > 0) {
      el.removeAttribute('h');
      if (total > 1) {
        el.dataset['count'] = String(total);
      } else {
        delete el.dataset['count'];
      }
    } else {
      el.setAttribute('h', '');
      el.classList.remove('selected');
      delete el.dataset['count'];
    }
  }

  for (const fruit of fruits) {
    const stagedCount = gameData.stagedFruits.count(fruit);
    for (let i = 0; i < stagedCount; i++) {
      stagedList.push(fruit);
    }
  }

  if (unicorn) {
    const stagedCount = stagedList.length;
    const orbitHtml = stagedList
      .map((item, index) => `
        <span class="u2" style="--index:${index};--count:${stagedCount};">
          <i class="${item} u3"></i>
        </span>
      `)
      .join('');

    unicorn.querySelector('.u1')!.innerHTML = orbitHtml;
  }

  maybeTriggerVictory();
};

export const addToInventory = (item: GameItem, animate = true) => {
  gameData.inventory.add(item);
  renderInventory();
  if (animate) {
    animateGain(item);
  }
};

export const removeFromInventory = (item: GameItem) => {
  const removed = gameData.inventory.remove(item);
  if (removed) {
    renderInventory();
  }
  return removed;
};

export const collectCaughtItem = (item: GameItem) => {
  if (isGemItem(item)) {
    addToInventory(item);
    return;
  }

  if (!isFruitItem(item)) {
    return;
  }

  gameData.caughtFruits++;

  const staged = gameData.stagedFruits;
  staged.add(item);

  if (staged.count(item) >= 3) {
    staged.remove(item);
    staged.remove(item);
    staged.remove(item);
    addToInventory(item);
    return;
  }

  renderInventory();
};
