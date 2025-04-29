import { EuchreGameFlow } from './reducers/gameFlowReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { useCallback, useEffect } from 'react';
import useGameStateLogic from './logic/useGameStateLogic';
import useGameSetupLogic from './logic/useGameSetupLogic';
import usePlayerData from './data/usePlayerData';
import {
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  GameErrorHandlers
} from '../../lib/euchre/definitions/game-state-definitions';
import { InitDealResult } from '../../lib/euchre/definitions/logic-definitions';
import { GameEventHandlers } from './useEventLog';
import { EuchrePauseActionType } from './reducers/gamePauseReducer';
import useGameData from './data/useGameData';
import {
  getPlayerNotificationType,
  PlayerNotificationAction,
  PlayerNotificationActionType
} from './reducers/playerNotificationReducer';
import GamePlayIndicator from '../../ui/euchre/game/game-play-indicator';

/**
 * Hook used to initialize game play for dealing cards for intial dealer.
 * @param state
 * @returns
 */
export default function useEuchreGameInitDeal(
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: GameErrorHandlers
) {
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { dealCardsForDealer } = useGameSetupLogic();
  const { getTeamColor } = usePlayerData();
  const { notificationDelay } = useGameData();

  //#region Deal Cards For Initial Dealer *************************************************************************

  /** Deal cards to determine who the initial dealer will be for the game. First jack dealt to a user will become the initial dealer.
   *  After logic is run to determine dealer, animate the cards being dealt if turned on from the settings.
   */
  const beginDealCardsForDealer = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state,
        EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        errorHandlers.onCancel
      )
    )
      return;

    eventHandlers.addEvent(
      eventHandlers.createEvent('v', undefined, 'Begin deal cards to determine initial dealer.')
    );

    const dealResult: InitDealResult | null = dealCardsForDealer(
      state.euchreGame,
      state.euchreGameFlow,
      state.euchreReplayGame
    );

    if (!dealResult?.newDealer) throw Error('Unable to determine dealer for initial dealer.');

    setters.setInitialDealerResult(dealResult);
    setters.dispatchStateChange(
      undefined,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_ANIMATE
    );
  }, [dealCardsForDealer, errorHandlers.onCancel, eventHandlers, isGameStateValidToContinue, setters, state]);

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
    const beginAnimationForInitDeal = async () => {
      if (
        !isGameStateValidToContinue(
          state,
          EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          errorHandlers.onCancel
        )
      )
        return;

      //setters.dispatchStateChange(EuchreGameFlow.END_DEAL_FOR_DEALER, EuchreAnimationActionType.SET_NONE);
    };

    try {
      beginAnimationForInitDeal();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'beginAnimationForInitDeal');
    }
  }, [errorHandlers, isGameStateValidToContinue, setters, state]);

  /**
   * Intended to run logic associated with ending dealing for dealer.
   */
  const endDealCardsForDealer = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state,
        EuchreGameFlow.END_DEAL_FOR_DEALER,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        errorHandlers.onCancel
      )
    )
      return;

    if (!state.initDealer) throw new Error('Invalid deal state for end deal for dealer.');

    const newGame: EuchreGameInstance = { ...state.euchreGame };
    newGame.currentPlayer = state.initDealer.newDealer;
    newGame.dealer = state.initDealer.newDealer;

    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        state.initDealer.newDealer,
        'Set as initial dealer.',
        undefined,
        getTeamColor(state.initDealer.newDealer, state.euchreSettings)
      )
    );

    setters.setEuchreGame(newGame);
    setters.dispatchStateChange(EuchreGameFlow.END_DEAL_FOR_DEALER, EuchreAnimationActionType.SET_ANIMATE);
  }, [errorHandlers.onCancel, eventHandlers, getTeamColor, isGameStateValidToContinue, setters, state]);

  useEffect(() => {
    try {
      endDealCardsForDealer();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'endDealCardsForDealer');
    }
  }, [endDealCardsForDealer, errorHandlers]);

  useEffect(() => {
    const endAnimationForInitDeal = async () => {
      if (
        !isGameStateValidToContinue(
          state,
          EuchreGameFlow.END_DEAL_FOR_DEALER,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          errorHandlers.onCancel
        )
      )
        return;

      setters.dispatchStateChange(undefined, undefined, EuchrePauseActionType.SET_GENERAL);

      const newAction: PlayerNotificationAction = {
        type: getPlayerNotificationType(state.euchreGame.dealer.playerNumber),
        payload: (
          <GamePlayIndicator
            playerNumber={state.euchreGame.dealer.playerNumber}
            notificationSpeed={state.euchreSettings.notificationSpeed}
            side="outer"
          />
        )
      };
      setters.dispatchPlayerNotification(newAction);
      await notificationDelay(state.euchreSettings);
      setters.dispatchStateChange(undefined, undefined, EuchrePauseActionType.SET_ANIMATE);
    };

    try {
      endAnimationForInitDeal();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'endAnimationForInitDeal');
    }
  }, [errorHandlers, isGameStateValidToContinue, notificationDelay, setters, state]);

  const handleBeginDealForDealerComplete = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_DEAL_FOR_DEALER,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const handleEndDealForDealerComplete = () => {
    setters.setInitialDealerResult(null);
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_SHUFFLE_CARDS,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  //#endregion

  return { handleBeginDealForDealerComplete, handleEndDealForDealerComplete };
}
