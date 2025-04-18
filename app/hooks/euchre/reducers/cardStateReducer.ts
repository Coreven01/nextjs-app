import { EuchrePlayer, GameSpeed } from '../../../lib/euchre/definitions';
import { CardSprungTarget } from '../data/useCardTransform';

export interface PlayerHandState {
  width: number;
  height: number;
  location: 'center' | 'side';
  shouldEnableShadow: boolean;
  gameSpeedMs: GameSpeed;
  shouldShowCardValue?: boolean;
  shouldShowCardImage?: boolean;
  player?: EuchrePlayer;
  responsive?: boolean;
}

export interface CardState {
  cardIndex: number;
  src: string;
  cardFullName: string;
  initSprungValue?: CardSprungTarget;
  springValue?: CardSprungTarget;
  xDamping?: number;
  xStiffness?: number;
  yDamping?: number;
  yStiffness?: number;
  rotation?: number;
}

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
