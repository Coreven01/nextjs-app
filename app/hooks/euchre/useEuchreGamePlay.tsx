import { Card, PromptType } from '@/app/lib/euchre/definitions/definitions';
import { CheckCircleIcon } from '@heroicons/react/16/solid';
import { EuchreFlowActionType, EuchreGameFlow } from './reducers/gameFlowReducer';
import { PlayerNotificationAction, PlayerNotificationActionType } from './reducers/playerNotificationReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './reducers/gameAnimationFlowReducer';

import { useCallback, useEffect, useRef } from 'react';
import UserInfo from '@/app/ui/euchre/player/user-info';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
import clsx from 'clsx';
import useGameStateLogic from './logic/useGameStateLogic';
import useGameData from './data/useGameData';
import usePlayerData from './data/usePlayerData';
import useGameSetupLogic from './logic/useGameSetupLogic';
import useGamePlayLogic from './logic/useGamePlayLogic';
import { v4 as uuidv4 } from 'uuid';
import { GameEventHandlers, SUB_SUIT } from './useEventLog';
import EphemeralModal from '../../ui/euchre/common/ephemeral-modal';
import {
  EuchreCard,
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  EuchreTrick,
  ErrorHandlers
} from '../../lib/euchre/definitions/game-state-definitions';
import GamePlayIndicator from '../../ui/euchre/game/game-play-indicator';

