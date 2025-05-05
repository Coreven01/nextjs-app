import {
  EuchreGameSetters,
  EuchreGameValues,
  ErrorHandlers
} from '../../../lib/euchre/definitions/game-state-definitions';
import useGameStateLogic from '../logic/useGameStateLogic';
import { EuchreAnimateType, EuchreAnimationActionType } from '../reducers/gameAnimationFlowReducer';
import { EuchreGameFlow } from '../reducers/gameFlowReducer';
import { EuchrePauseActionType } from '../reducers/gamePauseReducer';

const useGameOrderState = (state: EuchreGameValues, setters: EuchreGameSetters, handlers: ErrorHandlers) => {
  const { isGameStateValidToContinue } = useGameStateLogic();

  const shouldBeginOrderTrump = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_ORDER_TRUMP,
    EuchreAnimateType.NONE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldAnimateBeginOrderTrump = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_ORDER_TRUMP,
    EuchreAnimateType.ANIMATE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldEndOrderTrump = isGameStateValidToContinue(
    state,
    EuchreGameFlow.END_ORDER_TRUMP,
    EuchreAnimateType.NONE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldAnimateEndOrderTrump = isGameStateValidToContinue(
    state,
    EuchreGameFlow.END_ORDER_TRUMP,
    EuchreAnimateType.ANIMATE,
    state.shouldCancel,
    handlers.onCancel
  );

  const continueToAnimateBeginOrderTrump = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_ORDER_TRUMP,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const continueToEndOrderTrump = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_ORDER_TRUMP,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const pauseForUserDiscardSelection = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_ORDER_TRUMP,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_USER_INPUT
    );
  };

  const continueToAnimateEndOrderTrump = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_ORDER_TRUMP,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const continueToBeginPlayCard = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_PLAY_CARD,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  return {
    shouldBeginOrderTrump,
    shouldAnimateBeginOrderTrump,
    shouldEndOrderTrump,
    shouldAnimateEndOrderTrump,
    continueToAnimateBeginOrderTrump,
    continueToEndOrderTrump,
    pauseForUserDiscardSelection,
    continueToAnimateEndOrderTrump,
    continueToBeginPlayCard
  };
};

export default useGameOrderState;
