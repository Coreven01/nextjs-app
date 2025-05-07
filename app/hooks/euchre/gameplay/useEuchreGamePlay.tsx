import { Card, PromptType, TableLocation } from '@/app/lib/euchre/definitions/definitions';
import {
  getPlayerNotificationType,
  PlayerNotificationAction,
  PlayerNotificationActionType
} from '../reducers/playerNotificationReducer';
import { useCallback, useEffect, useRef } from 'react';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
import useGameData from '../data/useGameData';
import usePlayerData from '../data/usePlayerData';
import useGameSetupLogic from '../logic/useGameSetupLogic';
import useGamePlayLogic from '../logic/useGamePlayLogic';
import { v4 as uuidv4 } from 'uuid';
import { GameEventHandlers } from '../useEventLog';
import {
  EuchreCard,
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  EuchreTrick,
  ErrorHandlers
} from '../../../lib/euchre/definitions/game-state-definitions';
import GamePlayIndicator from '../../../ui/euchre/game/game-play-indicator';
import useGameEventsPlay from '../events/useGameEventsPlay';
import useGamePlayState from '../phases/useGamePlayState';
import { EuchrePauseType } from '../reducers/gamePauseReducer';

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
  const { addPlayCardEvent, addCardPlayedEvent, addPlayerRenegedEvent, addTrickWonEvent, addHandWonEvent } =
    useGameEventsPlay(state, eventHandlers);

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
  const { euchreGame, euchreSettings, euchrePauseState, playedCard } = state;
  /**
   * Show an indicator in the player's area to show which card won.
   */
  const getPlayerNotificationCheck = useCallback(
    (location: TableLocation) => {
      const newAction: PlayerNotificationAction = {
        type: getPlayerNotificationType(location),
        payload: undefined
      };

      newAction.payload = <GamePlayIndicator notificationSpeed={euchreSettings.notificationSpeed} />;

      return newAction;
    },
    [euchreSettings.notificationSpeed]
  );

  /**
   *
   */
  const handleCloseHandResults = useCallback(() => {
    const gameOver = isGameOver(euchreGame, euchreSettings.gamePoints);

    if (gameOver) {
      setters.dispatchPause();
      setters.addPromptValue(PromptType.GAME_RESULT);
    } else {
      const newGame: EuchreGameInstance = { ...euchreGame };
      const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
      newGame.dealer = rotation[0];
      newGame.currentRound += 1;

      setters.setEuchreGame(newGame);
      resetForNewHand();
    }
  }, [isGameOver, euchreGame, euchreSettings.gamePoints, setters, getPlayerRotation, resetForNewHand]);

  /**
   * Update state with card played from either user selection or auto played by AI.
   */
  const handleCardPlayed = (cardPlayed: Card) => {
    if (
      euchrePauseState.pauseType === EuchrePauseType.AI_INPUT ||
      euchrePauseState.pauseType === EuchrePauseType.USER_INPUT
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

    const newGame: EuchreGameInstance = { ...euchreGame };

    addPlayCardEvent(true);

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
      euchreSettings.autoFollowSuit &&
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
      const selectedCard: Card = { ...determineCardToPlay(newGame, euchreSettings.difficulty) };
      setters.setPlayedCard(selectedCard);
      pauseForPlayCard(true);
    } else {
      pauseForPlayCard(false);
    }
  }, [
    addPlayCardEvent,
    availableCardsToPlay,
    createTrick,
    determineCardToPlay,
    euchreSettings.autoFollowSuit,
    euchreSettings.difficulty,
    getCardsAvailableToPlay,
    isHandFinished,
    isTrickFinished,
    pauseForPlayCard,
    setters,
    shouldBeginPlayCard,
    euchreGame
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

    const newGame: EuchreGameInstance = { ...euchreGame };
    if (!playedCard) throw Error('Played card not found for end play card.');

    const cardPlayed: EuchreCard = {
      player: newGame.currentPlayer,
      card: playedCard
    };

    newGame.currentPlayer.playedCards.push(playedCard);
    addCardPlayedEvent(cardPlayed);
    newGame.currentTrick.cardsPlayed.push(cardPlayed);

    setters.setEuchreGame(newGame);
    setters.setPlayedCard(null);

    continueToAnimateBeginPlayCardResult();
  }, [
    addCardPlayedEvent,
    continueToAnimateBeginPlayCardResult,
    euchreGame,
    setters,
    shouldEndPlayCard,
    playedCard
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

    let newGame: EuchreGameInstance = { ...euchreGame };

    const sittingOut = playerSittingOut(newGame);
    const playerRotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer, sittingOut);

    newGame = updateIfTrickOver(newGame, playerRotation);
    newGame = updateIfHandOver(newGame);

    setters.setEuchreGame(newGame);
    setters.dispatchPause();

    continueToAnimateEndPlayCardResult();
  }, [
    continueToAnimateEndPlayCardResult,
    euchreGame,
    getPlayerRotation,
    playerSittingOut,
    setters,
    shouldEndPlayCardResult,
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

      if (isTrickFinished(euchreGame)) {
        await animateEndResultTrickFinished();
      } else {
        //short delay between players playing cards if the next player is AI.
        if (!euchreGame.currentPlayer.human) {
          //await gameDelay(euchreSettings);
        }

        continueToBeginPlayCard();
      }
    };

    const animateEndResultTrickFinished = async () => {
      // enter this block if all cards have been played for the current trick, or player reneged.
      const currentTrick: EuchreTrick = euchreGame.currentTrick;

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
              dealer={euchreGame.dealer}
              player={euchreGame.currentPlayer}
              settings={euchreSettings}
              info={'renege'}
              loner={false}
              namedSuit={null}
              delayMs={incrementSpeed(euchreSettings.notificationSpeed, 1)}
            />
          )
        };

        setters.dispatchPlayerNotification(notification);
      }
      await notificationDelay(euchreSettings, playedReneged ? 1 : undefined);
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
    euchreGame,
    euchreSettings,
    getPlayerNotificationCheck,
    incrementSpeed,
    isTrickFinished,
    notificationDelay,
    setters,
    shouldAnimateEndPlayCardResult
  ]);

  /**
   *
   */
  useEffect(() => {
    const animateTrickFinished = async () => {
      if (!shouldAnimateBeginTrickFinished) return;

      if (isHandFinished(euchreGame)) {
        setters.dispatchPause();

        const handResult = euchreGame.handResults.at(-1);
        if (!handResult) throw new Error('Game result not found for trick finished.');

        addHandWonEvent(handResult);

        await gameDelay(euchreSettings);

        setters.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
        pauseForPrompt();

        if (euchreSettings.showHandResult) {
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
    euchreGame,
    euchreSettings,
    handleCloseHandResults,
    isHandFinished,
    gameDelay,
    pauseForPrompt,
    setters,
    shouldAnimateBeginTrickFinished
  ]);

  //#endregion

  return { handleCardPlayed, handleCloseHandResults, handleTrickFinished };
}
