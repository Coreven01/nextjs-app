'use client';

import { Card, EuchrePlayer, EuchreTrick, PromptType } from '@/app/lib/euchre/definitions';
import { CheckCircleIcon } from '@heroicons/react/16/solid';
import { EuchreFlowActionType, EuchreGameFlow } from './gameFlowReducer';
import {
  getPlayerNotificationType,
  PlayerNotificationAction,
  PlayerNotificationActionType
} from './playerNotificationReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './gameAnimationFlowReducer';
import { EuchreErrorState, EuchreGameState } from './useEuchreGame';
import { useCallback, useEffect, useRef } from 'react';
import isGameStateValidToContinue from '@/app/lib/euchre/game-state-logic';
import GameCard from '@/app/ui/euchre/game/game-card';
import { getEncodedCardSvg } from '@/app/lib/euchre/card-data';
import { getCardsAvailableToPlay, getGameStateForNextHand } from '@/app/lib/euchre/game-play-logic';
import { getPlayerRotation } from '@/app/lib/euchre/game';
import UserInfo from '@/app/ui/euchre/player/user-info';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
import { createEvent } from '@/app/lib/euchre/util';
import clsx from 'clsx';

export default function useEuchreGamePlay(state: EuchreGameState, errorState: EuchreErrorState) {
  const playerAutoPlayed = useRef(false);

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
        EuchreAnimateType.ANIMATE_NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    const newGame = state.euchreGame?.shallowCopy();

    if (!newGame?.currentPlayer) throw Error('Player not found for play card.');
    if (!newGame?.currentTrick) throw Error('Game Trick not found for play card.');
    if (!newGame?.trump) throw Error('Game Trick not found for play card.');

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_WAIT });

    if (newGame.trickFinished) {
      newGame.addTrickForNewHand();
    }

    if (newGame.currentTrick.cardsPlayed.length === 0) {
      state.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
    }

    // if settings set to auto follow suit, and only one card to play, then play that card without user interaction.
    let promptForInput = newGame.currentPlayer.human;
    if (
      promptForInput &&
      state.euchreSettings.autoFollowSuit &&
      getCardsAvailableToPlay(
        newGame.trump,
        newGame.currentTrick.cardsPlayed.at(0)?.card ?? null,
        newGame.currentPlayer.availableCards
      ).length === 1
    ) {
      playerAutoPlayed.current = true;
      promptForInput = false;
    }

    state.setEuchreGame(newGame);

    if (promptForInput) {
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_AWAIT_USER_INPUT });
    } else {
      const selectedCard: Card = newGame.currentPlayer.determineCardToPlay(
        newGame,
        state.euchreSettings.difficulty
      );
      state.setPlayedCard(selectedCard);
      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_BEGIN_PLAY_CARD });
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PLAY_CARD });
    }
  }, [state]);

  /** Play card for AI player, or prompt if player is human. */
  useEffect(() => {
    try {
      beginPlayCard();
    } catch (e) {}
  }, [beginPlayCard]);

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
          EuchreAnimateType.ANIMATE_BEGIN_PLAY_CARD,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      const newGame = state.euchreGame?.shallowCopy();
      if (!newGame?.currentPlayer) throw Error('Player not found for play card.');

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_WAIT });

      if (!newGame.currentPlayer.human || playerAutoPlayed.current)
        await new Promise((resolve) => setTimeout(resolve, state.euchreSettings.gameSpeed));

      if (!state.playedCard) throw new Error('Unable to animate play card - player card not found.');
      if (!newGame.currentPlayer) throw new Error('Unable to animate play card - current player not found.');

      state.dispatchPlayerNotification(
        getPlayerNotificationForPlayedCard(state.playedCard, newGame.currentPlayer)
      );
      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_NONE });
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_END_PLAY_CARD });
      playerAutoPlayed.current = false;
    };

    try {
      animateBeginPlayCards();
    } catch (e) {}
  }, [state]);

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
        EuchreAnimateType.ANIMATE_NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    const newGame = state.euchreGame?.shallowCopy();

    if (!newGame?.currentPlayer) throw Error('Current player not found - Play card.');
    if (!newGame?.trump) throw Error('Trump card not found - Play card.');
    if (!state.playedCard) throw Error('Played card not found for handle play card.');
    if (!newGame.currentTrick) throw Error('Game trick not found for handle play card.');

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_WAIT });

    const cardPlayed = newGame.currentPlayer.playGameCard(state.playedCard);

    state.addEvent(
      createEvent(
        'i',
        state.euchreSettings,
        cardPlayed.player,
        `Card Played: ${cardPlayed.card.value}-${cardPlayed.card.suit}`
      )
    );

    newGame.currentPlayer.sortCards(newGame.trump);
    newGame.currentTrick.cardsPlayed.push(cardPlayed);

    state.setEuchreGame(newGame);

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PLAY_CARD_RESULT });
    state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_BEGIN_PLAY_CARD_RESULT });
  }, [state]);

  /**
   *
   */
  useEffect(() => {
    try {
      endPlayCard();
    } catch (e) {}
  }, [endPlayCard]);

  /**
   *
   */
  const handleCloseHandResults = useCallback(() => {
    const newGame = state.euchreGame?.shallowCopy();

    if (!newGame) throw new Error();
    if (!newGame.dealer) throw new Error();

    const gameOver = newGame.isGameOver;

    if (gameOver) {
      state.setPromptValue([{ type: PromptType.GAME_RESULT }]);
    } else {
      const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);

      newGame.dealer = rotation[0];
      state.setEuchreGame(newGame);
      state.setPromptValue([]);
      state.dispatchGameFlow({
        type: EuchreFlowActionType.UPDATE_ALL,
        payload: getGameStateForNextHand(state.euchreGameFlow, state.euchreSettings, newGame)
      });
    }
  }, [state]);

  /**
   *
   */
  const handleCloseGameResults = useCallback(() => {
    state.setPromptValue([]);
  }, [state]);

  /**
   *
   */
  const handleCardPlayed = (cardPlayed: Card) => {
    if (state.euchreGame && state.euchreGameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT) {
      state.setPlayedCard(cardPlayed);
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PLAY_CARD });
      state.dispatchGameAnimationFlow({
        type: EuchreAnimationActionType.SET_ANIMATE_BEGIN_PLAY_CARD
      });
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
          EuchreAnimateType.ANIMATE_BEGIN_PLAY_CARD_RESULT,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_WAIT });

      if (state.euchreGame?.handFinished || state.euchreGame?.trickFinished) {
        await new Promise((resolve) => setTimeout(resolve, state.euchreSettings.gameSpeed));
      }
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_END_PLAY_CARD_RESULT });
      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_NONE });
    };

    try {
      animateResultOfCardPlayed();
    } catch (e) {}
  }, [state, handleCloseHandResults]);

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
        EuchreAnimateType.ANIMATE_NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;
    const newGame = state.euchreGame?.shallowCopy();

    if (!newGame?.currentPlayer) throw Error('Player not found for play card.');

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_WAIT });

    const playerRotation = getPlayerRotation(
      newGame.gamePlayers,
      newGame.currentPlayer,
      newGame.playerSittingOut
    );

    newGame.updateIfTrickOver(playerRotation);
    newGame.updateIfHandOver();
    state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_END_PLAY_CARD_RESULT });
    state.setEuchreGame(newGame);
    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_END_PLAY_CARD_RESULT });
  }, [state]);

  /**
   *
   */
  useEffect(() => {
    try {
      endPlayCardResult();
    } catch (e) {}
  }, [endPlayCardResult]);

  /** Handle UI and animation updates after a player plays a card.
   *
   */
  useEffect(() => {
    const animateEndResultOfCardPlayed = async () => {
      const newGame = state.euchreGame?.shallowCopy();

      if (
        !newGame ||
        !isGameStateValidToContinue(
          newGame,
          state.euchreGameFlow,
          state.euchreAnimationFlow,
          EuchreGameFlow.END_PLAY_CARD_RESULT,
          EuchreAnimateType.ANIMATE_END_PLAY_CARD_RESULT,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_WAIT });

      if (!newGame.currentPlayer) throw new Error();
      if (!newGame.dealer) throw new Error();

      if (newGame.trickFinished) {
        const lastWonTrick: EuchreTrick | null = newGame.currentTrick;

        if (!lastWonTrick)
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

        state.addEvent(createEvent('i', state.euchreSettings, lastWonTrick.taker ?? undefined, `Trick won.`));

        await new Promise((resolve) => setTimeout(resolve, state.euchreSettings.gameSpeed));

        // little bit longer pause so the user can see what happened.
        if (playedReneged)
          await new Promise((resolve) => setTimeout(resolve, state.euchreSettings.gameSpeed));
      }

      if (newGame.handFinished) {
        const gameResult = newGame.allGameResults.at(-1);

        if (gameResult) {
          state.addEvent(
            createEvent(
              'i',
              state.euchreSettings,
              newGame.currentPlayer,
              `Hand won team: ${gameResult.teamWon} Points: ${gameResult.points}`
            )
          );
        }

        await new Promise((resolve) => setTimeout(resolve, state.euchreSettings.gameSpeed));

        state.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
        state.dispatchGameFlow({ type: EuchreFlowActionType.SET_AWAIT_USER_INPUT });

        if (state.euchreSettings.showHandResult) {
          state.setPromptValue([{ type: PromptType.HAND_RESULT }]);
        } else {
          handleCloseHandResults();
        }
      } else if (newGame.trickFinished) {
        await new Promise((resolve) => setTimeout(resolve, state.euchreSettings.gameSpeed));
      }

      if (!newGame.handFinished) {
        state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PLAY_CARD });
      }

      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_NONE });
    };

    try {
      animateEndResultOfCardPlayed();
    } catch (e) {}
  }, [state, handleCloseHandResults]);

  //#endregion

  return { handleCardPlayed, handleCloseGameResults, handleCloseHandResults };
}

