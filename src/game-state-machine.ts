import { createStateMachine, StateMachine } from './core/state-machine';
import { State } from './core/state';

export let gameStateMachine: StateMachine;

export function createGameStateMachine(initialState: State, ...initialArguments: any[]) {
  gameStateMachine = createStateMachine(initialState, ...initialArguments);
}
