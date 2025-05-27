import { EuchrePlayer } from '../../definitions/game-state-definitions';

/** Values used to identify if certain values should be displayed for a player's hand. */
interface PlayerDisplayValue {
  player: EuchrePlayer;
  value: boolean;
}

export enum EuchreGameFlow {
  BEGIN_INTRO,
  END_INTRO,
  BEGIN_INIT_DEAL,
  END_INIT_DEAL,
  BEGIN_DEAL_FOR_DEALER,
  END_DEAL_FOR_DEALER,
  BEGIN_SKIP_ANIMATION,
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
      gameFlow: action.gameFlow ?? EuchreGameFlow.BEGIN_INTRO
    };
  } else {
    throw Error('Unknown game flow action: ' + action.type);
  }
}
