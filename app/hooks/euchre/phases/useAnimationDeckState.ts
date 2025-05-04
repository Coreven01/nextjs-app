import { EuchreGameState } from '../../../lib/euchre/definitions/game-state-definitions';
import { EuchreAnimateType } from '../reducers/gameAnimationFlowReducer';
import { EuchreGameFlow } from '../reducers/gameFlowReducer';
import { EuchrePauseType } from '../reducers/gamePauseReducer';

const useAnimationDeckState = (state: EuchreGameState) => {
  const { euchreGameFlow, euchreAnimationFlow, euchrePauseState } = state;

  const isAnimatePhase =
    euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
    euchrePauseState.pauseType === EuchrePauseType.ANIMATE;

  return {
    shouldBeginDealForDealer:
      euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_FOR_DEALER && isAnimatePhase,
    shouldEndDealForDealer: euchreGameFlow.gameFlow === EuchreGameFlow.END_DEAL_FOR_DEALER && isAnimatePhase,
    shouldBeginDealCards: euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_CARDS && isAnimatePhase
  };
};

export default useAnimationDeckState;
