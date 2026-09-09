import { State } from './state';

export type StateMachine = {
  setState: (newState: State, ...enterArgs: any[]) => void;
  getState: () => State;
};

export const createStateMachine = (initialState: State, ...enterArgs: any[]): StateMachine => {
  let currentState = initialState;

  currentState.onEnter?.(...enterArgs);

  return {
    setState(newState: State, ...nextArgs: any[]) {
      currentState.onLeave?.();
      currentState = newState;
      currentState.onEnter?.(...nextArgs);
    },
    getState() {
      return currentState;
    },
  };
};
