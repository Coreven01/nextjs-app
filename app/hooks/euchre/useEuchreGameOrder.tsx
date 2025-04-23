import { Card, EuchreGameInstance, PromptType } from '@/app/lib/euchre/definitions';
import { EuchreGameFlow } from './reducers/gameFlowReducer';
import { getPlayerNotificationType, PlayerNotificationAction } from './reducers/playerNotificationReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { EuchreGameState } from './useEuchreGame';
import { useCallback, useEffect } from 'react';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
import { createEvent } from '@/app/lib/euchre/util';
import useGameStateLogic from './logic/useGameStateLogic';
import useGameBidLogic from './logic/useGameBidLogic';
import useGameData from './data/useGameData';
import usePlayerData from './data/usePlayerData';
import useCardSvgData from './data/useCardSvgData';
import useCardData from './data/useCardData';

export default function useEuchreGameOrder(state: EuchreGameState) {
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { orderTrump, determineDiscard } = useGameBidLogic();
  const { incrementSpeed, playerSittingOut, notificationDelay } = useGameData();
  const { discard, playerEqual } = usePlayerData();
  const { getSuitName } = useCardSvgData();
  const { indexCards } = useCardData();

  //#region Order Trump *************************************************************************

  /** Player has ordered trump either by naming suit or telling the dealer to pick up the flipped card.
   */
  const beginOrderTrump = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state,
        EuchreGameFlow.BEGIN_ORDER_TRUMP,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    if (!state.bidResult) throw new Error('Bid result not found.');
    const newGame: EuchreGameInstance = orderTrump(state.euchreGame, state.bidResult);

    state.addEvent(
      createEvent(
        'i',
        state.euchreSettings,
        newGame.currentPlayer ?? undefined,
        `Trump called: ${newGame.trump.suit} - ${getSuitName(newGame.trump.suit)}. Loner: ${state.bidResult.loner}`
      )
    );

    if (!newGame.maker) throw Error('Maker not found - Order Trump.');

    // don't believe this is needed anymore:
    // if (state.bidResult.loner) {
    //   const partnerSittingOut = newGame.gamePlayers.find(
    //     (p) => p.team === newGame.maker?.team && p !== newGame.maker
    //   );
    //   if (partnerSittingOut) {
    //     const playerSetting = state.euchreGameFlow.shouldShowCardImagesForHand.find(
    //       (i) => i.player === partnerSittingOut
    //     );

    //     if (playerSetting) playerSetting.value = false;
    //     state.dispatchGameFlow({
    //       type: EuchreFlowActionType.SET_STATE,
    //       state: { ...state.euchreGameFlow }
    //     });
    //   }
    // }

    state.dispatchStateChange(EuchreGameFlow.BEGIN_ORDER_TRUMP, EuchreAnimationActionType.SET_ANIMATE);
    state.setEuchreGame(newGame);
  }, [getSuitName, isGameStateValidToContinue, orderTrump, state]);

  /**
   *
   */
  useEffect(() => {
    try {
      beginOrderTrump();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.BEGIN_ORDER_TRUMP,
        EuchreAnimationActionType.SET_NONE,
        'beginOrderTrump'
      );
    }
  }, [beginOrderTrump, state]);

  /**
   *
   */
  useEffect(() => {
    const beginAnimationOrderTrump = async () => {
      if (
        !isGameStateValidToContinue(
          state,
          EuchreGameFlow.BEGIN_ORDER_TRUMP,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      state.dispatchStateChange(EuchreGameFlow.WAIT);

      const game: EuchreGameInstance = state.euchreGame;

      if (!state.bidResult) throw new Error('Bid result not found');
      if (!game.maker) throw Error('Maker not found - Order Trump.');

      const orderType = state.bidResult.calledSuit ? 'named' : 'order';
      const notification: PlayerNotificationAction = {
        type: getPlayerNotificationType(game.maker.playerNumber),
        payload: (
          <PlayerNotification
            dealer={game.dealer}
            player={game.maker}
            settings={state.euchreSettings}
            info={orderType}
            loner={state.bidResult.loner}
            namedSuit={state.bidResult.calledSuit}
            delayMs={incrementSpeed(state.euchreSettings.notificationSpeed, 1)}
          />
        )
      };

      state.dispatchPlayerNotification(notification);
      await notificationDelay(state.euchreSettings, 1);

      state.dispatchStateChange(EuchreGameFlow.END_ORDER_TRUMP, EuchreAnimationActionType.SET_NONE);
    };

    try {
      beginAnimationOrderTrump();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.BEGIN_ORDER_TRUMP,
        EuchreAnimationActionType.SET_ANIMATE,
        'beginAnimationOrderTrump'
      );
    }
  }, [incrementSpeed, isGameStateValidToContinue, notificationDelay, state]);

  /**
   *
   */
  const endOrderTrump = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state,
        EuchreGameFlow.END_ORDER_TRUMP,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    const newGame: EuchreGameInstance = { ...state.euchreGame };

    if (!state.bidResult) throw new Error('Bid result not found');

    let shouldDiscard = state.bidResult.calledSuit === null;
    const sittingOut = playerSittingOut(newGame);

    if (shouldDiscard && sittingOut && playerEqual(newGame.dealer, sittingOut)) {
      shouldDiscard = false;
    }

    if (newGame.dealer.human && shouldDiscard) {
      state.dispatchStateChange(EuchreGameFlow.AWAIT_PROMPT);
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

      state.dispatchStateChange(EuchreGameFlow.END_ORDER_TRUMP, EuchreAnimationActionType.SET_ANIMATE);
      state.setEuchreGame(newGame);
    }
  }, [determineDiscard, discard, isGameStateValidToContinue, playerEqual, playerSittingOut, state]);

  /**
   *
   */
  useEffect(() => {
    try {
      endOrderTrump();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.END_ORDER_TRUMP,
        EuchreAnimationActionType.SET_NONE,
        'endOrderTrump'
      );
    }
  }, [endOrderTrump, state]);

  /**
   *
   */
  useEffect(() => {
    const endAnimationOrderTrump = async () => {
      if (
        !isGameStateValidToContinue(
          state,
          EuchreGameFlow.END_ORDER_TRUMP,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      // update player's hand in an effect in useCardState with the new card if player had to discard.
      await notificationDelay(state.euchreSettings);

      state.dispatchStateChange(EuchreGameFlow.BEGIN_PLAY_CARD, EuchreAnimationActionType.SET_NONE);
    };

    try {
      endAnimationOrderTrump();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.END_ORDER_TRUMP,
        EuchreAnimationActionType.SET_ANIMATE,
        'endAnimationOrderTrump'
      );
    }
  }, [isGameStateValidToContinue, notificationDelay, state]);

  /** Submit the resulting discard from user input after flip card has been picked up.
   *
   */
  const handleDiscardSubmit = useCallback(
    (card: Card) => {
      const newGame = state.euchreGame ? { ...state.euchreGame } : null;

      if (newGame?.trump && state.euchreGameFlow.gameFlow === EuchreGameFlow.AWAIT_PROMPT) {
        newGame.dealer.hand = discard(newGame.dealer, card, newGame.trump);
        newGame.dealer.hand = indexCards(newGame.dealer.hand);
        newGame.discard = card;

        state.addEvent(
          createEvent(
            'd',
            state.euchreSettings,
            newGame.dealer ?? undefined,
            `Dealer discarded: ${newGame.discard.value}-${newGame.discard.suit}`
          )
        );

        state.dispatchStateChange(EuchreGameFlow.END_ORDER_TRUMP, EuchreAnimationActionType.SET_ANIMATE);
        state.setPromptValue([]);
        state.setEuchreGame(newGame);
      }
    },
    [discard, indexCards, state]
  );

  //#endregion

  return { handleDiscardSubmit };
}
