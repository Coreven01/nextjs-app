'use client';

import { Card, EuchreGameInstance, PromptType } from '@/app/lib/euchre/definitions';
import { EuchreFlowActionType, EuchreGameFlow } from './gameFlowReducer';
import {
  getPlayerNotificationType,
  PlayerNotificationAction,
  PlayerNotificationActionType
} from './playerNotificationReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './gameAnimationFlowReducer';
import { EuchreErrorState, EuchreGameState } from './useEuchreGame';
import { useCallback, useEffect } from 'react';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
import { createEvent } from '@/app/lib/euchre/util';
import useGameStateLogic from './logic/useGameStateLogic';
import useGameBidLogic from './logic/useGameBidLogic';
import useGameData from './data/useGameData';
import usePlayerData from './data/usePlayerData';
import useCardData from './data/useCardData';

export default function useEuchreGameOrder(state: EuchreGameState, errorState: EuchreErrorState) {
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { orderTrump, determineDiscard } = useGameBidLogic();
  const { incrementSpeed, playerSittingOut } = useGameData();
  const { discard, sortCards, playerEqual } = usePlayerData();

  //#region Order Trump *************************************************************************

  /** Player has ordered trump either by naming suit or telling the dealer to pick up the flipped card.
   */
  const beginOrderTrump = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state.euchreGame,
        state.euchreGameFlow,
        state.euchreAnimationFlow,
        EuchreGameFlow.BEGIN_ORDER_TRUMP,
        EuchreAnimateType.ANIMATE_NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_WAIT });

    let newGame: EuchreGameInstance | null = state.euchreGame ? { ...state.euchreGame } : null;

    if (!newGame) throw new Error('Game not found for trump ordered.');
    if (!state.bidResult) throw new Error('Bid result not found.');
    state.addEvent(
      createEvent(
        'i',
        state.euchreSettings,
        newGame.currentPlayer ?? undefined,
        `Trump called. Loner: ${state.bidResult.loner}`
      )
    );

    newGame = orderTrump(newGame, state.bidResult);

    if (!newGame.dealer) throw Error('Dealer not found - Order Trump.');
    if (!newGame.maker) throw Error('Maker not found - Order Trump.');

    if (state.bidResult.loner) {
      const partnerSittingOut = newGame.gamePlayers.find(
        (p) => p.team === newGame.maker?.team && p !== newGame.maker
      );
      if (partnerSittingOut) {
        const playerSetting = state.euchreGameFlow.shouldShowCardImagesForHand.find(
          (i) => i.player === partnerSittingOut
        );

        if (playerSetting) playerSetting.value = false;
        state.dispatchGameFlow({
          type: EuchreFlowActionType.UPDATE_ALL,
          payload: { ...state.euchreGameFlow }
        });
      }
    }

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_ORDER_TRUMP });
    state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_ORDER_TRUMP });
    state.setEuchreGame(newGame);
  }, [isGameStateValidToContinue, orderTrump, state]);

  /**
   *
   */
  useEffect(() => {
    try {
      beginOrderTrump();
    } catch (e) {}
  }, [beginOrderTrump]);

  /**
   *
   */
  useEffect(() => {
    const beginAnimationOrderTrump = async () => {
      if (
        !isGameStateValidToContinue(
          state.euchreGame,
          state.euchreGameFlow,
          state.euchreAnimationFlow,
          EuchreGameFlow.BEGIN_ORDER_TRUMP,
          EuchreAnimateType.ANIMATE_ORDER_TRUMP,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_WAIT });

      const newGame = state.euchreGame ? { ...state.euchreGame } : null;

      if (!newGame?.dealer) throw new Error('Game dealer not found for animation trump ordered.');
      if (!state.bidResult) throw new Error('Bid result not found');
      if (!newGame.maker) throw Error('Maker not found - Order Trump.');

      const orderType = state.bidResult.calledSuit ? 'named' : 'order';
      const notification: PlayerNotificationAction = {
        type: getPlayerNotificationType(newGame.maker.playerNumber),
        payload: (
          <PlayerNotification
            dealer={newGame.dealer}
            player={newGame.maker}
            settings={state.euchreSettings}
            info={orderType}
            loner={state.bidResult.loner}
            namedSuit={state.bidResult.calledSuit}
          />
        )
      };

      state.dispatchPlayerNotification(notification);

      // additional delay to notify users which suit is trump
      await new Promise((resolve) => setTimeout(resolve, incrementSpeed(state.euchreSettings.gameSpeed, 2)));

      let shouldDiscard = state.bidResult.calledSuit === null;
      const sittingOut = playerSittingOut(newGame);

      if (shouldDiscard && sittingOut && playerEqual(newGame.dealer, sittingOut)) {
        shouldDiscard = false;
      }

      if (newGame.dealer.human && shouldDiscard) {
        state.dispatchGameFlow({ type: EuchreFlowActionType.SET_AWAIT_USER_INPUT });
        state.setPromptValue([{ type: PromptType.DISCARD }]);
      } else {
        if (shouldDiscard) {
          newGame.discard = determineDiscard(newGame, newGame.dealer, state.euchreSettings.difficulty);
          newGame.dealer.hand = discard(newGame.dealer, newGame.discard, newGame.trump);

          state.addEvent(
            createEvent(
              'd',
              state.euchreSettings,
              newGame.dealer ?? undefined,
              `Dealer discarded: ${newGame.discard.value}-${newGame.discard.suit}`
            )
          );
        }
        state.dispatchPlayerNotification({
          type: PlayerNotificationActionType.UPDATE_CENTER,
          payload: undefined
        });
        state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PLAY_CARD });
        state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_NONE });
        state.setEuchreGame(newGame);
      }
    };

    try {
      beginAnimationOrderTrump();
    } catch (e) {}
  }, [
    determineDiscard,
    discard,
    incrementSpeed,
    isGameStateValidToContinue,
    playerEqual,
    playerSittingOut,
    state
  ]);

  /** Submit the resulting discard from user input after flip card has been picked up.
   *
   */
  const handleDiscardSubmit = useCallback(
    (card: Card) => {
      const newGame = state.euchreGame ? { ...state.euchreGame } : null;

      if (newGame?.trump && state.euchreGameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT) {
        newGame.dealer.hand = discard(newGame.dealer, card, newGame.trump);
        newGame.dealer.hand = sortCards(newGame.dealer, newGame.trump);
        newGame.discard = card;

        state.addEvent(
          createEvent(
            'd',
            state.euchreSettings,
            newGame.dealer ?? undefined,
            `Dealer discarded: ${newGame.discard.value}-${newGame.discard.suit}`
          )
        );

        state.dispatchPlayerNotification({ type: PlayerNotificationActionType.UPDATE_CENTER });
        state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PLAY_CARD });
        state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_NONE });
        state.setPromptValue([]);
        state.setEuchreGame(newGame);
      }
    },
    [discard, sortCards, state]
  );

  //#endregion

  return { handleDiscardSubmit };
}
