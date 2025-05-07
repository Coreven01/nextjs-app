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
  const { euchreGame, euchreSettings, euchrePauseState, bidResult } = state;

  //#region Order Trump *************************************************************************

  /** Submit the resulting discard from user input after flip card has been picked up.
   *
   */
  const handleDiscardSubmit = useCallback(
    (card: Card) => {
      const newGame = { ...euchreGame };

      if (newGame?.trump && euchrePauseState.pauseType === EuchrePauseType.USER_INPUT) {
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
      euchreGame,
      euchrePauseState.pauseType
    ]
  );

  /** Player has ordered trump either by naming suit or telling the dealer to pick up the flipped card.
   */
  const beginOrderTrump = useCallback(() => {
    if (!shouldBeginOrderTrump) return;

    if (!bidResult) throw new Error('Bid result not found.');
    const newGame: EuchreGameInstance = orderTrump(euchreGame, bidResult);
    if (!newGame.maker) throw Error('Maker not found - Order Trump.');

    addTrumpOrderedEvent(newGame.maker, bidResult);
    continueToAnimateBeginOrderTrump();
    setters.setEuchreGame(newGame);
  }, [
    addTrumpOrderedEvent,
    continueToAnimateBeginOrderTrump,
    orderTrump,
    setters,
    shouldBeginOrderTrump,
    bidResult,
    euchreGame
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

      if (!bidResult) throw new Error('Bid result not found');
      if (!euchreGame.maker) throw Error('Maker not found - Order Trump.');

      const orderType = bidResult.calledSuit ? 'named' : 'order';
      const notification: PlayerNotificationAction = {
        type: getPlayerNotificationType(euchreGame.maker.location),
        payload: (
          <PlayerNotification
            dealer={euchreGame.dealer}
            player={euchreGame.maker}
            settings={euchreSettings}
            info={orderType}
            loner={bidResult.loner}
            namedSuit={bidResult.calledSuit}
            delayMs={incrementSpeed(euchreSettings.notificationSpeed, 1)}
          />
        )
      };

      setters.dispatchPlayerNotification(notification);
      await notificationDelay(euchreSettings, 1);

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
    bidResult,
    euchreGame,
    euchreSettings
  ]);

  /**
   *
   */
  const endOrderTrump = useCallback(() => {
    if (!shouldEndOrderTrump) return;

    const newGame: EuchreGameInstance = { ...euchreGame };

    if (!bidResult) throw new Error('Bid result not found');

    let shouldDiscard = bidResult.calledSuit === null;
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
        newGame.discard = determineDiscard(newGame, newGame.dealer, euchreSettings.difficulty);
        newGame.dealer.hand = discard(newGame.dealer, newGame.discard, newGame.trump);

        addDiscardEvent(newGame.discard);
      }

      continueToAnimateEndOrderTrump();
      setters.setEuchreGame(newGame);
    }
  }, [
    addDealerPickedUpEvent,
    addDiscardEvent,
    bidResult,
    continueToAnimateEndOrderTrump,
    determineDiscard,
    discard,
    euchreGame,
    euchreSettings.difficulty,
    pauseForUserDiscardSelection,
    playerEqual,
    playerSittingOut,
    setters,
    shouldEndOrderTrump
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
      await notificationDelay(euchreSettings);

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
    euchreSettings
  ]);

  //#endregion

  return { handleDiscardSubmit };
}
