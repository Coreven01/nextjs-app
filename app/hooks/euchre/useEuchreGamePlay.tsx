import { Card, EuchreCard, EuchreGameInstance, EuchreTrick, PromptType } from '@/app/lib/euchre/definitions';
import { CheckCircleIcon } from '@heroicons/react/16/solid';
import { EuchreFlowActionType, EuchreGameFlow } from './reducers/gameFlowReducer';
import { PlayerNotificationAction, PlayerNotificationActionType } from './reducers/playerNotificationReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { EuchreGameState } from './useEuchreGame';
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
import { SUB_SUIT } from './useEventLog';
import EphemeralModal from '../../ui/euchre/common/ephemeral-modal';

export default function useEuchreGamePlay(state: EuchreGameState) {
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
   * Show an indicator in the player's area to show the card that won the trick.
   */
  const getPlayerNotificationForTrickWon = useCallback(
    (result: EuchreTrick) => {
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
          messageLocation = 'lg:left-0 -left-8';
          break;
        case 4:
          messageLocation = 'lg:right-0 -right-8';
          break;
      }

      const infoDetail = (
        <EphemeralModal
          key={uuidv4()}
          className={clsx(
            `w-fit h-fit absolute whitespace-nowrap shadow-lg shadow-black z-50`,
            messageLocation
          )}
          durationMs={500}
          delayMs={state.euchreSettings.notificationSpeed}
          fadeType="both"
        >
          <UserInfo
            className={clsx(
              `p-2 lg:text-lg text-base w-auto absolute whitespace-nowrap z-40 shadow-lg`,
              messageLocation
            )}
          >
            <div className="flex gap-2 items-center">{icon}</div>
          </UserInfo>
        </EphemeralModal>
      );

      newAction.payload = infoDetail;

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
        state.onCancel
      )
    )
      return;

    const newGame: EuchreGameInstance = { ...state.euchreGame };

    state.addEvent(createEvent('d', state.euchreGame?.currentPlayer, `Begin play card for regular play.`));

    if (isTrickFinished(newGame) && !isHandFinished(newGame)) {
      console.log('[createTrick] - called for begin play card when trick finished or hand finished');
      newGame.currentTrick = createTrick(newGame.currentRound);
    }

    if (newGame.currentTrick.cardsPlayed.length === 0) {
      state.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
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

    state.setEuchreGame(newGame);

    if (!awaitForPlayerInput) {
      const selectedCard: Card = { ...determineCardToPlay(newGame, state.euchreSettings.difficulty) };
      state.setPlayedCard(selectedCard);
      state.dispatchStateChange(EuchreGameFlow.AWAIT_AI_INPUT);
    } else {
      state.dispatchStateChange(EuchreGameFlow.AWAIT_USER_INPUT);
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
      state.onError(
        error,
        EuchreGameFlow.BEGIN_PLAY_CARD,
        EuchreAnimationActionType.SET_NONE,
        'beginPlayCard'
      );
    }
  }, [beginPlayCard, state]);

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
          state.onCancel
        )
      )
        return;

      state.dispatchStateChange(EuchreGameFlow.END_PLAY_CARD, EuchreAnimationActionType.SET_NONE);
      playerAutoPlayed.current = false;
    };

    try {
      animateBeginPlayCards();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.BEGIN_PLAY_CARD,
        EuchreAnimationActionType.SET_ANIMATE,
        'animateBeginPlayCards'
      );
    }
  }, [isGameStateValidToContinue, state]);

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
        state.onCancel
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

    state.addEvent(
      createEvent(
        'i',
        cardPlayed.player,
        `Played card: ${SUB_SUIT}`,
        [cardPlayed.card],
        getTeamColor(cardPlayed.player, state.euchreSettings)
      )
    );

    newGame.currentTrick.cardsPlayed.push(cardPlayed);
    state.setEuchreGame(newGame);
    state.setPlayedCard(null);
    state.dispatchStateChange(EuchreGameFlow.BEGIN_PLAY_CARD_RESULT, EuchreAnimationActionType.SET_ANIMATE);
  }, [getTeamColor, isGameStateValidToContinue, state]);

  /**
   *
   */
  useEffect(() => {
    try {
      endPlayCard();
    } catch (e) {
      const error = e as Error;
      state.onError(error, EuchreGameFlow.END_PLAY_CARD, EuchreAnimationActionType.SET_NONE, 'endPlayCard');
    }
  }, [endPlayCard, state]);

  /**
   *
   */
  const handleCloseHandResults = useCallback(() => {
    const gameOver = isGameOver(state.euchreGame);

    if (gameOver) {
      state.setPromptValue([{ type: PromptType.GAME_RESULT }]);
    } else {
      const newGame: EuchreGameInstance = { ...state.euchreGame };
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
      state.dispatchStateChange(EuchreGameFlow.BEGIN_PLAY_CARD, EuchreAnimationActionType.SET_ANIMATE);
    }
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
          state.onCancel
        )
      )
        return;

      state.dispatchStateChange(EuchreGameFlow.END_PLAY_CARD_RESULT, EuchreAnimationActionType.SET_NONE);
    };

    try {
      animateResultOfCardPlayed();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.BEGIN_PLAY_CARD_RESULT,
        EuchreAnimationActionType.SET_ANIMATE,
        'animateResultOfCardPlayed'
      );
    }
  }, [isGameStateValidToContinue, state]);

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
        state.onCancel
      )
    )
      return;

    let newGame: EuchreGameInstance = { ...state.euchreGame };

    const sittingOut = playerSittingOut(newGame);
    const playerRotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer, sittingOut);

    newGame = updateIfTrickOver(newGame, playerRotation);
    newGame = updateIfHandOver(newGame);

    state.setEuchreGame(newGame);
    state.dispatchStateChange(EuchreGameFlow.END_PLAY_CARD_RESULT, EuchreAnimationActionType.SET_ANIMATE);
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
      state.onError(
        error,
        EuchreGameFlow.END_PLAY_CARD_RESULT,
        EuchreAnimationActionType.SET_NONE,
        'endPlayCardResult'
      );
    }
  }, [endPlayCardResult, state]);

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
          state.onCancel
        )
      )
        return;

      state.dispatchStateChange(EuchreGameFlow.WAIT);

      if (isTrickFinished(state.euchreGame)) {
        await animateEndResultTrickFinished();
      } else {
        //short delay between players playing cards if the next player is AI.
        if (!state.euchreGame.currentPlayer.human) await gameDelay(state.euchreSettings);

        state.dispatchStateChange(EuchreGameFlow.BEGIN_PLAY_CARD, EuchreAnimationActionType.SET_NONE);
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
        state.dispatchPlayerNotification(getPlayerNotificationForTrickWon(currentTrick));
        if (wonCard) {
          state.addEvent(
            createEvent(
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
          state.addEvent(
            createEvent(
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

        state.dispatchPlayerNotification(notification);
      }
      await notificationDelay(state.euchreSettings, playedReneged ? 1 : undefined);
      state.dispatchStateChange(EuchreGameFlow.TRICK_FINISHED, EuchreAnimationActionType.SET_NONE);
    };
    try {
      animateEndResultOfCardPlayed();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.END_PLAY_CARD_RESULT,
        EuchreAnimationActionType.SET_ANIMATE,
        'animateEndResultOfCardPlayed'
      );
    }
  }, [
    gameDelay,
    getPlayerNotificationForTrickWon,
    getTeamColor,
    incrementSpeed,
    isGameStateValidToContinue,
    isTrickFinished,
    notificationDelay,
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
      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
    }
  }, [state]);

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
          state.onCancel
        )
      )
        return;

      if (isHandFinished(state.euchreGame)) {
        state.dispatchStateChange(EuchreGameFlow.WAIT);

        const handResult = state.euchreGame.handResults.at(-1);
        if (!handResult) throw new Error('Game result not found for trick finished.');

        state.addEvent(
          createEvent(
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

        state.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
        state.dispatchStateChange(EuchreGameFlow.AWAIT_PROMPT, EuchreAnimationActionType.SET_NONE);

        if (state.euchreSettings.showHandResult) {
          state.setPromptValue([{ type: PromptType.HAND_RESULT }]);
        } else {
          handleCloseHandResults();
        }
      } else {
        state.dispatchStateChange(EuchreGameFlow.BEGIN_PLAY_CARD, EuchreAnimationActionType.SET_NONE);
      }
    };

    try {
      animateTrickFinished();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.TRICK_FINISHED,
        EuchreAnimationActionType.SET_ANIMATE,
        'animateTrickFinished'
      );
    }
  }, [
    getTeamColor,
    handleCloseHandResults,
    isGameStateValidToContinue,
    isHandFinished,
    notificationDelay,
    state
  ]);

  //#endregion

  return { handleCardPlayed, handleCloseHandResults, handleTrickFinished };
}
