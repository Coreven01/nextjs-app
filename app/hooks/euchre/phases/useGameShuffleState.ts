import {
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  ErrorHandlers
} from '../../../lib/euchre/definitions/game-state-definitions';
import useGamePlayLogic from '../logic/useGamePlayLogic';
import useGameStateLogic from '../logic/useGameStateLogic';
import { EuchreAnimateType, EuchreAnimationActionType } from '../reducers/gameAnimationFlowReducer';
import { EuchreFlowActionType, EuchreGameFlow, EuchreGameFlowState } from '../reducers/gameFlowReducer';
import { EuchrePauseActionType } from '../reducers/gamePauseReducer';

const useGameShuffleState = (
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  handlers: ErrorHandlers
) => {
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { getGameStateForNextHand } = useGamePlayLogic();

  const shouldBeginSkipAnimation = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_SKIP_ANIMATION,
    EuchreAnimateType.NONE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldShuffleCards = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_SHUFFLE_CARDS,
    EuchreAnimateType.NONE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldAnimateBeginDealCards = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_DEAL_CARDS,
    EuchreAnimateType.ANIMATE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldEndDealCards = isGameStateValidToContinue(
    state,
    EuchreGameFlow.END_DEAL_CARDS,
    EuchreAnimateType.NONE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldAnimateEndDealCards = isGameStateValidToContinue(
    state,
    EuchreGameFlow.END_DEAL_CARDS,
    EuchreAnimateType.ANIMATE,
    state.shouldCancel,
    handlers.onCancel
  );

  const continueToAnimateDealCards = (game: EuchreGameInstance) => {
    const newGameState: EuchreGameFlowState = getGameStateForNextHand(
      state.euchreGameFlow,
      state.euchreSettings,
      game.gamePlayers
    );
    newGameState.gameFlow = EuchreGameFlow.BEGIN_DEAL_CARDS;

    setters.dispatchGameFlow({ type: EuchreFlowActionType.SET_STATE, state: newGameState });
    setters.dispatchStateChange(
      undefined,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const pauseForAnimateBeginDealCards = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_DEAL_CARDS,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_ANIMATE
    );
  };

  const continueToEndDealCards = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_DEAL_CARDS,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const continueToAnimateEndDealCards = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_DEAL_CARDS,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const pauseForAnimateEndDealCards = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_DEAL_CARDS,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_ANIMATE
    );
  };

  const continueToBeginBidForTrump = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  return {
    shouldBeginSkipAnimation,
    shouldShuffleCards,
    shouldAnimateBeginDealCards,
    shouldEndDealCards,
    shouldAnimateEndDealCards,
    continueToAnimateDealCards,
    pauseForAnimateBeginDealCards,
    continueToEndDealCards,
    continueToAnimateEndDealCards,
    pauseForAnimateEndDealCards,
    continueToBeginBidForTrump
  };
};

export default useGameShuffleState;
