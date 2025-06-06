import {
  getPlayerNotificationType,
  NotificationAction,
  NotificationActionType
} from '../../state/reducers/playerNotificationReducer';
import { useCallback, useEffect, useRef } from 'react';
import PlayerNotification from '@/features/euchre/components/player/player-notification';
import { v4 as uuidv4 } from 'uuid';
import { GameEventHandlers } from '../common/useEventLog';
import {
  ErrorHandlers,
  EuchreCard,
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  EuchreTrick
} from '../../definitions/game-state-definitions';
import GamePlayIndicator from '../../components/game/game-play-indicator';
import useGamePlayState from '../phases/useGamePlayState';
import { EuchrePauseType } from '../../state/reducers/gamePauseReducer';
import {
  createTrick,
  gameDelay,
  getCardsAvailableToPlay,
  incrementSpeed,
  isGameOver,
  isHandFinished,
  isTrickFinished,
  minNotificationDelay,
  notificationDelay,
  updateIfHandOver,
  updateIfTrickOver
} from '../../util/game/gameDataUtil';
import { availableCardsToPlay, getPlayerRotation, getTeamColor } from '../../util/game/playerDataUtil';
import {
  addCardPlayedEvent,
  addHandWonEvent,
  addPlayCardEvent,
  addPlayerRenegedEvent,
  addTrickWonEvent
} from '../../util/game/events/gamePlayEventsUtil';
import { determineCardToPlay } from '../../util/game/gamePlayLogicUtil';
import { EuchreGameFlow } from '../../state/reducers/gameFlowReducer';
import { EuchreAnimateType } from '../../state/reducers/gameAnimationFlowReducer';
import { TableLocation, PromptType, Card } from '../../definitions/definitions';
import UserInfo from '../../components/player/user-info';
import PlayerColor from '../../components/player/player-team-color';

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
      const playerLocation = getPlayerNotificationType(location);
      const newAction: NotificationAction = {
        type: playerLocation,
        payload: (
          <GamePlayIndicator
            relativeLocation="center"
            playerLocation={playerLocation}
            notificationSpeed={euchreSettings.notificationSpeed}
          />
        )
      };

      return newAction;
    },
    [euchreSettings.notificationSpeed]
  );

  /**
   *
   * @param player
   * @returns
   */
  const getNotificationForHandkWon = useCallback(() => {
    const newAction: NotificationAction = {
      type: NotificationActionType.CENTER,
      payload: undefined
    };

    const handResult = euchreGame.handResults.at(-1);
    const wonPlayer = euchreGame.gamePlayers.find((p) => p.team === handResult?.teamWon);

    if (!handResult) return newAction;
    if (!wonPlayer) return newAction;

    const infoDetail = (
      <UserInfo className="absolute p-2 w-auto whitespace-nowrap shadow-lg shadow-black z-50">
        <div className="flex items-center">
          <PlayerColor
            className="border border-white text-transparent h-4 w-4 mr-2"
            teamColor={getTeamColor(wonPlayer, euchreSettings)}
          >
            X
          </PlayerColor>
          {'  '}
          Team won {handResult.points} {handResult.points === 1 ? 'point' : 'points'}
        </div>
      </UserInfo>
    );
    newAction.payload = infoDetail;

    return newAction;
  }, [euchreGame.gamePlayers, euchreGame.handResults, euchreSettings]);

  /**
   *
   */
  const handleCloseHandResults = useCallback(() => {
    const gameOver = isGameOver(euchreGame, euchreSettings.gamePoints);
    setters.dispatchPlayerNotification({ type: NotificationActionType.RESET });

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
      setters.dispatchPlayerNotification({ type: NotificationActionType.RESET });
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

    newGame = updateIfTrickOver(newGame);
    newGame = updateIfHandOver(newGame);

    setters.setEuchreGame(newGame);
    //setters.dispatchPause();

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

        await notificationDelay(euchreSettings);

        pauseForTrickFinished();
      } else if (currentTrick.playerRenege) {
        const renegeCard = currentTrick.cardsPlayed.find((c) => c.player === currentTrick.playerRenege);

        if (renegeCard) {
          addPlayerRenegedEvent(currentTrick.playerRenege, renegeCard.card, state, eventHandlers);
        }

        const notification: NotificationAction = {
          type: NotificationActionType.CENTER,
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
        continueToAnimateTrickFinished();
      }
    };

    errorHandlers.catchAsync(
      animateEndResultOfCardPlayed,
      errorHandlers.onError,
      'animateEndResultOfCardPlayed'
    );
  }, [
    continueToAnimateTrickFinished,
    continueToBeginPlayCard,
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

        setters.dispatchPlayerNotification({ type: NotificationActionType.RESET });
        pauseForPrompt();

        if (euchreSettings.showHandResult) {
          setters.addPromptValue(PromptType.HAND_RESULT);
        } else {
          setters.dispatchPlayerNotification(getNotificationForHandkWon());
          await minNotificationDelay(euchreSettings, 2000);
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
    getNotificationForHandkWon,
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
