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

      // ***** this game state is not being used.
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

    // newGame.currentPlayer = dealResult.newDealer;
    // newGame.dealer = dealResult.newDealer;

    // eventHandlers.addEvent(
    //   eventHandlers.createEvent(
    //     'i',
    //     dealResult.newDealer,
    //     'Set as initial dealer.',
    //     undefined,
    //     getTeamColor(dealResult.newDealer, state.euchreSettings)
    //   )
    // );

    //setters.dispatchStateChange(EuchreGameFlow.BEGIN_SHUFFLE_CARDS, EuchreAnimationActionType.SET_NONE);
  }, [errorHandlers.onCancel, isGameStateValidToContinue, state]);

  useEffect(() => {
    endDealCardsForDealer();
  }, [endDealCardsForDealer]);

  //#endregion

  return {};
}