export default function useEuchreGamePlay(
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers
) {
  const playerAutoPlayed = useRef(false);
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { createTrick } = useGameSetupLogic();
  const { getPlayerRotation, availableCardsToPlay, getTeamColor } = usePlayerData();
  const { determineCardToPlay, getGameStateForNextHand } = useGamePlayLogic();
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

  /**
   * Show an indicator in the player's area to show which card won.
   */
  const getPlayerNotificationCheck = useCallback(
    (result: EuchreTrick) => {
      const newAction: PlayerNotificationAction = {
        type: PlayerNotificationActionType.UPDATE_CENTER,
        payload: undefined
      };

      newAction.payload = (
        <GamePlayIndicator
          playerNumber={result.taker?.playerNumber ?? 1}
          notificationSpeed={state.euchreSettings.notificationSpeed}
          side="center"
        />
      );

      return newAction;
    },
    [state.euchreSettings.notificationSpeed]
  );

  //#region Play Card *************************************************************************

  /** Regualr play for the game for winning tricks. Each player will play a card to determine the winner of the trick. If human player,
   * wait for user to select a card, otherwise select a card for AI player.
   */
  const beginPlayCard = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state,
        EuchreGameFlow.BEGIN_PLAY_CARD,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        errorHandlers.onCancel
      )
    )
      return;

    const newGame: EuchreGameInstance = { ...state.euchreGame };

    eventHandlers.addEvent(
      eventHandlers.createEvent('d', state.euchreGame?.currentPlayer, `Begin play card for regular play.`)
    );

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
      //setters.dispatchStateChange(EuchreGameFlow.AWAIT_AI_INPUT);
    } else {
      //setters.dispatchStateChange(EuchreGameFlow.AWAIT_USER_INPUT);
    }
  }, [
    availableCardsToPlay,
    createTrick,
    determineCardToPlay,
    errorHandlers.onCancel,
    eventHandlers,
    getCardsAvailableToPlay,
    isGameStateValidToContinue,
    isHandFinished,
    isTrickFinished,
    setters,
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
      if (
        !isGameStateValidToContinue(
          state,
          EuchreGameFlow.BEGIN_PLAY_CARD,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          errorHandlers.onCancel
        )
      )
        return;

      setters.dispatchStateChange(EuchreGameFlow.END_PLAY_CARD, EuchreAnimationActionType.SET_NONE);
      playerAutoPlayed.current = false;
    };

    try {
      animateBeginPlayCards();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'animateBeginPlayCards');
    }
  }, [errorHandlers, isGameStateValidToContinue, setters, state]);

  /**
   *
   */
  const endPlayCard = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state,
        EuchreGameFlow.END_PLAY_CARD,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        errorHandlers.onCancel
      )
    )
      return;

    const newGame: EuchreGameInstance = { ...state.euchreGame };
    if (!state.playedCard) throw Error('Played card not found for end play card.');

    const cardPlayed: EuchreCard = {
      player: newGame.currentPlayer,
      card: state.playedCard
    };

    newGame.currentPlayer.playedCards.push(state.playedCard);

    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        cardPlayed.player,
        `Played card: ${SUB_SUIT}`,
        [cardPlayed.card],
        getTeamColor(cardPlayed.player, state.euchreSettings)
      )
    );

    newGame.currentTrick.cardsPlayed.push(cardPlayed);
    setters.setEuchreGame(newGame);
    setters.setPlayedCard(null);
    setters.dispatchStateChange(EuchreGameFlow.BEGIN_PLAY_CARD_RESULT, EuchreAnimationActionType.SET_ANIMATE);
  }, [errorHandlers.onCancel, eventHandlers, getTeamColor, isGameStateValidToContinue, setters, state]);

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

  /**
   *
   */
  const handleCloseHandResults = useCallback(() => {
    const gameOver = isGameOver(state.euchreGame);

    if (gameOver) {
      setters.setPromptValue([{ type: PromptType.GAME_RESULT }]);
    } else {
      const newGame: EuchreGameInstance = { ...state.euchreGame };
      const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
      newGame.dealer = rotation[0];
      newGame.currentRound += 1;

      setters.setEuchreGame(newGame);
      setters.setPromptValue([]);
      setters.dispatchGameFlow({
        type: EuchreFlowActionType.SET_STATE,
        state: getGameStateForNextHand(state.euchreGameFlow, state.euchreSettings, newGame)
      });
    }
  }, [
    getGameStateForNextHand,
    getPlayerRotation,
    isGameOver,
    setters,
    state.euchreGame,
    state.euchreGameFlow,
    state.euchreSettings
  ]);

  /**
   *
   */
  const handleCardPlayed = (cardPlayed: Card) => {
    // if (
    //   state.euchreGameFlow.gameFlow === EuchreGameFlow.AWAIT_AI_INPUT ||
    //   state.euchreGameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT
    // ) {
    //   setters.setPlayedCard(cardPlayed);
    //   setters.dispatchStateChange(EuchreGameFlow.BEGIN_PLAY_CARD, EuchreAnimationActionType.SET_ANIMATE);
    // }
  };

  /** Handle UI and animation updates after a player plays a card.
   *
   */
  useEffect(() => {
    const animateResultOfCardPlayed = async () => {
      if (
        !isGameStateValidToContinue(
          state,
          EuchreGameFlow.BEGIN_PLAY_CARD_RESULT,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          errorHandlers.onCancel
        )
      )
        return;

      setters.dispatchStateChange(EuchreGameFlow.END_PLAY_CARD_RESULT, EuchreAnimationActionType.SET_NONE);
    };

    try {
      animateResultOfCardPlayed();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'animateResultOfCardPlayed');
    }
  }, [errorHandlers, isGameStateValidToContinue, setters, state]);

  /**
   *
   */
  const endPlayCardResult = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state,
        EuchreGameFlow.END_PLAY_CARD_RESULT,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        errorHandlers.onCancel
      )
    )
      return;

    let newGame: EuchreGameInstance = { ...state.euchreGame };

    const sittingOut = playerSittingOut(newGame);
    const playerRotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer, sittingOut);

    newGame = updateIfTrickOver(newGame, playerRotation);
    newGame = updateIfHandOver(newGame);

    setters.setEuchreGame(newGame);
    setters.dispatchStateChange(EuchreGameFlow.END_PLAY_CARD_RESULT, EuchreAnimationActionType.SET_ANIMATE);
  }, [
    errorHandlers.onCancel,
    getPlayerRotation,
    isGameStateValidToContinue,
    playerSittingOut,
    setters,
    state,
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
      if (
        !isGameStateValidToContinue(
          state,
          EuchreGameFlow.END_PLAY_CARD_RESULT,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          errorHandlers.onCancel
        )
      )
        return;

      //setters.dispatchStateChange(EuchreGameFlow.WAIT);

      if (isTrickFinished(state.euchreGame)) {
        await animateEndResultTrickFinished();
      } else {
        //short delay between players playing cards if the next player is AI.
        if (!state.euchreGame.currentPlayer.human) await gameDelay(state.euchreSettings);

        setters.dispatchStateChange(EuchreGameFlow.BEGIN_PLAY_CARD, EuchreAnimationActionType.SET_NONE);
      }
    };

    const animateEndResultTrickFinished = async () => {
      // enter this block if all cards have been played, or player reneged.
      const currentTrick: EuchreTrick = state.euchreGame.currentTrick;

      if (!currentTrick.taker)
        throw new Error('Invalid state for handling play card result. Winning trick not found.');

      const playedReneged: boolean = currentTrick.playerRenege !== null;
      if (!playedReneged) {
        const wonCard = currentTrick.cardsPlayed.find((c) => c.player === currentTrick.taker);
        setters.dispatchPlayerNotification(getPlayerNotificationCheck(currentTrick));
        if (wonCard) {
          eventHandlers.addEvent(
            eventHandlers.createEvent(
              'i',
              currentTrick.taker,
              `Won the trick with ${SUB_SUIT}.`,
              [wonCard.card],
              getTeamColor(currentTrick.taker, state.euchreSettings)
            )
          );
        }
      } else if (currentTrick.playerRenege) {
        const renegeCard = currentTrick.cardsPlayed.find((c) => c.player === currentTrick.playerRenege);

        if (renegeCard) {
          eventHandlers.addEvent(
            eventHandlers.createEvent(
              'i',
              currentTrick.playerRenege,
              `Player reneged with ${SUB_SUIT}.`,
              [renegeCard.card],
              getTeamColor(currentTrick.playerRenege, state.euchreSettings)
            )
          );
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
      setters.dispatchStateChange(EuchreGameFlow.TRICK_FINISHED, EuchreAnimationActionType.SET_NONE);
    };
    try {
      animateEndResultOfCardPlayed();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'animateEndResultOfCardPlayed');
    }
  }, [
    errorHandlers,
    eventHandlers,
    gameDelay,
    getPlayerNotificationCheck,
    getTeamColor,
    incrementSpeed,
    isGameStateValidToContinue,
    isTrickFinished,
    notificationDelay,
    setters,
    state
  ]);

  /**
   *
   */
  const handleTrickFinished = useCallback(() => {
    if (
      state.euchreGameFlow.gameFlow === EuchreGameFlow.TRICK_FINISHED &&
      state.euchreAnimationFlow.animationType === EuchreAnimateType.NONE
    ) {
      setters.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
    }
  }, [setters, state.euchreAnimationFlow.animationType, state.euchreGameFlow.gameFlow]);

  /**
   *
   */
  useEffect(() => {
    const animateTrickFinished = async () => {
      if (
        !isGameStateValidToContinue(
          state,
          EuchreGameFlow.TRICK_FINISHED,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          errorHandlers.onCancel
        )
      )
        return;

      if (isHandFinished(state.euchreGame)) {
        //setters.dispatchStateChange(EuchreGameFlow.WAIT);

        const handResult = state.euchreGame.handResults.at(-1);
        if (!handResult) throw new Error('Game result not found for trick finished.');

        eventHandlers.addEvent(
          eventHandlers.createEvent(
            'i',
            undefined,
            `Hand won by team: ${handResult.teamWon} - Points: ${handResult.points}`,
            undefined,
            getTeamColor(
              handResult.teamWon === 1 ? state.euchreGame.player1 : state.euchreGame.player3,
              state.euchreSettings
            )
          )
        );

        await notificationDelay(state.euchreSettings);

        setters.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
        //setters.dispatchStateChange(EuchreGameFlow.AWAIT_PROMPT, EuchreAnimationActionType.SET_NONE);

        if (state.euchreSettings.showHandResult) {
          setters.setPromptValue([{ type: PromptType.HAND_RESULT }]);
        } else {
          handleCloseHandResults();
        }
      } else {
        setters.dispatchStateChange(EuchreGameFlow.BEGIN_PLAY_CARD, EuchreAnimationActionType.SET_NONE);
      }
    };

    try {
      animateTrickFinished();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'animateTrickFinished');
    }
  }, [
    errorHandlers,
    eventHandlers,
    getTeamColor,
    handleCloseHandResults,
    isGameStateValidToContinue,
    isHandFinished,
    notificationDelay,
    setters,
    state
  ]);

  //#endregion

  return { handleCardPlayed, handleCloseHandResults, handleTrickFinished };
}
