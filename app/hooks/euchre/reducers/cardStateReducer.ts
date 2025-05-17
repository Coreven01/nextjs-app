import { PlayerHandState } from '../../../lib/euchre/definitions/game-state-definitions';

export interface PlayCardStateActionAction {
  type: PlayCardStateActionType;
  payload?: PlayerHandState;
}

export enum PlayCardStateActionType {
  INIT_STATE
}

export function cardStateReducer(state: PlayerHandState, action: PlayCardStateActionAction): PlayerHandState {
  if (action.type === PlayCardStateActionType.INIT_STATE) {
    return { ...state, ...action.payload };
  } else {
    throw Error('Unknown action: ' + action.type);
  }
}
