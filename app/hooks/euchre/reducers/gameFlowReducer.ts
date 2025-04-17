import { EuchrePlayer } from '@/app/lib/euchre/definitions';

/** Values used to identify if certain values should be displayed for a player's hand. */
interface PlayerDisplayValue {
  player: EuchrePlayer;
  value: boolean;
}

export enum EuchreGameFlow {
  AWAIT_USER_INPUT = 1,
  AWAIT_PLAY_CARD,
  WAIT,
  ERROR,
  BEGIN_INTRO,
  END_INTRO,
  BEGIN_INIT_DEAL,
  END_INIT_DEAL,
  BEGIN_DEAL_FOR_DEALER,
  END_DEAL_FOR_DEALER,
  BEGIN_SHUFFLE_CARDS,
  END_SHUFFLE_CARDS,
  BEGIN_DEAL_CARDS,
  END_DEAL_CARDS,
  BEGIN_BID_FOR_TRUMP,
  END_BID_FOR_TRUMP,
  BEGIN_ORDER_TRUMP,
  END_ORDER_TRUMP,
  BEGIN_PASS_DEAL,
  END_PASS_DEAL,
  BEGIN_PLAY_CARD,
  END_PLAY_CARD,
  BEGIN_PLAY_CARD_RESULT,
  END_PLAY_CARD_RESULT
}

export enum EuchreFlowActionType {
  UPDATE_ALL = 1,

  /** Used to prevent game from continuing to execute during its state is batching updates. When an action is started, this should be be the first state that's set. */
  SET_WAIT,
  SET_ERROR,
  SET_AWAIT_USER_INPUT,
  SET_AWAIT_PLAY_CARD,
  SET_BEGIN_INTRO,
  SET_END_INTRO,
  SET_BEGIN_INIT_DEAL,
  SET_END_INIT_DEAL,
  SET_BEGIN_DEAL_FOR_DEALER,
  SET_END_DEAL_FOR_DEALER,
  SET_BEGIN_SHUFFLE_CARDS,
  SET_END_SHUFFLE_CARDS,
  SET_BEGIN_DEAL_CARDS,
  SET_END_DEAL_CARDS,
  SET_BEGIN_BID_FOR_TRUMP,
  SET_END_BID_FOR_TRUMP,
  SET_BEGIN_ORDER_TRUMP,
  SET_END_ORDER_TRUMP,
  SET_BEGIN_PASS_DEAL,
  SET_END_PASS_DEAL,
  SET_BEGIN_PLAY_CARD,
  SET_END_PLAY_CARD,
  SET_BEGIN_PLAY_CARD_RESULT,
  SET_END_PLAY_CARD_RESULT
}

