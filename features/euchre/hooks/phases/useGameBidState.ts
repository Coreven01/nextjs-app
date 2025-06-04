import { PromptType } from '../../definitions/definitions';
import {
  EuchreGameValues,
  EuchreGameSetters,
  ErrorHandlers,
  EuchreGameInstance,
  EuchrePlayer
} from '../../definitions/game-state-definitions';
import { getGameStateForNextHand } from '../../util/game/gamePlayLogicUtil';
import { isGameStateValidToContinue } from '../../util/game/gameStateLogicUtil';
import { getPlayerRotation, playerEqual } from '../../util/game/playerDataUtil';
import { EuchreAnimateType, EuchreAnimationActionType } from '../../state/reducers/gameAnimationFlowReducer';
import { EuchreFlowActionType, EuchreGameFlow } from '../../state/reducers/gameFlowReducer';
import { EuchrePauseActionType } from '../../state/reducers/gamePauseReducer';

const useGameBidState = (state: EuchreGameValues, setters: EuchreGameSetters, handlers: ErrorHandlers) => {
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

  const shouldAnimateBeginPassDeal = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_PASS_DEAL,
    EuchreAnimateType.ANIMATE,
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
    setters.addPromptValue(PromptType.BID);
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

  // const updateStateAndContinueToBidForTrump = (game: EuchreGameInstance, gameflow: EuchreGameFlowState) => {
  //   const newGameFlow = { ...gameflow };
  //   const biddingRoundFinished = playerEqual(game.dealer, game.currentPlayer);
  //   const firstRound = !state.euchreGameFlow.hasFirstBiddingPassed;

  //   newGameFlow.gameFlow = EuchreGameFlow.BEGIN_BID_FOR_TRUMP;
  //   if (biddingRoundFinished) {
  //     newGameFlow.hasFirstBiddingPassed = firstRound || newGameFlow.hasFirstBiddingPassed;
  //     newGameFlow.hasSecondBiddingPassed = !firstRound;
  //   }

  //   setters.dispatchGameFlow({ type: EuchreFlowActionType.SET_STATE, state: newGameFlow });
  // };

  /** Update game state for next player in rotation and update which round of bidding has passed.
   * If second round of bidding is finished, move to pass deal state, otherwise move back to begin
   * bid for trump for the next player in turn.
   */
  const updateStateForEndOfTrump = () => {
    const newGameFlow = { ...state.euchreGameFlow };
    const biddingRoundFinished = playerEqual(state.euchreGame.dealer, state.euchreGame.currentPlayer);
    const firstRound = !state.euchreGameFlow.hasFirstBiddingPassed;

    if (biddingRoundFinished) {
      newGameFlow.hasFirstBiddingPassed = firstRound || newGameFlow.hasFirstBiddingPassed;
      newGameFlow.hasSecondBiddingPassed = !firstRound;
    }

    if (newGameFlow.hasSecondBiddingPassed) {
      // all users have passed. pass the deal to the next user and begin to re-deal.
      continueToBeginPassDeal();
    } else {
      newGameFlow.gameFlow = EuchreGameFlow.BEGIN_BID_FOR_TRUMP;
      setters.dispatchGameFlow({ type: EuchreFlowActionType.SET_STATE, state: newGameFlow });

      const newGame: EuchreGameInstance = { ...state.euchreGame };
      const rotation: EuchrePlayer[] = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer);
      newGame.currentPlayer = rotation[0];

      setters.setEuchreGame(newGame);
    }
  };

  const updateStateForNewHand = () => {
    setters.removePromptValue(PromptType.HAND_RESULT);
    setters.dispatchGameFlow({
      type: EuchreFlowActionType.SET_STATE,
      state: getGameStateForNextHand(state.euchreGameFlow, state.euchreSettings, state.euchreGame.gamePlayers)
    });
    setters.dispatchStateChange(
      undefined,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const pauseForPassDeal = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_PASS_DEAL,
      EuchreAnimationActionType.SET_NONE,
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
    shouldBeginBidForTrump,
    shouldAnimateBeginBidForTrump,
    shouldEndBidForTrump,
    shouldBeginPassDeal,
    shouldAnimateBeginPassDeal,
    continueToAnimateBeginBidForTrump,
    pauseForBidForTrump,
    continueToBeginPassDeal,
    continueToEndBidForTrump,
    //updateStateAndContinueToBidForTrump,
    updateStateForEndOfTrump,
    updateStateForNewHand,
    continueToBeginOrderTrump,
    pauseForPassDeal,
    continueToShuffleCards
  };
};

export default useGameBidState;
