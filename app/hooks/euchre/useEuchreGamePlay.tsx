import { Card, EuchreCard, EuchreGameInstance, EuchreTrick, PromptType } from '@/app/lib/euchre/definitions';
import { CheckCircleIcon } from '@heroicons/react/16/solid';
import { EuchreFlowActionType, EuchreGameFlow } from './reducers/gameFlowReducer';
import { PlayerNotificationAction, PlayerNotificationActionType } from './reducers/playerNotificationReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { EuchreErrorState, EuchreGameState } from './useEuchreGame';
import { useCallback, useEffect, useRef } from 'react';
import UserInfo from '@/app/ui/euchre/player/user-info';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
import { createEvent } from '@/app/lib/euchre/util';
import clsx from 'clsx';
import useGameStateLogic from './logic/useGameStateLogic';
import useGameData from './data/useGameData';
import usePlayerData from './data/usePlayerData';
import useGameSetupLogic from './logic/useGameSetupLogic';
import useGamePlayLogic from './logic/useGamePlayLogic';
import { v4 as uuidv4 } from 'uuid';

export default function useEuchreGamePlay(state: EuchreGameState, errorState: EuchreErrorState) {
  const playerAutoPlayed = useRef(false);
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { createTrick, createDefaultEuchreGame } = useGameSetupLogic();
  const { getPlayerRotation, availableCardsToPlay } = usePlayerData();
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
    gameDelay
  } = useGameData();

  /**
   *
   */
  const getPlayerNotificationForTrickWon = useCallback((result: EuchreTrick) => {
    const newAction: PlayerNotificationAction = {
      type: PlayerNotificationActionType.UPDATE_CENTER,
      payload: undefined
    };
    const icon: React.ReactNode = <CheckCircleIcon className="min-h-[18px] max-h-[20px] text-green-300" />;
    let messageLocation = '';

    switch (result.taker?.playerNumber) {
      case 1:
        messageLocation = 'lg:bottom-0 -bottom-8';
        break;
      case 2:
        messageLocation = 'lg:top-0 -top-8';
        break;
      case 3:
        messageLocation = 'lg:left-3 -left-8';
        break;
      case 4:
        messageLocation = 'lg:right-3 -right-8';
        break;
    }

    const key = '1';
    const infoDetail = (
      <UserInfo
        className={clsx(
          `p-2 lg:text-lg text-base w-auto absolute whitespace-nowrap z-40 shadow-lg shadow-black text-black border border-black dark:border-white dark:text-white text-center bg-white dark:bg-stone-800`,
          messageLocation
        )}
        id={key}
        key={`${key}`}
      >
        <div className="flex gap-2 items-center">{icon}</div>
      </UserInfo>
    );

    newAction.payload = infoDetail;

    return newAction;
  }, []);

  //#region Play Card *************************************************************************

  /** Regualr play for the game for winning tricks. Each player will play a card to determine the winner of the trick. If human player,
   * wait for user to select a card, otherwise select a card for AI player.
   */
  const beginPlayCard = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state.euchreGame,
        state.euchreGameFlow,
        state.euchreAnimationFlow,
        EuchreGameFlow.BEGIN_PLAY_CARD,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    const newGame: EuchreGameInstance | null = state.euchreGame ? { ...state.euchreGame } : null;

    if (!newGame) throw Error('Game not found for play card.');

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.WAIT });

    state.addEvent(
      createEvent(
        'd',
        state.euchreSettings,
        state.euchreGame?.currentPlayer,
        `Game Flow: Begin play card. Animation Flow: None.`
      )
    );

    if (isTrickFinished(newGame) && !isHandFinished(newGame)) {
      newGame.currentTrick = createTrick(newGame.currentRound);
    }

    if (newGame.currentTrick.cardsPlayed.length === 0) {
      state.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
    }

    // if settings set to auto follow suit, and only one card to play, then play that card without user interaction.
    let awaitForPlayerInput = newGame.currentPlayer.human;
    if (
      awaitForPlayerInput &&
      state.euchreSettings.autoFollowSuit &&
      getCardsAvailableToPlay(
        newGame.trump,
        newGame.currentTrick.cardsPlayed.at(0)?.card ?? null,
        availableCardsToPlay(newGame.currentPlayer)
      ).length === 1
    ) {
      playerAutoPlayed.current = true;
      awaitForPlayerInput = false;
    }

    state.setEuchreGame(newGame);

    if (!awaitForPlayerInput) {
      const selectedCard: Card = { ...determineCardToPlay(newGame, state.euchreSettings.difficulty) };
      state.setPlayedCard(selectedCard);
      state.dispatchGameFlow({
        type: EuchreFlowActionType.SET_GAME_FLOW,
        gameFlow: EuchreGameFlow.AWAIT_AI_INPUT
      });
    } else {
      state.dispatchGameFlow({
        type: EuchreFlowActionType.SET_GAME_FLOW,
        gameFlow: EuchreGameFlow.AWAIT_USER_INPUT
      });
    }
  }, [
    availableCardsToPlay,
    createTrick,
    determineCardToPlay,
    getCardsAvailableToPlay,
    isGameStateValidToContinue,
    isHandFinished,
    isTrickFinished,
    state
  ]);

  /** Play card for AI player, or prompt if player is human. */
  useEffect(() => {
    try {
      beginPlayCard();
    } catch (e) {
      const error = e as Error;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in beginPlayCard',
        gameFlow: EuchreGameFlow.BEGIN_PLAY_CARD,
        animationType: EuchreAnimationActionType.SET_NONE
      });
    }
  }, [beginPlayCard, errorState, state]);

  /** Proxy handler to animate playing the card for the player's choice before updating the state with the choice and result.
   *
   */
  useEffect(() => {
    const animateBeginPlayCards = async () => {
      if (
        !isGameStateValidToContinue(
          state.euchreGame,
          state.euchreGameFlow,
          state.euchreAnimationFlow,
          EuchreGameFlow.BEGIN_PLAY_CARD,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      const newGame: EuchreGameInstance | null = state.euchreGame ? { ...state.euchreGame } : null;
      if (!newGame) throw Error('Game not found for animate play card.');

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.WAIT });

      if (!state.playedCard) throw new Error('Unable to animate play card - player card not found.');

      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_NONE });
      state.dispatchGameFlow({
        type: EuchreFlowActionType.SET_GAME_FLOW,
        gameFlow: EuchreGameFlow.END_PLAY_CARD
      });
      playerAutoPlayed.current = false;
    };

    try {
      animateBeginPlayCards();
    } catch (e) {
      const error = e as Error;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in animateBeginPlayCards',
        gameFlow: EuchreGameFlow.BEGIN_PLAY_CARD,
        animationType: EuchreAnimationActionType.SET_ANIMATE
      });
    }
  }, [errorState, gameDelay, isGameStateValidToContinue, state]);

  /**
   *
   */
  const endPlayCard = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state.euchreGame,
        state.euchreGameFlow,
        state.euchreAnimationFlow,
        EuchreGameFlow.END_PLAY_CARD,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    const newGame: EuchreGameInstance | null = state.euchreGame ? { ...state.euchreGame } : null;

    if (!newGame) throw Error('Game not found - end play card.');
    if (!state.playedCard) throw Error('Played card not found for end play card.');

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.WAIT });

    const cardPlayed: EuchreCard = { player: newGame.currentPlayer, card: state.playedCard };
    newGame.currentPlayer.playedCards.push(state.playedCard);

    state.addEvent(
      createEvent(
        'i',
        state.euchreSettings,
        cardPlayed.player,
        `Card Played: ${cardPlayed.card.value}-${cardPlayed.card.suit}`
      )
    );

    newGame.currentTrick.cardsPlayed.push(cardPlayed);
    state.setEuchreGame(newGame);
    state.setPlayedCard(null);
    state.dispatchGameFlow({
      type: EuchreFlowActionType.SET_GAME_FLOW,
      gameFlow: EuchreGameFlow.BEGIN_PLAY_CARD_RESULT
    });
    state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
  }, [isGameStateValidToContinue, state]);

  /**
   *
   */
  useEffect(() => {
    try {
      endPlayCard();
    } catch (e) {
      const error = e as Error;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in endPlayCard',
        gameFlow: EuchreGameFlow.END_PLAY_CARD,
        animationType: EuchreAnimationActionType.SET_NONE
      });
    }
  }, [endPlayCard, errorState, state]);

  /**
   *
   */
  const handleCloseHandResults = useCallback(() => {
    const newGame: EuchreGameInstance | null = state.euchreGame ? { ...state.euchreGame } : null;

    if (!newGame) throw new Error();

    const gameOver = isGameOver(newGame);

    if (gameOver) {
      state.setPromptValue([{ type: PromptType.GAME_RESULT }]);
    } else {
      const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
      newGame.dealer = rotation[0];
      newGame.currentRound += 1;
      state.setEuchreGame(newGame);
      state.setPromptValue([]);
      state.dispatchGameFlow({
        type: EuchreFlowActionType.SET_STATE,
        state: getGameStateForNextHand(state.euchreGameFlow, state.euchreSettings, newGame)
      });
    }
  }, [getGameStateForNextHand, getPlayerRotation, isGameOver, state]);

  /**
   *
   */
  const handleCardPlayed = (cardPlayed: Card) => {
    if (
      state.euchreGameFlow.gameFlow === EuchreGameFlow.AWAIT_AI_INPUT ||
      state.euchreGameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT
    ) {
      state.setPlayedCard(cardPlayed);
      state.dispatchGameFlow({
        type: EuchreFlowActionType.SET_GAME_FLOW,
        gameFlow: EuchreGameFlow.BEGIN_PLAY_CARD
      });
      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
    }
  };

  /** Handle UI and animation updates after a player plays a card.
   *
   */
  useEffect(() => {
    const animateResultOfCardPlayed = async () => {
      if (
        !isGameStateValidToContinue(
          state.euchreGame,
          state.euchreGameFlow,
          state.euchreAnimationFlow,
          EuchreGameFlow.BEGIN_PLAY_CARD_RESULT,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.WAIT });
      if (!state.euchreGame) throw Error('Game not found.');

      state.dispatchGameFlow({
        type: EuchreFlowActionType.SET_GAME_FLOW,
        gameFlow: EuchreGameFlow.END_PLAY_CARD_RESULT
      });
      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_NONE });
    };

    try {
      animateResultOfCardPlayed();
    } catch (e) {
      const error = e as Error;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in animateResultOfCardPlayed',
        gameFlow: EuchreGameFlow.BEGIN_PLAY_CARD_RESULT,
        animationType: EuchreAnimationActionType.SET_ANIMATE
      });
    }
  }, [
    state,
    handleCloseHandResults,
    isGameStateValidToContinue,
    isTrickFinished,
    isHandFinished,
    errorState
  ]);

  /**
   *
   */
  const endPlayCardResult = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state.euchreGame,
        state.euchreGameFlow,
        state.euchreAnimationFlow,
        EuchreGameFlow.END_PLAY_CARD_RESULT,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;
    let newGame: EuchreGameInstance | null = state.euchreGame ? { ...state.euchreGame } : null;

    if (!newGame) throw Error('Game not found for play card result.');

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.WAIT });

    const sittingOut = playerSittingOut(newGame);
    const playerRotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer, sittingOut);

    newGame = updateIfTrickOver(newGame, playerRotation);
    newGame = updateIfHandOver(newGame);

    state.setEuchreGame(newGame);
    state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
    state.dispatchGameFlow({
      type: EuchreFlowActionType.SET_GAME_FLOW,
      gameFlow: EuchreGameFlow.END_PLAY_CARD_RESULT
    });
  }, [
    getPlayerRotation,
    isGameStateValidToContinue,
    playerSittingOut,
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

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in endPlayCardResult',
        gameFlow: EuchreGameFlow.END_PLAY_CARD_RESULT,
        animationType: EuchreAnimationActionType.SET_NONE
      });
    }
  }, [endPlayCardResult, errorState, state]);

  /** Handle UI and animation updates after a player plays a card.
   *
   */
  useEffect(() => {
    const animateEndResultOfCardPlayed = async () => {
      const newGame: EuchreGameInstance | null = state.euchreGame ? { ...state.euchreGame } : null;

      if (
        !isGameStateValidToContinue(
          newGame,
          state.euchreGameFlow,
          state.euchreAnimationFlow,
          EuchreGameFlow.END_PLAY_CARD_RESULT,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.WAIT });

      if (!newGame) throw new Error('Game not found for animate end card played.');

      if (isTrickFinished(newGame)) {
        // enter this block if all cards have been played, or player reneged.
        const lastWonTrick: EuchreTrick = newGame.currentTrick;

        if (!lastWonTrick.taker)
          throw new Error('Invalid state for handling play card result. Winning trick not found.');

        const playedReneged = lastWonTrick.playerRenege !== null;
        if (!playedReneged) {
          state.dispatchPlayerNotification(getPlayerNotificationForTrickWon(lastWonTrick));
        } else {
          const notification: PlayerNotificationAction = {
            type: PlayerNotificationActionType.UPDATE_CENTER,
            payload: (
              <PlayerNotification
                dealer={newGame.dealer}
                player={newGame.currentPlayer}
                settings={state.euchreSettings}
                info={'renege'}
                loner={false}
                namedSuit={null}
              />
            )
          };

          state.dispatchPlayerNotification(notification);
        }

        state.addEvent(createEvent('i', state.euchreSettings, lastWonTrick.taker, `Trick won.`));
        await notificationDelay(state.euchreSettings);

        // little bit longer pause so the user can see what happened.
        if (playedReneged) await notificationDelay(state.euchreSettings);
      } else {
        //short delay between players playing cards if the next player is AI.
        if (!newGame.currentPlayer.human) await gameDelay(state.euchreSettings);
      }

      if (isHandFinished(newGame)) {
        const gameResult = newGame.gameResults.at(-1);

        if (!gameResult) throw new Error();

        state.addEvent(
          createEvent(
            'i',
            state.euchreSettings,
            newGame.currentPlayer,
            `Hand won team: ${gameResult.teamWon} Points: ${gameResult.points}`
          )
        );

        await notificationDelay(state.euchreSettings);

        state.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
        state.dispatchGameFlow({
          type: EuchreFlowActionType.SET_GAME_FLOW,
          gameFlow: EuchreGameFlow.AWAIT_PROMPT
        });

        if (state.euchreSettings.showHandResult) {
          state.setPromptValue([{ type: PromptType.HAND_RESULT }]);
        } else {
          handleCloseHandResults();
        }
      } else {
        state.dispatchGameFlow({
          type: EuchreFlowActionType.SET_GAME_FLOW,
          gameFlow: EuchreGameFlow.BEGIN_PLAY_CARD
        });
      }

      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_NONE });
    };

    try {
      animateEndResultOfCardPlayed();
    } catch (e) {
      const error = e as Error;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in animateEndResultOfCardPlayed',
        gameFlow: EuchreGameFlow.END_PLAY_CARD_RESULT,
        animationType: EuchreAnimationActionType.SET_ANIMATE
      });
    }
  }, [
    state,
    handleCloseHandResults,
    isGameStateValidToContinue,
    getPlayerNotificationForTrickWon,
    isTrickFinished,
    isHandFinished,
    errorState,
    notificationDelay,
    gameDelay
  ]);

  //#endregion

  return { handleCardPlayed, handleCloseHandResults };
}
