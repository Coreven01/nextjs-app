import { EuchreGameValues, EuchreGameSetters, ErrorHandlers } from '../../definitions/game-state-definitions';
import { isGameStateValidToContinue } from '../../util/game/gameStateLogicUtil';
import { EuchreAnimateType, EuchreAnimationActionType } from '../../state/reducers/gameAnimationFlowReducer';
import { EuchreGameFlow } from '../../state/reducers/gameFlowReducer';
import { EuchrePauseActionType } from '../../state/reducers/gamePauseReducer';

const useGameInitDealState = (
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  handlers: ErrorHandlers
) => {
  const shouldBeginDealCardsForDealer = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
    EuchreAnimateType.NONE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldAnimateBeginDealCardsForDealer = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
    EuchreAnimateType.ANIMATE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldEndDealCardsForDealer = isGameStateValidToContinue(
    state,
    EuchreGameFlow.END_DEAL_FOR_DEALER,
    EuchreAnimateType.NONE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldAnimateEndDealCardsForDealer = isGameStateValidToContinue(
    state,
    EuchreGameFlow.END_DEAL_FOR_DEALER,
    EuchreAnimateType.ANIMATE,
    state.shouldCancel,
    handlers.onCancel
  );

  const continueToSkipInitDealAnimation = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_SKIP_ANIMATION,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const pauseForAnimateBeginDealCardsForDealer = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_ANIMATE
    );
  };

  const continueToEndDealCardsForDealer = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_DEAL_FOR_DEALER,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const continueToAnimateEndDealCardsForDealer = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_DEAL_FOR_DEALER,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const pauseForAnimateEndDealCardsForDealer = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_DEAL_FOR_DEALER,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_ANIMATE
    );
  };

  const continueToShuffleCards = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_SHUFFLE_CARDS,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  return {
    shouldBeginDealCardsForDealer,
    shouldAnimateBeginDealCardsForDealer,
    shouldEndDealCardsForDealer,
    shouldAnimateEndDealCardsForDealer,
    continueToSkipInitDealAnimation,
    pauseForAnimateBeginDealCardsForDealer,
    continueToEndDealCardsForDealer,
    continueToAnimateEndDealCardsForDealer,
    pauseForAnimateEndDealCardsForDealer,
    continueToShuffleCards
  };
};

export default useGameInitDealState;
