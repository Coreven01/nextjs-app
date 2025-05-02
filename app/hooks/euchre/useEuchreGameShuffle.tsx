import { useCallback, useEffect } from 'react';
import { PlayerNotificationActionType } from './reducers/playerNotificationReducer';
import useGameSetupLogic from './logic/useGameSetupLogic';
import { GameEventHandlers, SUB_SUIT } from './useEventLog';
import usePlayerData from './data/usePlayerData';
import {
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  GameErrorHandlers
} from '../../lib/euchre/definitions/game-state-definitions';
import useGameShuffleState from './phases/useGameShuffleState';

const useEuchreGameShuffle = (
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: GameErrorHandlers
) => {
  const { shuffleAndDealHand } = useGameSetupLogic();
  const { getTeamColor, getPlayerRotation } = usePlayerData();
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

  //#region Shuffle and Deal for regular playthrough *************************************************************************

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. After deal logic is run, begin animation for dealing cards to players. */
  const beginShuffleAndDealHand = useCallback(() => {
    if (!shouldShuffleCards) return;

    eventHandlers.addEvent(
      eventHandlers.createEvent('v', state.euchreGame.dealer, 'Begin shuffle and deal for regular play.')
    );

    const shuffleResult = shuffleAndDealHand(
      state.euchreGame,
      state.euchreSettings,
      state.euchreReplayGame,
      state.shouldCancel
    );

    const newGame = shuffleResult.game;

    setters.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });

    setters.setEuchreGame(newGame);
    continueToAnimateDealCards(newGame);
  }, [
    continueToAnimateDealCards,
    eventHandlers,
    setters,
    shouldShuffleCards,
    shuffleAndDealHand,
    state.euchreGame,
    state.euchreReplayGame,
    state.euchreSettings,
    state.shouldCancel
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
      await new Promise((resolve) => setTimeout(resolve, 150));
      pauseForAnimateBeginDealCards();
    };

    try {
      beginAnimationForDealCards();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'beginAnimationForDealCards');
    }
  }, [errorHandlers, pauseForAnimateBeginDealCards, shouldAnimateBeginDealCards]);

  /** Update game state once card animation is complete and begin the bidding game state. */
  const handleBeginDealComplete = () => {
    const game = state.euchreGame;

    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        game.dealer,
        `Flipped up ${SUB_SUIT} for bidding.`,
        [game.trump],
        getTeamColor(game.dealer, state.euchreSettings)
      )
    );

    continueToEndDealCards();
  };

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
      await new Promise((resolve) => setTimeout(resolve, 150));
      pauseForAnimateEndDealCards();
    };

    try {
      endAnimationEndDealCards();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'endAnimationEndDealCards');
    }
  }, [errorHandlers, pauseForAnimateEndDealCards, shouldAnimateEndDealCards]);

  /** */
  const handleEndDealComplete = () => {
    const newGame: EuchreGameInstance = { ...state.euchreGame };
    const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
    newGame.currentPlayer = rotation[0];

    setters.setEuchreGame(newGame);
    continueToBeginBidForTrump();
  };
  //#endregion

  return {
    handleBeginRegularDealComplete: handleBeginDealComplete,
    handleEndRegularDealComplete: handleEndDealComplete
  };
};

export default useEuchreGameShuffle;
