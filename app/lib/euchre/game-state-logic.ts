import { EuchreGameFlow, GameFlowState } from '@/app/hooks/euchre/gameFlowReducer';
import { EuchreGameInstance } from './data';
import {
  EuchreAnimateType,
  EuchreAnimationState
} from '@/app/hooks/euchre/gameAnimationFlowReducer';

/** Verify the game state before attempting to execute specific logic in the Euchre game play through */
export default function isGameStateValidToContinue(
  game: EuchreGameInstance | undefined | null,
  gameFlow: GameFlowState,
  gameAnimationFlow: EuchreAnimationState,
  gameFlowValue: EuchreGameFlow,
  gameAnimationValue: EuchreAnimateType,
  shouldCancel: boolean,
  handleCancel: () => void
): boolean {
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
}