const actionTypeMap: Map<EuchreFlowActionType, EuchreGameFlow> = new Map([
  [EuchreFlowActionType.SET_AWAIT_USER_INPUT, EuchreGameFlow.AWAIT_USER_INPUT],
  [EuchreFlowActionType.SET_BEGIN_INIT_DEAL, EuchreGameFlow.BEGIN_INIT_DEAL],
  [EuchreFlowActionType.SET_END_INIT_DEAL, EuchreGameFlow.END_INIT_DEAL],
  [EuchreFlowActionType.SET_BEGIN_DEAL_FOR_DEALER, EuchreGameFlow.BEGIN_DEAL_FOR_DEALER],
  [EuchreFlowActionType.SET_END_DEAL_FOR_DEALER, EuchreGameFlow.END_DEAL_FOR_DEALER],

  [EuchreFlowActionType.SET_BEGIN_SHUFFLE_CARDS, EuchreGameFlow.BEGIN_SHUFFLE_CARDS],
  [EuchreFlowActionType.SET_END_SHUFFLE_CARDS, EuchreGameFlow.END_SHUFFLE_CARDS],
  [EuchreFlowActionType.SET_BEGIN_DEAL_CARDS, EuchreGameFlow.BEGIN_DEAL_CARDS],
  [EuchreFlowActionType.SET_END_DEAL_CARDS, EuchreGameFlow.END_DEAL_CARDS],
  [EuchreFlowActionType.SET_BEGIN_ORDER_TRUMP, EuchreGameFlow.BEGIN_ORDER_TRUMP],

  [EuchreFlowActionType.SET_END_ORDER_TRUMP, EuchreGameFlow.END_ORDER_TRUMP],
  [EuchreFlowActionType.SET_BEGIN_PASS_DEAL, EuchreGameFlow.BEGIN_PASS_DEAL],
  [EuchreFlowActionType.SET_END_PASS_DEAL, EuchreGameFlow.END_PASS_DEAL],
  [EuchreFlowActionType.SET_BEGIN_PLAY_CARD, EuchreGameFlow.BEGIN_PLAY_CARD],
  [EuchreFlowActionType.SET_END_PLAY_CARD, EuchreGameFlow.END_PLAY_CARD],

  [EuchreFlowActionType.SET_BEGIN_BID_FOR_TRUMP, EuchreGameFlow.BEGIN_BID_FOR_TRUMP],
  [EuchreFlowActionType.SET_END_BID_FOR_TRUMP, EuchreGameFlow.END_BID_FOR_TRUMP],
  [EuchreFlowActionType.SET_BEGIN_PLAY_CARD_RESULT, EuchreGameFlow.BEGIN_PLAY_CARD_RESULT],
  [EuchreFlowActionType.SET_END_PLAY_CARD_RESULT, EuchreGameFlow.END_PLAY_CARD_RESULT],
  [EuchreFlowActionType.SET_WAIT, EuchreGameFlow.WAIT],

  [EuchreFlowActionType.SET_ERROR, EuchreGameFlow.ERROR],
  [EuchreFlowActionType.SET_BEGIN_INTRO, EuchreGameFlow.BEGIN_INTRO],
  [EuchreFlowActionType.SET_END_INTRO, EuchreGameFlow.END_INTRO],
  [EuchreFlowActionType.SET_AWAIT_PLAY_CARD, EuchreGameFlow.AWAIT_PLAY_CARD]
]);
export interface EuchreGameFlowState {
  /** Boolean value to identify if a game has yet been created. */
  hasGameStarted: boolean;
  hasFirstBiddingPassed: boolean;
  hasSecondBiddingPassed: boolean;

  /** Should show the game deck. Shown when animating dealing cards to users. */
  shouldShowDeckImages: PlayerDisplayValue[];

  /** Should show the images for cards for the player. This does not show the value of the cards, but the back of the card. */
  shouldShowCardImagesForHand: PlayerDisplayValue[];

  /** Should show the cards face up card values for a player. */
  shouldShowCardValuesForHand: PlayerDisplayValue[];
  gameFlow: EuchreGameFlow;
}

export interface GameFlowAction {
  type: EuchreFlowActionType;
  payload?: EuchreGameFlowState;
}

export const INIT_GAME_FLOW_STATE: EuchreGameFlowState = {
  hasGameStarted: false,
  shouldShowDeckImages: [],
  shouldShowCardImagesForHand: [],
  shouldShowCardValuesForHand: [],
  hasSecondBiddingPassed: false,
  hasFirstBiddingPassed: false,
  gameFlow: EuchreGameFlow.BEGIN_INTRO
};

export function gameFlowStateReducer(
  state: EuchreGameFlowState,
  action: GameFlowAction
): EuchreGameFlowState {
  if (action.type === EuchreFlowActionType.UPDATE_ALL) {
    return { ...state, ...action.payload };
  } else if (actionTypeMap.get(action.type)) {
    return {
      ...state,
      gameFlow: actionTypeMap.get(action.type) ?? EuchreGameFlow.ERROR
    };
  } else {
    throw Error('Unknown game flow action: ' + action.type);
  }
}
