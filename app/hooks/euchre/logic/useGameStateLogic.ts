import { EuchreGameFlow, EuchreGameFlowState } from '@/app/hooks/euchre/reducers/gameFlowReducer';
import {
  EuchreAnimateType,
  EuchreAnimationState
} from '@/app/hooks/euchre/reducers/gameAnimationFlowReducer';
import { EuchreGameInstance, EuchreSettings } from '@/app/lib/euchre/definitions';
import { useCallback } from 'react';

const useGameStateLogic = () => {
  const generateElementId = (): string => {
    return `element-${Math.floor(Math.random() * 10000)}`;
  };

  /** Verify the game state before attempting to execute specific logic in the Euchre game play through */
  const isGameStateValidToContinue = useCallback(
    (
      game: EuchreGameInstance | undefined | null,
      gameFlow: EuchreGameFlowState,
      gameAnimationFlow: EuchreAnimationState,
      gameFlowValue: EuchreGameFlow,
      gameAnimationValue: EuchreAnimateType,
      shouldCancel: boolean,
      handleCancel: () => void
    ): boolean => {
      if (
        !(
          game &&
          gameFlow.gameFlow === gameFlowValue &&
          gameAnimationFlow.animationType === gameAnimationValue
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

  return { isGameStateValidToContinue, generateElementId };
};

export default useGameStateLogic;
