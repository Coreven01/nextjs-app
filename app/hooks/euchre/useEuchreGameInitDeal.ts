'use client';

import { EuchreFlowActionType, EuchreGameFlow } from './gameFlowReducer';
import { EuchreActionType, EuchreAnimateType } from './gameAnimationFlowReducer';
import { EuchreGameState } from './useEuchreGame';
import { dealCardsForDealer } from '@/app/lib/euchre/game-setup-logic';
import { useCallback, useEffect } from 'react';
import isGameStateValidToContinue from '@/app/lib/euchre/game-state-logic';
import { createEvent } from '@/app/lib/euchre/util';

export default function useEuchreGameInitDeal(state: EuchreGameState) {
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
        EuchreAnimateType.ANIMATE_NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    if (!state.euchreGame) throw new Error();

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_WAIT });

    const newGame = state.euchreGame.shallowCopy();
    state.addEvent(createEvent('i', state.euchreSettings, undefined, 'Begin deal cards for dealer.'));

    const dealResult = dealCardsForDealer(newGame, state.euchreGameFlow, state.euchreSettings);

    if (!dealResult) throw Error('Unable to determine dealer for initial dealer.');

    newGame.assignDealerAndPlayer(dealResult.newDealer);

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_DEAL_FOR_DEALER });
    state.dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_DEAL_FOR_DEALER });
    state.setEuchreGame(newGame);
  }, [state]);

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
        EuchreAnimateType.ANIMATE_NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    // stub to run logic after cards are dealt for initial dealer.

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_SHUFFLE_CARDS });
  }, [state]);

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
          EuchreAnimateType.ANIMATE_DEAL_FOR_DEALER,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      if (!state.euchreGame?.dealer) throw new Error('Unable to find dealer for initial deal animation.');

      //await animateForInitialDeal(animationTransformation, game, game.dealer);

      state.dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_SHUFFLE_CARDS });
    };

    beginAnimationForInitDeal();
  }, [state]);

  useEffect(() => {
    try {
      beginDealCardsForDealer();
    } catch (e) {
      console.error(e);
    }
  }, [beginDealCardsForDealer]);

  useEffect(() => {
    endDealCardsForDealer();
  }, [endDealCardsForDealer]);

  //#endregion

  return {};
}
