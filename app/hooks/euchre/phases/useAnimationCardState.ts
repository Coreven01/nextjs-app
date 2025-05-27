import { EuchreGameState } from '../../../../features/euchre/definitions/game-state-definitions';
import { EuchreAnimateType } from '../../../../features/euchre/state/reducers/gameAnimationFlowReducer';
import { EuchreGameFlow } from '../../../../features/euchre/state/reducers/gameFlowReducer';
import { EuchrePauseType } from '../../../../features/euchre/state/reducers/gamePauseReducer';

const useAnimationCardState = (state: EuchreGameState) => {
  const { euchreGameFlow, euchreAnimationFlow, euchrePauseState } = state;

  return {
    shouldCreateHandState:
      euchreGameFlow.gameFlow === EuchreGameFlow.END_DEAL_CARDS &&
      euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE,
    shouldCreateCardState:
      euchreGameFlow.gameFlow === EuchreGameFlow.END_DEAL_CARDS &&
      euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
      euchrePauseState.pauseType === EuchrePauseType.ANIMATE,
    shouldAnimateBeginPassDeal:
      euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_PASS_DEAL &&
      euchreAnimationFlow.animationType === EuchreAnimateType.NONE &&
      euchrePauseState.pauseType === EuchrePauseType.ANIMATE,
    shouldReorderHand:
      euchreGameFlow.gameFlow === EuchreGameFlow.END_ORDER_TRUMP &&
      euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE,
    shouldAnimateTrickFinished:
      euchreGameFlow.gameFlow === EuchreGameFlow.TRICK_FINISHED &&
      euchreAnimationFlow.animationType === EuchreAnimateType.NONE &&
      euchrePauseState.pauseType === EuchrePauseType.ANIMATE,
    shoudUpdateCardStateForTurnEnd:
      euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_PLAY_CARD &&
      euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
      euchrePauseState.pauseType === EuchrePauseType.NONE,
    shoudUpdateCardStateForTurn:
      euchreAnimationFlow.animationType === EuchreAnimateType.NONE &&
      euchrePauseState.pauseType === EuchrePauseType.USER_INPUT &&
      euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_PLAY_CARD
  };
};

export default useAnimationCardState;
