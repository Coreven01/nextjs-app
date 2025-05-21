import { Card, PromptType, TableLocation } from '@/app/lib/euchre/definitions/definitions';
import {
  getPlayerNotificationType,
  PlayerNotificationAction,
  PlayerNotificationActionType
} from '../reducers/playerNotificationReducer';
import { useCallback, useEffect, useRef } from 'react';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
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
import useGamePlayState from '../phases/useGamePlayState';
import { EuchrePauseType } from '../reducers/gamePauseReducer';
import {
  createTrick,
  gameDelay,
  getCardsAvailableToPlay,
  incrementSpeed,
  isGameOver,
  isHandFinished,
  isTrickFinished,
  notificationDelay,
  playerSittingOut,
  updateIfHandOver,
  updateIfTrickOver
} from '../../../lib/euchre/util/gameDataUtil';
import { availableCardsToPlay, getPlayerRotation } from '../../../lib/euchre/util/playerDataUtil';
import {
  addCardPlayedEvent,
  addHandWonEvent,
  addPlayCardEvent,
  addPlayerRenegedEvent,
  addTrickWonEvent
} from '../../../lib/euchre/util/gamePlayEventsUtil';
import { determineCardToPlay } from '../../../lib/euchre/util/gamePlayLogicUtil';
import { EuchreGameFlow } from '../reducers/gameFlowReducer';
import { EuchreAnimateType } from '../reducers/gameAnimationFlowReducer';

const useEuchreGamePlay = (
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers
) => {
  const playerAutoPlayed = useRef(false);
  const {
    shouldBeginPlayCard,
    shouldAnimateBeginPlayCard,
    shouldEndPlayCard,
    shouldAnimateBeginPlayCardResult,
    shouldEndPlayCardResult,
    shouldAnimateEndPlayCardResult,
    shouldAnimateBeginTrickFinished,
    pauseForPlayCard,
    pauseForPlayCardAnimation,
    continueToAnimateBeginPlayCard,
    continueToEndPlayCard,
    continueToAnimateBeginPlayCardResult,
    continueToEndPlayCardResult,
    continueToAnimateEndPlayCardResult,
    continueToBeginPlayCard,
    continueToTrickFinished,
    continueToAnimateTrickFinished,
    pauseForPrompt,
    pauseForTrickFinished,
    resetForNewHand
  } = useGamePlayState(state, setters, errorHandlers);
  const { euchreGame, euchreGameFlow, euchreAnimationFlow, euchreSettings, euchrePauseState, playedCard } =
    state;
  /**
   * Show an indicator in the player's area to show which card won.
   */
  const getPlayerNotificationCheck = useCallback(
    (location: TableLocation) => {
      const newAction: PlayerNotificationAction = {
        type: getPlayerNotificationType(location),
        payload: undefined
      };

      newAction.payload = (
        <GamePlayIndicator location={location} notificationSpeed={euchreSettings.notificationSpeed} />
      );

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
  }, [euchreGame, euchreSettings.gamePoints, resetForNewHand, setters]);

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

  const handleCardPlayedComplete = () => {
    if (
      euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_PLAY_CARD &&
      euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
      euchrePauseState.pauseType === EuchrePauseType.ANIMATE
    ) {
      continueToEndPlayCard();
    }
  };

  /**
   *
   */
  const handleTrickFinished = useCallback(() => {
    if (
      euchreGameFlow.gameFlow === EuchreGameFlow.TRICK_FINISHED &&
      euchrePauseState.pauseType === EuchrePauseType.ANIMATE
    ) {
      continueToAnimateTrickFinished();
    }
  }, [continueToAnimateTrickFinished, euchreGameFlow.gameFlow, euchrePauseState.pauseType]);

  //#region Play Card *************************************************************************

  /** Regualr play for the game for winning tricks. Each player will play a card to determine the winner of the trick. If human player,
   * wait for user to select a card, otherwise select a card for AI player.
   */
  const beginPlayCard = useCallback(() => {
    if (!shouldBeginPlayCard) return;

    const newGame: EuchreGameInstance = { ...euchreGame };

    addPlayCardEvent(true, state, eventHandlers);

    if (isTrickFinished(newGame) && !isHandFinished(newGame)) {
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
    euchreGame,
    euchreSettings.autoFollowSuit,
    euchreSettings.difficulty,
    eventHandlers,
    pauseForPlayCard,
    setters,
    shouldBeginPlayCard,
    state
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
      //await new Promise((resolve) => setTimeout(resolve, 50));

      //continueToEndPlayCard();
      pauseForPlayCardAnimation();
    };

    errorHandlers.catchAsync(animateBeginPlayCards, errorHandlers.onError, 'animateBeginPlayCards');
  }, [continueToEndPlayCard, errorHandlers, pauseForPlayCardAnimation, setters, shouldAnimateBeginPlayCard]);

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
    addCardPlayedEvent(cardPlayed, state, eventHandlers);
    newGame.currentTrick.cardsPlayed.push(cardPlayed);

    setters.setEuchreGame(newGame);
    setters.setPlayedCard(null);

    continueToAnimateBeginPlayCardResult();
  }, [
    continueToAnimateBeginPlayCardResult,
    euchreGame,
    eventHandlers,
    playedCard,
    setters,
    shouldEndPlayCard,
    state
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
  }, [continueToAnimateEndPlayCardResult, euchreGame, setters, shouldEndPlayCardResult]);

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
          addTrickWonEvent(currentTrick.taker, wonCard.card, state, eventHandlers);
        }
        pauseForTrickFinished();
      } else if (currentTrick.playerRenege) {
        const renegeCard = currentTrick.cardsPlayed.find((c) => c.player === currentTrick.playerRenege);

        if (renegeCard) {
          addPlayerRenegedEvent(currentTrick.playerRenege, renegeCard.card, state, eventHandlers);
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
        await notificationDelay(euchreSettings, playedReneged ? 1 : undefined);
        continueToTrickFinished();
      }
    };

    errorHandlers.catchAsync(
      animateEndResultOfCardPlayed,
      errorHandlers.onError,
      'animateEndResultOfCardPlayed'
    );
  }, [
    continueToBeginPlayCard,
    continueToTrickFinished,
    errorHandlers,
    euchreGame,
    euchreSettings,
    eventHandlers,
    getPlayerNotificationCheck,
    pauseForTrickFinished,
    setters,
    shouldAnimateEndPlayCardResult,
    state
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

        addHandWonEvent(handResult, state, eventHandlers);

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
    continueToBeginPlayCard,
    errorHandlers,
    euchreGame,
    euchreSettings,
    eventHandlers,
    handleCloseHandResults,
    pauseForPrompt,
    setters,
    shouldAnimateBeginTrickFinished,
    state
  ]);

  //#endregion

  return { handleCardPlayed, handleCardPlayedComplete, handleCloseHandResults, handleTrickFinished };
};

export default useEuchreGamePlay;
