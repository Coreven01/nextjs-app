'use client';

import { Card, PromptType } from '@/app/lib/euchre/definitions';
import { EuchreFlowActionType, EuchreGameFlow } from './gameFlowReducer';
import { PlayerNotificationAction, PlayerNotificationActionType } from './playerNotificationReducer';
import { EuchreActionType, EuchreAnimateType } from './gameAnimationFlowReducer';
import { EuchreGameState } from './useEuchreGame';
import { incrementSpeed, orderTrump } from '@/app/lib/euchre/game-setup-logic';
import { useCallback, useEffect } from 'react';
import isGameStateValidToContinue from '@/app/lib/euchre/game-state-logic';
import { getPlayerNotificationForBidding } from './useEuchreGameBid';

export default function useEuchreGameOrder(state: EuchreGameState) {
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

    let newGame = state.euchreGame?.shallowCopy();

    if (!newGame) throw new Error('Game not found for trump ordered.');
    if (!state.bidResult) throw new Error('Bid result not found.');

    newGame = orderTrump(newGame, state.bidResult);

    if (!newGame.dealer) throw Error('Dealer not found - Order Trump.');
    if (!newGame.maker) throw Error('Maker not found - Order Trump.');

    if (state.bidResult.loner) {
      const partnerSittingOut = newGame.gamePlayers.find(
        (p) => p.team === newGame.maker?.team && p !== newGame.maker
      );
      if (partnerSittingOut) {
        const playerSetting = state.euchreGameFlow.shouldShowHandImages.find(
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
    state.dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_ORDER_TRUMP });
    state.setEuchreGame(newGame);
  }, [state]);

  /**
   *
   */
  useEffect(() => {
    beginOrderTrump();
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

      const newGame = state.euchreGame?.shallowCopy();

      if (!newGame?.dealer) throw new Error('Game dealer not found for animation trump ordered.');
      if (!state.bidResult) throw new Error('Bid result not found');
      if (!newGame.maker) throw Error('Maker not found - Order Trump.');

      const orderType = state.bidResult.calledSuit ? 'n' : 'o';
      const newPlayerNotification: PlayerNotificationAction = getPlayerNotificationForBidding(
        newGame.dealer,
        newGame.maker,
        state.euchreSettings,
        orderType,
        state.bidResult.loner,
        state.bidResult.calledSuit
      );

      state.dispatchPlayerNotification(newPlayerNotification);

      // additional delay to notify users which suit is trump
      await new Promise((resolve) => setTimeout(resolve, incrementSpeed(state.euchreSettings.gameSpeed, 2)));

      let shouldDiscard = state.bidResult.calledSuit === null;
      const playerSittingOut = newGame.playerSittingOut;

      if (shouldDiscard && playerSittingOut && newGame.dealer.equal(playerSittingOut)) {
        shouldDiscard = false;
      }

      if (newGame.dealer.human && shouldDiscard) {
        state.dispatchGameFlow({ type: EuchreFlowActionType.SET_AWAIT_USER_INPUT });
        state.setPromptValue([{ type: PromptType.DISCARD }]);
      } else {
        if (shouldDiscard) {
          newGame.discard = newGame.dealer.chooseDiscard(newGame, state.euchreSettings.difficulty);
        }
        state.dispatchPlayerNotification({
          type: PlayerNotificationActionType.UPDATE_CENTER,
          payload: undefined
        });
        state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PLAY_CARD });
        state.dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
        state.setEuchreGame(newGame);
      }
    };

    beginAnimationOrderTrump();
  }, [state]);

  /** Submit the resulting discard from user input after flip card has been picked up.
   *
   */
  const handleDiscardSubmit = useCallback(
    (card: Card) => {
      const newGame = state.euchreGame?.shallowCopy();

      if (newGame?.trump && state.euchreGameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT) {
        newGame.dealer?.discard(card, newGame.trump, state.euchreSettings.difficulty);
        newGame.dealer?.sortCards(newGame.trump);
        newGame.discard = card;

        state.dispatchPlayerNotification({ type: PlayerNotificationActionType.UPDATE_CENTER });
        state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PLAY_CARD });
        state.dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
        state.setPromptValue([]);
      }
    },
    [state]
  );

  //#endregion

  return { handleDiscardSubmit };
}
