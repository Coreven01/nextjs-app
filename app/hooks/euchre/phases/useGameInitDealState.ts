import {
  EuchreGameSetters,
  EuchreGameValues,
  ErrorHandlers
} from '../../../lib/euchre/definitions/game-state-definitions';
import useGameStateLogic from '../logic/useGameStateLogic';
import { EuchreAnimateType, EuchreAnimationActionType } from '../reducers/gameAnimationFlowReducer';
import { EuchreGameFlow } from '../reducers/gameFlowReducer';
import { EuchrePauseActionType } from '../reducers/gamePauseReducer';

const useGameInitDealState = (
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  handlers: ErrorHandlers
) => {
  const { isGameStateValidToContinue } = useGameStateLogic();

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
    pauseForAnimateBeginDealCardsForDealer,
    continueToEndDealCardsForDealer,
    continueToAnimateEndDealCardsForDealer,
    pauseForAnimateEndDealCardsForDealer,
    continueToShuffleCards
  };
};

export default useGameInitDealState;
