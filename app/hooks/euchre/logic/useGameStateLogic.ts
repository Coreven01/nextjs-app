import { EuchreGameFlow } from '@/app/hooks/euchre/reducers/gameFlowReducer';
import { EuchreAnimateType } from '@/app/hooks/euchre/reducers/gameAnimationFlowReducer';
import { useCallback } from 'react';
import { EuchreGameState } from '../../../lib/euchre/definitions/game-state-definitions';
import { EuchrePauseType } from '../reducers/gamePauseReducer';

const useGameStateLogic = () => {
  /** Verify the game state before attempting to execute specific logic in the Euchre game play through */
  const isGameStateValidToContinue = useCallback(
    (
      state: EuchreGameState,
      gameFlow: EuchreGameFlow,
      gameAnimationFlow: EuchreAnimateType,
      shouldCancel: boolean,
      handleCancel: () => void
    ): boolean => {
      if (
        !(
          state.euchreGameFlow.gameFlow === gameFlow &&
          state.euchreAnimationFlow.animationType === gameAnimationFlow &&
          state.euchrePauseState.pauseType === EuchrePauseType.NONE
        )
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
  return { isGameStateValidToContinue, getGameStatesForDeal };
};

export default useGameStateLogic;