/**
 *
 */
const getPlayerNotificationForPlayedCard = (card: Card, player: EuchrePlayer) => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_PLAYER1,
    payload: undefined
  };

  let cardLocation = '';
  switch (player.playerNumber) {
    case 1:
      cardLocation = '-top-8 md:-top-5 md:w-auto w-16';
      break;
    case 2:
      cardLocation = '-bottom-4 md:-bottom-5 md:w-auto w-16';
      break;
    case 3:
      cardLocation = '-right-16 md:-right-5 md:h-auto h-16';
      break;
    case 4:
      cardLocation = '-left-16 md:-left-5 md:h-auto h-16';
      break;
  }

  const rotateValues = [
    'rotate-[-8deg]',
    'rotate-[-4deg]',
    'rotate-[-1deg]',
    'rotate-[1deg]',
    'rotate-[4deg]',
    'rotate-[8deg]'
  ];

  const infoDetail = (
    <GameCard
      responsive={true}
      src={getEncodedCardSvg(card, player.location)}
      card={card}
      width={card.getDisplayWidth(player.location)}
      player={player}
      enableShadow={true}
      height={card.getDisplayHeight(player.location)}
      className={`!absolute z-30 ${rotateValues[Math.round(Math.random() * 5)]} ${cardLocation}`}
      id={card.generateElementId()}
      key={`${card.generateElementId()}-${Math.floor(Math.random() * 1000)}`}
    ></GameCard>
  );

  newAction.type = getPlayerNotificationType(player.playerNumber);
  newAction.payload = infoDetail;
  return newAction;
};

/**
 *
 */
const getPlayerNotificationForTrickWon = (result: EuchreTrick) => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_CENTER,
    payload: undefined
  };
  const icon: React.ReactNode = <CheckCircleIcon className="min-h-[18px] max-h-[20px] text-green-300" />;
  let messageLocation = '';

  switch (result.taker?.playerNumber) {
    case 1:
      messageLocation = 'md:bottom-0 -bottom-8';
      break;
    case 2:
      messageLocation = 'md:top-0 -top-8';
      break;
    case 3:
      messageLocation = 'md:left-3 -left-8';
      break;
    case 4:
      messageLocation = 'md:right-3 -right-8';
      break;
  }

  const id = result.taker?.generateElementId();
  const infoDetail = (
    <UserInfo
      className={clsx(
        `p-2 md:text-lg text-base w-auto absolute whitespace-nowrap z-40 shadow-lg shadow-black text-black border border-black dark:border-white dark:text-white text-center bg-white dark:bg-stone-800`,
        messageLocation
      )}
      id={id}
      key={`${id}`}
    >
      <div className="flex gap-2 items-center">{icon}</div>
    </UserInfo>
  );

  newAction.payload = infoDetail;

  return newAction;
};
