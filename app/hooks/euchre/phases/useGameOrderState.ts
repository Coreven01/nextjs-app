import {
  EuchreGameValues,
  EuchreGameSetters,
  ErrorHandlers
} from '../../../../features/euchre/definitions/game-state-definitions';
import { isGameStateValidToContinue } from '../../../../features/euchre/util/game/gameStateLogicUtil';
import {
  EuchreAnimateType,
  EuchreAnimationActionType
} from '../../../../features/euchre/state/reducers/gameAnimationFlowReducer';
import { EuchreGameFlow } from '../../../../features/euchre/state/reducers/gameFlowReducer';
import { EuchrePauseActionType } from '../../../../features/euchre/state/reducers/gamePauseReducer';

const useGameOrderState = (state: EuchreGameValues, setters: EuchreGameSetters, handlers: ErrorHandlers) => {
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

  const pauseForAnimateEndOrderTrump = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_ORDER_TRUMP,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_ANIMATE
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
    continueToBeginPlayCard,
    pauseForAnimateEndOrderTrump
  };
};

export default useGameOrderState;
