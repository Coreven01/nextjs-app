import { Card, PromptType, TableLocation } from '@/app/lib/euchre/definitions/definitions';
import { EuchreFlowActionType } from './reducers/gameFlowReducer';
import {
  getPlayerNotificationType,
  PlayerNotificationAction,
  PlayerNotificationActionType
} from './reducers/playerNotificationReducer';
import { useCallback, useEffect, useRef } from 'react';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
import useGameData from './data/useGameData';
import usePlayerData from './data/usePlayerData';
import useGameSetupLogic from './logic/useGameSetupLogic';
import useGamePlayLogic from './logic/useGamePlayLogic';
import { v4 as uuidv4 } from 'uuid';
import { GameEventHandlers } from './useEventLog';
import {
  EuchreCard,
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  EuchreTrick,
  ErrorHandlers
} from '../../lib/euchre/definitions/game-state-definitions';
import GamePlayIndicator from '../../ui/euchre/game/game-play-indicator';
import useGameEventsPlay from './events/useGameEventsPlay';
import useGamePlayState from './phases/useGamePlayState';
import { EuchrePauseType } from './reducers/gamePauseReducer';

export default function useEuchreGamePlay(
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers
) {
  const playerAutoPlayed = useRef(false);
  const { createTrick } = useGameSetupLogic();
  const { getPlayerRotation, availableCardsToPlay } = usePlayerData();
  const { determineCardToPlay } = useGamePlayLogic();
  const {
    isHandFinished,
    isTrickFinished,
    updateIfHandOver,
    updateIfTrickOver,
    playerSittingOut,
    getCardsAvailableToPlay,
    isGameOver,
    notificationDelay,
    gameDelay,
    incrementSpeed
  } = useGameData();
  const {
    addBeginPlayCardEvent,
    addCardPlayedEvent,
    addPlayerRenegedEvent,
    addTrickWonEvent,
    addHandWonEvent
  } = useGameEventsPlay(state, eventHandlers);
  const {
    shouldBeginPlayCard,
    shouldAnimateBeginPlayCard,
    shouldEndPlayCard,
    shouldAnimateBeginPlayCardResult,
    shouldEndPlayCardResult,
    shouldAnimateEndPlayCardResult,
    shouldBeginTrickFinished,
    shouldAnimateBeginTrickFinished,
    pauseForPlayCard,
    continueToAnimateBeginPlayCard,
    continueToEndPlayCard,
    continueToAnimateBeginPlayCardResult,
    continueToEndPlayCardResult,
    continueToAnimateEndPlayCardResult,
    continueToBeginPlayCard,
    continueToTrickFinished,
    continueToAnimateTrickFinished,
    pauseForPrompt,
    resetForNewHand
  } = useGamePlayState(state, setters, errorHandlers);

  /**
   * Show an indicator in the player's area to show which card won.
   */
  const getPlayerNotificationCheck = useCallback(
    (location: TableLocation) => {
      const newAction: PlayerNotificationAction = {
        type: getPlayerNotificationType(location),
        payload: undefined
      };

      newAction.payload = <GamePlayIndicator notificationSpeed={state.euchreSettings.notificationSpeed} />;

      return newAction;
    },
    [state.euchreSettings.notificationSpeed]
  );

  /**
   *
   */
  const handleCloseHandResults = useCallback(() => {
    const gameOver = isGameOver(state.euchreGame);

    if (gameOver) {
      setters.dispatchPause();
      setters.addPromptValue(PromptType.GAME_RESULT);
    } else {
      const newGame: EuchreGameInstance = { ...state.euchreGame };
      const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
      newGame.dealer = rotation[0];
      newGame.currentRound += 1;

      setters.setEuchreGame(newGame);
      resetForNewHand();
    }
  }, [getPlayerRotation, isGameOver, resetForNewHand, setters, state.euchreGame]);

  /**
   *
   */
  const handleCardPlayed = (cardPlayed: Card) => {
    if (
      state.euchrePauseState.pauseType === EuchrePauseType.AI_INPUT ||
      state.euchrePauseState.pauseType === EuchrePauseType.USER_INPUT
    ) {
      setters.setPlayedCard(cardPlayed);
      continueToAnimateBeginPlayCard();
    }
  };

  /**
   *
   */
  const handleTrickFinished = useCallback(() => {
    if (shouldBeginTrickFinished) {
      continueToAnimateTrickFinished();
    }
  }, [continueToAnimateTrickFinished, shouldBeginTrickFinished]);

  //#region Play Card *************************************************************************

  /** Regualr play for the game for winning tricks. Each player will play a card to determine the winner of the trick. If human player,
   * wait for user to select a card, otherwise select a card for AI player.
   */
  const beginPlayCard = useCallback(() => {
    if (!shouldBeginPlayCard) return;

    const newGame: EuchreGameInstance = { ...state.euchreGame };

    addBeginPlayCardEvent();

    if (isTrickFinished(newGame) && !isHandFinished(newGame)) {
      console.log('[createTrick] - called for begin play card when trick finished or hand finished');
      newGame.currentTrick = createTrick(newGame.currentRound);
    }

    if (newGame.currentTrick.cardsPlayed.length === 0) {
      setters.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
    }

    // if settings set to auto follow suit, and only one card to play, then play that card without user interaction.
    let awaitForPlayerInput = newGame.currentPlayer.human;
    const shouldAutoPlay =
      awaitForPlayerInput &&
      state.euchreSettings.autoFollowSuit &&
      getCardsAvailableToPlay(
        newGame.trump,
        newGame.currentTrick.cardsPlayed.at(0)?.card ?? null,
        availableCardsToPlay(newGame.currentPlayer)
      ).length === 1;

    if (shouldAutoPlay) {
      playerAutoPlayed.current = true;
      awaitForPlayerInput = false;
    }

    setters.setEuchreGame(newGame);

    if (!awaitForPlayerInput) {
      const selectedCard: Card = { ...determineCardToPlay(newGame, state.euchreSettings.difficulty) };
      setters.setPlayedCard(selectedCard);
      pauseForPlayCard(true);
    } else {
      pauseForPlayCard(false);
    }
  }, [
    addBeginPlayCardEvent,
    availableCardsToPlay,
    createTrick,
    determineCardToPlay,
    getCardsAvailableToPlay,
    isHandFinished,
    isTrickFinished,
    pauseForPlayCard,
    setters,
    shouldBeginPlayCard,
    state.euchreGame,
    state.euchreSettings.autoFollowSuit,
    state.euchreSettings.difficulty
  ]);

  /** Play card for AI player, or prompt if player is human. */
  useEffect(() => {
    try {
      beginPlayCard();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'beginPlayCard');
    }
  }, [beginPlayCard, errorHandlers]);

  /** Proxy handler to animate playing the card for the player's choice before updating the state with the choice and result.
   *
   */
  useEffect(() => {
    const animateBeginPlayCards = async () => {
      if (!shouldAnimateBeginPlayCard) return;

      setters.dispatchPause();
      playerAutoPlayed.current = false;

      // this state triggers a re-order of player's hand in useCardState.ts
      await new Promise((resolve) => setTimeout(resolve, 50));

      continueToEndPlayCard();
    };

    errorHandlers.catchAsync(animateBeginPlayCards, errorHandlers.onError, 'animateBeginPlayCards');
  }, [continueToEndPlayCard, errorHandlers, setters, shouldAnimateBeginPlayCard]);

  /**
   *
   */
  const endPlayCard = useCallback(() => {
    if (!shouldEndPlayCard) return;

    const newGame: EuchreGameInstance = { ...state.euchreGame };
    if (!state.playedCard) throw Error('Played card not found for end play card.');

    const cardPlayed: EuchreCard = {
      player: newGame.currentPlayer,
      card: state.playedCard
    };

    newGame.currentPlayer.playedCards.push(state.playedCard);
    addCardPlayedEvent(cardPlayed);
    newGame.currentTrick.cardsPlayed.push(cardPlayed);

    setters.setEuchreGame(newGame);
    setters.setPlayedCard(null);
    continueToAnimateBeginPlayCardResult();
  }, [
    addCardPlayedEvent,
    continueToAnimateBeginPlayCardResult,
    setters,
    shouldEndPlayCard,
    state.euchreGame,
    state.playedCard
  ]);

  /**
   *
   */
  useEffect(() => {
    try {
      endPlayCard();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'endPlayCard');
    }
  }, [endPlayCard, errorHandlers]);

  /** Handle UI and animation updates after a player plays a card.
   *
   */
  useEffect(() => {
    const animateBeginPlayCardResult = () => {
      if (!shouldAnimateBeginPlayCardResult) return;

      continueToEndPlayCardResult();
    };

    try {
      animateBeginPlayCardResult();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'animateBeginPlayCardResult');
    }
  }, [continueToEndPlayCardResult, errorHandlers, shouldAnimateBeginPlayCardResult]);

  /**
   *
   */
  const endPlayCardResult = useCallback(() => {
    if (!shouldEndPlayCardResult) return;

    let newGame: EuchreGameInstance = { ...state.euchreGame };

    const sittingOut = playerSittingOut(newGame);
    const playerRotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer, sittingOut);

    newGame = updateIfTrickOver(newGame, playerRotation);
    newGame = updateIfHandOver(newGame);

    setters.setEuchreGame(newGame);
    setters.dispatchPause();
    continueToAnimateEndPlayCardResult();
  }, [
    continueToAnimateEndPlayCardResult,
    getPlayerRotation,
    playerSittingOut,
    setters,
    shouldEndPlayCardResult,
    state.euchreGame,
    updateIfHandOver,
    updateIfTrickOver
  ]);

  /**
   *
   */
  useEffect(() => {
    try {
      endPlayCardResult();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'endPlayCardResult');
    }
  }, [endPlayCardResult, errorHandlers]);

  /** Handle UI and animation updates after a player plays a card.
   *
   */
  useEffect(() => {
    const animateEndResultOfCardPlayed = async () => {
      if (!shouldAnimateEndPlayCardResult) return;

      setters.dispatchPause();

      if (isTrickFinished(state.euchreGame)) {
        await animateEndResultTrickFinished();
      } else {
        //short delay between players playing cards if the next player is AI.
        // if (!state.euchreGame.currentPlayer.human) {
        //   await gameDelay(state.euchreSettings);
        // }

        continueToBeginPlayCard();
      }
    };

    const animateEndResultTrickFinished = async () => {
      // enter this block if all cards have been played for the current trick, or player reneged.
      const currentTrick: EuchreTrick = state.euchreGame.currentTrick;

      if (!currentTrick.taker)
        throw new Error('Invalid state for handling play card result. Winning trick not found.');

      const playedReneged: boolean = currentTrick.playerRenege !== null;
      if (!playedReneged) {
        const wonCard = currentTrick.cardsPlayed.find((c) => c.player === currentTrick.taker);
        setters.dispatchPlayerNotification(getPlayerNotificationCheck(currentTrick.taker.location));
        if (wonCard) {
          addTrickWonEvent(currentTrick.taker, wonCard.card);
        }
      } else if (currentTrick.playerRenege) {
        const renegeCard = currentTrick.cardsPlayed.find((c) => c.player === currentTrick.playerRenege);

        if (renegeCard) {
          addPlayerRenegedEvent(currentTrick.playerRenege, renegeCard.card);
        }

        const notification: PlayerNotificationAction = {
          type: PlayerNotificationActionType.UPDATE_CENTER,
          payload: (
            <PlayerNotification
              key={uuidv4()}
              dealer={state.euchreGame.dealer}
              player={state.euchreGame.currentPlayer}
              settings={state.euchreSettings}
              info={'renege'}
              loner={false}
              namedSuit={null}
              delayMs={incrementSpeed(state.euchreSettings.notificationSpeed, 1)}
            />
          )
        };

        setters.dispatchPlayerNotification(notification);
      }
      await notificationDelay(state.euchreSettings, playedReneged ? 1 : undefined);
      continueToTrickFinished();
    };

    errorHandlers.catchAsync(
      animateEndResultOfCardPlayed,
      errorHandlers.onError,
      'animateEndResultOfCardPlayed'
    );
  }, [
    addPlayerRenegedEvent,
    addTrickWonEvent,
    continueToBeginPlayCard,
    continueToTrickFinished,
    errorHandlers,
    gameDelay,
    getPlayerNotificationCheck,
    incrementSpeed,
    isTrickFinished,
    notificationDelay,
    setters,
    shouldAnimateEndPlayCardResult,
    state.euchreGame,
    state.euchreSettings
  ]);

  /**
   *
   */
  useEffect(() => {
    const animateTrickFinished = async () => {
      if (!shouldAnimateBeginTrickFinished) return;

      if (isHandFinished(state.euchreGame)) {
        setters.dispatchPause();

        const handResult = state.euchreGame.handResults.at(-1);
        if (!handResult) throw new Error('Game result not found for trick finished.');

        addHandWonEvent(handResult);

        await notificationDelay(state.euchreSettings);

        setters.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
        pauseForPrompt();

        if (state.euchreSettings.showHandResult) {
          setters.addPromptValue(PromptType.HAND_RESULT);
        } else {
          handleCloseHandResults();
        }
      } else {
        continueToBeginPlayCard();
      }
    };

    errorHandlers.catchAsync(animateTrickFinished, errorHandlers.onError, 'animateTrickFinished');
  }, [
    addHandWonEvent,
    continueToBeginPlayCard,
    errorHandlers,
    handleCloseHandResults,
    isHandFinished,
    notificationDelay,
    pauseForPrompt,
    setters,
    shouldAnimateBeginTrickFinished,
    state.euchreGame,
    state.euchreSettings
  ]);

  //#endregion

  return { handleCardPlayed, handleCloseHandResults, handleTrickFinished };
}
