import { EuchreGameFlow } from '@/app/hooks/euchre/reducers/gameFlowReducer';
import { EuchreAnimateType } from '@/app/hooks/euchre/reducers/gameAnimationFlowReducer';
import { useCallback } from 'react';
import { EuchreGameState } from '../../../lib/euchre/definitions/game-state-definitions';
import { EuchrePauseType } from '../reducers/gamePauseReducer';

const useGameStateLogic = () => {
  /** Verify the game state before attempting to execute specific logic in the Euchre game play through. */
  const isGameStateValidToContinue = useCallback(
    (
      state: EuchreGameState,
      gameFlow: EuchreGameFlow,
      gameAnimationFlow: EuchreAnimateType,
      shouldCancel: boolean,
      handleCancel: () => void
    ): boolean => {
      if (state.euchrePauseState.pauseType !== EuchrePauseType.NONE) return false;

      if (
        state.euchreGameFlow.gameFlow !== gameFlow ||
        state.euchreAnimationFlow.animationType !== gameAnimationFlow
      ) {
        return false;
      }

      if (shouldCancel) {
        handleCancel();
        return false;
      }

      return true;
    },
    []
  );

  /** Game states where the game deck should be rendered. */
  const getGameStatesForDeal = useCallback(() => {
    return [
      EuchreGameFlow.BEGIN_INIT_DEAL,
      EuchreGameFlow.END_INIT_DEAL,
      EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
      EuchreGameFlow.END_DEAL_FOR_DEALER,
      EuchreGameFlow.BEGIN_SHUFFLE_CARDS,
      EuchreGameFlow.END_SHUFFLE_CARDS,
      EuchreGameFlow.BEGIN_DEAL_CARDS
    ];
  }, []);

  /** Game states where the player's hand should be rendered. */
  const getGameStatesForPlay = useCallback(() => {
    return [
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
  }, []);

  /** Game states where the trump card should be shown for bidding. */
  const getGameStatesForBid = useCallback(() => {
    return [
      EuchreGameFlow.END_DEAL_CARDS,
      EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
      EuchreGameFlow.END_BID_FOR_TRUMP,
      EuchreGameFlow.BEGIN_PASS_DEAL,
      EuchreGameFlow.END_PASS_DEAL
    ];
  }, []);

  return { isGameStateValidToContinue, getGameStatesForDeal, getGameStatesForPlay, getGameStatesForBid };
};

export default useGameStateLogic;
