import { State } from '@/core/state';
import { gameStateMachine } from '@/game-state-machine';
import { GameState } from './game.state';
import { on } from '@/core/event';
import { GameEvent } from '@/game/event-manifest';
import { Levels } from '@/game/level-data';


class MenuState implements State {
  onEnter() {
    menu.classList.toggle('show', true);
    newGame.addEventListener('click', this.startGame)

    on(GameEvent.LEVEL, (levelIndex: number) => {
      gameStateMachine.setState(new GameState(levelIndex));
    });
  }

  onLeave() {
    menu.classList.toggle('show', false);
    newGame.removeEventListener('click', this.startGame);
  }

  onUpdate() {

  }

  startGame () {
    gameStateMachine.setState(new GameState(0));
  }
}

export const menuState = new MenuState();
