import { EuchreGameFlow } from './reducers/gameFlowReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { EuchreGameState } from './useEuchreGame';
import { useCallback, useEffect } from 'react';
import { createEvent } from '@/app/lib/euchre/util';
import { InitDealResult } from '@/app/lib/euchre/logic-definitions';
import useGameStateLogic from './logic/useGameStateLogic';
import useGameSetupLogic from './logic/useGameSetupLogic';
import { EuchreGameInstance } from '../../lib/euchre/definitions';
import usePlayerData from './data/usePlayerData';

/**
 * Hook used to initialize game play for dealing cards for intial dealer.
 * @param state
 * @returns
 */
export default function useEuchreGameInitDeal(state: EuchreGameState) {
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
        state.onCancel
      )
    )
      return;

    state.dispatchStateChange(EuchreGameFlow.WAIT);

    const newGame: EuchreGameInstance = { ...state.euchreGame };
    state.addEvent(createEvent('v', undefined, 'Begin deal cards to determine initial dealer.'));

    const dealResult: InitDealResult | null = dealCardsForDealer(
      newGame,
      state.euchreGameFlow,
      state.euchreReplayGame
    );

    if (!dealResult?.newDealer) throw Error('Unable to determine dealer for initial dealer.');

    newGame.currentPlayer = dealResult.newDealer;
    newGame.dealer = dealResult.newDealer;

    state.addEvent(
      createEvent(
        'i',
        dealResult.newDealer,
        'Set as initial dealer.',
        undefined,
        getTeamColor(dealResult.newDealer, state.euchreSettings)
      )
    );

    state.dispatchStateChange(EuchreGameFlow.BEGIN_DEAL_FOR_DEALER, EuchreAnimationActionType.SET_ANIMATE);
    state.setEuchreGame(newGame);
  }, [dealCardsForDealer, getTeamColor, isGameStateValidToContinue, state]);

  /** Effect to begin deal cards to determine initial dealer
   *
   */
  useEffect(() => {
    try {
      beginDealCardsForDealer();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
        EuchreAnimationActionType.SET_NONE,
        'beginDealCardsForDealer'
      );
    }
  }, [beginDealCardsForDealer, state]);

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
          state.onCancel
        )
      )
        return;

      // ***** this game state is not being used.
      state.dispatchStateChange(EuchreGameFlow.END_DEAL_FOR_DEALER, EuchreAnimationActionType.SET_NONE);
    };

    try {
      beginAnimationForInitDeal();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
        EuchreAnimationActionType.SET_ANIMATE,
        'beginAnimationForInitDeal'
      );
    }
  }, [isGameStateValidToContinue, state]);

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
        state.onCancel
      )
    )
      return;

    // ***** this game state is not being used.

    state.dispatchStateChange(EuchreGameFlow.BEGIN_SHUFFLE_CARDS, EuchreAnimationActionType.SET_NONE);
  }, [isGameStateValidToContinue, state]);

  useEffect(() => {
    endDealCardsForDealer();
  }, [endDealCardsForDealer]);

  //#endregion

  return {};
}
