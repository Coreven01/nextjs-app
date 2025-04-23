import { EuchreGameFlow } from '@/app/hooks/euchre/reducers/gameFlowReducer';
import { EuchreAnimateType } from '@/app/hooks/euchre/reducers/gameAnimationFlowReducer';
import { useCallback } from 'react';
import { EuchreGameBase } from '../useEuchreGame';

const useGameStateLogic = () => {
  /** Verify the game state before attempting to execute specific logic in the Euchre game play through */
  const isGameStateValidToContinue = useCallback(
    (
      game: EuchreGameBase,
      gameFlowValue: EuchreGameFlow,
      gameAnimationValue: EuchreAnimateType,
      shouldCancel: boolean,
      handleCancel: () => void
    ): boolean => {
      if (
        !(
          game.euchreGameFlow.gameFlow === gameFlowValue &&
          game.euchreAnimationFlow.animationType === gameAnimationValue
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
