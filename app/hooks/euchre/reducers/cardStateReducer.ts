import { HandState } from '../../../../features/euchre/definitions/game-state-definitions';

export interface PlayCardStateActionAction {
  type: PlayCardStateActionType;
  payload?: HandState;
}

export enum PlayCardStateActionType {
  INIT_STATE
}

export function cardStateReducer(state: HandState, action: PlayCardStateActionAction): HandState {
  if (action.type === PlayCardStateActionType.INIT_STATE) {
    return { ...state, ...action.payload };
  } else {
    throw Error('Unknown action: ' + action.type);
  }
}
