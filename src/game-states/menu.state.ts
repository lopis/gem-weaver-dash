import { State } from '@/core/state';
import { gameStateMachine } from '@/game-state-machine';
import { GameState } from './game.state';
import { on } from '@/core/event';
import { GAME_EVENT_LEVEL } from '@/game/event-manifest';
import musicPlayer from '@/core/music-player';

const setLevel = (level: number) => {
  gameStateMachine.setState(new GameState(level));
  musicPlayer.start();
}


class MenuState implements State {
  onEnter() {
    menu.classList.toggle('show', true);
    newGame.addEventListener('click', this.startGame)

    on(GAME_EVENT_LEVEL, (levelIndex: number) => {
      setLevel(levelIndex);
    });
  }

  onLeave() {
    menu.classList.toggle('show', false);
    newGame.removeEventListener('click', this.startGame);
  }

  onUpdate() {

  }

  startGame () {
    setLevel(0);
  }
}

export const menuState = new MenuState();
