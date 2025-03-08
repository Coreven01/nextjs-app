import { EuchrePlayer } from '@/app/lib/euchre/data';

interface PlayerDisplayValue {
  player: EuchrePlayer;
  value: boolean;
}

export enum EuchreGameFlow {
  INIT_DEAL,
  BEGIN_DEAL_FOR_JACK,
  SHUFFLE_CARDS,
  DEAL_CARDS,
  BID_FOR_TRUMP,
  HANDLE_BID,
  ORDER_TRUMP,
  PASS_DEAL,
  PLAY_HAND,
  AWAIT_USER_INPUT,
  HANDLE_PLAY_CARD,
  HANDLE_PLAY_CARD_RESULT
}

export interface GameFlowState {
  /** Boolean value to identify if a game has yet been created. */
  hasGameStarted: boolean;
  hasFirstBiddingPassed: boolean;
  hasSecondBiddingPassed: boolean;

  /** Should show the game deck. Shown when animating dealing cards to users. */
  shouldShowDeckImages: PlayerDisplayValue[];

  /** Should show the images for cards for the player. This does not show the value of the cards, but the back of the card. */
  shouldShowHandImages: PlayerDisplayValue[];

  /** Should show the cards face up. */
  shouldShowHandValues: PlayerDisplayValue[];
  gameFlow: EuchreGameFlow;
}

export interface GameFlowAction {
  type: GameFlowActionType;
  payload?: GameFlowState | undefined;
}

export enum GameFlowActionType {
  UPDATE_ALL,
  SET_INIT_DEAL,
  SET_BEGIN_DEAL_FOR_DEALER,
  SET_SHUFFLE_CARDS,
  SET_DEAL_CARDS,
  SET_BID_FOR_TRUMP,
  SET_HANDLE_BID,
  SET_ORDER_TRUMP,
  SET_PASS_DEAL,
  SET_PLAY_HAND,
  SET_AWAIT_USER_INPUT,
  SET_HANDLE_PLAY_CARD,
  SET_HANDLE_PLAY_CARD_RESULT
}

export const initialGameFlowState: GameFlowState = {
  hasGameStarted: false,
  shouldShowDeckImages: [],
  shouldShowHandImages: [],
  shouldShowHandValues: [],
  hasSecondBiddingPassed: false,
  hasFirstBiddingPassed: false,
  gameFlow: EuchreGameFlow.INIT_DEAL
};

export function gameFlowStateReducer(state: GameFlowState, action: GameFlowAction): GameFlowState {
  if (action.type === GameFlowActionType.UPDATE_ALL) {
    return { ...state, ...action.payload };
  } else if (action.type === GameFlowActionType.SET_INIT_DEAL) {
    return { ...state, gameFlow: EuchreGameFlow.INIT_DEAL };
  } else if (action.type === GameFlowActionType.SET_BEGIN_DEAL_FOR_DEALER) {
    return { ...state, gameFlow: EuchreGameFlow.BEGIN_DEAL_FOR_JACK };
  } else if (action.type === GameFlowActionType.SET_SHUFFLE_CARDS) {
    return { ...state, gameFlow: EuchreGameFlow.SHUFFLE_CARDS };
  } else if (action.type === GameFlowActionType.SET_DEAL_CARDS) {
    return { ...state, gameFlow: EuchreGameFlow.DEAL_CARDS };
  } else if (action.type === GameFlowActionType.SET_BID_FOR_TRUMP) {
    return { ...state, gameFlow: EuchreGameFlow.BID_FOR_TRUMP };
  } else if (action.type === GameFlowActionType.SET_HANDLE_BID) {
    return { ...state, gameFlow: EuchreGameFlow.HANDLE_BID };
  } else if (action.type === GameFlowActionType.SET_ORDER_TRUMP) {
    return { ...state, gameFlow: EuchreGameFlow.ORDER_TRUMP };
  } else if (action.type === GameFlowActionType.SET_PASS_DEAL) {
    return { ...state, gameFlow: EuchreGameFlow.PASS_DEAL };
  } else if (action.type === GameFlowActionType.SET_PLAY_HAND) {
    return { ...state, gameFlow: EuchreGameFlow.PLAY_HAND };
  } else if (action.type === GameFlowActionType.SET_HANDLE_PLAY_CARD) {
    return { ...state, gameFlow: EuchreGameFlow.HANDLE_PLAY_CARD };
  } else if (action.type === GameFlowActionType.SET_AWAIT_USER_INPUT) {
    return { ...state, gameFlow: EuchreGameFlow.AWAIT_USER_INPUT };
  } else if (action.type === GameFlowActionType.SET_HANDLE_PLAY_CARD_RESULT) {
    return { ...state, gameFlow: EuchreGameFlow.HANDLE_PLAY_CARD_RESULT };
  } else {
    throw Error('Unknown action: ' + action.type);
  }
}
