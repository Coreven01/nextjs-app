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
  const { addSkipDealAnimationEvent, addBeginShuffleEvent, addTrumpCardFlippedEvent } = useGameEventsShuffle(
    state,
    eventHandlers
  );
  const { shuffleAndDealHand, dealCardsForDealer } = useGameSetupLogic();
  const { getPlayerRotation } = usePlayerData();
  const {
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
  } = useGameShuffleState(state, setters, errorHandlers);
  const { euchreGame, euchreGameFlow, euchreSettings, euchreReplayGame, shouldCancel } = state;

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
  const beginSkipDealAnimation = useCallback(() => {
    if (!shouldBeginSkipAnimation) return;

    addSkipDealAnimationEvent();
    //throw new Error('todo: create initial deal and regular deal function');

    let newGame = { ...euchreGame };
    const dealResult = dealCardsForDealer(newGame, euchreGameFlow, null);

    if (!dealResult?.newDealer) throw new Error('Dealer not found after dealing for initial deal.');

    newGame.dealer = dealResult.newDealer;
    newGame.currentPlayer = dealResult.newDealer;

    const shuffleResult = shuffleAndDealHand(newGame, euchreSettings, null, false);

    newGame = shuffleResult.game;
    setters.setEuchreGame(newGame);

    continueToAnimateEndDealCards();
  }, [
    addSkipDealAnimationEvent,
    continueToAnimateEndDealCards,
    dealCardsForDealer,
    euchreGame,
    euchreGameFlow,
    euchreSettings,
    setters,
    shouldBeginSkipAnimation,
    shuffleAndDealHand
  ]);

  /**
   *
   */
  useEffect(() => {
    try {
      beginSkipDealAnimation();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'beginSkipDealAnimation');
    }
  }, [beginSkipDealAnimation, errorHandlers]);

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. After deal logic is run, begin animation for dealing cards to players. */
  const beginShuffleAndDealHand = useCallback(() => {
    if (!shouldShuffleCards) return;

    addBeginShuffleEvent();

    const shuffleResult = shuffleAndDealHand(euchreGame, euchreSettings, euchreReplayGame, shouldCancel);

    const newGame = shuffleResult.game;

    setters.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });

    setters.setEuchreGame(newGame);

    if (!euchreSettings.shouldAnimateDeal) {
      continueToAnimateEndDealCards();
    } else {
      continueToAnimateDealCards(newGame);
    }
  }, [
    addBeginShuffleEvent,
    continueToAnimateDealCards,
    continueToAnimateEndDealCards,
    euchreGame,
    euchreReplayGame,
    euchreSettings,
    setters,
    shouldCancel,
    shouldShuffleCards,
    shuffleAndDealHand
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
