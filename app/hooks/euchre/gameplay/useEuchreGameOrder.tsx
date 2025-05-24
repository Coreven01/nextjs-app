import { getPlayerNotificationType, NotificationAction } from '../reducers/playerNotificationReducer';
import { useCallback, useEffect } from 'react';
import PlayerNotification from '@/features/euchre/components/player/player-notification';
import { GameEventHandlers } from '../useEventLog';
import {
  ErrorHandlers,
  EuchreAnimationHandlers,
  EuchreError,
  EuchreGameInstance,
  EuchreGamePlayHandlers,
  EuchreGameSetters,
  EuchreGameValues,
  EuchreSettings,
  GamePlayContext
} from '../../../../features/euchre/definitions/game-state-definitions';
import useGameOrderState from '../phases/useGameOrderState';
import { EuchrePauseType } from '../reducers/gamePauseReducer';
import {
  incrementSpeed,
  notificationDelay,
  playerSittingOut
} from '../../../../features/euchre/util/game/gameDataUtil';
import {
  discard,
  getPlayerRotation,
  playerEqual
} from '../../../../features/euchre/util/game/playerDataUtil';
import { indexCards } from '../../../../features/euchre/util/game/cardDataUtil';
import { determineDiscard, orderTrump } from '../../../../features/euchre/util/game/gameBidLogicUtil';
import {
  addDealerPickedUpEvent,
  addDiscardEvent,
  addTrumpOrderedEvent
} from '../../../../features/euchre/util/game/gameOrderEventsUtil';
import { Card, PromptType } from '../../../../features/euchre/definitions/definitions';

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
    continueToBeginPlayCard,
    pauseForAnimateEndOrderTrump
  } = useGameOrderState(state, setters, errorHandlers);
  const { euchreGame, euchreSettings, euchrePauseState, bidResult } = state;

  //#region Order Trump *************************************************************************

  /** Submit the resulting discard from user input after flip card has been picked up.
   *
   */
  const handleDiscardSubmit = useCallback(
    (card: Card) => {
      const newGame = { ...euchreGame };

      if (newGame?.trump && euchrePauseState.pauseType === EuchrePauseType.USER_INPUT) {
        const sittingOut = playerSittingOut(newGame);
        const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer, sittingOut);

        newGame.currentPlayer = rotation[0];
        newGame.dealer.hand = discard(newGame.dealer, card, newGame.trump);
        newGame.dealer.hand = indexCards(newGame.dealer.hand);
        newGame.discard = card;

        addDiscardEvent(newGame.discard, state, eventHandlers);
        continueToAnimateEndOrderTrump();

        setters.removePromptValue(PromptType.DISCARD);
        setters.setEuchreGame(newGame);
      }
    },
    [continueToAnimateEndOrderTrump, euchreGame, euchrePauseState.pauseType, eventHandlers, setters, state]
  );

  const handleTrumpOrderedComplete = () => {
    if (euchrePauseState.pauseType === EuchrePauseType.ANIMATE) {
      continueToBeginPlayCard();
    }
  };

  /** Player has ordered trump either by naming suit or telling the dealer to pick up the flipped card.
   */
  const beginOrderTrump = useCallback(() => {
    if (!shouldBeginOrderTrump) return;

    if (!bidResult) throw new Error('Bid result not found.');
    const newGame: EuchreGameInstance = orderTrump(euchreGame, bidResult);

    if (!newGame.maker) throw Error('Maker not found - Order Trump.');

    addTrumpOrderedEvent(newGame.maker, bidResult, state, eventHandlers);
    continueToAnimateBeginOrderTrump();
    setters.setEuchreGame(newGame);
  }, [
    bidResult,
    continueToAnimateBeginOrderTrump,
    euchreGame,
    eventHandlers,
    setters,
    shouldBeginOrderTrump,
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
      if (!shouldAnimateBeginOrderTrump) return;

      setters.dispatchPause();

      if (!bidResult) throw new Error('Bid result not found');
      if (!euchreGame.maker) throw Error('Maker not found - Order Trump.');

      const orderType = bidResult.calledSuit ? 'named' : 'order';
      const notification: NotificationAction = {
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
    bidResult,
    continueToEndOrderTrump,
    errorHandlers,
    euchreGame.dealer,
    euchreGame.maker,
    euchreSettings,
    setters,
    shouldAnimateBeginOrderTrump
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
      const sittingOut = playerSittingOut(newGame);
      const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer, sittingOut);

      newGame.currentPlayer = rotation[0];

      if (shouldDiscard) {
        addDealerPickedUpEvent(state, eventHandlers);
        newGame.discard = determineDiscard(newGame, newGame.dealer, euchreSettings.difficulty);
        newGame.dealer.hand = discard(newGame.dealer, newGame.discard, newGame.trump);

        addDiscardEvent(newGame.discard, state, eventHandlers);
      }

      continueToAnimateEndOrderTrump();
      setters.setEuchreGame(newGame);
    }
  }, [
    bidResult,
    continueToAnimateEndOrderTrump,
    euchreGame,
    euchreSettings.difficulty,
    eventHandlers,
    pauseForUserDiscardSelection,
    setters,
    shouldEndOrderTrump,
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
      if (!shouldAnimateEndOrderTrump) return;

      //setters.dispatchPause();

      // update player's hand in an effect in useCardState with the new card if player had to discard.
      //await notificationDelay(euchreSettings);

      pauseForAnimateEndOrderTrump();
      //continueToBeginPlayCard();
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
    euchreSettings,
    pauseForAnimateEndOrderTrump,
    setters,
    shouldAnimateEndOrderTrump
  ]);

  //#endregion

  return { handleDiscardSubmit, handleTrumpOrderedComplete };
}
