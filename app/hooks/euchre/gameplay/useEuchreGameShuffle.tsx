import { useCallback, useEffect } from 'react';
import { PlayerNotificationActionType } from '../reducers/playerNotificationReducer';
import useGameSetupLogic from '../logic/useGameSetupLogic';
import { GameEventHandlers } from '../useEventLog';
import usePlayerData from '../data/usePlayerData';
import {
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  ErrorHandlers
} from '../../../lib/euchre/definitions/game-state-definitions';
import useGameShuffleState from '../phases/useGameShuffleState';
import useGameEventsShuffle from '../events/useGameEventsShuffle';

const useEuchreGameShuffle = (
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers
) => {
  const { addBeginShuffleEvent, addTrumpCardFlippedEvent } = useGameEventsShuffle(state, eventHandlers);
  const { shuffleAndDealHand } = useGameSetupLogic();
  const { getPlayerRotation } = usePlayerData();
  const {
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
  } = useGameShuffleState(state, setters, errorHandlers);
  const { euchreGame, euchreSettings, euchreReplayGame, shouldCancel } = state;

  //#region Handlers

  /** Update game state once card animation is complete and begin the bidding game state. */
  const handleBeginDealComplete = useCallback(() => {
    addTrumpCardFlippedEvent();
    continueToEndDealCards();
  }, [addTrumpCardFlippedEvent, continueToEndDealCards]);

  /** */
  const handleEndDealComplete = useCallback(() => {
    const newGame: EuchreGameInstance = { ...euchreGame };
    const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
    newGame.currentPlayer = rotation[0];

    setters.setEuchreGame(newGame);
    continueToBeginBidForTrump();
  }, [continueToBeginBidForTrump, euchreGame, getPlayerRotation, setters]);
  //#endregion

  //#region Shuffle and Deal for regular playthrough *************************************************************************

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. After deal logic is run, begin animation for dealing cards to players. */
  const beginShuffleAndDealHand = useCallback(() => {
    if (!shouldShuffleCards) return;

    addBeginShuffleEvent();

    const shuffleResult = shuffleAndDealHand(euchreGame, euchreSettings, euchreReplayGame, shouldCancel);

    const newGame = shuffleResult.game;

    setters.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });

    setters.setEuchreGame(newGame);
    continueToAnimateDealCards(newGame);
  }, [
    addBeginShuffleEvent,
    continueToAnimateDealCards,
    setters,
    shouldShuffleCards,
    shuffleAndDealHand,
    euchreGame,
    euchreReplayGame,
    euchreSettings,
    shouldCancel
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
      if (!shouldAnimateBeginDealCards) return;

      // this state is being updated by the event handler [handleShuffleAndDealComplete]
      // which gets executed by an effect in useCardState after the animation is complete for dealing cards.

      // wait a short period to make sure the state chage was picked up by the useCardState effect.
      await new Promise((resolve) => setTimeout(resolve, 50));
      pauseForAnimateBeginDealCards();
    };

    errorHandlers.catchAsync(beginAnimationForDealCards, errorHandlers.onError, 'beginAnimationForDealCards');
  }, [errorHandlers, pauseForAnimateBeginDealCards, shouldAnimateBeginDealCards]);

  /** */
  const endDealCards = useCallback(() => {
    if (!shouldEndDealCards) return;

    continueToAnimateEndDealCards();
  }, [continueToAnimateEndDealCards, shouldEndDealCards]);

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
    const endAnimationEndDealCards = async () => {
      if (!shouldAnimateEndDealCards) return;

      // this state is being updated by the event handler [handleEndDealComplete]
      // which gets executed by an effect in useCardState after the animation is complete for dealing cards.

      // wait a short period to make sure the state chage was picked up by the useCardState effect.
      await new Promise((resolve) => setTimeout(resolve, 50));
      pauseForAnimateEndDealCards();
    };

    errorHandlers.catchAsync(endAnimationEndDealCards, errorHandlers.onError, 'endAnimationEndDealCards');
  }, [errorHandlers, pauseForAnimateEndDealCards, shouldAnimateEndDealCards]);

  //#endregion

  return {
    handleBeginRegularDealComplete: handleBeginDealComplete,
    handleEndRegularDealComplete: handleEndDealComplete
  };
};

export default useEuchreGameShuffle;
