import { useCallback, useEffect } from 'react';
import {
  ErrorHandlers,
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues
} from '../../../../features/euchre/definitions/game-state-definitions';

import { GameEventHandlers } from '../useEventLog';
import { getPlayerNotificationType, NotificationAction } from '../reducers/playerNotificationReducer';
import GamePlayIndicator from '../../../../features/euchre/components/game/game-play-indicator';
import useGameInitDealState from '../phases/useGameInitDealState';
import {
  addInitialDealerSetEvent,
  addInitialDealEvent
} from '../../../../features/euchre/util/game/gameInitDealEvents';
import { dealCardsForDealer } from '../../../../features/euchre/util/game/gameSetupLogicUtil';
import { notificationDelay } from '../../../../features/euchre/util/game/gameDataUtil';
import { InitDealResult } from '../../../../features/euchre/definitions/logic-definitions';

/**
 * Hook used to initialize game play for dealing cards for intial dealer.
 * @param state
 * @returns
 */
export default function useEuchreGameInitDeal(
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers
) {
  const {
    shouldBeginDealCardsForDealer,
    shouldAnimateBeginDealCardsForDealer,
    shouldEndDealCardsForDealer,
    shouldAnimateEndDealCardsForDealer,
    pauseForAnimateBeginDealCardsForDealer,
    continueToEndDealCardsForDealer,
    continueToAnimateEndDealCardsForDealer,
    pauseForAnimateEndDealCardsForDealer,
    continueToShuffleCards
  } = useGameInitDealState(state, setters, errorHandlers);

  //#region Handlers
  const handleBeginDealForDealerComplete = useCallback(() => {
    continueToEndDealCardsForDealer();
  }, [continueToEndDealCardsForDealer]);

  const handleEndDealForDealerComplete = useCallback(() => {
    continueToShuffleCards();
  }, [continueToShuffleCards]);
  const { euchreGame, euchreSettings, euchreGameFlow, initDealer } = state;
  //#endregion

  //#region Deal Cards For Initial Dealer *************************************************************************

  /** Deal cards to determine who the initial dealer will be for the game. First jack dealt to a user will become the initial dealer.
   *  After logic is run to determine dealer, animate the cards being dealt if turned on from the settings.
   *  This state is updated by calling: handleBeginDealForDealerComplete
   */
  const beginDealCardsForDealer = useCallback(() => {
    if (!shouldBeginDealCardsForDealer) return;

    addInitialDealEvent(state, eventHandlers);

    if (euchreSettings.shouldAnimateDeal) {
      const dealResult: InitDealResult | null = dealCardsForDealer(euchreGame, euchreGameFlow);

      if (!dealResult?.newDealer) throw Error('[INIT DEAL] - Unable to determine dealer for initial dealer.');

      setters.setInitialDealerResult(dealResult);
      pauseForAnimateBeginDealCardsForDealer();
    } else {
      continueToShuffleCards();
      //continueToSkipInitDealAnimation();
    }
  }, [
    continueToShuffleCards,
    euchreGame,
    euchreGameFlow,
    euchreSettings.shouldAnimateDeal,
    eventHandlers,
    pauseForAnimateBeginDealCardsForDealer,
    setters,
    shouldBeginDealCardsForDealer,
    state
  ]);

  /** Effect to begin deal cards to determine initial dealer
   *
   */
  useEffect(() => {
    try {
      beginDealCardsForDealer();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'beginDealCardsForDealer');
    }
  }, [beginDealCardsForDealer, errorHandlers]);

  /** Animate dealing cards for initial dealer. When finished with animation, begin shuffle and deal for regular play.
   *
   */
  useEffect(() => {
    const beginAnimationForInitDeal = () => {
      if (!shouldAnimateBeginDealCardsForDealer) return;

      // does nothing for now.
    };

    try {
      beginAnimationForInitDeal();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'beginAnimationForInitDeal');
    }
  }, [errorHandlers, shouldAnimateBeginDealCardsForDealer]);

  /**
   * Sets the current player and dealer to the player who won during the initial deal.
   */
  const endDealCardsForDealer = useCallback(() => {
    if (!shouldEndDealCardsForDealer) return;
    if (!initDealer) throw new Error('[INIT DEAL] - Invalid deal state for end deal for dealer.');

    const newGame: EuchreGameInstance = { ...euchreGame };
    newGame.currentPlayer = initDealer.newDealer;
    newGame.dealer = initDealer.newDealer;

    addInitialDealerSetEvent(newGame.dealer, state, eventHandlers);

    setters.setEuchreGame(newGame);
    continueToAnimateEndDealCardsForDealer();
  }, [
    continueToAnimateEndDealCardsForDealer,
    euchreGame,
    eventHandlers,
    initDealer,
    setters,
    shouldEndDealCardsForDealer,
    state
  ]);

  /**
   * Begin effect for end deal card for dealer.
   */
  useEffect(() => {
    try {
      endDealCardsForDealer();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'endDealCardsForDealer');
    }
  }, [endDealCardsForDealer, errorHandlers]);

  /**
   * Pause and display an indicator who won for initial deal.
   * This state is updated by calling: handleEndDealForDealerComplete
   */
  useEffect(() => {
    const endAnimationForInitDeal = async () => {
      if (!shouldAnimateEndDealCardsForDealer) return;

      if (euchreSettings.shouldAnimateDeal) {
        setters.dispatchPause();

        const playerLocation = getPlayerNotificationType(euchreGame.dealer.location);
        // show an indicator who will be the next dealer.
        const newAction: NotificationAction = {
          type: playerLocation,
          payload: (
            <GamePlayIndicator
              playerLocation={playerLocation}
              notificationSpeed={euchreSettings.notificationSpeed}
              relativeLocation="middle"
            />
          )
        };

        setters.dispatchPlayerNotification(newAction);
        await notificationDelay(euchreSettings);
      }

      pauseForAnimateEndDealCardsForDealer();
    };

    errorHandlers.catchAsync(endAnimationForInitDeal, errorHandlers.onError, 'endAnimationForInitDeal');
  }, [
    errorHandlers,
    euchreGame.dealer.location,
    euchreSettings,
    pauseForAnimateEndDealCardsForDealer,
    setters,
    shouldAnimateEndDealCardsForDealer
  ]);

  //#endregion

  return { handleBeginDealForDealerComplete, handleEndDealForDealerComplete };
}
