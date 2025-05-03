import { PromptType } from '../../../lib/euchre/definitions/definitions';
import {
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  ErrorHandlers
} from '../../../lib/euchre/definitions/game-state-definitions';
import usePlayerData from '../data/usePlayerData';
import useGamePlayLogic from '../logic/useGamePlayLogic';
import useGameStateLogic from '../logic/useGameStateLogic';
import { EuchreAnimateType, EuchreAnimationActionType } from '../reducers/gameAnimationFlowReducer';
import { EuchreFlowActionType, EuchreGameFlow, EuchreGameFlowState } from '../reducers/gameFlowReducer';
import { EuchrePauseActionType } from '../reducers/gamePauseReducer';

const useGameBidState = (state: EuchreGameValues, setters: EuchreGameSetters, handlers: ErrorHandlers) => {
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { getGameStateForNextHand } = useGamePlayLogic();
  const { playerEqual } = usePlayerData();

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

  const continueToAnimateBeginBidForTrump = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const pauseForBidForTrump = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_USER_INPUT
    );
    setters.setPromptValue([{ type: PromptType.BID }]);
  };

  const continueToBeginPassDeal = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_PASS_DEAL,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const continueToEndBidForTrump = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_BID_FOR_TRUMP,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const continueToBeginOrderTrump = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_ORDER_TRUMP,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const updateStateAndContinueToBidForTrump = (game: EuchreGameInstance, gameflow: EuchreGameFlowState) => {
    const newGameFlow = { ...gameflow };
    const biddingRoundFinished = playerEqual(game.dealer, game.currentPlayer);
    const firstRound = !state.euchreGameFlow.hasFirstBiddingPassed;

    newGameFlow.gameFlow = EuchreGameFlow.BEGIN_BID_FOR_TRUMP;
    if (biddingRoundFinished) {
      newGameFlow.hasFirstBiddingPassed = firstRound || newGameFlow.hasFirstBiddingPassed;
      newGameFlow.hasSecondBiddingPassed = !firstRound;
    }

    setters.dispatchGameFlow({ type: EuchreFlowActionType.SET_STATE, state: newGameFlow });
  };

  const updateStateForNewHand = (game: EuchreGameInstance) => {
    setters.setPromptValue([]);
    setters.dispatchGameFlow({
      type: EuchreFlowActionType.SET_STATE,
      state: getGameStateForNextHand(state.euchreGameFlow, state.euchreSettings, game)
    });
    setters.dispatchStateChange(
      undefined,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  return {
    shouldBeginBidForTrump,
    shouldAnimateBeginBidForTrump,
    shouldEndBidForTrump,
    shouldBeginPassDeal,
    continueToAnimateBeginBidForTrump,
    pauseForBidForTrump,
    continueToBeginPassDeal,
    continueToEndBidForTrump,
    updateStateAndContinueToBidForTrump,
    updateStateForNewHand,
    continueToBeginOrderTrump
  };
};

export default useGameBidState;
