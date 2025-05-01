import { GameSpeed, TableLocation } from '../../../lib/euchre/definitions/definitions';
import { EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';
import { CardSpringTarget } from '../data/useCardTransform';
import { EuchreGameFlow } from './gameFlowReducer';

export interface PlayerHandState {
  width: number;
  height: number;
  location: TableLocation;
  shouldEnableShadow: boolean;
  gameSpeedMs: GameSpeed;
  shouldShowCardValue?: boolean;
  shouldShowCardImage?: boolean;
  player?: EuchrePlayer;
  responsive?: boolean;

  /** Used to identify which state is being updated, and to prevent the state from being updated more than once. */
  stateEffect?: EuchreGameFlow;
}

export interface CardState {
  cardIndex: number;
  src?: string;
  cardFullName: string;
  initSpringValue?: CardSpringTarget;
  springValue?: CardSpringTarget;
  xDamping?: number;
  xStiffness?: number;
  yDamping?: number;
  yStiffness?: number;
  rotation?: number;
  runEffectForState?: EuchreGameFlow;
  enabled: boolean;
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
