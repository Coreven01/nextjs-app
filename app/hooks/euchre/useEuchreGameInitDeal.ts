import { EuchreFlowActionType, EuchreGameFlow } from './reducers/gameFlowReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { EuchreErrorState, EuchreGameState } from './useEuchreGame';
import { useCallback, useEffect } from 'react';
import { createEvent } from '@/app/lib/euchre/util';
import { InitDealResult } from '@/app/lib/euchre/logic-definitions';
import useGameStateLogic from './logic/useGameStateLogic';
import useGameSetupLogic from './logic/useGameSetupLogic';

/**
 *
 * @param state
 * @returns
 */
export default function useEuchreGameInitDeal(state: EuchreGameState, errorState: EuchreErrorState) {
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { dealCardsForDealer } = useGameSetupLogic();

  //#region Deal Cards For Initial Dealer *************************************************************************

  /** Deal cards to determine who the initial dealer will be for the game. First jack dealt to a user will become the initial dealer.
   *  After logic is run to determine dealer, animate the cards being dealt if turned on from the settings.
   */
  const beginDealCardsForDealer = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state.euchreGame,
        state.euchreGameFlow,
        state.euchreAnimationFlow,
        EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    if (!state.euchreGame) throw new Error();

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.WAIT });

    const newGame = { ...state.euchreGame };
    state.addEvent(
      createEvent('v', state.euchreSettings, undefined, 'Begin deal cards to determine initial dealer.')
    );

    const dealResult: InitDealResult | null = dealCardsForDealer(
      newGame,
      state.euchreGameFlow,
      state.euchreSettings,
      state.euchreReplayGame
    );

    if (!dealResult?.newDealer) throw Error('Unable to determine dealer for initial dealer.');

    newGame.currentPlayer = dealResult.newDealer;
    newGame.dealer = dealResult.newDealer;

    state.dispatchGameFlow({
      type: EuchreFlowActionType.SET_GAME_FLOW,
      gameFlow: EuchreGameFlow.BEGIN_DEAL_FOR_DEALER
    });
    state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
    state.setEuchreGame(newGame);
  }, [dealCardsForDealer, isGameStateValidToContinue, state]);

  /** Animate dealing cards for initial dealer. When finished with animation, begin shuffle and deal for regular play.
   *
   */
  useEffect(() => {
    const beginAnimationForInitDeal = async () => {
      if (
        !isGameStateValidToContinue(
          state.euchreGame,
          state.euchreGameFlow,
          state.euchreAnimationFlow,
          EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      if (!state.euchreGame?.dealer) throw new Error('Unable to find dealer for initial deal animation.');

      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_NONE });
      state.dispatchGameFlow({
        type: EuchreFlowActionType.SET_GAME_FLOW,
        gameFlow: EuchreGameFlow.BEGIN_SHUFFLE_CARDS
      });
    };

    beginAnimationForInitDeal();
  }, [isGameStateValidToContinue, state]);

  useEffect(() => {
    try {
      beginDealCardsForDealer();
    } catch (e) {
      console.error(e);
    }
  }, [beginDealCardsForDealer]);

  /**
   *
   */
  const endDealCardsForDealer = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state.euchreGame,
        state.euchreGameFlow,
        state.euchreAnimationFlow,
        EuchreGameFlow.END_DEAL_FOR_DEALER,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    // stub to run logic after cards are dealt for initial dealer.

    state.dispatchGameFlow({
      type: EuchreFlowActionType.SET_GAME_FLOW,
      gameFlow: EuchreGameFlow.BEGIN_SHUFFLE_CARDS
    });
  }, [isGameStateValidToContinue, state]);

  useEffect(() => {
    endDealCardsForDealer();
  }, [endDealCardsForDealer]);

  //#endregion

  return {};
}
