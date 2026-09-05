import { createGameStateMachine, gameStateMachine } from './game-state-machine';
import { drawEngine } from './core/draw-engine';
import { updateTimeEvents } from './core/timer';
import { loadingState } from './game-states/loading.state';
import { emit } from './core/event';
import { GAME_EVENT_PAUSE, GAME_EVENT_UNPAUSE } from './game/event-manifest';

fav.href = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'.9em\' font-size=\'85\'%3E🍓%3C/text%3E%3C/svg%3E';

let previousTime = 0;
let paused = false;

window.addEventListener('blur', () => {
  emit(GAME_EVENT_PAUSE);
  paused = true;
});
window.addEventListener('focus', () => {
  emit(GAME_EVENT_UNPAUSE);
  paused = false;
});

function update(currentTime: number) {
  if (paused) return;

  currentTime = performance.now();
  let delta = currentTime - previousTime;
  previousTime = currentTime;
  if (delta > 1000) {
    return;
  }

  drawEngine.clear();

  const state = gameStateMachine.getState();
  state.onUpdate(delta);
  updateTimeEvents(delta);
};


createGameStateMachine(loadingState);

setInterval(update, 16);
