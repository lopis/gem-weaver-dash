import { CountSet } from "@/core/util/count-set";
import { resetInteractionLock } from "./interaction-lock";
import { FruitItem, GameItem, GemItem } from "./game-item";
import { levelDashPar } from "./level-data";
import { setSketchText } from "./sketch-font";

export let inventory!: CountSet<GameItem>;
export let stagedFruits!: CountSet<FruitItem>;
export const gameData = {
  caughtFruits: 0,
  level: 0,
  dash: 0,
  spells: 0,
  victoryTriggered: false,
  onVictory: null as (() => void) | null,
};

const renderStats = () => {
  setSketchText(sd, String(gameData.dash));
};

export const initGameData = (startLevel: number, initialInventory: GemItem[] = []) => {
  resetInteractionLock();
  inventory = new CountSet<GameItem>();
  stagedFruits = new CountSet<FruitItem>();
  gameData.caughtFruits = 0;
  gameData.level = startLevel;
  gameData.dash = levelDashPar[startLevel];
  gameData.spells = 0;
  gameData.victoryTriggered = false;
  gameData.onVictory = null;

  for (const gem of initialInventory) {
    inventory.add(gem);
  }

  renderStats();
}

export const addDash = () => {
  gameData.dash--;
  renderStats();
};

export const addSpell = () => {
  gameData.spells++;
  renderStats();
};
