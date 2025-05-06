import { Card, PromptType } from '@/app/lib/euchre/definitions/definitions';
import { getPlayerNotificationType, PlayerNotificationAction } from '../reducers/playerNotificationReducer';
import { useCallback, useEffect } from 'react';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
import useGameBidLogic from '../logic/useGameBidLogic';
import useGameData from '../data/useGameData';
import usePlayerData from '../data/usePlayerData';
import useCardData from '../data/useCardData';
import { GameEventHandlers } from '../useEventLog';
import {
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  ErrorHandlers
} from '../../../lib/euchre/definitions/game-state-definitions';
import useGameOrderState from '../phases/useGameOrderState';
import useGameEventsOrder from '../events/useGameEventsOrder';
import { EuchrePauseType } from '../reducers/gamePauseReducer';

export default function useEuchreGameOrder(
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers
) {
  const {
    shouldBeginOrderTrump,
    shouldAnimateBeginOrderTrump,
    shouldEndOrderTrump,
    shouldAnimateEndOrderTrump,
    continueToAnimateBeginOrderTrump,
    continueToEndOrderTrump,
    pauseForUserDiscardSelection,
    continueToAnimateEndOrderTrump,
    continueToBeginPlayCard
  } = useGameOrderState(state, setters, errorHandlers);
  const { addTrumpOrderedEvent, addDiscardEvent, addDealerPickedUpEvent } = useGameEventsOrder(
    state,
    eventHandlers
  );
  const { orderTrump, determineDiscard } = useGameBidLogic();
  const { incrementSpeed, playerSittingOut, notificationDelay } = useGameData();
  const { discard, playerEqual } = usePlayerData();
  const { indexCards } = useCardData();

  //#region Order Trump *************************************************************************

  /** Submit the resulting discard from user input after flip card has been picked up.
   *
   */
  const handleDiscardSubmit = useCallback(
    (card: Card) => {
      const newGame = state.euchreGame ? { ...state.euchreGame } : null;

      if (newGame?.trump && state.euchrePauseState.pauseType === EuchrePauseType.USER_INPUT) {
        newGame.dealer.hand = discard(newGame.dealer, card, newGame.trump);
        newGame.dealer.hand = indexCards(newGame.dealer.hand);
        newGame.discard = card;

        addDiscardEvent(newGame.discard);
        continueToAnimateEndOrderTrump();

        setters.removePromptValue(PromptType.DISCARD);
        setters.setEuchreGame(newGame);
      }
    },
    [
      addDiscardEvent,
      continueToAnimateEndOrderTrump,
      discard,
      indexCards,
      setters,
      state.euchreGame,
      state.euchrePauseState.pauseType
    ]
  );

  /** Player has ordered trump either by naming suit or telling the dealer to pick up the flipped card.
   */
  const beginOrderTrump = useCallback(() => {
    if (!shouldBeginOrderTrump) return;

    if (!state.bidResult) throw new Error('Bid result not found.');
    const newGame: EuchreGameInstance = orderTrump(state.euchreGame, state.bidResult);
    if (!newGame.maker) throw Error('Maker not found - Order Trump.');

    addTrumpOrderedEvent(newGame.maker, state.bidResult);
    continueToAnimateBeginOrderTrump();
    setters.setEuchreGame(newGame);
  }, [
    addTrumpOrderedEvent,
    continueToAnimateBeginOrderTrump,
    orderTrump,
    setters,
    shouldBeginOrderTrump,
    state.bidResult,
    state.euchreGame
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
      if (!shouldAnimateBeginOrderTrump) return;

      setters.dispatchPause();
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

      continueToEndOrderTrump();
    };

    try {
      beginAnimationOrderTrump();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'beginAnimationOrderTrump');
    }
  }, [
    continueToEndOrderTrump,
    errorHandlers,
    incrementSpeed,
    notificationDelay,
    setters,
    shouldAnimateBeginOrderTrump,
    state.bidResult,
    state.euchreGame,
    state.euchreSettings
  ]);

  /**
   *
   */
  const endOrderTrump = useCallback(() => {
    if (!shouldEndOrderTrump) return;

    const newGame: EuchreGameInstance = { ...state.euchreGame };

    if (!state.bidResult) throw new Error('Bid result not found');

    let shouldDiscard = state.bidResult.calledSuit === null;
    const sittingOut = playerSittingOut(newGame);

    if (shouldDiscard && sittingOut && playerEqual(newGame.dealer, sittingOut)) {
      shouldDiscard = false;
    }

    if (newGame.dealer.human && shouldDiscard) {
      setters.addPromptValue(PromptType.DISCARD);
      pauseForUserDiscardSelection();
    } else {
      if (shouldDiscard) {
        addDealerPickedUpEvent(newGame.trump);
        newGame.discard = determineDiscard(newGame, newGame.dealer, state.euchreSettings.difficulty);
        newGame.dealer.hand = discard(newGame.dealer, newGame.discard, newGame.trump);

        addDiscardEvent(newGame.discard);
      }

      continueToAnimateEndOrderTrump();
      setters.setEuchreGame(newGame);
    }
  }, [
    addDiscardEvent,
    continueToAnimateEndOrderTrump,
    determineDiscard,
    discard,
    pauseForUserDiscardSelection,
    playerEqual,
    playerSittingOut,
    setters,
    shouldEndOrderTrump,
    state.bidResult,
    state.euchreGame,
    state.euchreSettings.difficulty
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
      if (!shouldAnimateEndOrderTrump) return;

      setters.dispatchPause();

      // update player's hand in an effect in useCardState with the new card if player had to discard.
      await notificationDelay(state.euchreSettings);

      continueToBeginPlayCard();
    };

    try {
      endAnimationOrderTrump();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'endAnimationOrderTrump');
    }
  }, [
    continueToBeginPlayCard,
    errorHandlers,
    notificationDelay,
    setters,
    shouldAnimateEndOrderTrump,
    state.euchreSettings
  ]);

  //#endregion

  return { handleDiscardSubmit };
}
