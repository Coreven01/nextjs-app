import { EuchreFlowActionType, EuchreGameFlow, EuchreGameFlowState } from './reducers/gameFlowReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { useCallback, useEffect } from 'react';
import { PlayerNotificationActionType } from './reducers/playerNotificationReducer';
import useGameSetupLogic from './logic/useGameSetupLogic';
import useGamePlayLogic from './logic/useGamePlayLogic';
import useGameStateLogic from './logic/useGameStateLogic';
import { GameEventHandlers, SUB_SUIT as SUB_CARD } from './useEventLog';
import usePlayerData from './data/usePlayerData';
import {
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  GameErrorHandlers
} from '../../lib/euchre/definitions/game-state-definitions';
import { EuchrePauseActionType } from './reducers/gamePauseReducer';

const useEuchreGameShuffle = (
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: GameErrorHandlers
) => {
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { shuffleAndDealHand } = useGameSetupLogic();
  const { getGameStateForNextHand } = useGamePlayLogic();
  const { getTeamColor } = usePlayerData();

  //#region Shuffle and Deal for regular playthrough *************************************************************************

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. After deal logic is run, begin animation for dealing cards to players. */
  const beginShuffleAndDealHand = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state,
        EuchreGameFlow.BEGIN_SHUFFLE_CARDS,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        errorHandlers.onCancel
      )
    )
      return;

    setters.dispatchStateChange(EuchreGameFlow.WAIT);

    let newGame: EuchreGameInstance = { ...state.euchreGame };
    if (!newGame.dealer) throw new Error('Dealer not found for shuffle and deal.');

    eventHandlers.addEvent(
      eventHandlers.createEvent('v', newGame.dealer, 'Begin shuffle and deal for regular play.')
    );

    const shuffleResult = shuffleAndDealHand(
      newGame,
      state.euchreSettings,
      state.euchreReplayGame,
      state.shouldCancel
    );

    newGame = shuffleResult.game;
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        newGame.dealer,
        `Flipped up ${SUB_CARD} for bidding.`,
        [newGame.trump],
        getTeamColor(newGame.dealer, state.euchreSettings)
      )
    );

    setters.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });

    const newGameState: EuchreGameFlowState = getGameStateForNextHand(
      state.euchreGameFlow,
      state.euchreSettings,
      newGame
    );
    newGameState.gameFlow = EuchreGameFlow.BEGIN_DEAL_CARDS;

    setters.dispatchGameFlow({ type: EuchreFlowActionType.SET_STATE, state: newGameState });
    setters.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
    setters.setEuchreGame(newGame);
  }, [
    errorHandlers.onCancel,
    eventHandlers,
    getGameStateForNextHand,
    getTeamColor,
    isGameStateValidToContinue,
    setters,
    shuffleAndDealHand,
    state
  ]);

  /**
   *
   */
  useEffect(() => {
    try {
      beginShuffleAndDealHand();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'beginShuffleAndDealHand');
    }
  }, [beginShuffleAndDealHand, errorHandlers]);

  /** Animate cards being dealt by an effect in useCardState  */
  useEffect(() => {
    const beginAnimationForDealCards = async () => {
      if (
        !isGameStateValidToContinue(
          state,
          EuchreGameFlow.BEGIN_DEAL_CARDS,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          errorHandlers.onCancel
        )
      )
        return;

      // this state is being updated by the event handler [handleShuffleAndDealComplete]
      // which gets executed by an effect in useCardState after the animation is complete for dealing cards.

      // wait a short period to make sure the state chage was picked up by the useCardState effect.
      //await new Promise((resolve) => setTimeout(resolve, 150));
      setters.dispatchStateChange(undefined, undefined, EuchrePauseActionType.SET_ANIMATE);
    };

    try {
      beginAnimationForDealCards();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'beginAnimationForDealCards');
    }
  }, [errorHandlers, isGameStateValidToContinue, setters, state]);

  /** Update game state once card animation is complete and begin the bidding game state. */
  const handleBeginDealComplete = () => {
    setters.dispatchStateChange(EuchreGameFlow.END_DEAL_CARDS, EuchreAnimationActionType.SET_NONE);
  };

  const endDealCards = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state,
        EuchreGameFlow.END_DEAL_CARDS,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        errorHandlers.onCancel
      )
    )
      return;

    setters.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
  }, [errorHandlers.onCancel, isGameStateValidToContinue, setters, state]);

  /**
   *
   */
  useEffect(() => {
    try {
      endDealCards();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'endDealCards');
    }
  }, [endDealCards, errorHandlers]);

  /** Animate cards being dealt by an effect in useCardState  */
  useEffect(() => {
    const endAnimationForDealCards = async () => {
      if (
        !isGameStateValidToContinue(
          state,
          EuchreGameFlow.END_DEAL_CARDS,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          errorHandlers.onCancel
        )
      )
        return;

      // this state is being updated by the event handler [handleShuffleAndDealComplete]
      // which gets executed by an effect in useCardState after the animation is complete for dealing cards.

      // wait a short period to make sure the state chage was picked up by the useCardState effect.
      await new Promise((resolve) => setTimeout(resolve, 150));
      setters.dispatchStateChange(EuchreGameFlow.WAIT);
    };

    try {
      endAnimationForDealCards();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'endAnimationForDealCards');
    }
  }, [errorHandlers, isGameStateValidToContinue, setters, state]);

  const handleEndDealComplete = () => {
    setters.dispatchStateChange(EuchreGameFlow.BEGIN_BID_FOR_TRUMP, EuchreAnimationActionType.SET_NONE);
  };
  //#endregion

  return { handleBeginDealComplete, handleEndDealComplete };
};

export default useEuchreGameShuffle;
