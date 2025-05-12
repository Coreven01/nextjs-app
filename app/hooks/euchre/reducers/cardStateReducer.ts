import { TableLocation } from '../../../lib/euchre/definitions/definitions';
import { EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';
import { CardSpringTarget } from '../../../lib/euchre/definitions/transform-definitions';
import { EuchreGameFlow } from './gameFlowReducer';

export interface PlayerHandState {
  handId: string;
  width: number;
  height: number;
  location: TableLocation;
  shouldShowCardValue?: boolean;
  player?: EuchrePlayer;
  responsive?: boolean;

  /** Used to identify which state is being updated, and to prevent the state from being updated more than once. */
  stateEffect?: EuchreGameFlow;
}

export interface CardBaseState {
  renderKey: string;
  cardIndex: number;
  src?: string;
  cardFullName: string;
  location?: TableLocation;
  enabled: boolean;
}

export interface CardAnimationState {
  initSpringValue?: CardSpringTarget;
  springValue?: CardSpringTarget;
  xDamping?: number;
  xStiffness?: number;
  yDamping?: number;
  yStiffness?: number;
  rotation?: number;
  runEffectForState?: EuchreGameFlow;
}

export interface CardState extends CardBaseState, CardAnimationState {}

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
