import { useCallback, useEffect } from 'react';
import { NotificationActionType } from '../../state/reducers/playerNotificationReducer';
import { GameEventHandlers } from '../common/useEventLog';
import {
  ErrorHandlers,
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues
} from '../../definitions/game-state-definitions';
import useGameShuffleState from '../../../../app/hooks/euchre/phases/useGameShuffleState';
import {
  addBeginShuffleEvent,
  addSkipDealAnimationEvent,
  addTrumpCardFlippedEvent
} from '../../util/game/gameShuffleEventsUtil';
import { getPlayerRotation } from '../../util/game/playerDataUtil';
import { dealCardsForDealer, shuffleAndDealHand } from '../../util/game/gameSetupLogicUtil';
import { reverseLastHandPlayed } from '../../util/game/gameDebugUtil';

const useEuchreGameShuffle = (
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers
) => {
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
    addTrumpCardFlippedEvent(state, eventHandlers);
    continueToEndDealCards();
  }, [continueToEndDealCards, eventHandlers, state]);

  /** */
  const handleEndDealComplete = useCallback(() => {
    const newGame: EuchreGameInstance = { ...euchreGame };
    const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
    newGame.currentPlayer = rotation[0];

    setters.setEuchreGame(newGame);
    continueToBeginBidForTrump();
  }, [continueToBeginBidForTrump, euchreGame, setters]);
  //#endregion

  //#region Shuffle and Deal for regular playthrough *************************************************************************

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. After deal logic is run, begin animation for dealing cards to players. */
  const beginSkipDealAnimation = useCallback(() => {
    if (!shouldBeginSkipAnimation) return;

    addSkipDealAnimationEvent(state, eventHandlers);

    let newGame = { ...euchreGame };
    const dealResult = dealCardsForDealer(newGame, euchreGameFlow);

    if (!dealResult?.newDealer) throw new Error('Dealer not found after dealing for initial deal.');

    newGame.dealer = dealResult.newDealer;
    newGame.currentPlayer = dealResult.newDealer;

    if (state.shouldReplayHand) {
      newGame = reverseLastHandPlayed(newGame);
      setters.setShouldReplayHand(false);
    } else {
      const shuffleResult = shuffleAndDealHand(newGame, euchreSettings, euchreReplayGame, shouldCancel);

      newGame = shuffleResult.game;
    }
    setters.setEuchreGame(newGame);
    continueToAnimateEndDealCards();
  }, [
    continueToAnimateEndDealCards,
    euchreGame,
    euchreGameFlow,
    euchreReplayGame,
    euchreSettings,
    eventHandlers,
    setters,
    shouldBeginSkipAnimation,
    shouldCancel,
    state
  ]);

  /**
   *
   */
  useEffect(() => {
    try {
      //beginSkipDealAnimation();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'beginSkipDealAnimation');
    }
  }, [beginSkipDealAnimation, errorHandlers]);

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. After deal logic is run, begin animation for dealing cards to players. */
  const beginShuffleAndDealHand = useCallback(() => {
    if (!shouldShuffleCards) return;

    addBeginShuffleEvent(state, eventHandlers);

    let newGame: EuchreGameInstance;
    if (state.shouldReplayHand) {
      newGame = reverseLastHandPlayed(euchreGame);
      setters.setShouldReplayHand(false);
    } else {
      const shuffleResult = shuffleAndDealHand(euchreGame, euchreSettings, euchreReplayGame, shouldCancel);
      newGame = shuffleResult.game;
    }

    setters.dispatchPlayerNotification({ type: NotificationActionType.RESET });
    setters.setEuchreGame(newGame);

    if (!euchreSettings.shouldAnimateDeal) {
      continueToAnimateEndDealCards();
    } else {
      continueToAnimateDealCards(newGame);
    }
  }, [
    continueToAnimateDealCards,
    continueToAnimateEndDealCards,
    euchreGame,
    euchreReplayGame,
    euchreSettings,
    eventHandlers,
    setters,
    shouldCancel,
    shouldShuffleCards,
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
      if (!shouldAnimateBeginDealCards) return;

      // this state is being updated by the event handler [handleShuffleAndDealComplete]
      // which gets executed by an effect in useCardState after the animation is complete for dealing cards.

      // wait a short period to make sure the state chage was picked up by the useCardState effect.
      //await new Promise((resolve) => setTimeout(resolve, 50));
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
      //await new Promise((resolve) => setTimeout(resolve, 50));
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
