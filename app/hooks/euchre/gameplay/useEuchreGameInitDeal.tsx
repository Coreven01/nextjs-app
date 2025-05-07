import { useCallback, useEffect } from 'react';
import useGameSetupLogic from '../logic/useGameSetupLogic';
import {
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  ErrorHandlers
} from '../../../lib/euchre/definitions/game-state-definitions';
import { InitDealResult } from '../../../lib/euchre/definitions/logic-definitions';
import { GameEventHandlers } from '../useEventLog';
import useGameData from '../data/useGameData';
import { getPlayerNotificationType, PlayerNotificationAction } from '../reducers/playerNotificationReducer';
import GamePlayIndicator from '../../../ui/euchre/game/game-play-indicator';
import useGameInitDealState from '../phases/useGameInitDealState';
import useGameEventsInitDeal from '../events/useGameEventsInitDeal';

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
  const { dealCardsForDealer } = useGameSetupLogic();
  const { notificationDelay } = useGameData();
  const { addInitialDealEvent, addInitialDealerSetEvent } = useGameEventsInitDeal(state, eventHandlers);
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
  const { euchreGame, euchreSettings, euchreGameFlow, euchreReplayGame, initDealer } = state;
  //#endregion

  //#region Deal Cards For Initial Dealer *************************************************************************

  /** Deal cards to determine who the initial dealer will be for the game. First jack dealt to a user will become the initial dealer.
   *  After logic is run to determine dealer, animate the cards being dealt if turned on from the settings.
   *  This state is updated by calling: handleBeginDealForDealerComplete
   */
  const beginDealCardsForDealer = useCallback(() => {
    if (!shouldBeginDealCardsForDealer) return;

    addInitialDealEvent();

    const dealResult: InitDealResult | null = dealCardsForDealer(
      euchreGame,
      euchreGameFlow,
      euchreReplayGame
    );

    if (!dealResult?.newDealer) throw Error('Unable to determine dealer for initial dealer.');

    setters.setInitialDealerResult(dealResult);
    pauseForAnimateBeginDealCardsForDealer();
  }, [
    addInitialDealEvent,
    dealCardsForDealer,
    pauseForAnimateBeginDealCardsForDealer,
    setters,
    shouldBeginDealCardsForDealer,
    euchreGame,
    euchreGameFlow,
    euchreReplayGame
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
    if (!initDealer) throw new Error('Invalid deal state for end deal for dealer.');

    const newGame: EuchreGameInstance = { ...euchreGame };
    newGame.currentPlayer = initDealer.newDealer;
    newGame.dealer = initDealer.newDealer;

    addInitialDealerSetEvent(newGame.dealer);

    setters.setEuchreGame(newGame);
    continueToAnimateEndDealCardsForDealer();
  }, [
    addInitialDealerSetEvent,
    continueToAnimateEndDealCardsForDealer,
    setters,
    shouldEndDealCardsForDealer,
    euchreGame,
    initDealer
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

        // show an indicator who will be the next dealer.
        const newAction: PlayerNotificationAction = {
          type: getPlayerNotificationType(euchreGame.dealer.location),
          payload: <GamePlayIndicator notificationSpeed={euchreSettings.notificationSpeed} />
        };

        setters.dispatchPlayerNotification(newAction);
        await notificationDelay(euchreSettings);
      }

      pauseForAnimateEndDealCardsForDealer();
    };

    errorHandlers.catchAsync(endAnimationForInitDeal, errorHandlers.onError, 'endAnimationForInitDeal');
  }, [
    errorHandlers,
    notificationDelay,
    pauseForAnimateEndDealCardsForDealer,
    setters,
    shouldAnimateEndDealCardsForDealer,
    euchreGame.dealer.location,
    euchreGame.dealer.playerNumber,
    euchreSettings
  ]);

  //#endregion

  return { handleBeginDealForDealerComplete, handleEndDealForDealerComplete };
}
