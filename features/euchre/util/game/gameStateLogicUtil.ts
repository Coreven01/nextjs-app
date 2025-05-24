import { EuchreGameFlow } from '@/app/hooks/euchre/reducers/gameFlowReducer';
import { EuchreAnimateType } from '@/app/hooks/euchre/reducers/gameAnimationFlowReducer';

import { EuchrePauseType } from '../../../../app/hooks/euchre/reducers/gamePauseReducer';
import { EuchreGameState } from '../../definitions/game-state-definitions';

/** Verify the game state before attempting to execute specific logic in the Euchre game play through. */
const isGameStateValidToContinue = (
  state: EuchreGameState,
  expectedGameFlow: EuchreGameFlow,
  expectedGameAnimationFlow: EuchreAnimateType,
  shouldCancel: boolean,
  handleCancel: () => void
): boolean => {
  if (state.euchrePauseState.pauseType !== EuchrePauseType.NONE) return false;

  // if debugging, then end processing further game state with the set value.
  if (state.euchreDebug && state.euchreDebug === expectedGameFlow) return false;

  if (
    state.euchreGameFlow.gameFlow !== expectedGameFlow ||
    state.euchreAnimationFlow.animationType !== expectedGameAnimationFlow
  ) {
    return false;
  }

  if (shouldCancel) {
    handleCancel();
    return false;
  }

  return true;
};

/** Game states where the game deck should be rendered. */
export const GAME_STATES_FOR_DEAL = [
  EuchreGameFlow.BEGIN_INIT_DEAL,
  EuchreGameFlow.END_INIT_DEAL,
  EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
  EuchreGameFlow.END_DEAL_FOR_DEALER,
  EuchreGameFlow.BEGIN_SHUFFLE_CARDS,
  EuchreGameFlow.END_SHUFFLE_CARDS,
  EuchreGameFlow.BEGIN_DEAL_CARDS
];

/** Game states where the player's hand should be rendered. */
export const GAME_STATES_FOR_PLAY = [
  EuchreGameFlow.END_DEAL_CARDS,
  EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
  EuchreGameFlow.END_BID_FOR_TRUMP,
  EuchreGameFlow.BEGIN_PASS_DEAL,
  EuchreGameFlow.END_PASS_DEAL,
  EuchreGameFlow.BEGIN_ORDER_TRUMP,
  EuchreGameFlow.END_ORDER_TRUMP,
  EuchreGameFlow.BEGIN_PLAY_CARD,
  EuchreGameFlow.END_PLAY_CARD,
  EuchreGameFlow.BEGIN_PLAY_CARD_RESULT,
  EuchreGameFlow.END_PLAY_CARD_RESULT,
  EuchreGameFlow.TRICK_FINISHED
];

/** Game states where the trump card should be shown for bidding. */
export const GAME_STATES_FOR_BID = [
  EuchreGameFlow.END_DEAL_CARDS,
  EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
  EuchreGameFlow.END_BID_FOR_TRUMP,
  EuchreGameFlow.BEGIN_PASS_DEAL,
  EuchreGameFlow.END_PASS_DEAL
];

/** Game states where the player's hand should be rendered. */
export const GAME_STATES_FOR_PLAYER_TURN = [
  EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
  EuchreGameFlow.END_BID_FOR_TRUMP,
  EuchreGameFlow.BEGIN_ORDER_TRUMP,
  EuchreGameFlow.END_ORDER_TRUMP,
  EuchreGameFlow.BEGIN_PLAY_CARD,
  EuchreGameFlow.END_PLAY_CARD,
  EuchreGameFlow.BEGIN_PLAY_CARD_RESULT
];

export { isGameStateValidToContinue };
