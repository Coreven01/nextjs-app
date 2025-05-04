import { EuchreGameState } from '../../../lib/euchre/definitions/game-state-definitions';
import { EuchreAnimateType } from '../reducers/gameAnimationFlowReducer';
import { EuchreGameFlow } from '../reducers/gameFlowReducer';
import { EuchrePauseType } from '../reducers/gamePauseReducer';

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
      state.euchreGameFlow.gameFlow === EuchreGameFlow.END_ORDER_TRUMP &&
      state.euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE
  };
};

export default useAnimationCardState;
