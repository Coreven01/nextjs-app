import { Card, PromptType } from '@/app/lib/euchre/definitions/definitions';
import { EuchreGameFlow } from './reducers/gameFlowReducer';
import { getPlayerNotificationType, PlayerNotificationAction } from './reducers/playerNotificationReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { useCallback, useEffect } from 'react';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
import useGameStateLogic from './logic/useGameStateLogic';
import useGameBidLogic from './logic/useGameBidLogic';
import useGameData from './data/useGameData';
import usePlayerData from './data/usePlayerData';
import useCardData from './data/useCardData';
import { GameEventHandlers, SUB_SUIT } from './useEventLog';
import {
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  ErrorHandlers
} from '../../lib/euchre/definitions/game-state-definitions';

export default function useEuchreGameOrder(
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers
) {
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { orderTrump, determineDiscard } = useGameBidLogic();
  const { incrementSpeed, playerSittingOut, notificationDelay } = useGameData();
  const { discard, playerEqual, getTeamColor } = usePlayerData();
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
        errorHandlers.onCancel
      )
    )
      return;

    if (!state.bidResult) throw new Error('Bid result not found.');
    const newGame: EuchreGameInstance = orderTrump(state.euchreGame, state.bidResult);
    if (!newGame.maker) throw Error('Maker not found - Order Trump.');

    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        newGame.maker,
        `Trump named: ${SUB_SUIT}. ${state.bidResult.loner ? ' Going alone.' : ''}`,
        [newGame.trump],
        getTeamColor(newGame.maker, state.euchreSettings)
      )
    );

    setters.dispatchStateChange(EuchreGameFlow.BEGIN_ORDER_TRUMP, EuchreAnimationActionType.SET_ANIMATE);
    setters.setEuchreGame(newGame);
  }, [
    errorHandlers.onCancel,
    eventHandlers,
    getTeamColor,
    isGameStateValidToContinue,
    orderTrump,
    setters,
    state
  ]);

  /**
   *
   */
  useEffect(() => {
    try {
      beginOrderTrump();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'beginOrderTrump');
    }
  }, [beginOrderTrump, errorHandlers]);

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
          errorHandlers.onCancel
        )
      )
        return;

      //setters.dispatchStateChange(EuchreGameFlow.WAIT);

      const game: EuchreGameInstance = state.euchreGame;

      if (!state.bidResult) throw new Error('Bid result not found');
      if (!game.maker) throw Error('Maker not found - Order Trump.');

      const orderType = state.bidResult.calledSuit ? 'named' : 'order';
      const notification: PlayerNotificationAction = {
        type: getPlayerNotificationType(game.maker.location),
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

      setters.dispatchPlayerNotification(notification);
      await notificationDelay(state.euchreSettings, 1);

      setters.dispatchStateChange(EuchreGameFlow.END_ORDER_TRUMP, EuchreAnimationActionType.SET_NONE);
    };

    try {
      beginAnimationOrderTrump();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'beginAnimationOrderTrump');
    }
  }, [errorHandlers, incrementSpeed, isGameStateValidToContinue, notificationDelay, setters, state]);

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
        errorHandlers.onCancel
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
      //setters.dispatchStateChange(EuchreGameFlow.AWAIT_PROMPT);
      setters.setPromptValue([{ type: PromptType.DISCARD }]);
    } else {
      if (shouldDiscard) {
        newGame.discard = determineDiscard(newGame, newGame.dealer, state.euchreSettings.difficulty);
        newGame.dealer.hand = discard(newGame.dealer, newGame.discard, newGame.trump);

        eventHandlers.addEvent(
          eventHandlers.createEvent(
            'd',
            newGame.dealer,
            `Dealer discarded: ${newGame.discard?.value}-${newGame.discard?.suit}`
          )
        );
      }

      setters.dispatchStateChange(EuchreGameFlow.END_ORDER_TRUMP, EuchreAnimationActionType.SET_ANIMATE);
      setters.setEuchreGame(newGame);
    }
  }, [
    determineDiscard,
    discard,
    errorHandlers.onCancel,
    eventHandlers,
    isGameStateValidToContinue,
    playerEqual,
    playerSittingOut,
    setters,
    state
  ]);

  /**
   *
   */
  useEffect(() => {
    try {
      endOrderTrump();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'endOrderTrump');
    }
  }, [endOrderTrump, errorHandlers]);

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
          errorHandlers.onCancel
        )
      )
        return;

      // update player's hand in an effect in useCardState with the new card if player had to discard.
      await notificationDelay(state.euchreSettings);

      setters.dispatchStateChange(EuchreGameFlow.BEGIN_PLAY_CARD, EuchreAnimationActionType.SET_NONE);
    };

    try {
      endAnimationOrderTrump();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'endAnimationOrderTrump');
    }
  }, [errorHandlers, isGameStateValidToContinue, notificationDelay, setters, state]);

  /** Submit the resulting discard from user input after flip card has been picked up.
   *
   */
  const handleDiscardSubmit = useCallback(
    (card: Card) => {
      const newGame = state.euchreGame ? { ...state.euchreGame } : null;

      // if (newGame?.trump && state.euchreGameFlow.gameFlow === EuchreGameFlow.AWAIT_PROMPT) {
      //   newGame.dealer.hand = discard(newGame.dealer, card, newGame.trump);
      //   newGame.dealer.hand = indexCards(newGame.dealer.hand);
      //   newGame.discard = card;

      //   eventHandlers.addEvent(
      //     eventHandlers.createEvent('d', newGame.dealer, `Discarded: ${SUB_SUIT}`, [newGame.discard])
      //   );

      //   setters.dispatchStateChange(EuchreGameFlow.END_ORDER_TRUMP, EuchreAnimationActionType.SET_ANIMATE);
      //   setters.setPromptValue([]);
      //   setters.setEuchreGame(newGame);
      // }
    },
    [discard, eventHandlers, indexCards, setters, state.euchreGame, state.euchreGameFlow.gameFlow]
  );

  //#endregion

  return { handleDiscardSubmit };
}
