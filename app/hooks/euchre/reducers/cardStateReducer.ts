import { AnimationControls } from 'framer-motion';
import { TableLocation } from '../../../lib/euchre/definitions/definitions';
import { EuchrePlayer, PlayerHandState } from '../../../lib/euchre/definitions/game-state-definitions';
import { CardSpringTarget } from '../../../lib/euchre/definitions/transform-definitions';
import { EuchreGameFlow } from './gameFlowReducer';

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
