import { EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';

/** Values used to identify if certain values should be displayed for a player's hand. */
interface PlayerDisplayValue {
  player: EuchrePlayer;
  value: boolean;
}

export enum EuchreGameFlow {
  AWAIT_USER_INPUT = 1,
  AWAIT_PROMPT,
  AWAIT_AI_INPUT,

  /** Used to prevent game from continuing to execute during its state is batching updates. When an action is started, this should be be the first state that's set. */
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
  END_PLAY_CARD_RESULT,
  TRICK_FINISHED
}

export enum EuchreFlowActionType {
  SET_STATE = 1,
  SET_GAME_FLOW
}
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
  state?: EuchreGameFlowState;
  gameFlow?: EuchreGameFlow;
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
  if (action.type === EuchreFlowActionType.SET_STATE) {
    return { ...state, ...action.state };
  } else if (action.type === EuchreFlowActionType.SET_GAME_FLOW) {
    return {
      ...state,
      gameFlow: action.gameFlow ?? EuchreGameFlow.ERROR
    };
  } else {
    throw Error('Unknown game flow action: ' + action.type);
  }
}
