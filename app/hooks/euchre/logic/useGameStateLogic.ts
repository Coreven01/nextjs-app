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

  return { isGameStateValidToContinue };
};

export default useGameStateLogic;
