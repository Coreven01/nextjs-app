import { EuchreGameValues, GameErrorHandlers } from '../../../lib/euchre/definitions/game-state-definitions';
import useGameStateLogic from '../logic/useGameStateLogic';
import { EuchreAnimateType } from '../reducers/gameAnimationFlowReducer';
import { EuchreGameFlow } from '../reducers/gameFlowReducer';

const useGameBidState = (state: EuchreGameValues, handlers: GameErrorHandlers) => {
  const { isGameStateValidToContinue } = useGameStateLogic();

  const shouldBeginBidForTrump = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
    EuchreAnimateType.NONE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldAnimateBeginBidForTrump = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
    EuchreAnimateType.ANIMATE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldEndBidForTrump = isGameStateValidToContinue(
    state,
    EuchreGameFlow.END_BID_FOR_TRUMP,
    EuchreAnimateType.NONE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldBeginPassDeal = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_PASS_DEAL,
    EuchreAnimateType.NONE,
    state.shouldCancel,
    handlers.onCancel
  );

  const continueFromBeginBidForTrump = () => {};

  return { shouldBeginBidForTrump, shouldAnimateBeginBidForTrump, shouldEndBidForTrump, shouldBeginPassDeal };
};

export default useGameBidState;
