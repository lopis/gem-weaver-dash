import { resizeCanvas } from '@/core/canvas';
import { clearEvents, on } from '@/core/event';
import { addTimeEvent, clearTimers } from '@/core/timer';
import { State } from '@/core/state';
import { gameData, initGameData } from '@/game/game-data';
import { GameGrid } from '@/game/game-grid';
import { initInventoryView, renderInventory } from '@/game/inventory';
import { decodeLevel } from '@/game/level-data';
import { initSpellListener } from '@/game/spells';
import { lockInteractions } from '@/game/interaction-lock';
import { Workspace } from '@/game/workspace';
import { Levels } from '@/game/level-data';
import { gameStateMachine } from '@/game-state-machine';
import {
  GAME_EVENT_LEVEL,
  GAME_EVENT_PAUSE,
  GAME_EVENT_REDO_LEVEL,
  GAME_EVENT_SPELL_ADD,
  GAME_EVENT_SPELL_SUB,
  GAME_EVENT_UNPAUSE,
} from '@/game/event-manifest';
import musicPlayer from '@/core/music-player';
import { setSketchText } from '@/game/sketch-font';

export class GameState implements State {
  grid!: GameGrid;
  workplace!: Workspace;
  private victoryStarted = false;
  private help4Shown = false;
  private help5Shown = false;
  private help6Shown = false;

  constructor(private readonly level: number) {}

  onEnter() {
    nav.classList.remove('dead');
    gm.classList.toggle('show', true);
    const level = decodeLevel(this.level);
    initGameData(this.level, level.initialInventory);
    initInventoryView();
    gameData.onVictory = () => this.startVictorySequence();
    renderInventory();
    this.grid = new GameGrid(level);
    this.workplace = new Workspace();
    resizeCanvas();
    initSpellListener();
    this.help4Shown = false;
    this.help5Shown = false;
    this.help6Shown = false;
    this.hideAllHelpTexts();
    addTimeEvent(() => this.initHelpTexts(), 0, 0, 500);

    setSketchText(lvn, String(this.level + 1));

    on(GAME_EVENT_SPELL_ADD, () => {
      if (this.level === 1 && this.help6Shown) {
        this.setHelpVisible(6, false);
      }
    });

    on(GAME_EVENT_SPELL_SUB, () => {
      if (this.level === 1 && this.help6Shown) {
        this.setHelpVisible(6, false);
      }
    });

    on(GAME_EVENT_REDO_LEVEL, () => {
      gameStateMachine.setState(new GameState(this.level));
    });

    on(GAME_EVENT_LEVEL, (levelIndex: number) => {
      gameStateMachine.setState(new GameState(levelIndex));
    });

    on(GAME_EVENT_PAUSE, () => musicPlayer.pause());
    on(GAME_EVENT_UNPAUSE, () => musicPlayer.unpause());
  }

  onLeave() {
    clearTimers();
    this.hideAllHelpTexts();
    gm.classList.toggle('show', false);
    iv.classList.remove('animate');
    win.classList.add('hide');
    win.classList.remove('animate');
    gameData.onVictory = null;
    clearEvents();
  }

  onUpdate(timeElapsed: number) {
    this.grid.update(timeElapsed);
    this.updateHelpTexts();
  }

  private setHelpVisible(helpId: number, visible: boolean) {
    const el = document.querySelector(`[hp="${helpId}"]`) as HTMLElement;
    el.classList.toggle('hide', !visible);
  }

  private hideAllHelpTexts() {
    for (let i = 1; i <= 7; i++) {
      this.setHelpVisible(i, false);
    }
  }

  private initHelpTexts() {
    if (this.level === 0) {
      this.setHelpVisible(1, true);
      this.setHelpVisible(2, true);
      return;
    }

    if (this.level === 1) {
      this.setHelpVisible(3, true);
      return;
    }

    if (this.level === 3) {
      this.setHelpVisible(7, true);
    }
  }

  /**
   * Info Text
   *
   * The info text area nudges that help the player in the first levels.
   * They are HTML text elements with selector [help], e.g. [help=1].
   *
   * Level 0:
   *  show help 1 and 2
   * Level 1:
   *  show help 3;
   *  after catching 6 fruit, show help 4 and hide help 3;
   *  after selecting a fruit from inventory, show help 5 and hide help 4;
   *  after putting fruits in both spaces, hide help 5 and show help 6;
   *  after doing the spell, hide help 6.
   * Level 2:
   *  no help text
   * Level 3:
   *  show help 7.
   */
  private updateHelpTexts() {
    if (this.level !== 1) {
      return;
    }

    if (!this.help4Shown && gameData.caughtFruits >= 6) {
      this.help4Shown = true;
      this.setHelpVisible(3, false);
      this.setHelpVisible(4, true);
    }

    if (!this.help5Shown && iv.querySelector('i.selected[data-i^="F"]')) {
      this.help5Shown = true;
      this.setHelpVisible(4, false);
      this.setHelpVisible(5, true);
    }

    if (!this.help6Shown && s1.dataset['i']?.startsWith('F') && s2.dataset['i']?.startsWith('F')) {
      this.help6Shown = true;
      this.setHelpVisible(5, false);
      this.setHelpVisible(6, true);
    }
  }

  private startVictorySequence() {
    if (this.victoryStarted) {
      return;
    }

    this.victoryStarted = true;
    lockInteractions();

    addTimeEvent(() => {
      iv.classList.add('animate');
      win.classList.remove('hide');
      win.classList.add('animate');
    }, 0, 0, 1000);

    addTimeEvent(() => {
      const nextLevel = (gameData.level + 1) % Levels.length;
      gameStateMachine.setState(new GameState(nextLevel));
    }, 0, 0, 4000);
  }
}
